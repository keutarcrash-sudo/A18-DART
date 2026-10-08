"use client";
/**
 * Records partagés d'Arena18 (Supabase), sans compte, avec le prénom (docs/00-cadrage.md).
 *
 * - En fin de partie, on envoie les moments qui comptent : volées de 60 et plus, 180, checkouts, et la partie elle-même.
 *   Une partie abandonnée n'envoie rien. Les envois attendent sur le téléphone si la 5G lâche, et repartent plus tard.
 * - L'accueil lit un résumé (jour ou semaine) : meilleure volée, plus gros checkout, les 180, le nombre de parties.
 * - Modération : filtre automatique (gros mots, scores impossibles) ; le reste se supprime à la main dans Supabase.
 *
 * Sans les deux clés Supabase (fichier .env.local ou réglages Vercel), l'app marche normalement, sans records.
 */
import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "./storage";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const recordsEnabled = !!URL && !!KEY;

export type RecordGame = "301" | "501" | "701" | "cricket" | "killer" | "clock" | "high";
export interface RecordEntry {
  kind: "volley" | "checkout" | "oneEighty" | "game";
  name: string;
  value: number;
  game: RecordGame;
}

export interface RecordsSummary {
  best_volley: { name: string; value: number } | null;
  best_checkout: { name: string; value: number } | null;
  one_eighties: string[];
  games: number;
}

const QUEUE = "a18:records-attente";

const headers = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" });

/* ---------- Modération ---------- */

const BAD = [
  "merde", "putain", "pute", "salope", "connard", "connasse", "encule", "enculer", "batard", "bite", "couille", "chatte",
  "nique", "niquer", "fdp", "ntm", "pd", "pede", "tapette", "negre", "bougnoule", "youpin", "nazi", "hitler", "salaud",
  "fuck", "shit", "bitch", "cunt", "dick", "cock", "pussy", "nigger", "nigga", "fag", "whore", "slut", "porn", "sexe", "sex",
];

/** Le prénom passe-t-il le filtre ? (on regarde aussi les lettres collées : « Pu.tain », « PUTAIN2 »). */
export function nameIsClean(name: string): boolean {
  const flat = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const words = flat.split(/[^a-z0-9]+/).filter(Boolean);
  const glued = flat.replace(/[^a-z]/g, "");
  return !BAD.some((b) => words.includes(b) || (b.length >= 4 && glued.includes(b)));
}

/** Scores possibles seulement (la base vérifie aussi). */
function isPossible(e: RecordEntry): boolean {
  switch (e.kind) {
    case "volley":
      return e.value >= 0 && e.value <= 180;
    case "checkout":
      return e.value >= 2 && e.value <= 170;
    case "oneEighty":
      return e.value === 180;
    case "game":
      return e.value === 0;
  }
}

/* ---------- Envoi ---------- */

/** Envoie les records d'une partie terminée (gardés sur le téléphone tant que l'envoi échoue). */
export function submitRecords(entries: RecordEntry[]): void {
  if (!recordsEnabled) return;
  const ok = entries.filter((e) => isPossible(e) && nameIsClean(e.name)).map((e) => ({ ...e, name: e.name.slice(0, 20) }));
  if (!ok.length) return;
  writeJSON(QUEUE, [...(readJSON<RecordEntry[]>(QUEUE) ?? []), ...ok].slice(-200));
  void flushRecords();
}

let flushing = false;
export async function flushRecords(): Promise<void> {
  if (!recordsEnabled || flushing) return;
  const pending = readJSON<RecordEntry[]>(QUEUE) ?? [];
  if (!pending.length) return;
  flushing = true;
  try {
    const res = await fetch(`${URL}/rest/v1/records`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(pending),
    });
    // Envoyé, ou refusé par la base (score impossible) : dans les deux cas, on ne réessaie pas.
    if (res.ok || res.status === 400) {
      const now = readJSON<RecordEntry[]>(QUEUE) ?? [];
      writeJSON(QUEUE, now.slice(pending.length));
    }
  } catch {
    // Pas de réseau : on réessaiera au prochain lancement.
  } finally {
    flushing = false;
  }
}

/* ---------- Lecture ---------- */

export type Period = "day" | "week";

/** Début de la journée ou de la semaine (lundi), à l'heure du téléphone. */
export function periodStart(p: Period, now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export async function fetchSummary(p: Period): Promise<RecordsSummary> {
  const res = await fetch(`${URL}/rest/v1/rpc/records_summary`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ since: periodStart(p).toISOString() }),
  });
  if (!res.ok) throw new Error(`records ${res.status}`);
  return res.json();
}

export type RecordsState = { status: "off" } | { status: "loading" } | { status: "error" } | { status: "ok"; data: RecordsSummary };

/** Résumé des records pour l'accueil. */
export function useRecordsSummary(p: Period): RecordsState {
  const [state, setState] = useState<{ p: Period; s: RecordsState } | null>(null);
  useEffect(() => {
    if (!recordsEnabled) return;
    let alive = true;
    void flushRecords();
    fetchSummary(p)
      .then((data) => alive && setState({ p, s: { status: "ok", data } }))
      .catch(() => alive && setState({ p, s: { status: "error" } }));
    return () => {
      alive = false;
    };
  }, [p]);
  if (!recordsEnabled) return { status: "off" };
  return state && state.p === p ? state.s : { status: "loading" };
}

/**
 * Meilleure volée du jour à Arena18, pour fêter un record battu pendant la partie.
 * Renvoie null tant qu'on ne sait pas (pas de réseau, pas de records) : on ne fête rien au hasard.
 */
export function useDayBest(): { best: number | null; beat: (points: number) => void } {
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    if (!recordsEnabled) return;
    let alive = true;
    fetchSummary("day")
      .then((d) => alive && setBest(d.best_volley?.value ?? 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const beat = useCallback((points: number) => setBest((b) => (b === null ? b : Math.max(b, points))), []);
  return { best, beat };
}

/** Un record du jour se fête à partir d'une volée de 60, et seulement s'il bat le meilleur connu. */
export function isDayRecord(best: number | null, points: number): boolean {
  return best !== null && points >= 60 && points > best;
}
