"use client";
/**
 * L'app comme une vraie app : installée sur l'écran d'accueil, hors ligne, plein écran.
 * - Plein écran : seulement sur Android (Apple l'interdit aux sites sur iPhone), au lancement d'une partie.
 * - Installation : bouton natif sur Android, deux gestes expliqués sur iPhone.
 */
import { useEffect, useState } from "react";

/** L'app est-elle ouverte depuis l'écran d'accueil (déjà installée) ? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Passe en plein écran (plus de barre d'adresse) et bloque le portrait.
 * À appeler depuis une tape du joueur : le navigateur refuse sinon. Ne fait rien sur iPhone ni si l'app est installée.
 */
export function enterFullscreen(): void {
  if (typeof document === "undefined" || isStandalone() || isIOS()) return;
  const el = document.documentElement;
  if (!document.fullscreenEnabled || document.fullscreenElement || !el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: "hide" })
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("portrait"))
    .catch(() => {});
}

/** Enregistre le programme du mode hors ligne (public/sw.js), en ligne seulement (pas pendant le développement). */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "none" | "android" | "ios";

/** Peut-on proposer l'installation ici, et comment ? */
export function useInstall(): { mode: InstallMode; install: () => void } {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [mode, setMode] = useState<InstallMode>("none");

  useEffect(() => {
    if (isStandalone()) return;
    // Safari sur iPhone : pas de bouton natif, on explique les deux gestes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- détection du téléphone, une fois
    if (isIOS()) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setMode("android");
    };
    const onInstalled = () => setMode("none");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = () => {
    if (!prompt) return;
    void prompt.prompt();
    void prompt.userChoice.then((c) => {
      if (c.outcome === "accepted") setMode("none");
      setPrompt(null);
    });
  };

  return { mode, install };
}
