import { describe, expect, it } from "vitest";
import type { Action } from "./types";
import { type CricketMode, type CricketSetup, allClosed, isDead, rankingCricket, replayCricket } from "./cricket";

const d = (n: number, m: 1 | 2 | 3 = 1): Action => ({ type: "dart", dart: { n, m } });
const next: Action = { type: "next" };
const miss = d(0);

function setup(mode: CricketMode = "classic", names = ["Guillaume", "Thomas"], firstSide = 0): CricketSetup {
  return { sides: names.map((n) => ({ name: n, members: [n] })), options: { mode }, firstSide };
}

/** Le camp 0 ferme tout en 3 tours (T20 T19 T18 / T17 T16 T15 / bull, bull), l'adversaire rate tout. */
const closeAll: Action[] = [
  d(20, 3), d(19, 3), d(18, 3), next, miss, miss, miss, next,
  d(17, 3), d(16, 3), d(15, 3), next, miss, miss, miss, next,
  d(25, 2), d(25, 1),
];

describe("Cricket : touches", () => {
  it("un simple = 1 touche, un double = 2, un triple = 3 (fermé)", () => {
    const st = replayCricket(setup(), [d(20), d(19, 2), d(18, 3)]);
    expect(st.marks[0][20]).toBe(1);
    expect(st.marks[0][19]).toBe(2);
    expect(st.marks[0][18]).toBe(3);
    expect(st.events).toContainEqual({ type: "closed", side: 0, n: 18 });
  });

  it("les numéros hors 15-20 et centre ne comptent pas", () => {
    const st = replayCricket(setup(), [d(14, 3), d(1), miss]);
    expect(st.volleyMarks).toBe(0);
    expect(st.status).toBe("full");
    expect(st.events.map((e) => e.type)).toContain("noMarks");
  });

  it("le bull double compte 2 touches", () => {
    const st = replayCricket(setup(), [d(25, 2)]);
    expect(st.marks[0][25]).toBe(2);
  });

  it("joueur suivant et tours", () => {
    const st = replayCricket(setup(), [miss, miss, miss, next]);
    expect(st.current).toBe(1);
    const st2 = replayCricket(setup(), [miss, miss, miss, next, miss, miss, miss, next]);
    expect(st2.current).toBe(0);
    expect(st2.turn).toBe(2);
  });
});

describe("Cricket classique : points", () => {
  it("une touche en trop sur un numéro fermé rapporte ses points si l'adversaire ne l'a pas fermé", () => {
    const st = replayCricket(setup(), [d(20, 3), d(20, 2), d(20)]);
    expect(st.points[0]).toBe(60);
  });

  it("plus de points quand tout le monde a fermé", () => {
    const acts: Action[] = [d(20, 3), miss, miss, next, d(20, 3), miss, miss, next, d(20, 3)];
    const st = replayCricket(setup(), acts);
    expect(st.points[0]).toBe(0);
    expect(isDead(st, 20)).toBe(true);
  });

  it("tout fermer en menant aux points gagne", () => {
    const st = replayCricket(setup(), closeAll);
    expect(allClosed(st, 0)).toBe(true);
    expect(st.status).toBe("match");
    expect(st.winner).toBe(0);
  });

  it("tout fermer sans mener aux points ne gagne pas", () => {
    const behind: Action[] = [
      miss, miss, miss, next, d(20, 3), d(20, 3), d(20, 3), next, // Thomas marque 120
      ...closeAll,
    ];
    const st = replayCricket(setup(), behind);
    expect(allClosed(st, 0)).toBe(true);
    expect(st.winner).toBeNull();
  });
});

describe("Cricket sans points", () => {
  it("le premier qui ferme tout gagne, même sans points", () => {
    const behind: Action[] = [miss, miss, miss, next, d(20, 3), d(20, 3), d(20, 3), next, ...closeAll];
    const st = replayCricket(setup("none"), behind);
    expect(st.points).toEqual([0, 0]);
    expect(st.winner).toBe(0);
  });
});

describe("Cut-throat", () => {
  it("les points vont aux adversaires qui n'ont pas fermé", () => {
    const st = replayCricket(setup("cut", ["A", "B", "C"]), [d(20, 3), d(20, 3)]);
    expect(st.points).toEqual([0, 60, 60]);
  });

  it("il faut tout fermer avec le plus petit score", () => {
    const st = replayCricket(setup("cut"), closeAll);
    expect(st.winner).toBe(0);
  });
});

describe("Classement et événements", () => {
  it("le vainqueur passe en premier", () => {
    const st = replayCricket(setup("classic", ["A", "B", "C"]), [miss, miss, miss, next, d(20, 3), miss, miss, next]);
    expect(rankingCricket(st)[0]).toBe(1);
  });

  it("9 touches en une volée", () => {
    const st = replayCricket(setup(), [d(20, 3), d(19, 3), d(18, 3)]);
    expect(st.events.map((e) => e.type)).toContain("nineMarks");
  });

  it("6 touches et plus", () => {
    const st = replayCricket(setup(), [d(20, 3), d(19, 3), miss]);
    expect(st.events).toContainEqual({ type: "manyMarks", side: 0, marks: 6 });
  });

  it("refuse une 4e fléchette avant « joueur suivant »", () => {
    const st = replayCricket(setup(), [d(20), d(20), d(20), d(19)]);
    expect(st.marks[0][19]).toBe(0);
  });
});
