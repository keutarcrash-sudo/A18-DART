/**
 * Moteur du Plus gros score (règles : docs/05-jeux.md).
 *
 * - Un nombre de volées fixé (3 à 10, 8 par défaut). Chaque fléchette marque ses points.
 * - La partie s'arrête toute seule après la dernière volée du dernier joueur.
 * - Le plus gros total gagne (égalité possible : plusieurs gagnants).
 */
import { type Action, type Dart, type Side, dartPoints, isValidDart } from "./types";

export interface HighOptions {
  rounds: number;
}

export const DEFAULT_HIGH_OPTIONS: HighOptions = { rounds: 8 };

export interface HighSetup {
  sides: Side[];
  options: HighOptions;
  firstSide: number;
}

export type HighStatus = "open" | "full" | "match";

export type HighEvent =
  | { type: "dart"; dart: Dart }
  | { type: "volley"; side: number; points: number }
  | { type: "ton"; side: number; points: number }
  | { type: "oneEighty"; side: number }
  | { type: "twentySix"; side: number }
  | { type: "threeMisses"; side: number }
  | { type: "takesLead"; side: number }
  | { type: "matchWon"; sides: number[] }
  | { type: "nextPlayer"; side: number };

export interface HighVolley {
  side: number;
  member: string;
  turn: number;
  darts: Dart[];
  points: number;
}

export interface HighState {
  setup: HighSetup;
  scores: number[];
  current: number;
  memberIdx: number[];
  /** Numéro de la volée en cours (1 à rounds). */
  turn: number;
  volley: Dart[];
  /** Score du camp actif au début de la volée. */
  volleyStart: number;
  status: HighStatus;
  /** Gagnants (plusieurs en cas d'égalité). */
  winners: number[];
  history: HighVolley[];
  events: HighEvent[];
}

export function initHigh(setup: HighSetup): HighState {
  const n = setup.sides.length;
  if (n < 1) throw new Error("Il faut au moins un joueur.");
  return {
    setup,
    scores: Array(n).fill(0),
    current: setup.firstSide,
    memberIdx: Array(n).fill(0),
    turn: 1,
    volley: [],
    volleyStart: 0,
    status: "open",
    winners: [],
    history: [],
    events: [],
  };
}

export function highRounds(setup: HighSetup): number {
  return Math.min(10, Math.max(3, Math.round(setup.options.rounds)));
}

export function currentMemberHigh(st: HighState, side = st.current): string {
  const members = st.setup.sides[side].members;
  return members[st.memberIdx[side] % members.length];
}

/** Seul en tête ? */
function soleLeader(scores: number[], side: number): boolean {
  return scores.every((s, i) => i === side || s < scores[side]);
}

function applyDart(prev: HighState, dart: Dart): HighState {
  if (prev.status !== "open" || !isValidDart(dart)) return { ...prev, events: [] };
  const st: HighState = structuredClone(prev);
  const side = st.current;
  st.volley.push(dart);
  st.scores[side] += dartPoints(dart);
  st.events = [{ type: "dart", dart }];
  if (st.volley.length < 3) return st;

  const points = st.scores[side] - st.volleyStart;
  st.events.push({ type: "volley", side, points });
  if (points === 180) st.events.push({ type: "oneEighty", side });
  else if (points >= 100) st.events.push({ type: "ton", side, points });
  else if (points === 26) st.events.push({ type: "twentySix", side });
  else if (st.volley.every((d) => d.n === 0)) st.events.push({ type: "threeMisses", side });
  const before = st.scores.map((s, i) => (i === side ? st.volleyStart : s));
  if (st.setup.sides.length > 1 && soleLeader(st.scores, side) && !soleLeader(before, side)) st.events.push({ type: "takesLead", side });
  st.history.push({ side, member: currentMemberHigh(st), turn: st.turn, darts: st.volley.slice(), points });

  const n = st.setup.sides.length;
  const last = st.turn === highRounds(st.setup) && (side + 1) % n === st.setup.firstSide;
  if (last) {
    const top = Math.max(...st.scores);
    st.status = "match";
    st.winners = st.scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);
    st.events.push({ type: "matchWon", sides: st.winners });
  } else {
    st.status = "full";
  }
  return st;
}

function applyNext(prev: HighState): HighState {
  if (prev.status !== "full") return { ...prev, events: [] };
  const st: HighState = structuredClone(prev);
  st.memberIdx[st.current] += 1;
  st.current = (st.current + 1) % st.setup.sides.length;
  if (st.current === st.setup.firstSide) st.turn += 1;
  st.volley = [];
  st.volleyStart = st.scores[st.current];
  st.status = "open";
  st.events = [{ type: "nextPlayer", side: st.current }];
  return st;
}

export function applyHigh(state: HighState, action: Action): HighState {
  return action.type === "dart" ? applyDart(state, action.dart) : applyNext(state);
}

export function replayHigh(setup: HighSetup, actions: Action[]): HighState {
  return actions.reduce(applyHigh, initHigh(setup));
}

/** Classement : le plus gros total d'abord. */
export function rankingHigh(st: HighState): number[] {
  return st.setup.sides.map((_, i) => i).sort((a, b) => st.scores[b] - st.scores[a]);
}

export function bestHighVolley(st: HighState): HighVolley | null {
  let best: HighVolley | null = null;
  for (const v of st.history) if (!best || v.points > best.points) best = v;
  return best && best.points > 0 ? best : null;
}
