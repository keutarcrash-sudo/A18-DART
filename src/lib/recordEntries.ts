/** Ce que chaque jeu envoie aux records d'Arena18 à la fin d'une partie (voir records.ts). */
import type { X01State } from "@/engine/x01";
import type { HighState } from "@/engine/high";
import type { RecordEntry, RecordGame } from "./records";

/** Volées de 60 et plus, et chaque 180. */
function volleys(history: { member: string; points: number }[], game: RecordGame): RecordEntry[] {
  return history.flatMap((v) => {
    const out: RecordEntry[] = [];
    if (v.points >= 60) out.push({ kind: "volley", name: v.member, value: v.points, game });
    if (v.points === 180) out.push({ kind: "oneEighty", name: v.member, value: 180, game });
    return out;
  });
}

export function recordsX01(st: X01State): RecordEntry[] {
  const game = String(st.setup.options.start) as RecordGame;
  return [
    ...volleys(st.history.filter((v) => !v.bust), game),
    ...st.history.filter((v) => v.checkout && v.points >= 2 && v.points <= 170).map((v): RecordEntry => ({ kind: "checkout", name: v.member, value: v.points, game })),
    gameEntry(st.setup.sides[st.winner ?? 0].name, game),
  ];
}

export function recordsHigh(st: HighState): RecordEntry[] {
  return [...volleys(st.history, "high"), gameEntry(st.setup.sides[st.winners[0] ?? 0].name, "high")];
}

/** La partie elle-même (pour « Parties aujourd'hui »), au nom du gagnant. */
export function gameEntry(winner: string, game: RecordGame): RecordEntry {
  return { kind: "game", name: winner, value: 0, game };
}
