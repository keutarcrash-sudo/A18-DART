import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Pwa } from "@/components/Pwa";
import { MotionProvider } from "@/components/MotionProvider";

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
    <html lang="fr" className={`${outfit.variable} ${jakarta.variable} h-full`}>
      <body className="min-h-full bg-creme font-text text-encre">
        <MotionProvider>{children}</MotionProvider>
        <Pwa />
      </body>
    </html>
  );
}
