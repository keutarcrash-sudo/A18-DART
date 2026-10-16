"use client";
/**
 * Scènes courtes, en style Pop, pour les moments plus fréquents :
 * - « misses »   : trois ratés, les fléchettes se plantent dans le panneau en OSB autour de la cible (avec le Tournis) ;
 * - « ton »      : volée de 100 et plus, une fléchette enflammée traverse l'écran (avec le Mort de rire) ;
 * - « closed »   : numéro fermé au Cricket, un cadenas claque dessus ;
 * Fonds en aplat (crème ou violet) avec trame de points, contours encre épais, ombres dures sans flou.
 * Même principe que Scene.tsx : une horloge pilote tout, une tape passe la scène.
 */
import { type MotionValue, motion, useReducedMotion, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { Head } from "./Heads";
import { POP, halftone } from "./Pop";
import { Boom, C, Dart, FlyingDart, MG, WholeBoard, easeIn, easeOut, lerp, pop, seg, useTimeline } from "./Scene";

/** Trames de points : encre légère sur crème, blanche sur violet. */
const DOTS_CREAM = halftone("rgb(30 41 59 / 0.11)", 18);
const DOTS_VIOLET = halftone("rgb(255 255 255 / 0.16)", 18);

export type MiniKind = "misses" | "ton" | "closed";
export const MINI_DURATION: Record<MiniKind, number> = { misses: 1.9, ton: 1.7, closed: 1.4 };

export interface MiniSpec {
  kind: MiniKind;
  /** Texte principal (phrase de la mascotte, « 20 fermé »…). */
  text?: string;
  /** Petit titre (prénom, « Ton-up »). */
  kicker?: string;
  /** Grand chiffre. */
  num?: string;
}

/** Apparition avec rebond à l'instant t0. */
function useIn(time: MotionValue<number>, t0: number, from = 0.3) {
  const scale = useTransform(time, (t) => lerp(from, 1, pop(seg(t, t0, t0 + 0.28))));
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1));
  return { scale, opacity };
}

function Bubble({ time, t0, children, className = "" }: { time: MotionValue<number>; t0: number; children: ReactNode; className?: string }) {
  const s = useIn(time, t0, 0.6);
  return (
    <motion.p
      style={{ ...s, boxShadow: `4px 4px 0 ${POP.ink}` }}
      className={`relative mb-3 origin-bottom-left rounded-[18px] rounded-bl-[4px] border-[3px] border-encre bg-carte px-4 py-2.5 font-text text-[16px] font-bold leading-snug text-encre ${className}`}
    >
      {children}
    </motion.p>
  );
}

export function MiniScene({ spec }: { spec: MiniSpec }) {
  const time = useTimeline(MINI_DURATION[spec.kind]);
  switch (spec.kind) {
    case "misses":
      return <Misses time={time} spec={spec} />;
    case "ton":
      return <Ton time={time} spec={spec} />;
    case "closed":
      return <Closed time={time} spec={spec} />;
  }
}

/* ---------- Trois ratés : le panneau en OSB ---------- */

/** Copeaux de l'OSB, tirés au hasard mais toujours les mêmes (graine fixe). */
const FLAKES = (() => {
  let seed = 18;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tones = ["#B98848", "#D9B077", "#A87634", "#E3C08A", "#9C6B2C", "#CFA060"];
  return Array.from({ length: 170 }, () => {
    const x = rnd() * 420 - 10;
    const y = rnd() * 880 - 10;
    const w = 14 + rnd() * 34;
    const h = 6 + rnd() * 14;
    const a = rnd() * 180;
    return { x, y, w, h, a, c: tones[Math.floor(rnd() * tones.length)] };
  });
})();

/** Le panneau en OSB du bar, en carte : copeaux de bois, contour encre et ombre dure. */
function Osb() {
  return (
    <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width={400} height={860} fill="#C99A5B" />
      {FLAKES.map((f, i) => (
        <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={3} fill={f.c} transform={`rotate(${f.a} ${f.x + f.w / 2} ${f.y + f.h / 2})`} />
      ))}
    </svg>
  );
}

const MISS_SPOTS: [number, number, number][] = [
  [62, 175, 24],
  [300, 575, -24],
  [96, 515, 30],
];

