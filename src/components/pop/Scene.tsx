"use client";
/**
 * Scènes animées des grandes célébrations, en style Pop (dessinées et animées ici, sans vidéo) :
 * - « bull »    : la fléchette déchire l'écran, traverse et se plante dans le bull (victoire, record) ;
 * - « triple »  : trois fléchettes s'enchaînent dans le triple 20 (180, 9 touches) ;
 * - « shatter » : la fléchette frappe la cible, qui se fissure et vole en éclats (bust, éliminé).
 *
 * Une seule horloge (`time`, en secondes) pilote tout : chaque élément calcule sa position à partir d'elle.
 * Dessin aux couleurs de la cible du jeu (components/x01/Board.tsx) : simples encre / crème, doubles et triples
 * rose / menthe, 25 menthe, bull rose, contours encre épais et ombre dure ; fléchette à fût encre, ailette violette,
 * pointe ambre.
 * Sans animation (réglage « réduire les animations »), la scène s'affiche directement dans son état final
 * (pour le bust : la cible fissurée, fléchette plantée, plutôt qu'une cible déjà tombée).
 */
import { type MotionValue, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { RINGS, SECTOR_ORDER } from "@/lib/board";
import { POP } from "./Pop";

export type SceneKind = "bull" | "triple" | "shatter";
export const SCENE_DURATION = 2.6;

/* ---------- Petits outils de minutage ---------- */

export const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Avancement de 0 à 1 entre les instants a et b. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u;
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** Rebond « sticker » : dépasse un peu puis se pose. */
export const pop = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.28 * Math.sin(u * Math.PI));

/** Horloge de scène : de 0 à `duration` secondes (directement à la fin si les animations sont réduites). */
export function useTimeline(duration = SCENE_DURATION): MotionValue<number> {
  const time = useMotionValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      time.set(duration);
      return;
    }
    const c = animate(time, duration, { duration, ease: "linear" });
    return () => c.stop();
  }, [time, reduce, duration]);
  return time;
}

/** Groupe SVG dont l'attribut `transform` suit l'horloge (Motion ne le fait pas tout seul pour un attribut SVG). */
export function MG({ transform, opacity, children }: { transform: MotionValue<string>; opacity?: MotionValue<number>; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  useMotionValueEvent(transform, "change", (v) => ref.current?.setAttribute("transform", v));
  return (
    <motion.g ref={ref} transform={transform.get()} style={opacity ? { opacity } : undefined}>
      {children}
    </motion.g>
  );
}

/* ---------- La cible Pop (centre 200,200) — mêmes proportions que la cible du jeu ---------- */

export const C = 200;
/** Rayon des secteurs ; l'anneau encre (où seraient les numéros) va jusqu'à RIM. */
const R = 124;
const RIM = 138;
/** Rayons de src/lib/board.ts (cible de rayon 100) mis à l'échelle de la scène. */
const K = R / RINGS.doubleOut;
const RR = {
  bull: RINGS.bull * K,
  outer: RINGS.outer * K,
  tripleIn: RINGS.tripleIn * K,
  tripleOut: RINGS.tripleOut * K,
  doubleIn: RINGS.doubleIn * K,
  doubleOut: R,
};
/** Rayon du milieu du triple (là où se plantent les fléchettes du 180). */
export const TRIPLE_R = (RR.tripleIn + RR.tripleOut) / 2;

export const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const n2 = (v: number) => Math.round(v * 100) / 100;
function ringPath(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r1, a0).map(n2);
  const [x1, y1] = polar(r1, a1).map(n2);
  const [x2, y2] = polar(r0, a1).map(n2);
  const [x3, y3] = polar(r0, a0).map(n2);
  return `M${x0} ${y0} A${n2(r1)} ${n2(r1)} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${n2(r0)} ${n2(r0)} 0 0 0 ${x3} ${y3} Z`;
}

const LINE = { stroke: POP.ink, strokeWidth: 2.5, strokeLinejoin: "round" as const };

