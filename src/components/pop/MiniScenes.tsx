"use client";
/**
 * Scènes courtes, en pop art, pour les moments plus fréquents :
 * - « misses »   : trois ratés, les fléchettes se plantent dans le panneau en OSB autour de la cible ;
 * - « ton »      : volée de 100 et plus, une fléchette enflammée traverse l'écran ;
 * - « closed »   : numéro fermé au Cricket, un cadenas claque dessus ;
 * - « eighteen » : volée de 18 pile, l'hommage à l'Arena18.
 * Même principe que Scene.tsx : une horloge pilote tout, une tape passe la scène.
 */
import { type MotionValue, motion, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { Mascot, POP, Shape, halftone } from "./Pop";
import { Boom, Bull, C, Dart, FlyingDart, MG, Sector, WholeBoard, easeIn, easeOut, lerp, polar, pop, seg, useTimeline } from "./Scene";

export type MiniKind = "misses" | "ton" | "closed" | "eighteen";
export const MINI_DURATION: Record<MiniKind, number> = { misses: 1.9, ton: 1.7, closed: 1.4, eighteen: 3 };

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
      style={{ ...s, boxShadow: `5px 5px 0 ${POP.ink}` }}
      className={`origin-bottom-left border-[3px] border-noir bg-blanc px-3.5 py-2.5 text-[15px] font-black italic leading-snug text-noir ${className}`}
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
    case "eighteen":
      return <Eighteen time={time} spec={spec} />;
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
  [346, 255, 40],
  [96, 515, 30],
];

function Misses({ time, spec }: { time: MotionValue<number>; spec: MiniSpec }) {
  const panel = useTransform(time, (t) => seg(t, 0, 0.15));
  return (
    <div className="absolute inset-0">
      <motion.div className="absolute inset-0" style={{ opacity: panel }}>
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
        <Boom key={k} time={time} t0={0.38 + k * 0.28} className={["left-[4%] top-[12%]", "right-[4%] top-[24%]", "left-[8%] top-[52%]"][k]} rotate={[-10, 8, -6][k]}>
          {w}
        </Boom>
      ))}
      <div className="absolute inset-x-4 bottom-[calc(60px+env(safe-area-inset-bottom))] flex items-end gap-2">
        <motion.div style={useIn(time, 1.1)} className="shrink-0">
          <Mascot mood="hide" size={92} />
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
      <path d="M0 140 C -40 190 -26 250 0 330 C 26 250 40 190 0 140 Z" fill={POP.pink} stroke={POP.ink} strokeWidth={4} />
      <path d="M0 150 C -26 190 -16 240 0 290 C 16 240 26 190 0 150 Z" fill={POP.orange} />
      <path d="M0 158 C -12 185 -8 220 0 250 C 8 220 12 185 0 158 Z" fill={POP.yellow} />
    </MG>
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
  return (
    <div className="absolute inset-0" style={{ background: POP.orange, ...halftone("rgb(0 0 0 / 0.14)") }}>
      <motion.div style={burst} className="pointer-events-none absolute left-1/2 top-[38%] -ml-[170px] -mt-[170px]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}>
          <Shape name="burst" fill={POP.yellow} size={340} flat />
        </motion.div>
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
      <div className="absolute inset-x-0 top-[38%] -translate-y-1/2 text-center text-noir">
        <motion.b style={word} className="block text-[40px] font-black uppercase italic leading-none tracking-tight">
          {spec.kicker}
        </motion.b>
        <motion.span style={num} className="block font-num text-[130px] leading-[0.9]">
          {spec.num}
        </motion.span>
      </div>
    </div>
  );
}

/* ---------- Numéro fermé : le cadenas ---------- */