function Misses({ time, spec }: { time: MotionValue<number>; spec: MiniSpec }) {
  const panel = useTransform(time, (t) => seg(t, 0, 0.15));
  return (
    <div className="absolute inset-0 bg-creme" style={DOTS_CREAM}>
      <motion.div
        className="absolute inset-x-3 bottom-[calc(132px+env(safe-area-inset-bottom))] top-[calc(12px+env(safe-area-inset-top))] overflow-hidden rounded-[28px] border-[3px] border-encre"
        style={{ opacity: panel, boxShadow: `6px 6px 0 ${POP.ink}` }}
      >
        <Osb />
      </motion.div>
      <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <g transform={`translate(200 340) scale(0.62) translate(${-C} ${-C})`}>
          <WholeBoard />
        </g>
        {MISS_SPOTS.map(([x, y, a], k) => (
          <FlyingDart key={k} time={time} tx={x} ty={y} t0={0.12 + k * 0.28} t1={0.36 + k * 0.28} angle={a} />
        ))}
      </svg>
      {["Ploc", "Ploc", "Ploc…"].map((w, k) => (
        <Boom key={k} time={time} t0={0.38 + k * 0.28} className={["left-[4%] top-[12%]", "right-[5%] top-[57%]", "left-[6%] top-[51%]"][k]} rotate={[-10, 8, -6][k]}>
          {w}
        </Boom>
      ))}
      <div className="absolute inset-x-4 bottom-[calc(52px+env(safe-area-inset-bottom))] flex items-end gap-2">
        <motion.div style={useIn(time, 1.1)} className="shrink-0">
          <Head kind="tournis" size={92} />
        </motion.div>
        <Bubble time={time} t0={1.2}>
          {spec.text}
        </Bubble>
      </div>
    </div>
  );
}

/* ---------- Ton-up : la fléchette enflammée ---------- */

