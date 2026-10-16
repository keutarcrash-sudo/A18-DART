"use client";
/**
 * Kit « Pop » des célébrations et des scènes (docs/08-refonte-pop.md) : stickers à contour encre épais et
 * ombre dure décalée (sans flou), couleurs de la palette en aplat. Les personnages sont les têtes de
 * components/pop/Heads.tsx.
 */
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Palette Pop (mêmes valeurs que les jetons de globals.css), pour les dessins SVG. */
export const POP = {
  violet: "#8B5CF6",
  rose: "#F472B6",
  ambre: "#FBBF24",
  menthe: "#34D399",
  ink: "#1E293B",
  cream: "#FFFDF5",
  white: "#FFFFFF",
} as const;

const STROKE = 6;
const SHADOW = 7;

type Draw = (fill: string, stroke: string) => ReactNode;

/** Un sticker : la forme en noir décalée (l'ombre), puis la forme en couleur avec son contour noir. */
function Sticker({ draw, fill, size, flat = false, className = "" }: { draw: Draw; fill: string; size: number; flat?: boolean; className?: string }) {
  return (
    <svg viewBox="-8 -8 124 124" width={size} height={size} className={className} aria-hidden>
      {!flat && <g transform={`translate(${SHADOW} ${SHADOW})`}>{draw(POP.ink, POP.ink)}</g>}
      {draw(fill, flat ? fill : POP.ink)}
    </svg>
  );
}

const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function starPoints(n: number, outer: number, inner: number, rot = -90): string {
  const p: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    p.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
  }
  return pts(p);
}

export const SHAPES = {
  burst: ((f, s) => <polygon points={starPoints(12, 50, 31, -82)} fill={f} stroke={s} strokeWidth={STROKE} strokeLinejoin="round" />) as Draw,
  star: ((f, s) => <polygon points={starPoints(5, 48, 21)} fill={f} stroke={s} strokeWidth={STROKE} strokeLinejoin="round" />) as Draw,
  bolt: ((f, s) => (
    <polygon points="60,2 16,58 46,58 34,98 86,38 56,38 70,2" fill={f} stroke={s} strokeWidth={STROKE} strokeLinejoin="round" />
  )) as Draw,
  heart: ((f, s) => (
    <path
      d="M50 92 C20 70 4 52 4 32 C4 16 16 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C84 6 96 16 96 32 C96 52 80 70 50 92 Z"
      fill={f}
      stroke={s}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
  )) as Draw,
  flower: ((f, s) => (
    <g stroke={s} strokeWidth={STROKE}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={50 + 28 * Math.cos((a * Math.PI) / 180)} cy={50 + 28 * Math.sin((a * Math.PI) / 180)} r={20} fill={f} />
      ))}
      <circle cx={50} cy={50} r={20} fill={f === POP.ink ? POP.ink : f === POP.ambre ? POP.rose : POP.ambre} />
    </g>
  )) as Draw,
  wave: ((f, s) => (
    <g fill="none" strokeLinecap="round">
      <path d="M6 54 Q 20 26 34 54 T 62 54 T 94 54" stroke={s} strokeWidth={26} />
      <path d="M6 54 Q 20 26 34 54 T 62 54 T 94 54" stroke={f} strokeWidth={14} />
    </g>
  )) as Draw,
  // Confettis géométriques (comme sur l'accueil et le podium).
  dot: ((f, s) => <circle cx={50} cy={50} r={40} fill={f} stroke={s} strokeWidth={STROKE * 1.4} />) as Draw,
  square: ((f, s) => <rect x={14} y={14} width={72} height={72} rx={12} fill={f} stroke={s} strokeWidth={STROKE * 1.4} />) as Draw,
  triangle: ((f, s) => <polygon points="50,8 94,88 6,88" fill={f} stroke={s} strokeWidth={STROKE * 1.4} strokeLinejoin="round" />) as Draw,
  plus: ((f, s) => (
    <path d="M36 6 H64 V36 H94 V64 H64 V94 H36 V64 H6 V36 H36 Z" fill={f} stroke={s} strokeWidth={STROKE * 1.4} strokeLinejoin="round" />
  )) as Draw,
  asterisk: ((f, s) => (
    <g>
      {[0, 60, 120].map((a) => (
        <rect key={a} x={40} y={4} width={20} height={92} rx={10} fill={f} stroke={s} strokeWidth={STROKE} transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx={50} cy={50} r={13} fill={f} />
    </g>
  )) as Draw,
};

export type ShapeName = keyof typeof SHAPES;

/** `flat` : forme pleine sans contour ni ombre (pour un fond derrière un texte). */
export function Shape({ name, fill, size, flat }: { name: ShapeName; fill: string; size: number; flat?: boolean }) {
  return <Sticker draw={SHAPES[name]} fill={fill} size={size} flat={flat} />;
}

/* ---------- Animation commune : le sticker « claque » à l'écran ---------- */

export function PopIn({
  children,
  delay = 0,
  rotate = 0,
  float = true,
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  rotate?: number;
  float?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={{ ...style, transform: `rotate(${rotate}deg)` }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ scale: 0, rotate: rotate - 50 }}
      animate={{ scale: 1, rotate }}
      transition={{ type: "spring", stiffness: 520, damping: 14, delay }}
    >
      <motion.div
        animate={float ? { y: [0, -6, 0], rotate: [0, 4, 0] } : undefined}
        transition={float ? { duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 } : undefined}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Trame de points (Ben-Day) en fond, couleur au choix. */
export function halftone(color = "rgb(0 0 0 / 0.13)", size = 14): React.CSSProperties {
  return { backgroundImage: `radial-gradient(${color} 24%, transparent 26%)`, backgroundSize: `${size}px ${size}px` };
}
