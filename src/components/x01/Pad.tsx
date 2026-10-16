"use client";
/**
 * Pavé « numéro d'abord » : une tape = un simple, tout de suite.
 * Double / Triple apparaissent alors sous le pouce, SANS chrono, jusqu'à la fléchette suivante
 * (décision client après test : 1,5 s ne laissait pas le temps).
 * Touches plus hautes sur les grands écrans (760 px et 820 px de haut) pour ne pas laisser de vide au-dessus du pavé.
 */
import type { Dart, Mult } from "@/engine/types";
import { useT } from "@/lib/i18n";

const ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
];

interface Props {
  disabled: boolean;
  /** Numéro de la dernière fléchette (1 à 20) dont on peut encore changer le multiplicateur. */
  multFor: number | null;
  canValidate: boolean;
  canUndo: boolean;
  /** Fléchettes « pour finir » à allumer (ambre qui pulse + pastille D / T). */
  glow?: Dart[];
  onNumber: (n: number, m?: Mult) => void;
  onMult: (m: Mult) => void;
  onUndo: () => void;
  onValidate: () => void;
}

const key =
  "pad-key pop-press pop-shadow-sm relative h-[46px] [@media(min-height:760px)_and_(max-height:819px)]:h-[52px] [@media(min-height:820px)]:h-[58px] rounded-xl border-2 border-encre bg-carte text-encre disabled:opacity-40";

/** Pastilles d'une touche : T, D, ou 1 (simple) quand la même touche a aussi un D / T. Le 25 n'en a pas. */
function tagsFor(glow: Dart[], n: number): string {
  if (n === 25) return "";
  const mine = glow.filter((d) => d.n === n);
  const tags = mine.map((d) => (d.m === 3 ? "T" : d.m === 2 ? "D" : "1"));
  if (tags.length > 1 || tags.some((x) => x !== "1")) return [...new Set(tags)].join("·");
  return "";
}

export function Pad({ disabled, multFor, canValidate, canUndo, glow = [], onNumber, onMult, onUndo, onValidate }: Props) {
  const t = useT();
  const lit = (n: number, bull = false) => glow.some((d) => d.n === n && (n !== 25 || (d.m === 2) === bull));
  const keyClass = (n: number, bull = false) => `${key} ${lit(n, bull) ? "key-glow" : ""}`;
  const Tag = ({ n }: { n: number }) => {
    const tag = n === 25 ? "" : tagsFor(glow, n);
    return tag ? (
      <span
        aria-hidden="true"
        className="absolute -right-[7px] -top-[9px] grid h-5 min-w-5 place-items-center rounded-full bg-encre px-1 font-display text-[11px] font-black text-white"
      >
        {tag}
      </span>
    ) : null;
  };
  return (
    <div className="relative flex flex-col gap-[6px] pt-3 [@media(min-height:820px)]:gap-2">
      {/* Double / Triple : juste au-dessus du pavé, sous le pouce. 25, BULL, RATÉ et ANNULER restent accessibles. */}
      {multFor !== null && (
        // Au-dessus du pavé, par-dessus la rangée des 3 fléchettes (simple affichage) : aucun bouton de saisie n'est caché.
        <div className="absolute inset-x-0 top-[-44px] z-10 grid h-[50px] grid-cols-2 gap-[6px] bg-creme [@media(min-height:820px)]:top-[-56px] [@media(min-height:820px)]:h-[62px] [@media(min-height:820px)]:gap-2">
          <button
            type="button"
            onClick={() => onMult(2)}
            className="pad-key pop-press pop-shadow-sm h-[46px] [@media(min-height:820px)]:h-[56px] rounded-xl border-2 border-encre bg-ambre font-display text-[15px] font-black text-encre"
          >
            DOUBLE {multFor}
          </button>
          <button
            type="button"
            onClick={() => onMult(3)}
            className="pad-key pop-press pop-shadow-sm h-[46px] [@media(min-height:820px)]:h-[56px] rounded-xl border-2 border-encre bg-rose font-display text-[15px] font-black text-encre"
          >
            TRIPLE {multFor}
          </button>
        </div>
      )}
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-5 gap-[6px] [@media(min-height:820px)]:gap-2">
          {row.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onNumber(n)}
              className={`${keyClass(n)} font-num text-[21px] [@media(min-height:820px)]:text-[23px]`}
            >
              {n}
              <Tag n={n} />
            </button>
          ))}
        </div>
      ))}

      <div className="relative">
        <div className="grid grid-cols-4 gap-[6px] [@media(min-height:820px)]:gap-2">
          <button type="button" disabled={disabled} onClick={() => onNumber(25)} className={`${keyClass(25)} font-num text-[18px]`}>
            25
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onNumber(25, 2)}
            className={`${keyClass(25, true).replace("bg-carte", "bg-menthe")} font-display text-[12px] font-black tracking-wide`}
          >
            BULL
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onNumber(0)}
            className={`${key.replace("bg-carte", "bg-muted")} font-display text-[12px] font-black tracking-wide`}
          >
            {t("RATÉ")}
          </button>
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="pad-key pop-press h-[46px] [@media(min-height:760px)_and_(max-height:819px)]:h-[52px] [@media(min-height:820px)]:h-[58px] rounded-xl border-2 border-dashed border-encre bg-transparent font-display text-[12px] font-black tracking-wide text-encre disabled:opacity-40"
          >
            {t("ANNULER")}
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canValidate}
        onClick={onValidate}
        className="pad-key pop-press pop-shadow h-14 [@media(min-height:760px)_and_(max-height:819px)]:h-[62px] [@media(min-height:820px)]:h-[68px] rounded-2xl border-2 border-encre bg-violet font-display text-[17px] font-black uppercase text-white disabled:bg-muted disabled:text-attenue disabled:opacity-100 disabled:shadow-none"
      >
        {t("Valider la volée")}
      </button>
    </div>
  );
}
