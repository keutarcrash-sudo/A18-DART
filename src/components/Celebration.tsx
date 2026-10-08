"use client";
/**
 * Célébrations sur 3 niveaux, toujours passables d'une tape, en touches pop art (components/pop/Pop.tsx) :
 * - max : plein écran ~2 s (180, victoire, record) : trame de points, explosion derrière le chiffre, stickers qui claquent,
 *   et la mascotte smiley ; variante « bust » en noir sur blanc (pas de rouge) ;
 * - mid : bandeau incliné ~1 s (volée de 100 et plus) avec deux stickers ;
 * - wink : bulle de la mascotte, ne bloque pas la saisie (26, trois ratés…).
 */
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n";
import { fitFont } from "@/lib/fit";
import { Mascot, type Mood, POP, PopIn, Shape, type ShapeName, halftone } from "@/components/pop/Pop";

export type CeleSpec =
  | { level: "max"; tone: "cyan" | "chartreuse" | "bust"; kicker: string; big: string; numeric: boolean; sub?: string; slot: string }
  | { level: "mid"; word: string; num: string };

const BG = { cyan: "bg-cyan", chartreuse: "bg-chartreuse", bust: "bg-blanc" } as const;

interface Deco {
  shape: ShapeName;
  fill: string;
  size: number;
  rotate: number;
  pos: React.CSSProperties;
}

/** Chaque moment a sa mascotte et ses stickers, placés sur les bords pour laisser le chiffre lisible. */
const SETS: Record<string, { mood: Mood; burst?: string; deco: Deco[] }> = {
  "180": {
    mood: "wow",
    burst: POP.yellow,
    deco: [
      { shape: "bolt", fill: POP.pink, size: 86, rotate: -14, pos: { left: "3%", top: "9%" } },
      { shape: "star", fill: POP.yellow, size: 70, rotate: 12, pos: { right: "6%", bottom: "16%" } },
      { shape: "flower", fill: POP.pink, size: 74, rotate: 0, pos: { left: "5%", bottom: "11%" } },
      { shape: "asterisk", fill: POP.blue, size: 46, rotate: 20, pos: { right: "30%", bottom: "8%" } },
    ],
  },
  exploit: {
    mood: "wow",
    burst: POP.yellow,
    deco: [
      { shape: "star", fill: POP.yellow, size: 76, rotate: -10, pos: { left: "4%", top: "10%" } },
      { shape: "bolt", fill: POP.blue, size: 80, rotate: 18, pos: { right: "7%", bottom: "14%" } },
      { shape: "heart", fill: POP.pink, size: 58, rotate: -12, pos: { left: "8%", bottom: "12%" } },
    ],
  },
  victoire: {
    mood: "joy",
    burst: POP.yellow,
    deco: [
      { shape: "star", fill: POP.yellow, size: 78, rotate: -12, pos: { left: "4%", top: "9%" } },
      { shape: "flower", fill: POP.pink, size: 80, rotate: 0, pos: { right: "5%", bottom: "15%" } },
      { shape: "heart", fill: POP.pink, size: 56, rotate: 14, pos: { left: "8%", bottom: "13%" } },
      { shape: "wave", fill: POP.blue, size: 96, rotate: -8, pos: { left: "34%", bottom: "6%" } },
      { shape: "asterisk", fill: POP.orange, size: 42, rotate: 0, pos: { left: "44%", top: "12%" } },
    ],
  },
  record: {
    mood: "smug",
    burst: POP.white,
    deco: [
      { shape: "star", fill: POP.white, size: 80, rotate: -10, pos: { left: "4%", top: "9%" } },
      { shape: "bolt", fill: POP.pink, size: 82, rotate: 16, pos: { right: "6%", bottom: "14%" } },
      { shape: "asterisk", fill: POP.blue, size: 50, rotate: 0, pos: { left: "8%", bottom: "12%" } },
    ],
  },
  bust: {
    mood: "dizzy",
    deco: [
      { shape: "bolt", fill: POP.yellow, size: 82, rotate: -18, pos: { left: "4%", top: "10%" } },
      { shape: "wave", fill: POP.blue, size: 92, rotate: 6, pos: { right: "4%", bottom: "13%" } },
      { shape: "asterisk", fill: POP.pink, size: 46, rotate: 10, pos: { left: "9%", bottom: "12%" } },
    ],
  },
  chambrage: {
    mood: "dizzy",
    deco: [
      { shape: "bolt", fill: POP.pink, size: 82, rotate: -16, pos: { left: "4%", top: "10%" } },
      { shape: "star", fill: POP.yellow, size: 60, rotate: 10, pos: { right: "8%", bottom: "14%" } },
      { shape: "wave", fill: POP.blue, size: 86, rotate: -6, pos: { left: "6%", bottom: "11%" } },
    ],
  },
};

