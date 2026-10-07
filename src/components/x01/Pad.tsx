"use client";
/**
 * Pavé « numéro d'abord » : une tape = un simple, tout de suite.
 * Double / Triple apparaissent alors sous le pouce, SANS chrono, jusqu'à la fléchette suivante
 * (décision client après test : 1,5 s ne laissait pas le temps).
 */
import type { Mult } from "@/engine/types";

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
  return (
    <div className="relative flex flex-col gap-[5px] pt-3">
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
            RATÉ
          </button>
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-[46px] border-[1.5px] border-[#3a3a3a] text-[12px] font-black tracking-wide text-[#cfcfcf] active:bg-case disabled:opacity-30"
          >
            ANNULER
          </button>
        </div>

        {/* Double / Triple : remplacent 25 / BULL / RATÉ, sous le pouce. ANNULER reste toujours accessible. */}
        {multFor !== null && (
          <div className="absolute inset-y-0 left-0 right-[calc(25%+1.25px)] grid grid-cols-2 gap-[5px] bg-noir">
            <button
              type="button"
              onClick={() => onMult(2)}
              className="h-[46px] bg-cyan text-[14px] font-black italic text-noir active:bg-blanc"
            >
              DOUBLE {multFor}
            </button>
            <button
              type="button"
              onClick={() => onMult(3)}
              className="h-[46px] bg-chartreuse text-[14px] font-black italic text-noir active:bg-blanc"
            >
              TRIPLE {multFor}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canValidate}
        onClick={onValidate}
        style={{ "--h": "56px" } as React.CSSProperties}
        className="btn-18 h-14 bg-blanc text-[17px] font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
      >
        Valider la volée
      </button>
    </div>
  );
}