/** Un secteur complet (simple + double + triple), dessiné à part pour pouvoir voler en éclats. Secteur 0 = le 20. */
export function Sector({ i }: { i: number }) {
  const a0 = i * 18 - 9;
  const a1 = i * 18 + 9;
  const even = i % 2 === 0;
  const ring = even ? POP.rose : POP.menthe;
  return (
    <g>
      <path d={ringPath(RR.outer, RR.doubleOut, a0, a1)} fill={even ? POP.ink : POP.cream} {...LINE} />
      <path d={ringPath(RR.doubleIn, RR.doubleOut, a0, a1)} fill={ring} {...LINE} />
      <path d={ringPath(RR.tripleIn, RR.tripleOut, a0, a1)} fill={ring} {...LINE} />
    </g>
  );
}

export function Bull() {
  return (
    <g stroke={POP.ink} strokeWidth={2.5}>
      <circle cx={C} cy={C} r={RR.outer} fill={POP.menthe} />
      <circle cx={C} cy={C} r={RR.bull} fill={POP.rose} />
    </g>
  );
}

/** Petits numéros dans l'anneau encre (20 en haut), comme sur une vraie cible. */
function Numbers() {
  return (
    <g fill={POP.cream} fontWeight={800} fontSize={12.5} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
      {SECTOR_ORDER.map((n, i) => {
        const [x, y] = polar((R + RIM) / 2, i * 18);
        return (
          <text key={n} x={n2(x)} y={n2(y)}>
            {n}
          </text>
        );
      })}
    </g>
  );
}

/** La cible entière : ombre dure décalée, anneau encre, secteurs, bull. */
export function WholeBoard() {
  return (
    <g>
      <circle cx={C + 9} cy={C + 9} r={RIM} fill={POP.ink} />
      <circle cx={C} cy={C} r={RIM} fill={POP.ink} />
      <Numbers />
      {Array.from({ length: 20 }, (_, i) => (
        <Sector key={i} i={i} />
      ))}
      <Bull />
      <circle cx={C} cy={C} r={R} fill="none" stroke={POP.ink} strokeWidth={4} />
    </g>
  );
}

/* ---------- La fléchette (comme sur la cible du jeu) : pointe en (0,0), corps vers le bas, inclinée ensuite ---------- */

/** Silhouette de la fléchette (pointe, fût, tige, ailettes). */
const DART_PARTS = (
  <>
    <path d="M0 -2 L-3.5 24 L3.5 24 Z" />
    <rect x={-8} y={22} width={16} height={46} rx={6} />
    <rect x={-3} y={66} width={6} height={44} rx={3} />
    <path d="M0 90 L-30 130 L-10 150 L0 126 Z" />
    <path d="M0 90 L30 130 L10 150 L0 126 Z" />
  </>
);

export function Dart() {
  const line = { stroke: POP.ink, strokeWidth: 3, strokeLinejoin: "round" as const };
  return (
    <g>
      {/* Bord découpé crème (sticker) : la fléchette reste lisible sur les cases encre comme sur le violet. */}
      <g fill={POP.cream} stroke={POP.cream} strokeWidth={10} strokeLinejoin="round">
        {DART_PARTS}
      </g>
      {/* Pointe ambre */}
      <path d="M0 -2 L-3.5 24 L3.5 24 Z" fill={POP.ambre} {...line} />
      {/* Fût encre, trois bagues crème */}
      <rect x={-8} y={22} width={16} height={46} rx={6} fill={POP.ink} {...line} />
      <rect x={-6} y={33} width={12} height={4} rx={2} fill={POP.cream} />
      <rect x={-6} y={45} width={12} height={4} rx={2} fill={POP.cream} />
      <rect x={-6} y={57} width={12} height={4} rx={2} fill={POP.cream} />
      {/* Tige */}
      <rect x={-3} y={66} width={6} height={44} rx={3} fill={POP.ink} {...line} />
      {/* Ailettes violettes */}
      <path d="M0 90 L-30 130 L-10 150 L0 126 Z" fill={POP.violet} {...line} />
      <path d="M0 90 L30 130 L10 150 L0 126 Z" fill={POP.violet} {...line} />
      <path d="M0 88 L0 146" stroke={POP.ink} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

/** Une fléchette qui vole du coin bas-droit (en gros plan) jusqu'à sa cible, puis vibre en se plantant. */
export function FlyingDart({ time, tx, ty, t0, t1, angle = 32 }: { time: MotionValue<number>; tx: number; ty: number; t0: number; t1: number; angle?: number }) {
  const transform = useTransform(time, (t) => {
    const u = easeIn(seg(t, t0, t1));
    const x = lerp(520, tx, u);
    const y = lerp(640, ty, u);
    const s = lerp(2.8, 1, u);
    // Vibration à l'impact, qui s'amortit.
    const after = Math.max(0, t - t1);
    const wobble = t > t1 ? 7 * Math.sin(after * 55) * Math.exp(-after * 7) : 0;
    return `translate(${x} ${y}) rotate(${angle + wobble}) scale(${s})`;
  });
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1));
  return (
    <MG transform={transform} opacity={opacity}>
      <Dart />
    </MG>
  );
}

