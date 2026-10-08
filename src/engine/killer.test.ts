import { describe, expect, it } from "vitest";
import { type Action, undoLastDart } from "./types";
import { type KillerSetup, nextToNumber, rankingKiller, replayKiller } from "./killer";

const d = (n: number, m: 1 | 2 | 3 = 1): Action => ({ type: "dart", dart: { n, m } });
const D = (n: number) => d(n, 2);
const next: Action = { type: "next" };
const miss = d(0);

function setup(lives = 3, names = ["Guillaume", "Thomas", "Léa"], firstSide = 0): KillerSetup {
  return { sides: names.map((n) => ({ name: n, members: [n] })), options: { lives }, firstSide };
}

/** Guillaume a le 20, Thomas le 14, Léa le 6. */
const numbers: Action[] = [d(20), d(14), d(6)];

describe("Killer : les numéros", () => {
  it("chaque fléchette attribue un numéro au suivant, dans l'ordre de jeu", () => {
    const st = replayKiller(setup(3, undefined, 1), [d(20), d(14)]);
    expect(st.numbers).toEqual([0, 20, 14]);
    expect(nextToNumber(st)).toBe(0);
    expect(st.status).toBe("numbers");
  });

  it("numéro déjà pris, centre ou hors cible : on relance", () => {
    const st = replayKiller(setup(), [d(20), d(20), d(25), miss, d(14)]);
    expect(st.numbers).toEqual([20, 14, 0]);
  });

  it("la partie commence quand tout le monde a son numéro", () => {
    const st = replayKiller(setup(), numbers);
    expect(st.status).toBe("open");
    expect(st.current).toBe(0);
    expect(st.events.map((e) => e.type)).toContain("numbersDone");
  });

  it("annuler revient sur le dernier numéro", () => {
    const st = replayKiller(setup(), undoLastDart(numbers));
    expect(st.numbers).toEqual([20, 14, 0]);
    expect(st.status).toBe("numbers");
  });
});

describe("Killer : tueur et vies", () => {
  it("seuls les doubles comptent", () => {
    const st = replayKiller(setup(), [...numbers, d(20), d(20, 3), d(14, 3)]);
    expect(st.killer[0]).toBe(false);
    expect(st.lives).toEqual([3, 3, 3]);
    expect(st.events.map((e) => e.type)).toContain("noEffect");
  });

  it("son propre double rend tueur", () => {
    const st = replayKiller(setup(), [...numbers, D(20)]);
    expect(st.killer[0]).toBe(true);
    expect(st.events).toContainEqual({ type: "killer", side: 0 });
  });

  it("pas tueur : le double d'un autre ne fait rien", () => {
    const st = replayKiller(setup(), [...numbers, D(14)]);
    expect(st.lives[1]).toBe(3);
  });

  it("un tueur enlève une vie avec le double d'un adversaire", () => {
    const st = replayKiller(setup(), [...numbers, D(20), D(14), D(14)]);
    expect(st.lives[1]).toBe(1);
    expect(st.events).toContainEqual({ type: "hit", by: 0, side: 1, lives: 1 });
  });

  it("un tueur qui touche son propre double perd une vie", () => {
    const st = replayKiller(setup(), [...numbers, D(20), D(20)]);
    expect(st.lives[0]).toBe(2);
    expect(st.events).toContainEqual({ type: "selfHit", side: 0, lives: 2 });
  });

  it("à zéro vie on est éliminé, et on est sauté au tour suivant", () => {
    const st = replayKiller(setup(1), [...numbers, D(20), D(14), miss, next]);
    expect(st.out).toEqual([1]);
    expect(st.current).toBe(2);
    const st2 = replayKiller(setup(1), [...numbers, D(20), D(14), miss, next, miss, miss, miss, next]);
    expect(st2.current).toBe(0);
    expect(st2.turn).toBe(2);
  });

  it("le lanceur qui s'élimine lui-même termine sa volée", () => {
    const st = replayKiller(setup(1), [...numbers, D(20), D(20)]);
    expect(st.out).toEqual([0]);
    expect(st.status).toBe("full");
  });

  it("le dernier en vie gagne", () => {
    const st = replayKiller(setup(1), [...numbers, D(20), D(14), D(6)]);
    expect(st.status).toBe("match");
    expect(st.winner).toBe(0);
    expect(rankingKiller(st)).toEqual([0, 2, 1]);
  });

  it("un éliminé ne perd plus de vie", () => {
    const st = replayKiller(setup(1), [...numbers, D(20), D(14), D(14)]);
    expect(st.lives[1]).toBe(0);
  });

  it("le tour passe au premier joueur même s'il est éliminé", () => {
    // Thomas (1) élimine Guillaume (0), qui commençait.
    const acts: Action[] = [...numbers, miss, miss, miss, next, D(14), D(20), miss, next, miss, miss, miss, next];
    const st = replayKiller(setup(1), acts);
    expect(st.out).toEqual([0]);
    expect(st.current).toBe(1);
    expect(st.turn).toBe(2);
  });
});
