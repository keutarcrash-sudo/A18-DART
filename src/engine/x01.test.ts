import { describe, expect, it } from "vitest";
import { type Action, type Dart, undoLastDart } from "./types";
import {
  DEFAULT_X01_OPTIONS,
  type X01Options,
  type X01Setup,
  bestVolley,
  currentMember,
  rankingX01,
  replayX01,
  suggestCheckout,
} from "./x01";

const d = (n: number, m: 1 | 2 | 3 = 1): Action => ({ type: "dart", dart: { n, m } });
const next: Action = { type: "next" };
const T20 = d(20, 3);

function setup(opts: Partial<X01Options> = {}, names = ["Guillaume", "Thomas"], firstSide = 0): X01Setup {
  return {
    sides: names.map((n) => ({ name: n, members: [n] })),
    options: { ...DEFAULT_X01_OPTIONS, ...opts },
    firstSide,
  };
}

describe("301 / 501 : bases", () => {
  it("soustrait la volée et passe au joueur suivant", () => {
    const st = replayX01(setup(), [d(20), d(20), d(20)]);
    expect(st.scores[0]).toBe(441);
    expect(st.status).toBe("full");
    const st2 = replayX01(setup(), [d(20), d(20), d(20), next]);
    expect(st2.current).toBe(1);
    expect(st2.volleyStart).toBe(501);
    expect(st2.turn).toBe(1);
  });

  it("compte les tours quand tout le monde a joué", () => {
    const st = replayX01(setup(), [d(1), d(1), d(1), next, d(1), d(1), d(1), next]);
    expect(st.current).toBe(0);
    expect(st.turn).toBe(2);
  });

  it("le joueur désigné au bull commence", () => {
    const st = replayX01(setup({}, ["A", "B", "C"], 2), []);
    expect(st.current).toBe(2);
    const st2 = replayX01(setup({}, ["A", "B", "C"], 2), [d(1), d(1), d(1), next, d(1), d(1), d(1), next, d(1), d(1), d(1), next]);
    expect(st2.current).toBe(2);
    expect(st2.turn).toBe(2);
  });

  it("refuse une 4e fléchette avant « joueur suivant »", () => {
    const st = replayX01(setup(), [d(20), d(20), d(20), d(20)]);
    expect(st.volley).toHaveLength(3);
    expect(st.scores[0]).toBe(441);
  });

  it("ignore les fléchettes impossibles (triple 25)", () => {
    const st = replayX01(setup(), [d(25, 3)]);
    expect(st.volley).toHaveLength(0);
  });
});

describe("Fin de partie", () => {
  it("fin simple : pile à zéro avec n'importe quelle fléchette gagne", () => {
    const st = replayX01(setup({ start: 301 }), [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(1)]);
    expect(st.scores[0]).toBe(0);
    expect(st.status).toBe("match");
    expect(st.winner).toBe(0);
    expect(st.events.map((e) => e.type)).toContain("matchWon");
  });

  it("fin simple : dépasser zéro fait bust et rend le score de début de volée", () => {
    const st = replayX01(setup({ start: 301 }), [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(20)]);
    expect(st.status).toBe("bust");
    expect(st.scores[0]).toBe(121);
    const after = replayX01(setup({ start: 301 }), [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(20), next]);
    expect(after.current).toBe(1);
    expect(after.scores[0]).toBe(121);
  });

  it("le bust arrête la volée dès qu’il arrive", () => {
    const base: Action[] = [T20, T20, T20, next, d(1), d(1), d(1), next]; // reste 121
    // 121 - 50 - 50 = 21, puis 21 - 50 < 0 → bust à la 3e
    const st = replayX01(setup({ start: 301 }), [...base, d(25, 2), d(25, 2), d(25, 2)]);
    expect(st.status).toBe("bust");
  });

  it("Double out : finir sur un simple fait bust", () => {
    const st = replayX01(setup({ start: 301, finish: "double" }), [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(1)]);
    expect(st.status).toBe("bust");
    expect(st.scores[0]).toBe(121);
  });

  it("Double out : rester à 1 fait bust", () => {
    const st = replayX01(setup({ start: 301, finish: "double" }), [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(20)]);
    expect(st.status).toBe("bust");
  });

  it("Double out : finir sur un double gagne (le bull compte comme double)", () => {
    const base: Action[] = [T20, T20, T20, next, d(1), d(1), d(1), next];
    const st = replayX01(setup({ start: 301, finish: "double" }), [...base, T20, d(11), d(25, 2)]);
    expect(st.winner).toBe(0);
    const st2 = replayX01(setup({ start: 301, finish: "double" }), [...base, d(19, 3), d(8, 3), d(20, 2)]);
    expect(st2.winner).toBe(0);
  });

  it("Double in : rien ne compte avant le premier double", () => {
    const st = replayX01(setup({ doubleIn: true }), [d(20), d(20, 2), d(20)]);
    expect(st.scores[0]).toBe(501 - 40 - 20);
    expect(st.opened[0]).toBe(true);
    const st2 = replayX01(setup({ doubleIn: true }), [d(20), d(20), d(20)]);
    expect(st2.scores[0]).toBe(501);
    expect(st2.opened[0]).toBe(false);
  });
});

