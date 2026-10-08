"use client";
/**
 * Pavé « numéro d'abord » : une tape = un simple, tout de suite.
 * Double / Triple apparaissent alors sous le pouce, SANS chrono, jusqu'à la fléchette suivante
 * (décision client après test : 1,5 s ne laissait pas le temps).
 */
import type { Mult } from "@/engine/types";
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
  onNumber: (n: number, m?: Mult) => void;
  onMult: (m: Mult) => void;
  onUndo: () => void;
  onValidate: () => void;
}

const key =
  "h-[46px] bg-case text-blanc active:bg-blanc active:text-noir disabled:opacity-40 disabled:active:bg-case disabled:active:text-blanc";

export function Pad({ disabled, multFor, canValidate, canUndo, onNumber, onMult, onUndo, onValidate }: Props) {
  const t = useT();
  return (
    <div className="relative flex flex-col gap-[5px] pt-3">
      {/* Double / Triple : juste au-dessus du pavé, sous le pouce. 25, BULL, RATÉ et ANNULER restent accessibles. */}
      {multFor !== null && (
        // Au-dessus du pavé, par-dessus la rangée des 3 fléchettes (simple affichage) : aucun bouton de saisie n'est caché.
        <div className="absolute inset-x-0 top-[-44px] grid h-[50px] grid-cols-2 gap-[5px] bg-noir">
          <button
            type="button"
            onClick={() => onMult(2)}
            className="h-[50px] bg-cyan text-[15px] font-black italic text-noir active:bg-blanc"
          >
            DOUBLE {multFor}
          </button>
          <button
            type="button"
            onClick={() => onMult(3)}
            className="h-[50px] bg-chartreuse text-[15px] font-black italic text-noir active:bg-blanc"
          >
            TRIPLE {multFor}
          </button>
        </div>
      )}
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-5 gap-[5px]">
          {row.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onNumber(n)}
              className={`${key} font-num text-[21px]`}
            >
              {n}
            </button>
          ))}
        </div>
      ))}

      <div className="relative">
        <div className="grid grid-cols-4 gap-[5px]">
          <button type="button" disabled={disabled} onClick={() => onNumber(25)} className={`${key} font-num text-[18px]`}>
            25
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onNumber(25, 2)}
            className={`${key} text-[12px] font-black tracking-wide`}
          >
            BULL
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onNumber(0)}
            className={`${key} text-[12px] font-black tracking-wide`}
          >
            {t("RATÉ")}
          </button>
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-[46px] border-[1.5px] border-[#3a3a3a] text-[12px] font-black tracking-wide text-[#cfcfcf] active:bg-case disabled:opacity-30"
          >
            {t("ANNULER")}
          </button>
        </div>

      </div>

      <button
        type="button"
        disabled={!canValidate}
        onClick={onValidate}
        style={{ "--h": "56px" } as React.CSSProperties}
        className="btn-18 h-14 bg-blanc text-[17px] font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
      >
        {t("Valider la volée")}
      </button>
    </div>
  );
}
