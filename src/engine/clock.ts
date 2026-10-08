/**
 * Moteur du Tour de l'horloge (règles : docs/05-jeux.md).
 *
 * - On vise 1, puis 2… jusqu'à 20 (puis le centre avec l'option « Finir au bull »).
 * - Par défaut, chaque touche fait avancer d'un numéro, quel que soit le multiplicateur.
 * - Option « Bonus d'avance » : simple = +1, double = +2, triple = +3 (sans sauter le bull).
 * - Le premier au bout gagne.
 */
import { type Action, type Dart, type Side, isValidDart } from "./types";

export interface ClockOptions {
  bonus: boolean;
  bullFinish: boolean;
}

export const DEFAULT_CLOCK_OPTIONS: ClockOptions = { bonus: false, bullFinish: false };

export interface ClockSetup {
  sides: Side[];
  options: ClockOptions;
  firstSide: number;
}

export type ClockStatus = "open" | "full" | "match";

export type ClockEvent =
  | { type: "dart"; dart: Dart }
  | { type: "advance"; side: number; from: number; to: number }
  | { type: "bullNext"; side: number }
  | { type: "threeHits"; side: number }
  | { type: "threeMisses"; side: number }
  | { type: "matchWon"; side: number }
  | { type: "nextPlayer"; side: number };

export interface ClockState {
  setup: ClockSetup;
  /** pos[side] : nombre de cases franchies (0 = vise le 1, 20 = vise le bull ou fini). */
  pos: number[];
  current: number;
  memberIdx: number[];
  turn: number;
  volley: Dart[];
  status: ClockStatus;
  winner: number | null;
  /** Tour où le vainqueur a fini. */
  winTurn: number | null;
  events: ClockEvent[];
}

/** Nombre de cases à franchir : 20, ou 21 avec le bull. */
export function clockLength(setup: ClockSetup): number {
  return setup.options.bullFinish ? 21 : 20;
}

/** Numéro visé pour une position : 1 à 20, puis 25 (le centre). */
export function targetAt(pos: number): number {
  return pos < 20 ? pos + 1 : 25;
}

export function clockTarget(st: ClockState, side = st.current): number {
  return targetAt(st.pos[side]);
}

export function initClock(setup: ClockSetup): ClockState {
  const n = setup.sides.length;
  if (n < 1) throw new Error("Il faut au moins un joueur.");
  return {
    setup,
    pos: Array(n).fill(0),
    current: setup.firstSide,
    memberIdx: Array(n).fill(0),
    turn: 1,
    volley: [],
    status: "open",
    winner: null,
    winTurn: null,
    events: [],
  };
}

export function currentMemberClock(st: ClockState, side = st.current): string {
  const members = st.setup.sides[side].members;
  return members[st.memberIdx[side] % members.length];
}

function applyDart(prev: ClockState, dart: Dart): ClockState {
  if (prev.status !== "open" || !isValidDart(dart)) return { ...prev, events: [] };
  const st: ClockState = structuredClone(prev);
  const side = st.current;
  const end = clockLength(st.setup);
  st.volley.push(dart);
  st.events = [{ type: "dart", dart }];

  const from = st.pos[side];
  if (dart.n > 0 && dart.n === targetAt(from)) {
    const step = st.setup.options.bonus ? dart.m : 1;
    // Le bull ne se saute pas : un bonus s'arrête au centre.
    const cap = st.setup.options.bullFinish && from < 20 ? 20 : end;
    const to = Math.min(from + step, cap);
    st.pos[side] = to;
    st.events.push({ type: "advance", side, from, to });
    if (to === 20 && st.setup.options.bullFinish) st.events.push({ type: "bullNext", side });
  }

  if (st.pos[side] >= end) {
    st.status = "match";
    st.winner = side;
    st.winTurn = st.turn;
    st.events.push({ type: "matchWon", side });
    return st;
  }

  if (st.volley.length === 3) {
    st.status = "full";
    const hits = st.volley.filter((d) => d.n > 0).length;
    if (hits === 3) st.events.push({ type: "threeHits", side });
    if (hits === 0) st.events.push({ type: "threeMisses", side });
  }
  return st;
}

function applyNext(prev: ClockState): ClockState {
  if (prev.status !== "full") return { ...prev, events: [] };
  const st: ClockState = structuredClone(prev);
  st.memberIdx[st.current] += 1;
  st.current = (st.current + 1) % st.setup.sides.length;
  if (st.current === st.setup.firstSide) st.turn += 1;
  st.volley = [];
  st.status = "open";
  st.events = [{ type: "nextPlayer", side: st.current }];
  return st;
}

export function applyClock(state: ClockState, action: Action): ClockState {
  return action.type === "dart" ? applyDart(state, action.dart) : applyNext(state);
}

export function replayClock(setup: ClockSetup, actions: Action[]): ClockState {
  return actions.reduce(applyClock, initClock(setup));
}

/** Classement : le vainqueur, puis le plus avancé. */
export function rankingClock(st: ClockState): number[] {
  return st.setup.sides
    .map((_, i) => i)
    .sort((a, b) => (st.winner === a ? -1 : st.winner === b ? 1 : st.pos[b] - st.pos[a]));
}