function Flame({ time }: { time: MotionValue<number> }) {
  const flicker = useTransform(time, (t) => `translate(0 150) scale(${1 + 0.12 * Math.sin(t * 60)} ${1 + 0.25 * Math.sin(t * 47)}) translate(0 -150)`);
  return (
    <MG transform={flicker}>
      <path d="M0 140 C -40 190 -26 250 0 330 C 26 250 40 190 0 140 Z" fill={POP.rose} stroke={POP.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M0 150 C -26 190 -16 240 0 290 C 16 240 26 190 0 150 Z" fill={POP.ambre} stroke={POP.ink} strokeWidth={2.5} />
      <path d="M0 158 C -12 185 -8 220 0 250 C 8 220 12 185 0 158 Z" fill={POP.cream} stroke={POP.ink} strokeWidth={2.5} />
    </MG>
  );
}

/** Explosion ambre à contour encre (340 px : avec son ombre, elle tient sur un écran de 360 px), assez large pour que le chiffre tienne dedans ; `shadow` : sa silhouette encre (ombre dure). */
function Burst({ shadow = false }: { shadow?: boolean }) {
  const n = 16;
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? 140 : 186;
    const a = ((i * 180) / n - 90) * (Math.PI / 180);
    return `${(190 + r * Math.cos(a)).toFixed(1)},${(190 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="-4 -4 396 396" width={340} height={340} aria-hidden>
      <polygon points={pts} fill={shadow ? POP.ink : POP.ambre} stroke={POP.ink} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
}

function Ton({ time, spec }: { time: MotionValue<number>; spec: MiniSpec }) {
  const dart = useTransform(time, (t) => {
    const u = easeIn(seg(t, 0.08, 0.7));
    return `translate(${lerp(-260, 1100, u)} ${lerp(470, 200, u)}) rotate(${70 + 10 * Math.sin(t * 9)}) scale(1.4)`;
  });
  const burst = useIn(time, 0.5, 0.2);
  const word = useIn(time, 0.55);
  const num = useIn(time, 0.62);
  const head = useIn(time, 0.72);
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 bg-violet" style={DOTS_VIOLET}>
      <motion.div style={burst} className="pointer-events-none absolute left-1/2 top-[38%] -ml-[170px] -mt-[170px]">
        {/* L'ombre tourne avec l'explosion mais reste décalée en bas à droite. */}
        {[true, false].map((shadow) => (
          <motion.div
            key={String(shadow)}
            className={shadow ? "absolute left-2 top-2" : "relative"}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <Burst shadow={shadow} />
          </motion.div>
        ))}
      </motion.div>
      <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <MG transform={dart}>
          <Flame time={time} />
          <Dart />
        </MG>
      </svg>
      <Boom time={time} t0={0.5} className="left-[6%] top-[14%]" rotate={-10}>
        Boom !
      </Boom>
      <div className="absolute inset-x-0 top-[38%] -translate-y-1/2 text-center text-encre">
        <motion.b
          style={{ ...word, boxShadow: `3px 3px 0 ${POP.ink}` }}
          className="relative inline-block rounded-full border-[3px] border-encre bg-carte px-4 py-0.5 font-display text-[30px] font-black uppercase leading-tight tracking-tight"
        >
          {spec.kicker}
        </motion.b>
        <motion.span style={num} className="mt-1 block font-num text-[112px] font-black leading-[0.9]">
          {spec.num}
        </motion.span>
      </div>
      <motion.div style={head} className="pointer-events-none absolute bottom-[calc(56px+env(safe-area-inset-bottom))] right-3 origin-bottom-right">
        <Head kind="mdr" size={112} />
      </motion.div>
    </div>
  );
}

/* ---------- Numéro fermé : le cadenas ---------- */

function Padlock({ time }: { time: MotionValue<number> }) {
  const shackle = useTransform(time, (t) => `translate(0 ${lerp(-34, 0, easeOut(seg(t, 0.5, 0.62)))})`);
  return (
    <svg viewBox="-10 -70 220 282" width={130} height={167} aria-hidden>
      <g transform="translate(7 7)">
        <rect x={10} y={70} width={180} height={130} rx={18} fill={POP.ink} />
      </g>
      <MG transform={shackle}>
        <path d="M50 78 V30 A50 50 0 0 1 150 30 V78" fill="none" stroke={POP.ink} strokeWidth={30} strokeLinecap="round" />
        <path d="M50 78 V30 A50 50 0 0 1 150 30 V78" fill="none" stroke={POP.cream} strokeWidth={16} strokeLinecap="round" />
      </MG>
      <rect x={10} y={70} width={180} height={130} rx={18} fill={POP.ambre} stroke={POP.ink} strokeWidth={7} />
      <circle cx={100} cy={122} r={15} fill={POP.ink} />
      <path d="M92 128 L108 128 L104 166 L96 166 Z" fill={POP.ink} />
    </svg>
  );
}

function Closed({ time, spec }: { time: MotionValue<number>; spec: MiniSpec }) {
  const drop = useTransform(time, (t) => {
    const u = easeIn(seg(t, 0.12, 0.42));
    const squash = t > 0.42 ? 1 - 0.18 * Math.sin(seg(t, 0.42, 0.58) * Math.PI) : 1;
    return `translateY(${lerp(-520, 0, u)}px) scaleY(${squash}) scaleX(${2 - squash})`;
  });
  const num = useIn(time, 0.02, 0.6);
  const label = useIn(time, 0.62);
  return (
    <div className="absolute inset-0 bg-violet" style={DOTS_VIOLET}>
      <div className="absolute inset-x-0 top-[34%] -translate-y-1/2">
        <motion.div style={num} className="relative mx-auto w-fit">
          <div
            className="absolute inset-x-[-22px] inset-y-[16px] -rotate-3 rounded-[28px] border-[4px] border-encre bg-carte"
            style={{ boxShadow: `6px 6px 0 ${POP.ink}` }}
          />
          <span
            className={`relative block whitespace-nowrap px-6 font-num font-black leading-[1] text-encre ${
              (spec.num ?? "").length <= 2 ? "text-[170px]" : (spec.num ?? "").length <= 4 ? "py-6 text-[96px]" : (spec.num ?? "").length <= 7 ? "py-8 text-[64px]" : "py-9 text-[44px]"
            }`}
          >
            {spec.num}
          </span>
        </motion.div>
      </div>
      <motion.div className="absolute left-1/2 top-[34%] ml-[34px] mt-[8px] origin-bottom" style={{ transform: drop }}>
        <Padlock time={time} />
      </motion.div>
      <Boom time={time} t0={0.44} className="right-[6%] top-[14%]" rotate={10}>
        Clac !
      </Boom>
      <motion.p
        style={{ ...label, textShadow: `0.06em 0.06em 0 ${POP.ink}` }}
        className="absolute inset-x-0 top-[58%] text-center font-display text-[36px] font-black uppercase tracking-tight text-white"
      >
        {spec.text}
      </motion.p>
    </div>
  );
}