describe("Manches", () => {
  const win301: Action[] = [T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(1)];

  it("au meilleur des 3, une manche gagnée relance une manche et le départ tourne", () => {
    const st = replayX01(setup({ start: 301, legs: 3 }), win301);
    expect(st.status).toBe("leg");
    expect(st.legsWon[0]).toBe(1);
    const st2 = replayX01(setup({ start: 301, legs: 3 }), [...win301, next]);
    expect(st2.leg).toBe(2);
    expect(st2.scores).toEqual([301, 301]);
    expect(st2.current).toBe(1);
  });

  it("le premier à 2 manches gagne la partie", () => {
    const leg2: Action[] = [d(1), d(1), d(1), next, T20, T20, T20, next, d(1), d(1), d(1), next, T20, T20, d(1)];
    const st = replayX01(setup({ start: 301, legs: 3 }), [...win301, next, ...leg2]);
    expect(st.status).toBe("match");
    expect(st.winner).toBe(0);
  });
});

describe("Équipes", () => {
  it("les membres d'une équipe lancent à tour de rôle", () => {
    const s: X01Setup = {
      sides: [
        { name: "Équipe A", members: ["Léa", "Sam"] },
        { name: "Équipe B", members: ["Hugo"] },
      ],
      options: DEFAULT_X01_OPTIONS,
      firstSide: 0,
    };
    const volley: Action[] = [d(1), d(1), d(1), next];
    expect(currentMember(replayX01(s, []))).toBe("Léa");
    expect(currentMember(replayX01(s, [...volley, ...volley]))).toBe("Sam");
    expect(currentMember(replayX01(s, [...volley, ...volley, ...volley, ...volley]))).toBe("Léa");
  });
});

describe("Événements pour les célébrations", () => {
  it("180", () => {
    const st = replayX01(setup(), [T20, T20, T20]);
    expect(st.events.map((e) => e.type)).toContain("oneEighty");
  });
  it("ton-up à 100 et plus", () => {
    const st = replayX01(setup(), [T20, d(20, 2), d(1)]);
    expect(st.events).toContainEqual({ type: "ton", side: 0, points: 101 });
  });
  it("le fameux 26", () => {
    const st = replayX01(setup(), [d(20), d(5), d(1)]);
    expect(st.events.map((e) => e.type)).toContain("twentySix");
  });
  it("trois à côté", () => {
    const st = replayX01(setup(), [d(0), d(0), d(0)]);
    expect(st.events.map((e) => e.type)).toContain("threeMisses");
  });
  it("meilleure volée et classement", () => {
    const st = replayX01(setup(), [T20, T20, d(1), next, d(20), d(20), d(20), next]);
    expect(bestVolley(st)?.points).toBe(121);
    expect(rankingX01(st)).toEqual([0, 1]);
  });
});

describe("Annuler", () => {
  it("retire la dernière fléchette", () => {
    expect(undoLastDart([d(20), d(19)])).toEqual([d(20)]);
  });
  it("traverse le changement de joueur", () => {
    const acts = [d(20), d(20), d(20), next];
    const st = replayX01(setup(), undoLastDart(acts));
    expect(st.current).toBe(0);
    expect(st.volley).toHaveLength(2);
    expect(st.scores[0]).toBe(461);
  });
});

describe("Suggestion de fin", () => {
  const lbl = (ds: Dart[] | null) => ds?.map((x) => (x.n === 25 && x.m === 2 ? "BULL" : (x.m === 3 ? "T" : x.m === 2 ? "D" : "") + x.n));
  it("170 = T20 T20 BULL", () => {
    expect(lbl(suggestCheckout(170, "double"))).toEqual(["T20", "T20", "BULL"]);
  });
  it("40 = D20 en une fléchette", () => {
    expect(lbl(suggestCheckout(40, "double"))).toEqual(["D20"]);
  });
  it("100 = T20 D20", () => {
    expect(lbl(suggestCheckout(100, "double"))).toEqual(["T20", "D20"]);
  });
  it("pas de fin possible à 169 ni à 1 en Double out", () => {
    expect(suggestCheckout(169, "double")).toBeNull();
    expect(suggestCheckout(1, "double")).toBeNull();
  });
  it("tient compte des fléchettes restantes", () => {
    expect(suggestCheckout(100, "double", 1)).toBeNull();
  });
  it("fin simple : 60 = T20", () => {
    expect(lbl(suggestCheckout(60, "simple"))).toEqual(["T20"]);
  });
});

describe("Historique : checkout", () => {
  it("la volée qui finit la manche est marquée checkout", () => {
    const setup: X01Setup = { sides: [{ name: "A", members: ["A"] }], options: { ...DEFAULT_X01_OPTIONS, start: 301 }, firstSide: 0 };
    const t20: Action = { type: "dart", dart: { n: 20, m: 3 } };
    const st = replayX01(setup, [t20, t20, t20, { type: "next" }, t20, t20, { type: "dart", dart: { n: 1, m: 1 } }]);
    expect(st.history.map((v) => v.checkout)).toEqual([false, true]);
  });
});

describe("Suggestion de fin en cours de volée", () => {
  it("95 en double out : T19 puis D19 ; après T19, il reste 38 → D19 en 2 fléchettes", () => {
    expect(suggestCheckout(95, "double")?.map((d) => d.n * d.m)).toEqual([57, 38]);
    expect(suggestCheckout(38, "double", 2)?.map((d) => `${d.m}x${d.n}`)).toEqual(["2x19"]);
  });
});
