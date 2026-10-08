import { describe, expect, it } from "vitest";
import type { Action } from "./types";
import { type ClockOptions, type ClockSetup, clockTarget, rankingClock, replayClock } from "./clock";

const d = (n: number, m: 1 | 2 | 3 = 1): Action => ({ type: "dart", dart: { n, m } });
const next: Action = { type: "next" };
const miss = d(0);

function setup(options: Partial<ClockOptions> = {}, names = ["Guillaume", "Thomas"]): ClockSetup {
  return { sides: names.map((n) => ({ name: n, members: [n] })), options: { bonus: false, bullFinish: false, ...options }, firstSide: 0 };
}

/** Touche les numéros de `from` à `to` en simple, en passant au joueur suivant (qui rate) toutes les 3 fléchettes. */
function run(from: number, to: number, m: 1 | 2 | 3 = 1): Action[] {
  const out: Action[] = [];
  let k = 0;
  for (let n = from; n <= to; n++) {
    out.push(d(n, m));
    if (++k === 3) {
      out.push(next, miss, miss, miss, next);
      k = 0;
    }
  }
  return out;
}

describe("Tour de l'horloge", () => {
  it("on commence au 1, chaque touche avance d'un numéro", () => {
    const st = replayClock(setup(), [d(1), d(2, 3)]);
    expect(clockTarget(st)).toBe(3);
  });

  it("une fléchette sur un autre numéro ne compte pas", () => {
    const st = replayClock(setup(), [d(5), miss]);
    expect(clockTarget(st)).toBe(1);
  });

  it("la volée finit après 3 fléchettes, puis joueur suivant et tours", () => {
    const st = replayClock(setup(), [miss, miss, miss]);
    expect(st.status).toBe("full");
    expect(st.events.map((e) => e.type)).toContain("threeMisses");
    const st2 = replayClock(setup(), [miss, miss, miss, next, miss, miss, miss, next]);
    expect(st2.current).toBe(0);
    expect(st2.turn).toBe(2);
  });

  it("trois touches dans la volée", () => {
    const st = replayClock(setup(), [d(1), d(2), d(3)]);
    expect(st.events.map((e) => e.type)).toContain("threeHits");
  });

  it("bonus : double = +2, triple = +3", () => {
    const st = replayClock(setup({ bonus: true }), [d(1, 2), d(3, 3)]);
    expect(clockTarget(st)).toBe(6);
  });

  it("le premier qui touche le 20 gagne", () => {
    const st = replayClock(setup(), run(1, 20));
    expect(st.status).toBe("match");
    expect(st.winner).toBe(0);
    expect(st.winTurn).toBe(7);
    expect(rankingClock(st)).toEqual([0, 1]);
  });

  it("finir au bull : après le 20, il faut le centre", () => {
    const acts = run(1, 20);
    const st = replayClock(setup({ bullFinish: true }), acts);
    expect(st.status).toBe("open");
    expect(clockTarget(st)).toBe(25);
    const st2 = replayClock(setup({ bullFinish: true }), [...acts, d(25)]);
    expect(st2.winner).toBe(0);
  });

  it("finir au bull : un bonus ne saute pas le centre", () => {
    const acts = [...run(1, 18), d(19, 3)];
    const st = replayClock(setup({ bonus: true, bullFinish: true }), acts);
    expect(clockTarget(st)).toBe(25);
    expect(st.status).not.toBe("match");
  });

  it("bonus sans bull : un triple sur le 19 finit la partie", () => {
    const st = replayClock(setup({ bonus: true }), [...run(1, 18), d(19, 3)]);
    expect(st.winner).toBe(0);
  });

  it("seul, ça marche aussi", () => {
    const st = replayClock(setup({}, ["Guillaume"]), [miss, miss, miss, next]);
    expect(st.current).toBe(0);
    expect(st.turn).toBe(2);
  });
});
