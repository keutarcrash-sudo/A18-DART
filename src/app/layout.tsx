import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

/*
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171717",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${a18.variable} h-full`}>
      <body className="min-h-full bg-noir text-blanc">{children}</body>
    </html>
  );
}
