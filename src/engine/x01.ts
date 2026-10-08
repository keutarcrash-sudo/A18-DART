/**
 * Moteur du 301 / 501 / 701.
 *
 * Règles (docs/05-jeux.md, docs/00-cadrage.md) :
 * - fin « pile à zéro » par défaut, « Double out » en option ;
 * - « Double in » en option : le score ne descend qu'après un premier double ;
 * - bust : la volée est annulée, le score revient à sa valeur de début de volée ;
 * - manches : 1, 3 ou 5 (le premier à la majorité gagne), le départ tourne à chaque manche ;
 * - équipes : un camp peut avoir plusieurs membres, qui lancent à tour de rôle.
 */
import { type Action, type Dart, type Side, dartPoints, isDouble, isValidDart } from "./types";

export type X01Start = 301 | 501 | 701;

export interface X01Options {
  start: X01Start;
  finish: "simple" | "double";
  doubleIn: boolean;
  legs: 1 | 3 | 5;
}

export const DEFAULT_X01_OPTIONS: X01Options = { start: 501, finish: "simple", doubleIn: false, legs: 1 };

export interface X01Setup {
  sides: Side[];
  options: X01Options;
  /** Camp qui commence (désigné au bull). */
  firstSide: number;
}

/**
 * open  : la volée est en cours ;
 * full  : 3 fléchettes lancées, en attente de « joueur suivant » ;
 * bust  : volée annulée, en attente de « joueur suivant » ;
 * leg   : manche gagnée, en attente de la manche suivante ;
 * match : partie terminée.
 */
export type VolleyStatus = "open" | "full" | "bust" | "leg" | "match";

export type X01Event =
  | { type: "dart"; dart: Dart }
  | { type: "bust"; side: number }
  | { type: "volley"; side: number; points: number }
  | { type: "ton"; side: number; points: number }
  | { type: "oneEighty"; side: number }
  | { type: "twentySix"; side: number }
  | { type: "threeMisses"; side: number }
  | { type: "checkout"; side: number; value: number }
  | { type: "legWon"; side: number; leg: number }
  | { type: "matchWon"; side: number }
  | { type: "nextPlayer"; side: number };

export interface X01Volley {
  side: number;
  member: string;
  turn: number;
  leg: number;
  darts: Dart[];
  points: number;
  bust: boolean;
  /** Volée qui gagne la manche : sa valeur est le checkout (score de départ de la volée). */
  checkout: boolean;
}

export interface X01State {
  setup: X01Setup;
  scores: number[];
  opened: boolean[];
  legsWon: number[];
  leg: number;
  legStarter: number;
  current: number;
  memberIdx: number[];
  turn: number;
  volley: Dart[];
  /** Score du camp actif au début de la volée. */
  volleyStart: number;
  /** Le camp actif avait-il déjà ouvert (Double in) au début de la volée ? */
  volleyOpened: boolean;
  status: VolleyStatus;
  winner: number | null;
  history: X01Volley[];
  /** Événements produits par la dernière action (pour les animations). */
  events: X01Event[];
}

export function legsNeeded(o: X01Options): number {
  return Math.ceil(o.legs / 2);
}

export function initX01(setup: X01Setup): X01State {
  const n = setup.sides.length;
  if (n < 1) throw new Error("Il faut au moins un joueur.");
  const s = setup.options.start;
  return {
    setup,
    scores: Array(n).fill(s),
    opened: Array(n).fill(!setup.options.doubleIn),
    legsWon: Array(n).fill(0),
    leg: 1,
    legStarter: setup.firstSide,
    current: setup.firstSide,
    memberIdx: Array(n).fill(0),
    turn: 1,
    volley: [],
    volleyStart: s,
    volleyOpened: !setup.options.doubleIn,
    status: "open",
    winner: null,
    history: [],
    events: [],
  };
}

/** Points de la volée en cours, en tenant compte du Double in. */
export function volleyScore(state: Pick<X01State, "volley" | "volleyOpened">): { points: number; opened: boolean } {
  let opened = state.volleyOpened;
  let points = 0;
  for (const d of state.volley) {
    if (!opened && isDouble(d)) opened = true;
    if (opened) points += dartPoints(d);
  }
  return { points, opened };
}

export function currentMember(state: X01State, side = state.current): string {
  const members = state.setup.sides[side].members;
  return members[state.memberIdx[side] % members.length];
}

function applyDart(prev: X01State, dart: Dart): X01State {
  if (prev.status !== "open" || !isValidDart(dart)) return { ...prev, events: [] };
  const st: X01State = structuredClone(prev);
  const side = st.current;
  st.volley.push(dart);
  st.events = [{ type: "dart", dart }];

  const { points, opened } = volleyScore(st);
  const rest = st.volleyStart - points;
  const doubleOut = st.setup.options.finish === "double";
  const finishedOnDouble = isDouble(dart);

  const bust = rest < 0 || (doubleOut && (rest === 1 || (rest === 0 && !finishedOnDouble)));

  if (bust) {
    st.scores[side] = st.volleyStart;
    st.status = "bust";
    st.events.push({ type: "bust", side });
    return st;
  }

  st.scores[side] = rest;
  st.opened[side] = opened;

  if (rest === 0) {
    st.legsWon[side] += 1;
    st.events.push({ type: "checkout", side, value: st.volleyStart });
    volleyEvents(st, points);
    st.events.push({ type: "legWon", side, leg: st.leg });
    if (st.legsWon[side] >= legsNeeded(st.setup.options)) {
      st.status = "match";
      st.winner = side;
      st.events.push({ type: "matchWon", side });
      st.history.push(snapshotVolley(st, points, false));
    } else {
      st.status = "leg";
    }
    return st;
  }

  if (st.volley.length === 3) {
    st.status = "full";
    volleyEvents(st, points);
  }
  return st;
}