/** Onde de choc à l'impact : un anneau de couleur cerné d'encre (sticker), qui s'élargit puis s'efface. */
export function Shock({ time, x, y, t0, color = POP.ambre }: { time: MotionValue<number>; x: number; y: number; t0: number; color?: string }) {
  const r = useTransform(time, (t) => lerp(10, 170, easeOut(seg(t, t0, t0 + 0.45))));
  const opacity = useTransform(time, (t) => (t < t0 ? 0 : 1 - seg(t, t0, t0 + 0.45)));
  return (
    <motion.g style={{ opacity }}>
      <motion.circle cx={x} cy={y} r={r} fill="none" stroke={POP.ink} strokeWidth={11} />
      <motion.circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={5} />
    </motion.g>
  );
}

/** Onomatopée de BD qui claque à un instant donné. */
export function Boom({ time, t0, children, className, rotate = -8 }: { time: MotionValue<number>; t0: number; children: ReactNode; className: string; rotate?: number }) {
  const scale = useTransform(time, (t) => pop(seg(t, t0, t0 + 0.25)));
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1));
  return (
    <motion.div style={{ scale, opacity, rotate }} className={`pointer-events-none absolute ${className}`}>
      <span
        className="inline-block whitespace-nowrap rounded-[14px] border-[3px] border-encre bg-carte px-3 pb-1 pt-0.5 font-display text-[28px] font-black uppercase leading-tight tracking-tight text-encre"
        style={{ boxShadow: `4px 4px 0 ${POP.ink}` }}
      >
        {children}
      </span>
    </motion.div>
  );
}

/* ---------- La déchirure de l'écran ---------- */

const JAG = [0, 2.6, -1.8, 3.1, -2.4, 1.2, -3, 2.2, -1.1, 2.9, -2.6, 1.7, -1.9, 2.4, -2.8, 1.4, 0];
function tearPolygon(w: number): string {
  // Bande diagonale (bas-gauche → haut-droit) aux bords déchirés, de demi-largeur w (en %).
  const n = JAG.length - 1;
  const side = (sign: number, extra: number) =>
    JAG.map((j, k) => {
      const u = k / n;
      const cx = -10 + 120 * u;
      const cy = 110 - 120 * u;
      const d = w + extra + j * Math.min(1, w / 4 + 0.3) * sign;
      return [cx + sign * d * 0.707, cy + sign * d * 0.707];
    });
  const a = side(1, 0);
  const b = side(-1, 0).reverse();
  return `polygon(${[...a, ...b].map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ")})`;
}

/** Le fond de la célébration apparaît à travers une déchirure qui s'ouvre (bord de papier blanc cerné d'encre). */
export function Tear({ time, className, style, children }: { time: MotionValue<number>; className: string; style?: React.CSSProperties; children: ReactNode }) {
  const w = (t: number) => lerp(0, 125, easeOut(seg(t, 0.12, 0.6)));
  const edge = useTransform(time, (t) => tearPolygon(w(t) + 3.4));
  const paper = useTransform(time, (t) => tearPolygon(w(t) + 2.2));
  const inner = useTransform(time, (t) => tearPolygon(w(t)));
  return (
    <>
      <motion.div className="absolute inset-0 bg-encre" style={{ clipPath: edge }} />
      <motion.div className="absolute inset-0 bg-carte" style={{ clipPath: paper }} />
      <motion.div className={`absolute inset-0 ${className}`} style={{ ...style, clipPath: inner }}>
        {children}
      </motion.div>
    </>
  );
}

/* ---------- Les trois scènes ---------- */

