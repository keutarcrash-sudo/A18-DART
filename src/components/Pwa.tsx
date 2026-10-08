"use client";
/** Active le mode hors ligne dès la première visite (voir public/sw.js). */
import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

export function Pwa() {
  useEffect(() => registerServiceWorker(), []);
  return null;
}
