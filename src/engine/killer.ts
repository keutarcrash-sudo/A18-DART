/**
 * Moteur du Killer (règles : docs/05-jeux.md).
 *
 * - Les numéros : chacun lance une fléchette de sa main faible, le numéro touché devient le sien.
 *   Chaque fléchette de cette phase attribue un numéro au camp suivant (hors cible ou déjà pris : on relance).
 * - Seuls les doubles comptent. Toucher le double de son propre numéro rend « tueur ».
 * - Un tueur qui touche le double d'un adversaire lui enlève une vie ; son propre double lui en coûte une.
 * - À zéro vie, on est éliminé. Le dernier en vie gagne.
 */
import { type Action, type Dart, type Side, isValidDart } from "./types";

export interface KillerOptions {
  lives: number;
}

export const DEFAULT_KILLER_OPTIONS: KillerOptions = { lives: 3 };

export interface KillerSetup {
  sides: Side[];
  options: KillerOptions;
  firstSide: number;
}

/** numbers : on attribue les numéros ; open : volée en cours ; full : 3 fléchettes, à valider ; match : fini. */
export type KillerStatus = "numbers" | "open" | "full" | "match";

export type KillerEvent =
  | { type: "dart"; dart: Dart }
  | { type: "numberSet"; side: number; n: number }
  | { type: "numbersDone" }
  | { type: "killer"; side: number }
  | { type: "hit"; by: number; side: number; lives: number }
  | { type: "selfHit"; side: number; lives: number }
  | { type: "eliminated"; side: number; by: number }
  | { type: "noEffect"; side: number }
  | { type: "matchWon"; side: number }
  | { type: "nextPlayer"; side: number };

export interface KillerState {
  setup: KillerSetup;
  /** numbers[side] : son numéro (0 tant qu'il n'est pas attribué). */
  numbers: number[];
  lives: number[];
  killer: boolean[];
  /** Camps éliminés, dans l'ordre. */
  out: number[];
  current: number;
  memberIdx: number[];
  turn: number;
  volley: Dart[];
  /** La volée en cours a-t-elle changé quelque chose ? */
  volleyEffect: boolean;
  status: KillerStatus;
  winner: number | null;
  events: KillerEvent[];
}

export function initKiller(setup: KillerSetup): KillerState {
  const n = setup.sides.length;
  if (n < 2) throw new Error("Il faut au moins deux camps.");
  const lives = Math.min(5, Math.max(1, Math.round(setup.options.lives)));
  return {
    setup,
    numbers: Array(n).fill(0),
    lives: Array(n).fill(lives),
    killer: Array(n).fill(false),
    out: [],
    current: setup.firstSide,
    memberIdx: Array(n).fill(0),
    turn: 1,
    volley: [],
    volleyEffect: false,
    status: "numbers",
    winner: null,
    events: [],
  };
}

export function isOut(st: KillerState, side: number): boolean {
  return st.lives[side] <= 0;
}

export function aliveSides(st: KillerState): number[] {
  return st.setup.sides.map((_, i) => i).filter((i) => !isOut(st, i));
}

export function currentMemberKiller(st: KillerState, side = st.current): string {
  const members = st.setup.sides[side].members;
  return members[st.memberIdx[side] % members.length];
}

/** Camp qui doit encore recevoir son numéro (dans l'ordre de jeu), ou null quand tout le monde en a un. */
export function nextToNumber(st: KillerState): number | null {
  const n = st.setup.sides.length;
  for (let k = 0; k < n; k++) {
    const i = (st.setup.firstSide + k) % n;
    if (!st.numbers[i]) return i;
  }
  return null;
}

/** À qui appartient ce numéro ? */
export function ownerOf(st: KillerState, n: number): number | null {
  const i = st.numbers.indexOf(n);
  return n > 0 && i >= 0 ? i : null;
}

function applyNumber(prev: KillerState, dart: Dart): KillerState {
  const side = nextToNumber(prev);
  // Hors cible, centre ou numéro déjà pris : on relance, rien ne change.
  if (side === null || dart.n < 1 || dart.n > 20 || prev.numbers.includes(dart.n)) return { ...prev, events: [] };
  const st: KillerState = structuredClone(prev);
  st.numbers[side] = dart.n;
  st.events = [{ type: "numberSet", side, n: dart.n }];
  if (nextToNumber(st) === null) {
    st.status = "open";
    st.events.push({ type: "numbersDone" });
  }
  return st;
}

function applyDart(prev: KillerState, dart: Dart): KillerState {
  if (!isValidDart(dart)) return { ...prev, events: [] };
  if (prev.status === "numbers") return applyNumber(prev, dart);
  if (prev.status !== "open") return { ...prev, events: [] };
  const st: KillerState = structuredClone(prev);
  const me = st.current;
  st.volley.push(dart);
  st.events = [{ type: "dart", dart }];

  const target = dart.m === 2 ? ownerOf(st, dart.n) : null;
  if (target !== null && !isOut(st, target)) {
    if (target === me) {
      if (!st.killer[me]) {
        st.killer[me] = true;
        st.volleyEffect = true;
        st.events.push({ type: "killer", side: me });
      } else {
        loseLife(st, me, me);
      }
    } else if (st.killer[me]) {
      loseLife(st, target, me);
    }
  }

  const alive = aliveSides(st);
  if (alive.length === 1) {
    st.status = "match";
    st.winner = alive[0];
    st.events.push({ type: "matchWon", side: alive[0] });
    return st;
  }

  // Volée finie après 3 fléchettes, ou tout de suite si le lanceur vient de s'éliminer.
  if (st.volley.length === 3 || isOut(st, me)) {
    st.status = "full";
    if (!st.volleyEffect && st.volley.length === 3) st.events.push({ type: "noEffect", side: me });
  }
  return st;
}

function loseLife(st: KillerState, side: number, by: number) {
  st.lives[side] -= 1;
  st.volleyEffect = true;
  st.events.push(side === by ? { type: "selfHit", side, lives: st.lives[side] } : { type: "hit", by, side, lives: st.lives[side] });
  if (st.lives[side] === 0) {
    st.out.push(side);
    st.events.push({ type: "eliminated", side, by });
  }
}

function applyNext(prev: KillerState): KillerState {
  if (prev.status !== "full") return { ...prev, events: [] };
  const st: KillerState = structuredClone(prev);
  const n = st.setup.sides.length;
  st.memberIdx[st.current] += 1;
  let i = st.current;
  do {
    i = (i + 1) % n;
    if (i === st.setup.firstSide) st.turn += 1;
  } while (isOut(st, i));
  st.current = i;
  st.volley = [];
  st.volleyEffect = false;
  st.status = "open";
  st.events = [{ type: "nextPlayer", side: i }];
  return st;
}

export function applyKiller(state: KillerState, action: Action): KillerState {
  return action.type === "dart" ? applyDart(state, action.dart) : applyNext(state);
}

export function replayKiller(setup: KillerSetup, actions: Action[]): KillerState {
  return actions.reduce(applyKiller, initKiller(setup));
}

/** Classement : le vainqueur, puis les survivants (plus de vies d'abord), puis les éliminés du dernier au premier. */
export function rankingKiller(st: KillerState): number[] {
  const alive = aliveSides(st).sort((a, b) => (st.winner === a ? -1 : st.winner === b ? 1 : st.lives[b] - st.lives[a]));
  return [...alive, ...st.out.slice().reverse()];
}