export function useSceneTime() {
  return useTimeline();
}

/** Apparition (0 → 1, avec rebond) d'un élément à l'instant t0, pour synchroniser le texte avec la scène. */
export function useAppear(time: MotionValue<number>, t0: number) {
  const scale = useTransform(time, (t) => lerp(0.4, 1, pop(seg(t, t0, t0 + 0.3))));
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1));
  return { scale, opacity };
}

/**
 * Instant montré pour le bust quand les animations sont réduites : la cible fissurée, fléchette plantée,
 * « BUST ! » affiché (à la fin de la scène animée, les morceaux sont déjà tombés).
 */
const SHATTER_STILL = 0.93;

/** La cible et ce qui lui arrive. `time` vient de useSceneTime(). */
export function SceneBoard({ kind, time, boom }: { kind: SceneKind; time: MotionValue<number>; boom?: string }) {
  const reduce = useReducedMotion();
  const still = useMotionValue(SHATTER_STILL);
  const clock = reduce && kind === "shatter" ? still : time;
  // Avec déchirure, la cible attend que l'écran soit ouvert.
  const from = kind === "shatter" ? 0.15 : 0.42;
  const appear = useTransform(clock, (t) => `translate(${C} ${C}) scale(${lerp(0.55, 1, pop(seg(t, from, from + 0.3)))}) translate(${-C} ${-C})`);
  const boardOpacity = useTransform(clock, (t): number => (t < from ? 0 : 1));
  // Secousse de l'écran à l'impact.
  const impact = kind === "triple" ? 1.25 : kind === "bull" ? 0.85 : 0.62;
  const shake = useTransform(clock, (t) => {
    const a = Math.max(0, t - impact);
    return t > impact && !reduce ? 9 * Math.sin(a * 70) * Math.exp(-a * 9) : 0;
  });

  return (
    <motion.div style={{ x: shake }} className="relative mx-auto aspect-square w-[min(88vw,400px)]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <MG transform={appear} opacity={boardOpacity}>
          {kind === "shatter" ? <Shatter time={clock} /> : <WholeBoard />}
        </MG>
        {kind === "bull" && (
          <>
            <Shock time={clock} x={C} y={C} t0={0.85} color={POP.cream} />
            <Shock time={clock} x={C} y={C} t0={0.98} />
            <FlyingDart time={clock} tx={C} ty={C} t0={0.45} t1={0.85} />
          </>
        )}
        {kind === "triple" &&
          [-5, 0, 5].map((a, k) => {
            const [x, y] = polar(TRIPLE_R, a);
            const t1 = 0.75 + k * 0.25;
            return (
              <g key={a}>
                <Shock time={clock} x={x} y={y} t0={t1} color={[POP.ambre, POP.rose, POP.menthe][k]} />
                <FlyingDart time={clock} tx={x} ty={y} t0={t1 - 0.22} t1={t1} angle={28 + k * 5} />
              </g>
            );
          })}
        {kind === "shatter" && <ShatterDart time={clock} />}
      </svg>
      {kind === "bull" && (
        <Boom time={clock} t0={0.88} className="left-[2%] top-[6%]">
          {boom ?? "Bull !"}
        </Boom>
      )}
      {kind === "triple" &&
        ["Tchak", "Tchak", "Tchak !"].map((w, k) => (
          <Boom key={k} time={clock} t0={0.77 + k * 0.25} className={["left-[0%] top-[4%]", "left-[30%] top-[-4%]", "right-[0%] top-[4%]"][k]} rotate={[-10, 4, 10][k]}>
            {w}
          </Boom>
        ))}
      {kind === "shatter" && (
        <Boom time={clock} t0={0.62} className="left-[4%] top-[8%]" rotate={-12}>
          {boom ?? "Crac !"}
        </Boom>
      )}
    </motion.div>
  );
}

/* ---------- Bust : impact, fissures, éclats ---------- */

const HIT = polar(RR.tripleOut + 16, 126);
const CRACKS = [
  [HIT, polar(72, 150), polar(42, 170), polar(12, 200)],
  [HIT, polar(110, 100), polar(130, 80)],
  [HIT, polar(62, 110), polar(32, 60), polar(62, 20)],
  [HIT, polar(118, 150), polar(134, 175)],
];

