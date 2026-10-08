/**
 * Moteur du Cricket (règles : docs/05-jeux.md).
 *
 * - On ferme 20, 19, 18, 17, 16, 15 et le centre : 3 touches chacun (double = 2, triple = 3, bull = 2).
 * - Classique : une touche en trop sur un numéro fermé rapporte ses points, tant qu'un adversaire ne l'a pas fermé.
 *   Il faut tout fermer ET mener aux points (égalité acceptée).
 * - Sans points : le premier qui ferme tout gagne.
 * - Cut-throat : les points vont aux adversaires qui n'ont pas fermé ; il faut tout fermer ET avoir le plus petit score.
 * - Les fléchettes hors 15-20 et centre ne comptent pas (« Raté / Autre »).
 */
import { type Action, type Dart, type Side, isValidDart } from "./types";

export const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25] as const;
export type CricketNumber = (typeof CRICKET_NUMBERS)[number];

export type CricketMode = "classic" | "none" | "cut";

export interface CricketOptions {
  mode: CricketMode;
}

export const DEFAULT_CRICKET_OPTIONS: CricketOptions = { mode: "classic" };

export interface CricketSetup {
  sides: Side[];
  options: CricketOptions;
  firstSide: number;
}

export type CricketStatus = "open" | "full" | "match";

export type CricketEvent =
  | { type: "dart"; dart: Dart }
  | { type: "closed"; side: number; n: CricketNumber }
  | { type: "volley"; side: number; marks: number }
  | { type: "nineMarks"; side: number }
  | { type: "manyMarks"; side: number; marks: number }
  | { type: "noMarks"; side: number }
  | { type: "matchWon"; side: number }
  | { type: "nextPlayer"; side: number };

export interface CricketVolley {
  side: number;
  member: string;
  turn: number;
  darts: Dart[];
  marks: number;
}

export interface CricketState {
  setup: CricketSetup;
  /** marks[side][n] : touches sur le numéro n (0 à 3, 3 = fermé). */
  marks: Record<CricketNumber, number>[];
  points: number[];
  current: number;
  memberIdx: number[];
  turn: number;
  volley: Dart[];
  /** Touches utiles de la volée en cours (y compris celles qui marquent des points). */
  volleyMarks: number;
  status: CricketStatus;
  winner: number | null;
  history: CricketVolley[];
  events: CricketEvent[];
}

const emptyMarks = (): Record<CricketNumber, number> => ({ 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 });

export function isCricketNumber(n: number): n is CricketNumber {
  return (CRICKET_NUMBERS as readonly number[]).includes(n);
}

export function initCricket(setup: CricketSetup): CricketState {
  const n = setup.sides.length;
  if (n < 1) throw new Error("Il faut au moins un joueur.");
  return {
    setup,
    marks: Array.from({ length: n }, emptyMarks),
    points: Array(n).fill(0),
    current: setup.firstSide,
    memberIdx: Array(n).fill(0),
    turn: 1,
    volley: [],
    volleyMarks: 0,
    status: "open",
    winner: null,
    history: [],
    events: [],
  };
}

export function closedCount(st: CricketState, side: number): number {
  return CRICKET_NUMBERS.filter((n) => st.marks[side][n] >= 3).length;
}

export function allClosed(st: CricketState, side: number): boolean {
  return closedCount(st, side) === CRICKET_NUMBERS.length;
}

/** Numéro fermé par tout le monde : il ne sert plus à rien. */
export function isDead(st: CricketState, n: CricketNumber): boolean {
  return st.marks.every((m) => m[n] >= 3);
}

export function currentMemberCricket(st: CricketState, side = st.current): string {
  const members = st.setup.sides[side].members;
  return members[st.memberIdx[side] % members.length];
}

function hasWon(st: CricketState, side: number): boolean {
  if (!allClosed(st, side)) return false;
  const others = st.points.filter((_, i) => i !== side);
  switch (st.setup.options.mode) {
    case "none":
      return true;
    case "classic":
      return others.every((p) => st.points[side] >= p);
    case "cut":
      return others.every((p) => st.points[side] <= p);
  }
}

function applyDart(prev: CricketState, dart: Dart): CricketState {
  if (prev.status !== "open" || !isValidDart(dart)) return { ...prev, events: [] };
  const st: CricketState = structuredClone(prev);
  const side = st.current;
  st.volley.push(dart);
  st.events = [{ type: "dart", dart }];

  if (isCricketNumber(dart.n)) {
    const n = dart.n;
    for (let i = 0; i < dart.m; i++) {
      if (st.marks[side][n] < 3) {
        st.marks[side][n] += 1;
        st.volleyMarks += 1;
        if (st.marks[side][n] === 3) st.events.push({ type: "closed", side, n });
        continue;
      }
      const open = st.marks.map((m, j) => j !== side && m[n] < 3);
      if (!open.some(Boolean)) continue; // fermé partout : la touche ne sert à rien
      st.volleyMarks += 1;
      if (st.setup.options.mode === "classic") st.points[side] += n;
      else if (st.setup.options.mode === "cut") open.forEach((o, j) => o && (st.points[j] += n));
    }
  }

  if (hasWon(st, side)) {
    st.status = "match";
    st.winner = side;
    closeVolley(st);
    st.events.push({ type: "matchWon", side });
    return st;
  }

  if (st.volley.length === 3) {
    st.status = "full";
    closeVolley(st);
  }
  return st;
}

function closeVolley(st: CricketState) {
  const side = st.current;
  const marks = st.volleyMarks;
  st.events.push({ type: "volley", side, marks });
  if (marks >= 9) st.events.push({ type: "nineMarks", side });
  else if (marks >= 6) st.events.push({ type: "manyMarks", side, marks });
  else if (marks === 0 && st.volley.length === 3) st.events.push({ type: "noMarks", side });
  st.history.push({ side, member: currentMemberCricket(st), turn: st.turn, darts: st.volley.slice(), marks });
}

function applyNext(prev: CricketState): CricketState {
  if (prev.status !== "full") return { ...prev, events: [] };
  const st: CricketState = structuredClone(prev);
  st.memberIdx[st.current] += 1;
  st.current = (st.current + 1) % st.setup.sides.length;
  if (st.current === st.setup.firstSide) st.turn += 1;
  st.volley = [];
  st.volleyMarks = 0;
  st.status = "open";
  st.events = [{ type: "nextPlayer", side: st.current }];
  return st;
}

export function applyCricket(state: CricketState, action: Action): CricketState {
  return action.type === "dart" ? applyDart(state, action.dart) : applyNext(state);
}

export function replayCricket(setup: CricketSetup, actions: Action[]): CricketState {
  return actions.reduce(applyCricket, initCricket(setup));
}

/** Classement : le vainqueur, puis le plus de numéros fermés, puis les points (moins = mieux en cut-throat). */
export function rankingCricket(st: CricketState): number[] {
  const cut = st.setup.options.mode === "cut";
  return st.setup.sides
    .map((_, i) => i)
    .sort((a, b) => {
      if (st.winner === a) return -1;
      if (st.winner === b) return 1;
      return closedCount(st, b) - closedCount(st, a) || (cut ? st.points[a] - st.points[b] : st.points[b] - st.points[a]);
    });
}

/** Meilleure volée en nombre de touches utiles. */
export function bestCricketVolley(st: CricketState): CricketVolley | null {
  let best: CricketVolley | null = null;
  for (const v of st.history) if (!best || v.marks > best.marks) best = v;
  return best && best.marks > 0 ? best : null;
}
