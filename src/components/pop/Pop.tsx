"use client";
/**
 * Kit pop art des célébrations (docs/04-direction-18.md, « Évolution pop art » ; références dans docs/pop-art/).
 * Stickers à contour noir épais et ombre noire décalée, couleurs vives en aplat, et la mascotte smiley
 * qui remplace les personnages 3D. Réservé aux célébrations : l'écran de saisie reste « 18° ».
 */
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export const POP = {
  pink: "#FF3D7F",
  blue: "#2D6BFF",
  yellow: "#FFD23F",
  orange: "#FF8A1F",
  cyan: "#0CC0DF",
  lime: "#C7D530",
  white: "#FFFFFF",
  ink: "#111111",
} as const;

const STROKE = 6;
const SHADOW = 6;

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
      <circle cx={50} cy={50} r={20} fill={f === POP.ink ? POP.ink : POP.yellow} />
    </g>
  )) as Draw,
  wave: ((f, s) => (
    <g fill="none" strokeLinecap="round">
      <path d="M6 54 Q 20 26 34 54 T 62 54 T 94 54" stroke={s} strokeWidth={26} />
      <path d="M6 54 Q 20 26 34 54 T 62 54 T 94 54" stroke={f} strokeWidth={14} />
    </g>
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

/* ---------- La mascotte : un smiley aux gros yeux de cartoon ---------- */

export type Mood = "joy" | "wow" | "wink" | "dizzy" | "smug";

export function Mascot({ mood = "joy", size = 120 }: { mood?: Mood; size?: number }) {
  const eye = (cx: number, closed: boolean, dizzy: boolean) =>
    dizzy ? (
      <g stroke={POP.ink} strokeWidth={5} strokeLinecap="round">
        <line x1={cx - 9} y1={34} x2={cx + 9} y2={52} />
        <line x1={cx + 9} y1={34} x2={cx - 9} y2={52} />
      </g>
    ) : closed ? (
      <path d={`M${cx - 11} 46 Q ${cx} 34 ${cx + 11} 46`} fill="none" stroke={POP.ink} strokeWidth={5} strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={43} rx={11} ry={14} fill={POP.white} stroke={POP.ink} strokeWidth={4} />
        <ellipse cx={cx + 3} cy={46} rx={5} ry={7} fill={POP.ink} />
        <circle cx={cx + 5} cy={42} r={2} fill={POP.white} />
      </g>
    );
  const mouth = {
    joy: <path d="M30 64 Q 50 86 70 64 Z" fill={POP.ink} stroke={POP.ink} strokeWidth={4} strokeLinejoin="round" />,
    wow: <ellipse cx={50} cy={72} rx={9} ry={11} fill={POP.ink} />,
    wink: <path d="M32 66 Q 50 80 68 66" fill="none" stroke={POP.ink} strokeWidth={5} strokeLinecap="round" />,
    dizzy: <path d="M34 74 Q 42 66 50 74 T 66 74" fill="none" stroke={POP.ink} strokeWidth={5} strokeLinecap="round" />,
    smug: <path d="M36 70 Q 56 78 68 64" fill="none" stroke={POP.ink} strokeWidth={5} strokeLinecap="round" />,
  }[mood];
  return (
    <svg viewBox="-8 -8 124 124" width={size} height={size} aria-hidden>
      <circle cx={50 + SHADOW} cy={50 + SHADOW} r={46} fill={POP.ink} />
      <circle cx={50} cy={50} r={46} fill={POP.yellow} stroke={POP.ink} strokeWidth={STROKE} />
      {mood !== "dizzy" && (
        <g fill={POP.pink} opacity={0.85}>
          <ellipse cx={22} cy={62} rx={8} ry={5} />
          <ellipse cx={78} cy={62} rx={8} ry={5} />
        </g>
      )}
      {eye(36, false, mood === "dizzy")}
      {eye(64, mood === "wink", mood === "dizzy")}
      {mouth}
    </svg>
  );
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