function Shatter({ time }: { time: MotionValue<number> }) {
  return (
    <g>
      <Rim time={time} shadow />
      <Rim time={time} />
      {Array.from({ length: 20 }, (_, i) => (
        <Shard key={i} i={i} time={time} />
      ))}
      <ShardBull time={time} />
      {CRACKS.map((pts, k) => (
        <Crack key={k} time={time} d={`M${pts.map(([x, y]) => `${n2(x)} ${n2(y)}`).join(" L")}`} delay={k * 0.04} />
      ))}
    </g>
  );
}

/** Les morceaux tombent : direction de leur secteur, puis gravité et rotation. */
function fall(t: number, i: number, angle: number) {
  const u = seg(t, 0.95, 2.1);
  const spread = 70 * easeOut(u);
  const [dx, dy] = [Math.sin((angle * Math.PI) / 180), -Math.cos((angle * Math.PI) / 180)];
  const g = 420 * u * u;
  const rot = (i % 2 ? 1 : -1) * (25 + (i % 5) * 9) * u;
  return { x: dx * spread, y: dy * spread + g, rot, opacity: 1 - seg(t, 1.7, 2.2) };
}

/** L'anneau encre (et son ombre dure) : il disparaît quand la cible éclate. */
function Rim({ time, shadow = false }: { time: MotionValue<number>; shadow?: boolean }) {
  const opacity = useTransform(time, (t) => 1 - seg(t, 0.95, 1.2));
  const o = shadow ? 9 : 0;
  return (
    <motion.g style={{ opacity }}>
      <circle cx={C + o} cy={C + o} r={RIM} fill={POP.ink} />
      {!shadow && <Numbers />}
    </motion.g>
  );
}

function Shard({ i, time }: { i: number; time: MotionValue<number> }) {
  const transform = useTransform(time, (t) => {
    const f = fall(t, i, i * 18);
    return `translate(${f.x} ${f.y}) rotate(${f.rot} ${polar(70, i * 18).join(" ")})`;
  });
  const opacity = useTransform(time, (t) => fall(t, i, i * 18).opacity);
  return (
    <MG transform={transform} opacity={opacity}>
      <Sector i={i} />
    </MG>
  );
}

function ShardBull({ time }: { time: MotionValue<number> }) {
  const transform = useTransform(time, (t) => {
    const u = seg(t, 1.0, 2.1);
    return `translate(0 ${380 * u * u}) rotate(${80 * u} ${C} ${C})`;
  });
  const opacity = useTransform(time, (t) => 1 - seg(t, 1.7, 2.2));
  return (
    <MG transform={transform} opacity={opacity}>
      <Bull />
    </MG>
  );
}

/** Une fissure : trait crème cerné d'encre, qui se dessine depuis l'impact. */
function Crack({ time, d, delay }: { time: MotionValue<number>; d: string; delay: number }) {
  const offset = useTransform(time, (t) => 1 - easeOut(seg(t, 0.62 + delay, 0.85 + delay)));
  const opacity = useTransform(time, (t) => (t < 0.62 ? 0 : 1 - seg(t, 0.95, 1.1)));
  const common = {
    d,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: "1 1",
    style: { strokeDashoffset: offset },
  };
  return (
    <motion.g style={{ opacity }}>
      <motion.path {...common} stroke={POP.ink} strokeWidth={9} />
      <motion.path {...common} stroke={POP.ambre} strokeWidth={4} />
    </motion.g>
  );
}

function ShatterDart({ time }: { time: MotionValue<number> }) {
  const [hx, hy] = HIT;
  const transform = useTransform(time, (t) => {
    const u = easeIn(seg(t, 0.25, 0.62));
    const x = lerp(520, hx, u);
    const y = lerp(640, hy, u);
    const s = lerp(2.8, 1, u);
    const f = seg(t, 1.0, 2.1);
    return `translate(${x} ${y + 420 * f * f}) rotate(${32 + 140 * f}) scale(${s})`;
  });
  const opacity = useTransform(time, (t): number => (t < 0.25 ? 0 : 1 - seg(t, 1.8, 2.2)));
  return (
    <MG transform={transform} opacity={opacity}>
      <Dart />
    </MG>
  );
}
