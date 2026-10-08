"use client";
/**
 * La partie en cours, sauvegardée sur le téléphone après chaque fléchette.
 * On ne stocke que le jeu, la configuration et la liste des actions : l'état est recalculé
 * par le moteur (replay). Annuler = retirer la dernière action.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Action, type Mult, undoLastDart } from "@/engine/types";
import { type X01Setup, replayX01 } from "@/engine/x01";
import { type CricketSetup, replayCricket } from "@/engine/cricket";
import { readJSON, removeKey, writeJSON } from "./storage";

const KEY = "a18:partie";

export interface SavedX01 {
  kind: "x01";
  setup: X01Setup;
  actions: Action[];
}

export interface SavedCricket {
  kind: "cricket";
  setup: CricketSetup;
  actions: Action[];
}

export type SavedPartie = SavedX01 | SavedCricket;

export function loadPartie(): SavedPartie | null {
  return readJSON<SavedPartie>(KEY);
}

export function savePartie(p: SavedPartie): void {
  writeJSON(KEY, p);
}

export function clearPartie(): void {
  removeKey(KEY);
}

/** La partie enregistrée est-elle commencée et pas encore terminée ? (pour « Reprendre ») */
export function partieEnCours(p: SavedPartie | null): boolean {
  if (!p || p.actions.length === 0) return false;
  const st = p.kind === "cricket" ? replayCricket(p.setup, p.actions) : replayX01(p.setup, p.actions);
  return st.status !== "match";
}

export function partieLabel(p: SavedPartie): string {
  return p.kind === "cricket" ? "Cricket" : String(p.setup.options.start);
}

function useGamePartie<P extends SavedPartie, S>(kind: P["kind"], replay: (setup: P["setup"], actions: Action[]) => S) {
  const [partie, setPartie] = useState<P | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Lecture au montage seulement (le stockage n'existe pas côté serveur).
  useEffect(() => {
    const p = loadPartie();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
    setPartie(p && p.kind === kind ? (p as P) : null);
    setLoaded(true);
  }, [kind]);

  useEffect(() => {
    if (partie) savePartie(partie);
  }, [partie]);

  const state = useMemo(() => (partie ? replay(partie.setup, partie.actions) : null), [partie, replay]);

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

  return { loaded, partie, state, push, setLastMult, undo, restart };
}

export function useX01Partie() {
  return useGamePartie<SavedX01, ReturnType<typeof replayX01>>("x01", replayX01);
}

export function useCricketPartie() {
  return useGamePartie<SavedCricket, ReturnType<typeof replayCricket>>("cricket", replayCricket);
}
