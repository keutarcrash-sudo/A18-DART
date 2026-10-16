/**
 * Quelle tête raconte quelle célébration (docs/08-refonte-pop.md, table des têtes).
 * Fichier sans dépendance d'affichage, pour pouvoir le tester.
 */
import type { HeadKind } from "./pop/Heads";

/** Niveau max : une tête par moment (`CeleSpec.slot`). */
export const MAX_HEADS = {
  "180": "explosee",
  exploit: "explosee",
  victoire: "frimeur",
  record: "coeurs",
  bust: "fondue",
  chambrage: "fondue",
} as const satisfies Record<string, HeadKind>;

/** Bandeau moyen (100 et plus, Touches, Sans faute, Tueur). */
export const MID_HEAD: HeadKind = "mdr";

/** Clin d'œil : tête par défaut, et celle de « passe devant ». */
export const WINK_HEAD: HeadKind = "langue";
export const TAKES_LEAD_HEAD: HeadKind = "frimeur";