function Padlock({ time }: { time: MotionValue<number> }) {
  const shackle = useTransform(time, (t) => `translate(0 ${lerp(-34, 0, easeOut(seg(t, 0.5, 0.62)))})`);
  return (
    <svg viewBox="-10 -70 220 270" width={130} height={160} aria-hidden>
      <g transform="translate(7 7)">
        <rect x={10} y={70} width={180} height={130} rx={18} fill={POP.ink} />
      </g>
      <MG transform={shackle}>
        <path d="M50 78 V30 A50 50 0 0 1 150 30 V78" fill="none" stroke={POP.ink} strokeWidth={30} strokeLinecap="round" />
        <path d="M50 78 V30 A50 50 0 0 1 150 30 V78" fill="none" stroke="#D9D9D9" strokeWidth={16} strokeLinecap="round" />
      </MG>
      <rect x={10} y={70} width={180} height={130} rx={18} fill={POP.yellow} stroke={POP.ink} strokeWidth={7} />
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
    <div className="absolute inset-0 bg-cyan" style={halftone("rgb(0 0 0 / 0.12)")}>
      <div className="absolute inset-x-0 top-[34%] -translate-y-1/2">
        <motion.div style={num} className="relative mx-auto w-fit">
          <div className="skew-18 absolute inset-x-[-28px] inset-y-[18px] border-[5px] border-noir bg-blanc" style={{ boxShadow: `7px 7px 0 ${POP.ink}` }} />
          <span
            className={`relative block whitespace-nowrap px-6 font-num leading-[1] text-noir ${
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
      <motion.p style={label} className="absolute inset-x-0 top-[58%] text-center text-[34px] font-black uppercase italic text-noir">
        {spec.text}
      </motion.p>
    </div>
  );
}

/* ---------- Volée de 18 : l'hommage ---------- */

/** Ordre des numéros sur une vraie cible, en partant du haut, dans le sens des aiguilles d'une montre. */
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const I18 = ORDER.indexOf(18);
/** La cible tourne puis s'arrête pile avec le 18 en haut. */
const SPIN_END = 720 - I18 * 18;

function boardSpin(t: number) {
  return lerp(0, SPIN_END, easeOut(seg(t, 0.1, 0.95)));
}

function NumberRing() {
  return (
    <g>
      <circle cx={C + 8} cy={C + 8} r={150} fill={POP.ink} />
      <circle cx={C} cy={C} r={150} fill={POP.ink} />
      {ORDER.map((n, i) => {
        const [x, y] = polar(134, i * 18);
        return (
          <text
            key={n}
            x={x}
            y={y}
            fill={n === 18 ? POP.yellow : POP.white}
            fontSize={n === 18 ? 22 : 17}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${i * 18} ${x} ${y})`}
            style={{ fontFamily: "var(--font-a18)" }}
          >
            {n}
          </text>
        );
      })}
    </g>
  );
}

const CONFETTI = (() => {
  let seed = 1818;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const colors = [POP.yellow, POP.cyan, POP.white, POP.lime, POP.orange, POP.blue];
  return Array.from({ length: 38 }, () => ({
    vx: (rnd() - 0.5) * 520,
    vy: -180 - rnd() * 320,
    spin: (rnd() - 0.5) * 900,
    w: 8 + rnd() * 10,
    h: 14 + rnd() * 14,
    c: colors[Math.floor(rnd() * colors.length)],
  }));
})();

function Confetti({ time, t0 }: { time: MotionValue<number>; t0: number }) {
  return (
    <g>
      {CONFETTI.map((p, k) => (
        <ConfettiPiece key={k} time={time} t0={t0} p={p} />
      ))}
    </g>
  );
}

function ConfettiPiece({ time, t0, p }: { time: MotionValue<number>; t0: number; p: (typeof CONFETTI)[number] }) {
  const transform = useTransform(time, (t) => {
    const u = Math.max(0, t - t0);
    return `translate(${C + p.vx * u} ${150 + p.vy * u + 520 * u * u}) rotate(${p.spin * u}) skewX(-18)`;
  });
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1 - seg(t, t0 + 1.4, t0 + 1.9)));
  return (
    <MG transform={transform} opacity={opacity}>
      <rect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} fill={p.c} stroke={POP.ink} strokeWidth={2} />
    </MG>
  );
}

