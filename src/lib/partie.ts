"use client";
/**
 * La partie en cours, sauvegardée sur le téléphone après chaque fléchette.
 * On ne stocke que la configuration et la liste des actions : l'état est recalculé
 * par le moteur (replay). Annuler = retirer la dernière action.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Action, type Mult, undoLastDart } from "@/engine/types";
import { type X01Setup, replayX01 } from "@/engine/x01";
import { readJSON, removeKey, writeJSON } from "./storage";

const KEY = "a18:partie";

export interface SavedX01 {
  kind: "x01";
  setup: X01Setup;
  actions: Action[];
}

export function loadPartie(): SavedX01 | null {
  return readJSON<SavedX01>(KEY);
}

export function savePartie(p: SavedX01): void {
  writeJSON(KEY, p);
}

export function clearPartie(): void {
  removeKey(KEY);
}

export function useX01Partie(fallback: () => SavedX01) {
  const [partie, setPartie] = useState<SavedX01 | null>(null);

  // Lecture au montage seulement (le stockage n'existe pas côté serveur).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
    setPartie(loadPartie() ?? fallback());
  }, [fallback]);

  useEffect(() => {
    if (partie) savePartie(partie);
  }, [partie]);

  const state = useMemo(() => (partie ? replayX01(partie.setup, partie.actions) : null), [partie]);

  const push = useCallback((a: Action) => setPartie((p) => (p ? { ...p, actions: [...p.actions, a] } : p)), []);

  const setLastMult = useCallback(
    (m: Mult) =>
      setPartie((p) => {
        if (!p) return p;
        const last = p.actions[p.actions.length - 1];
        if (!last || last.type !== "dart") return p;
        return { ...p, actions: [...p.actions.slice(0, -1), { type: "dart", dart: { ...last.dart, m } }] };
      }),
    [],
  );

  const undo = useCallback(() => setPartie((p) => (p ? { ...p, actions: undoLastDart(p.actions) } : p)), []);

  const restart = useCallback(
    (firstSide: number) => setPartie((p) => (p ? { ...p, setup: { ...p.setup, firstSide }, actions: [] } : p)),
    [],
  );

  return { partie, state, push, setLastMult, undo, restart };
}