function volleyEvents(st: X01State, points: number) {
  const side = st.current;
  st.events.push({ type: "volley", side, points });
  if (points === 180) st.events.push({ type: "oneEighty", side });
  else if (points >= 100) st.events.push({ type: "ton", side, points });
  else if (points === 26 && st.volley.length === 3) st.events.push({ type: "twentySix", side });
  else if (st.volley.length === 3 && st.volley.every((d) => d.n === 0)) st.events.push({ type: "threeMisses", side });
}

function snapshotVolley(st: X01State, points: number, bust: boolean): X01Volley {
  return {
    side: st.current,
    member: currentMember(st),
    turn: st.turn,
    leg: st.leg,
    darts: st.volley.slice(),
    points: bust ? 0 : points,
    bust,
    checkout: !bust && st.scores[st.current] === 0,
  };
}

function applyNext(prev: X01State): X01State {
  if (prev.status === "open" || prev.status === "match") return { ...prev, events: [] };
  const st: X01State = structuredClone(prev);
  const n = st.setup.sides.length;
  const { points } = volleyScore(st);
  st.history.push(snapshotVolley(st, points, st.status === "bust"));
  st.memberIdx[st.current] += 1;

  if (st.status === "leg") {
    st.leg += 1;
    st.scores = Array(n).fill(st.setup.options.start);
    st.opened = Array(n).fill(!st.setup.options.doubleIn);
    st.legStarter = (st.legStarter + 1) % n;
    st.current = st.legStarter;
    st.turn = 1;
  } else {
    st.current = (st.current + 1) % n;
    if (st.current === st.legStarter) st.turn += 1;
  }

  st.volley = [];
  st.volleyStart = st.scores[st.current];
  st.volleyOpened = st.opened[st.current];
  st.status = "open";
  st.events = [{ type: "nextPlayer", side: st.current }];
  return st;
}

export function applyX01(state: X01State, action: Action): X01State {
  return action.type === "dart" ? applyDart(state, action.dart) : applyNext(state);
}

/** Rejoue toute la partie depuis le début : c'est ainsi qu'on annule sans risque d'erreur. */
export function replayX01(setup: X01Setup, actions: Action[]): X01State {
  return actions.reduce(applyX01, initX01(setup));
}

/** Classement : manches gagnées, puis plus petit reste. */
export function rankingX01(st: X01State): number[] {
  return st.setup.sides
    .map((_, i) => i)
    .sort((a, b) => st.legsWon[b] - st.legsWon[a] || st.scores[a] - st.scores[b]);
}

/** Meilleure volée de la partie (hors bust). */
export function bestVolley(st: X01State): X01Volley | null {
  let best: X01Volley | null = null;
  for (const v of st.history) if (!v.bust && (!best || v.points > best.points)) best = v;
  return best;
}

/** Moyenne par volée de 3 fléchettes d'un camp (les busts comptent pour 0). */
export function average(st: X01State, side: number): number {
  const vs = st.history.filter((v) => v.side === side);
  if (!vs.length) return 0;
  return vs.reduce((a, v) => a + v.points, 0) / vs.length;
}

/* ---------- Suggestion de fin (checkout) ---------- */

const SINGLES: Dart[] = [...Array.from({ length: 20 }, (_, i) => ({ n: 20 - i, m: 1 as const })), { n: 25, m: 1 }];
const DOUBLES: Dart[] = [...Array.from({ length: 20 }, (_, i) => ({ n: 20 - i, m: 2 as const })), { n: 25, m: 2 }];
const TRIPLES: Dart[] = Array.from({ length: 20 }, (_, i) => ({ n: 20 - i, m: 3 as const }));
// Ordre de préférence pour les fléchettes de mise en place : triples hauts d'abord.
const SETUP: Dart[] = [...TRIPLES, ...SINGLES, ...DOUBLES];
// Doubles préférés pour finir (les plus joués).
const FAV_DOUBLES = [20, 16, 18, 12, 10, 8, 19, 17, 14, 15, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1, 25];

function finishingDoubles(): Dart[] {
  return FAV_DOUBLES.map((n) => ({ n, m: 2 as const }));
}

/**
 * Propose une fin en 3 fléchettes maximum (ou moins si `dartsLeft` < 3).
 * En Double out, la dernière fléchette est un double ; en fin simple, n'importe laquelle.
 * Renvoie null s'il n'y a pas de fin possible.
 */
export function suggestCheckout(rest: number, finish: "simple" | "double", dartsLeft = 3): Dart[] | null {
  if (rest <= 0 || dartsLeft <= 0) return null;
  const lasts = finish === "double" ? finishingDoubles() : [...TRIPLES, ...SINGLES, ...DOUBLES];
  for (let k = 1; k <= dartsLeft; k++) {
    for (const last of lasts) {
      const before = rest - dartPoints(last);
      if (before < 0) continue;
      if (k === 1) {
        if (before === 0) return [last];
        continue;
      }
      if (k === 2) {
        const a = SETUP.find((d) => dartPoints(d) === before);
        if (a) return [a, last];
        continue;
      }
      for (const a of SETUP) {
        const r = before - dartPoints(a);
        if (r <= 0) continue;
        const b = SETUP.find((d) => dartPoints(d) === r);
        if (b) return [a, b, last];
      }
    }
  }
  return null;
}
