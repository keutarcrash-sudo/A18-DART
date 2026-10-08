/*
 * Mode hors ligne d'A18 Darts (« service worker » : un petit programme qui tourne en arrière-plan sur le téléphone).
 *
 * - Il garde une copie des 3 écrans (accueil, création de partie, partie) et de tout ce qu'il leur faut
 *   (code, polices, chiffres A18, logo) : sans réseau, l'app s'ouvre quand même.
 * - Avec du réseau, il prend toujours la version en ligne d'abord et rafraîchit sa copie : pas de vieille version bloquée.
 * - Il ne touche jamais aux records (Supabase) : ils ont leur propre file d'attente sur le téléphone.
 */
const CACHE = "a18-darts-v1";
const PAGES = ["/", "/nouvelle", "/partie"];
const FILES = ["/logo-a18.png", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
const MAX_ENTRIES = 400;
const WARM_EVERY = 60 * 60 * 1000;

let lastWarm = 0;

/** Télécharge les écrans et tout ce qu'ils chargent (fichiers /_next/static cités dans le HTML). */
async function warm() {
  lastWarm = Date.now();
  const cache = await caches.open(CACHE);
  const statics = new Set(FILES);
  for (const page of PAGES) {
    try {
      const res = await fetch(page, { cache: "no-store" });
      if (!res.ok) continue;
      const html = await res.clone().text();
      await cache.put(page, res);
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) statics.add(m[0]);
    } catch {
      // Pas de réseau : on garde l'ancienne copie.
    }
  }
  const save = async (url) => {
    if (url.startsWith("/_next/static/") && (await cache.match(url))) return; // fichiers immuables : déjà là
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      // Les polices (Montserrat, chiffres A18) sont citées dans les feuilles de style : on les prend aussi.
      if (url.endsWith(".css")) {
        const css = await res.clone().text();
        for (const m of css.matchAll(/\/_next\/static\/media\/[^"'\s)]+/g)) statics.add(m[0]);
      }
      await cache.put(url, res);
    } catch {}
  };
  const css = [...statics].filter((u) => u.endsWith(".css"));
  await Promise.all(css.map(save));
  await Promise.all([...statics].filter((u) => !u.endsWith(".css")).map(save));
  await trim(cache);
}

/** Évite que la copie grossisse sans fin au fil des mises à jour. */
async function trim(cache) {
  const keys = await cache.keys();
  const extra = keys.length - MAX_ENTRIES;
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(warm().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Navigation interne de Next (données des écrans) : toujours en ligne ; hors ligne, Next recharge la page, servie ci-dessous.
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          if (res.ok && PAGES.includes(url.pathname)) {
            await cache.put(url.pathname, res.clone());
            if (Date.now() - lastWarm > WARM_EVERY) event.waitUntil(warm());
          }
          return res;
        } catch {
          return (await cache.match(url.pathname)) || (await cache.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Fichiers de l'app : ceux de /_next/static ne changent jamais (nom unique) → copie d'abord ; le reste → réseau d'abord.
  const immutable = url.pathname.startsWith("/_next/static/");
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (immutable) {
        const hit = await cache.match(req);
        if (hit) return hit;
      }
      try {
        const res = await fetch(req);
        if (res.ok && (immutable || FILES.includes(url.pathname) || url.pathname.startsWith("/icons/"))) await cache.put(req, res.clone());
        return res;
      } catch {
        return (await cache.match(req)) || Response.error();
      }
    })(),
  );
});