function Eighteen({ time, spec }: { time: MotionValue<number>; spec: MiniSpec }) {
  const bg = useTransform(time, (t) => `polygon(0 0, ${lerp(0, 160, easeOut(seg(t, 0, 0.3)))}% 0, ${lerp(-32, 128, easeOut(seg(t, 0, 0.3)))}% 100%, 0 100%)`);
  const board = useTransform(time, (t) => `rotate(${boardSpin(t)} ${C} ${C})`);
  const boardIn = useTransform(time, (t) => `translate(${C} ${C}) scale(${lerp(0.4, 1, pop(seg(t, 0.05, 0.35)))}) translate(${-C} ${-C})`);
  const dim = useTransform(time, (t) => 1 - 0.75 * seg(t, 1.0, 1.3));
  // La part du 18 : tourne avec la cible, puis se détache, monte et grossit.
  const slice = useTransform(time, (t) => {
    const u = easeOut(seg(t, 1.0, 1.45));
    const [cx, cy] = polar(70, 0);
    return `translate(0 ${30 * u}) translate(${cx} ${cy}) scale(${lerp(1, 2, u)}) translate(${-cx} ${-cy}) rotate(${u > 0 ? 0 : boardSpin(t) + I18 * 18} ${C} ${C})`;
  });
  const sliceOut = useTransform(time, (t): number => (t < 1.0 ? 0 : 1));
  const stamp = useTransform(time, (t) => {
    const u = seg(t, 1.45, 1.7);
    const s = u <= 0 ? 0 : lerp(2.4, 1, easeOut(u));
    return `translate(${C} 118) scale(${s}) rotate(${-6 * (1 - u)})`;
  });
  const tag = useIn(time, 1.75);
  const kick = useIn(time, 1.55);
  return (
    <div className="absolute inset-0">
      <motion.div className="absolute inset-0" style={{ background: POP.pink, ...halftone("rgb(0 0 0 / 0.13)"), clipPath: bg }} />
      <div className="absolute inset-x-0 top-[6%] mx-auto aspect-square w-[min(92vw,410px)]">
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <MG transform={boardIn}>
            <motion.g style={{ opacity: dim }}>
              <MG transform={board}>
                <NumberRing />
                {ORDER.map((_, i) => (i === I18 ? null : <Sector key={i} i={i} />))}
                <Bull />
              </MG>
            </motion.g>
            <motion.g style={{ opacity: useTransform(time, (t): number => (t < 1.0 ? 1 : 0)) }}>
              <MG transform={board}>
                <Sector i={I18} />
              </MG>
            </motion.g>
            <MG transform={slice} opacity={sliceOut}>
              <g transform={`rotate(${-I18 * 18} ${C} ${C})`}>
                <g transform={`translate(4 6)`}>
                  <path d={`M${polar(18, I18 * 18 - 9).join(" ")} L${polar(118, I18 * 18 - 9).join(" ")} A118 118 0 0 1 ${polar(118, I18 * 18 + 9).join(" ")} L${polar(18, I18 * 18 + 9).join(" ")} Z`} fill={POP.ink} />
                </g>
                <Sector i={I18} fill={POP.yellow} />
              </g>
            </MG>
          </MG>
          <Confetti time={time} t0={1.5} />
          <MG transform={stamp}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={88} fill={POP.white} stroke={POP.ink} strokeWidth={7} paintOrder="stroke" style={{ fontFamily: "var(--font-a18)" }}>
              18
            </text>
          </MG>
        </svg>
        <Boom time={time} t0={1.5} className="left-[0%] top-[2%]" rotate={-10}>
          Hommage !
        </Boom>
      </div>
      <div className="absolute inset-x-0 top-[calc(6%+min(92vw,410px)*0.86)] flex flex-col items-center gap-2">
        <motion.span style={kick} className="-skew-x-[18deg] bg-noir px-3 py-1 text-[12px] font-black uppercase tracking-[0.2em] text-blanc">
          <span className="inline-block skew-x-[18deg]">{spec.kicker} · 18</span>
        </motion.span>
        <motion.span
          style={{ ...tag, background: POP.yellow, boxShadow: `4px 4px 0 ${POP.ink}` }}
          className="border-[3px] border-noir px-3 py-1 font-num text-[22px] text-noir"
        >
          360° ÷ 20 = 18°
        </motion.span>
      </div>
      <div className="absolute inset-x-4 bottom-[calc(44px+env(safe-area-inset-bottom))] flex items-end gap-2">
        <motion.div style={useIn(time, 1.9)} className="shrink-0">
          <Mascot mood="joy" size={92} hat />
        </motion.div>
        <Bubble time={time} t0={2.0}>
          {spec.text}
        </Bubble>
      </div>
    </div>
  );
}
