"use client";
import { X01Game } from "@/components/x01/X01Game";
import { DEFAULT_X01_OPTIONS } from "@/engine/x01";
import type { SavedX01 } from "@/lib/partie";

/*
 * Provisoire : tant que les écrans Joueurs / Jeu / Réglages / Au bull ne sont pas codés,
 * une nouvelle partie démarre avec trois joueurs d'exemple en 501.
 */
const demo = (): SavedX01 => ({
  kind: "x01",
  setup: {
    sides: ["Guillaume", "Thomas", "Léa"].map((n) => ({ name: n, members: [n] })),
    options: DEFAULT_X01_OPTIONS,
    firstSide: 0,
  },
  actions: [],
});

export default function PartiePage() {
  return <X01Game fallback={demo} />;
}
