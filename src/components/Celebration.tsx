"use client";
/**
 * Célébrations sur 3 niveaux, toujours passables d'une tape :
 * - max : plein écran ~2 s (180, victoire, record) ; variante « bust » en noir sur blanc (pas de rouge) ;
 * - mid : bandeau incliné ~1 s (volée de 100 et plus) ;
 * - wink : bulle du personnage, ne bloque pas la saisie (26, trois ratés…).
 */
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n";
import { fitFont } from "@/lib/fit";

export type CeleSpec =
  | { level: "max"; tone: "cyan" | "chartreuse" | "bust"; kicker: string; big: string; numeric: boolean; sub?: string; slot: string }
  | { level: "mid"; word: string; num: string };

const BG = { cyan: "bg-cyan", chartreuse: "bg-chartreuse", bust: "bg-blanc" } as const;

export function Celebration({ spec, onDone }: { spec: CeleSpec | null; onDone: () => void }) {
  const t = useT();
  return (
    <AnimatePresence>
      {spec?.level === "max" && (
        <motion.button
          type="button"
          key="max"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`absolute inset-0 z-40 flex flex-col items-start justify-center px-5 text-left text-noir ${BG[spec.tone]}`}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.24em]">{spec.kicker}</span>
          <motion.span
            initial={{ x: -40, skewX: -18, opacity: 0 }}
            animate={{ x: 0, skewX: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className={
              spec.numeric
                ? "mt-1.5 font-num text-[150px] leading-[0.9]"
                : "mt-1.5 whitespace-nowrap font-black uppercase italic leading-[0.9] tracking-tight"
            }
            style={spec.numeric ? undefined : { fontSize: fitFont(spec.big, 64, 44) }}
          >
            {spec.big}
          </motion.span>
          {spec.sub && <span className="mt-3.5 text-xl font-black uppercase italic">{spec.sub}</span>}
          <span className="slot-perso absolute right-4 top-[70px] flex h-[150px] w-[110px] items-end justify-center p-1.5 text-center text-[8px] font-bold uppercase tracking-[0.14em] !text-noir/60 ![border-color:rgb(0_0_0/0.4)]">
            Perso 3D
            <br />
            {spec.slot}
          </span>
          <span className="absolute bottom-[calc(22px+env(safe-area-inset-bottom))] left-5 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">
            {t("Touche pour continuer")}
          </span>
        </motion.button>
      )}
      {spec?.level === "mid" && (
        <motion.button
          type="button"
          key="mid"
          onClick={onDone}
          className="absolute inset-0 z-40 flex items-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ x: "-110%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative -mx-8 h-[120px] w-[calc(100%+64px)]"
          >
            <div className="skew-18 absolute inset-0 bg-blanc" />
            <div className="relative flex h-full items-center justify-between px-[52px] text-noir">
              <b className="text-[34px] font-black uppercase italic tracking-tight">{spec.word}</b>
              <span className="font-num text-[64px]">{spec.num}</span>
            </div>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function Wink({ text }: { text: string | null }) {
  const t = useT();
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-x-3.5 bottom-[352px] z-30 flex items-end gap-2.5"
        >
          <span className="slot-perso flex h-[66px] w-[52px] shrink-0 items-end justify-center bg-noir p-1 text-[8px] font-bold uppercase">
            {t("Perso")}
          </span>
          <p
            style={{ "--h": "40px" } as React.CSSProperties}
            className="btn-18 bg-blanc px-4 py-2.5 text-sm font-black italic leading-snug text-noir"
          >
            {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
