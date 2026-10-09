/**
 * Types communs à tous les jeux.
 *
 * Le moteur ne connaît pas l'interface : il reçoit des actions (une fléchette,
 * « joueur suivant ») et renvoie un nouvel état plus des événements
 * (bust, 180, victoire…) que l'interface transforme en animations.
 */

export type Mult = 1 | 2 | 3;

/** Une fléchette. n = 0 (ratée), 1 à 20, ou 25 (centre : m=1 → 25, m=2 → bull 50). */
export interface Dart {
  n: number;
  m: Mult;
}

/** Un camp : un joueur seul, ou une équipe dont les membres lancent à tour de rôle. */
export interface Side {
  name: string;
  members: string[];
}

export type Action = { type: "dart"; dart: Dart } | { type: "next" };

export const MISS: Dart = { n: 0, m: 1 };

export function dartPoints(d: Dart): number {
  return d.n * d.m;
}

export function isDouble(d: Dart): boolean {
  return d.n > 0 && d.m === 2;
}

/** Libellé court d'une fléchette : 20, D16, T20, 25, BULL, 0. */
export function dartLabel(d: Dart): string {
  if (d.n === 0) return "0";
  if (d.n === 25) return d.m === 2 ? "BULL" : "25";
  return (d.m === 2 ? "D" : d.m === 3 ? "T" : "") + d.n;
}

export function isValidDart(d: Dart): boolean {
  if (d.n === 0) return d.m === 1;
  if (d.n === 25) return d.m === 1 || d.m === 2;
  return Number.isInteger(d.n) && d.n >= 1 && d.n <= 20 && [1, 2, 3].includes(d.m);
}

/**
 * Annuler : retire la dernière fléchette, y compris à travers un changement de joueur
 * (les « next » en fin de liste sont retirés avec elle).
 */
export function undoLastDart(actions: Action[]): Action[] {
  const out = actions.slice();
  while (out.length && out[out.length - 1].type === "next") out.pop();
  if (out.length) out.pop();
  return out;
}

/** Fléchette encore « modifiable » en Double / Triple : un simple de 1 à 20 (le bull et les ratés ne le sont pas). */
export function canUpgrade(d: Dart | undefined): boolean {
  return !!d && d.m === 1 && d.n >= 1 && d.n <= 20;
}

