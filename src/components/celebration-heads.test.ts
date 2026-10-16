import { describe, expect, it } from "vitest";
import { MAX_HEADS, MID_HEAD, TAKES_LEAD_HEAD, WINK_HEAD } from "./celebration-heads";

describe("têtes des célébrations", () => {
  it("chaque moment max a sa tête", () => {
    expect(MAX_HEADS).toEqual({
      "180": "explosee",
      exploit: "explosee",
      victoire: "frimeur",
      record: "coeurs",
      bust: "fondue",
      chambrage: "fondue",
    });
  });
  it("bandeau moyen et clins d'œil", () => {
    expect(MID_HEAD).toBe("mdr");
    expect(WINK_HEAD).toBe("langue");
    expect(TAKES_LEAD_HEAD).toBe("frimeur");
  });
});
