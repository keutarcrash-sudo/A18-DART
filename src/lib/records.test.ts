import { describe, expect, it } from "vitest";
import { isDayRecord, nameIsClean, periodStart } from "./records";

describe("Records : modération", () => {
  it("les prénoms normaux passent", () => {
    for (const n of ["Guillaume", "Thomas", "Léa", "Pascal", "Équipe A", "Jean-Mi", "Constance", "Bitcoin"]) expect(nameIsClean(n)).toBe(true);
  });

  it("les gros mots sont filtrés, même déguisés", () => {
    for (const n of ["Putain", "PU.TAIN", "connard2", "Salope", "Encülé", "fdp"]) expect(nameIsClean(n)).toBe(false);
  });
});

describe("Records : périodes", () => {
  it("la semaine commence le lundi", () => {
    const sunday = new Date(2026, 9, 11, 22, 0); // dimanche 11 octobre 2026
    expect(periodStart("week", sunday)).toEqual(new Date(2026, 9, 5));
    expect(periodStart("day", sunday)).toEqual(new Date(2026, 9, 11));
  });
});

describe("Records : record du jour battu", () => {
  it("seulement à partir de 60 et si on bat le meilleur connu", () => {
    expect(isDayRecord(null, 180)).toBe(false);
    expect(isDayRecord(0, 45)).toBe(false);
    expect(isDayRecord(0, 60)).toBe(true);
    expect(isDayRecord(100, 100)).toBe(false);
    expect(isDayRecord(100, 101)).toBe(true);
  });
});
