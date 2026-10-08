"use client";
/** Vue Tableau (téléphone posé à plat) : la course vers zéro, « qui mène » en premier. */
import { motion } from "motion/react";
import { fitFont } from "@/lib/fit";
import { type X01State, currentMember, rankingX01 } from "@/engine/x01";

interface Props {
  state: X01State;
  onClose: () => void;
}

export function Tableau({ state, onClose }: Props) {
  const order = rankingX01(state);
  const n = order.length;
  const start = state.setup.options.start;
  const rh = Math.min(118, Math.floor(540 / n));
  const showLegs = state.setup.options.legs > 1;

  return (
    <div className="flex h-full flex-col px-3.5 pb-3.5 pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
        <span>
          <b className="text-blanc">{start}</b> · Course vers zéro
        </span>
        <button
          type="button"
          onClick={onClose}
          className="h-[30px] border-[1.5px] border-[#3a3a3a] px-3 text-[10px] font-bold tracking-[0.14em] text-[#cfcfcf]"
        >
          SAISIR
        </button>
      </div>

      <div className="relative -mx-3.5 mt-2.5 h-[62px]">
        <div className="skew-18 absolute -left-5 bottom-0 right-8 top-0 bg-cyan" />
        <div className="absolute inset-y-0 left-5 flex items-center gap-2.5 whitespace-nowrap font-black uppercase italic text-noir">
          <small className="text-[12px] tracking-[0.14em]">À toi</small>
          <span className="tracking-tight" style={{ fontSize: fitFont(currentMember(state), 28, 130) }}>
            {currentMember(state)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {order.map((side, rank) => {
          const score = state.scores[side];
          const filled = Math.round(((start - score) / start) * 12);
          const first = rank === 0;
          return (
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              key={side}
              style={{ height: rh }}
              className="relative border-t border-filet"
            >
              <div
                className={`absolute left-0 top-[6%] font-black italic leading-none ${first ? "text-cyan" : "text-transparent [-webkit-text-stroke:1.5px_#555]"}`}
                style={{ fontSize: rh * 0.54 }}
              >
                {rank + 1}
              </div>
              <div
                className="absolute flex items-center gap-2 overflow-hidden font-black uppercase italic"
                style={{ left: rh * 0.5 + 6, top: rh * 0.15, right: rh * 0.9 + 12, fontSize: Math.min(rh * 0.16, 18) }}
              >
                <span className="truncate">{state.setup.sides[side].name}</span>
                {side === state.current && (
                  <span className="shrink-0 bg-cyan px-2 py-0.5 text-[9px] not-italic tracking-[0.14em] text-noir">À TOI</span>
                )}
              </div>
              <div className="absolute right-1 font-num leading-none" style={{ top: rh * 0.07, fontSize: rh * 0.39 }}>
                {score}
              </div>
              <div className="absolute flex gap-[3px]" style={{ left: rh * 0.5 + 6, right: 8, top: rh * 0.63, height: rh * 0.13 }}>
                {Array.from({ length: 12 }, (_, k) => (
                  <i key={k} className={`skew-18 flex-1 ${k < filled ? (first ? "bg-cyan" : "bg-blanc") : "bg-[#2b2b2b]"}`} />
                ))}
              </div>
              {rh > 80 && (
                <div
                  className="absolute text-[9px] font-bold uppercase tracking-[0.16em] text-gris"
                  style={{ left: rh * 0.5 + 6, top: rh * 0.82 }}
                >
                  {showLegs && `${state.legsWon[side]} manche${state.legsWon[side] > 1 ? "s" : ""} · `}
                  {start - score} points marqués
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
