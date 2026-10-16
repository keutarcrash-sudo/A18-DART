"use client";
/** Briques communes aux écrans à pavé (301 / 501, Plus gros score) : fléchettes sur la cible et rangée des 3 fléchettes. */
import { motion } from "motion/react";
import { type Dart, dartLabel } from "@/engine/types";
import { useT } from "@/lib/i18n";

/** Bouton arrondi de la barre du haut (Tableau, Menu). */
export const POP_PILL =
  "relative h-10 rounded-full border-2 border-encre bg-carte px-3.5 font-display text-[13px] font-extrabold tracking-wide text-encre pop-shadow-sm pop-press after:absolute after:-inset-1 after:content-['']";

/**
 * Fléchettes de la volée pour la cible. Graine de chaque fléchette = sa place dans la liste des actions
 * sauvegardées (on remonte la série de fléchettes en fin de liste) : position stable, même après rechargement.
 */
export function boardDartsOf(actions: { type: string }[], volley: Dart[]) {
  const dartIdx: number[] = [];
  for (let i = actions.length - 1; i >= 0 && actions[i].type === "dart"; i--) dartIdx.unshift(i);
  const seeds = dartIdx.slice(-volley.length);
  return volley.map((dart, k) => ({ dart, seed: seeds[k] ?? k }));
}

/** Les 3 fléchettes de la volée : Simple blanc, Double ambre, Triple rose ; cases vides en pointillés. */
export function DartRow({ volley, points }: { volley: Dart[]; points: number }) {
  const t = useT();
  return (
    <div className="grid h-11 grid-cols-[1fr_1fr_1fr_54px] items-center gap-2">
      {[0, 1, 2].map((k) => {
        const dt = volley[k];
        if (!dt) {
          return (
            <div
              key={`${k}-x`}
              className="grid h-11 place-items-center rounded-[14px] border-2 border-dashed border-attenue/40 font-display text-[18px] font-extrabold text-attenue/60"
            >
              {k + 1}
            </div>
          );
        }
        const tone = dt.m === 3 ? "bg-rose" : dt.m === 2 && dt.n !== 0 ? "bg-ambre" : "bg-carte";
        return (
          <motion.div
            key={`${k}-${dartLabel(dt)}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className={`grid h-11 place-items-center rounded-[14px] border-2 border-encre font-display text-[18px] font-extrabold shadow-[3px_3px_0_0_var(--color-encre)] ${tone}`}
          >
            {dt.n === 0 ? t("Raté") : dartLabel(dt)}
          </motion.div>
        );
      })}
      <div className="text-right font-num text-[26px] font-black">{points}</div>
    </div>
  );
}
