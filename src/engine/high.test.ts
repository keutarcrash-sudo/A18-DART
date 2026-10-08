import { describe, expect, it } from "vitest";
import type { Action } from "./types";
import { type HighSetup, bestHighVolley, rankingHigh, replayHigh } from "./high";

const d = (n: number, m: 1 | 2 | 3 = 1): Action => ({ type: "dart", dart: { n, m } });
const next: Action = { type: "next" };
const miss = d(0);
const misses: Action[] = [miss, miss, miss];

function setup(rounds = 3, names = ["Guillaume", "Thomas"], firstSide = 0): HighSetup {
  return { sides: names.map((n) => ({ name: n, members: [n] })), options: { rounds }, firstSide };
}

describe("Plus gros score", () => {
  it("chaque fléchette marque ses points, le score monte", () => {
    const st = replayHigh(setup(), [d(20, 3), d(25, 2), d(5)]);
    expect(st.scores[0]).toBe(115);
    expect(st.status).toBe("full");
    expect(st.events).toContainEqual({ type: "ton", side: 0, points: 115 });
  });

  it("180, 26 et trois ratés", () => {
    expect(replayHigh(setup(), [d(20, 3), d(20, 3), d(20, 3)]).events.map((e) => e.type)).toContain("oneEighty");
    expect(replayHigh(setup(), [d(20), d(5), d(1)]).events.map((e) => e.type)).toContain("twentySix");
    expect(replayHigh(setup(), misses).events.map((e) => e.type)).toContain("threeMisses");
  });

  it("passer devant l'autre", () => {
    const st = replayHigh(setup(), [d(20), miss, miss, next, d(20), d(1), miss]);
    expect(st.events).toContainEqual({ type: "takesLead", side: 1 });
  });

  it("les volées se comptent par tour complet", () => {
    const st = replayHigh(setup(), [...misses, next, ...misses, next]);
    expect(st.turn).toBe(2);
    expect(st.current).toBe(0);
    expect(st.volleyStart).toBe(0);
  });

  it("la partie s'arrête après la dernière volée du dernier joueur", () => {
    const round = (a: number, b: number): Action[] => [d(a), miss, miss, next, d(b), miss, miss];
    const acts = [...round(20, 1), next, ...round(20, 1), next, ...round(20, 19)];
    const st = replayHigh(setup(3), acts);
    expect(st.status).toBe("match");
    expect(st.winners).toEqual([0]);
    expect(rankingHigh(st)).toEqual([0, 1]);
  });

  it("égalité : plusieurs gagnants", () => {
    const st = replayHigh(setup(3, ["Guillaume", "Thomas"], 1), [
      d(20), miss, miss, next, d(20), miss, miss, next,
      ...misses, next, ...misses, next,
      ...misses, next, ...misses,
    ]);
    expect(st.status).toBe("match");
    expect(st.winners).toEqual([0, 1]);
  });

  it("meilleure volée", () => {
    const st = replayHigh(setup(), [d(20, 3), miss, miss, next, d(19, 3), d(19, 3), miss]);
    expect(bestHighVolley(st)?.points).toBe(114);
  });

  it("seul, ça marche aussi", () => {
    let acts: Action[] = [];
    for (let i = 0; i < 3; i++) acts = [...acts, ...(i ? [next] : []), d(20), d(20), d(20)];
    const st = replayHigh(setup(3, ["Guillaume"]), acts);
    expect(st.status).toBe("match");
    expect(st.scores[0]).toBe(180);
  });
});