export function Celebration({ spec, onDone }: { spec: CeleSpec | null; onDone: () => void }) {
  const t = useT();
  const set = spec?.level === "max" ? (SETS[spec.slot] ?? SETS.victoire) : null;
  return (
    <AnimatePresence>
      {spec?.level === "max" && set && (
        <motion.button
          type="button"
          key="max"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`absolute inset-0 z-40 flex flex-col items-start justify-center overflow-hidden px-5 text-left text-noir ${BG[spec.tone]}`}
          style={halftone(spec.tone === "bust" ? "rgb(0 0 0 / 0.08)" : "rgb(0 0 0 / 0.12)")}
        >
          {set.deco.map((d, i) => (
            <PopIn key={i} delay={0.12 + i * 0.07} rotate={d.rotate} className="pointer-events-none absolute" style={d.pos}>
              <Shape name={d.shape} fill={d.fill} size={d.size} />
            </PopIn>
          ))}
          <PopIn delay={0.05} rotate={8} className="pointer-events-none absolute right-3 top-[calc(56px+env(safe-area-inset-top))]">
            <Mascot mood={set.mood} size={118} />
          </PopIn>

          <span className="relative z-10 -skew-x-[18deg] bg-noir px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blanc">
            <span className="inline-block skew-x-[18deg]">{spec.kicker}</span>
          </span>
          <span className="relative mt-1.5">
            {set.burst && (
              <PopIn delay={0} rotate={0} float={false} className="pointer-events-none absolute left-1/2 top-1/2 z-0 -ml-[160px] -mt-[160px]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
                  <Shape name="burst" fill={set.burst} size={320} flat />
                </motion.div>
              </PopIn>
            )}
            <motion.span
              initial={{ x: -40, skewX: -18, opacity: 0 }}
              animate={{ x: 0, skewX: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className={
                spec.numeric
                  ? "relative z-10 block font-num text-[150px] leading-[0.9]"
                  : "relative z-10 block whitespace-nowrap font-black uppercase italic leading-[0.9] tracking-tight"
              }
              style={spec.numeric ? undefined : { fontSize: fitFont(spec.big, 64, 44) }}
            >
              {spec.big}
            </motion.span>
          </span>
          {spec.sub && <span className="relative z-10 mt-3.5 text-xl font-black uppercase italic">{spec.sub}</span>}
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
            <div className="skew-18 absolute inset-0 border-y-[5px] border-noir bg-blanc" style={halftone("rgb(0 0 0 / 0.07)", 10)} />
            <div className="relative flex h-full items-center justify-between px-[52px] text-noir">
              <b className="text-[34px] font-black uppercase italic tracking-tight">{spec.word}</b>
              <span className="font-num text-[64px]">{spec.num}</span>
            </div>
          </motion.div>
          <PopIn delay={0.18} rotate={-14} className="pointer-events-none absolute left-[6%] top-[calc(50%-120px)]">
            <Shape name="bolt" fill={POP.pink} size={70} />
          </PopIn>
          <PopIn delay={0.26} rotate={12} className="pointer-events-none absolute right-[8%] top-[calc(50%+56px)]">
            <Shape name="star" fill={POP.yellow} size={64} />
          </PopIn>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** La bulle de la mascotte : elle chambre sans bloquer la saisie. */
export function Wink({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-x-3.5 bottom-[352px] z-30 flex items-end gap-2"
        >
          <PopIn rotate={-8} className="shrink-0">
            <Mascot mood="wink" size={62} />
          </PopIn>
          <p
            style={{ "--h": "40px" } as React.CSSProperties}
            className="btn-18 border-[3px] border-noir bg-blanc px-4 py-2.5 text-sm font-black italic leading-snug text-noir"
          >
            {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
