import { describe, expect, it } from "vitest";
import { RINGS, SECTOR_ORDER, dartSpot, sectorAngle, zonePath } from "./board";

const DEMI = (9 * Math.PI) / 180;

/** Écart d'angle normalisé dans [-π, π]. */
function ecart(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function polaire(p: { x: number; y: number } | null) {
  if (!p) throw new Error("point attendu");
  return { r: Math.hypot(p.x, p.y), a: Math.atan2(p.y, p.x) };
}

const graines = Array.from({ length: 51 }, (_, i) => i);

describe("sectorAngle", () => {
  it("le 20 est en haut, les secteurs tournent dans le sens horaire", () => {
    expect(sectorAngle(20)).toBeCloseTo(-Math.PI / 2);
    expect(ecart(sectorAngle(1), sectorAngle(20))).toBeCloseTo(Math.PI / 10);
    expect(SECTOR_ORDER).toHaveLength(20);
  });
});

describe("dartSpot", () => {
  it("triple 20 : dans l'anneau triple, dans le secteur du 20", () => {
    for (const s of graines) {
      const { r, a } = polaire(dartSpot({ n: 20, m: 3 }, s));
      expect(r).toBeGreaterThan(RINGS.tripleIn);
      expect(r).toBeLessThan(RINGS.tripleOut);
      expect(Math.abs(ecart(a, sectorAngle(20)))).toBeLessThan(DEMI);
    }
  });

  it("double 1 : dans l'anneau double, dans le secteur du 1", () => {
    for (const s of graines) {
      const { r, a } = polaire(dartSpot({ n: 1, m: 2 }, s));
      expect(r).toBeGreaterThan(RINGS.doubleIn);
      expect(r).toBeLessThan(RINGS.doubleOut);
      expect(Math.abs(ecart(a, sectorAngle(1)))).toBeLessThan(DEMI);
    }
  });

  it("bull et 25", () => {
    for (const s of graines) {
      expect(polaire(dartSpot({ n: 25, m: 2 }, s)).r).toBeLessThan(RINGS.bull);
      const { r } = polaire(dartSpot({ n: 25, m: 1 }, s));
      expect(r).toBeGreaterThan(RINGS.bull);
      expect(r).toBeLessThan(RINGS.outer);
    }
  });

  it("simple 7 : dans le secteur du 7, hors double et triple, hors centre", () => {
    for (const s of graines) {
      const { r, a } = polaire(dartSpot({ n: 7, m: 1 }, s));
      expect(r).toBeGreaterThan(RINGS.outer);
      expect(r).toBeLessThan(RINGS.doubleIn);
      expect(r < RINGS.tripleIn || r > RINGS.tripleOut).toBe(true);
      expect(Math.abs(ecart(a, sectorAngle(7)))).toBeLessThan(DEMI);
    }
  });

  it("un raté n'a pas de point", () => {
    expect(dartSpot({ n: 0, m: 1 }, 3)).toBeNull();
  });

  it("même entrée, même graine : même point", () => {
    expect(dartSpot({ n: 12, m: 1 }, 7)).toEqual(dartSpot({ n: 12, m: 1 }, 7));
    expect(dartSpot({ n: 20, m: 3 }, 4)).toEqual(dartSpot({ n: 20, m: 3 }, 4));
  });

  it("des graines différentes donnent des points différents", () => {
    expect(dartSpot({ n: 20, m: 3 }, 1)).not.toEqual(dartSpot({ n: 20, m: 3 }, 2));
  });
});

describe("zonePath", () => {
  it("renvoie un chemin SVG non vide", () => {
    for (const d of [
      { n: 20, m: 3 },
      { n: 1, m: 2 },
      { n: 7, m: 1 },
      { n: 25, m: 1 },
      { n: 25, m: 2 },
    ] as const) {
      const p = zonePath(d);
      expect(p.length).toBeGreaterThan(0);
      expect(p.startsWith("M")).toBe(true);
    }
  });
});
