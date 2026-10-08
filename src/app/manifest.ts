import type { MetadataRoute } from "next";

/** Carte d'identité de l'app quand on l'ajoute à l'écran d'accueil (nom, icône, plein écran, couleurs). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A18 Darts",
    short_name: "A18 Darts",
    description: "Les fléchettes d'Arena18. À vous de jouer.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171717",
    theme_color: "#171717",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
