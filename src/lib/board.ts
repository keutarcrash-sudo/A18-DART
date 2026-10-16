/**
 * Géométrie de la cible (pure, sans React).
 *
 * Repère SVG : origine au centre de la cible, y vers le BAS, rayon 100.
 * Le 20 est en haut (angle -π/2) ; les secteurs se suivent dans le sens
 * horaire (à l'écran), 18° chacun.
 */

import type { Dart } from "@/engine/types";

/** Ordre des secteurs, du haut vers la droite (sens horaire). */
export const SECTOR_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

/** Rayons des anneaux (rayon total de la cible = 100). */
export const RINGS = {
  bull: 7,
  outer: 15,
  tripleIn: 54,
  tripleOut: 64,
  doubleIn: 90,
  doubleOut: 100,
};

const SECTEUR = (2 * Math.PI) / 20; // 18°
/** Marge gardée entre une fléchette et le bord d'un anneau. */
const MARGE_RAYON = 2;
/** Écart angulaire maximal par rapport au centre du secteur (7° sur 9°). */
const ECART_MAX = (7 * Math.PI) / 180;

/** Angle (radians) du centre du secteur n : -π/2 pour le 20, sens horaire. */
export function sectorAngle(n: number): number {
  const i = SECTOR_ORDER.indexOf(n as (typeof SECTOR_ORDER)[number]);
  if (i < 0) throw new Error(`Secteur inconnu : ${n}`);
  return -Math.PI / 2 + i * SECTEUR;
}

/** Petit générateur pseudo-aléatoire déterministe (mulberry32). */
function prng(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange (graine, n, m) en une seule graine entière. */
function melange(seed: number, d: Dart): number {
  let h = Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(d.n + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0xc2b2ae35) ^ Math.imul(d.m, 0x27d4eb2f);
  return (h ^ (h >>> 13)) >>> 0;
}

/**
 * Point d'impact d'une fléchette, ou null pour un raté.
 * Toujours dans la bonne case, à ≥ 2 unités des bords d'anneau et à moins
 * de 7° du centre du secteur. Même (d, seed) → même point, toujours.
 */
export function dartSpot(d: Dart, seed: number): { x: number; y: number } | null {
  if (d.n === 0) return null;
  const rnd = prng(melange(seed, d));
  const entre = (a: number, b: number) => a + MARGE_RAYON + rnd() * (b - a - 2 * MARGE_RAYON);

  let r: number;
  let angle: number;
  if (d.n === 25) {
    // Centre : disque (bull) ou anneau (25), dans toutes les directions.
    r = d.m === 2 ? rnd() * (RINGS.bull - MARGE_RAYON) : entre(RINGS.bull, RINGS.outer);
    angle = rnd() * 2 * Math.PI;
  } else {
    if (d.m === 3) r = entre(RINGS.tripleIn, RINGS.tripleOut);
    else if (d.m === 2) r = entre(RINGS.doubleIn, RINGS.doubleOut);
    else {
      // Simple : la graine choisit la partie extérieure ou intérieure.
      r = rnd() < 0.5 ? entre(RINGS.tripleOut, RINGS.doubleIn) : entre(RINGS.outer, RINGS.tripleIn);
    }
    angle = sectorAngle(d.n) + (rnd() * 2 - 1) * ECART_MAX;
  }
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

const f = (v: number) => Math.round(v * 100) / 100;
const pt = (r: number, a: number) => `${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`;

/** Secteur annulaire entre deux rayons et deux angles (a0 < a1, sens horaire). */
function secteurAnnulaire(r0: number, r1: number, a0: number, a1: number): string {
  return (
    `M${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}` +
    `L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`
  );
}

/** Disque (r0 = 0) ou anneau complet, en deux demi-cercles. */
function anneau(r0: number, r1: number): string {
  const cercle = (r: number, sens: 0 | 1) =>
    `M${r} 0A${r} ${r} 0 1 ${sens} ${-r} 0A${r} ${r} 0 1 ${sens} ${r} 0Z`;
  return r0 === 0 ? cercle(r1, 1) : cercle(r1, 1) + cercle(r0, 0);
}

/**
 * Chemin SVG (attribut `d`) de la case touchée.
 * - Double / triple : un secteur annulaire.
 * - Simple 1–20 : TOUTE la zone simple du secteur, en deux sous-chemins
 *   (partie intérieure bull-extérieur → triple, et extérieure triple → double).
 * - 25 : anneau entre bull et outer ; BULL (25, m=2) : disque du centre.
 */
export function zonePath(d: Dart): string {
  if (d.n === 25) return d.m === 2 ? anneau(0, RINGS.bull) : anneau(RINGS.bull, RINGS.outer);
  const c = sectorAngle(d.n);
  const a0 = c - SECTEUR / 2;
  const a1 = c + SECTEUR / 2;
  if (d.m === 3) return secteurAnnulaire(RINGS.tripleIn, RINGS.tripleOut, a0, a1);
  if (d.m === 2) return secteurAnnulaire(RINGS.doubleIn, RINGS.doubleOut, a0, a1);
  return (
    secteurAnnulaire(RINGS.outer, RINGS.tripleIn, a0, a1) +
    secteurAnnulaire(RINGS.tripleOut, RINGS.doubleIn, a0, a1)
  );
}
