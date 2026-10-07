"use client";
import { useEffect, useRef, useState } from "react";

/** Garde l'écran allumé pendant la partie (si le téléphone l'autorise). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
      } catch {
        /* refusé : pas grave */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Détecte le téléphone posé à plat sur la table (écran vers le haut).
 * Sur iPhone, il faut demander la permission une fois, depuis un geste de l'utilisateur : `askPermission`.
 */
export function useFlatPhone() {
  const [flat, setFlat] = useState<boolean | null>(null);
  const last = useRef<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const tilt = Math.max(Math.abs(e.beta), Math.abs(e.gamma));
      // Hystérésis : à plat sous 12°, plus à plat au-delà de 30°.
      const now = last.current ? tilt < 30 : tilt < 12;
      if (now !== last.current) {
        last.current = now;
        setFlat(now);
      }
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const askPermission = () => {
    const DOE = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as OrientationCtor | undefined;
    if (DOE?.requestPermission) void DOE.requestPermission().catch(() => {});
  };

  return { flat, askPermission };
}
