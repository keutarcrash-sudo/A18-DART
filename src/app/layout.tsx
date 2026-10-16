import type { Metadata, Viewport } from "next";
import { Montserrat, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Pwa } from "@/components/Pwa";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

/* Refonte pop : Outfit pour les titres et les chiffres, Plus Jakarta Sans pour le texte. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

/*
 * Anciennes polices « 18° » (Montserrat ci-dessus, chiffres A18 ci-dessous) : encore chargées pendant
 * la conversion des écrans, retirées à la fin de la refonte.
 *
 * Chiffres A18 « Élan gras » (docs/chiffres/). Le même fichier est déclaré en normal ET en italique :
 * les chiffres sont déjà penchés de 18°, le navigateur ne doit pas les pencher une seconde fois.
 */
const a18 = localFont({
  variable: "--font-a18",
  src: [
    { path: "./fonts/A18-Elan-Bold.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/A18-Elan-Bold.woff2", weight: "100 900", style: "italic" },
  ],
  display: "block",
});

export const metadata: Metadata = {
  title: "A18 Darts",
  description: "Les fléchettes d'Arena18. À vous de jouer.",
  applicationName: "A18 Darts",
  // Ajoutée à l'écran d'accueil d'un iPhone : plein écran, barre d'état sombre sur fond crème.
  appleWebApp: { capable: true, title: "A18 Darts", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFDF5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jakarta.variable} ${montserrat.variable} ${a18.variable} h-full`}>
      <body className="min-h-full bg-creme font-text text-encre">
        {children}
        <Pwa />
      </body>
    </html>
  );
}
