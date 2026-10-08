"use client";
/**
 * Scènes animées des grandes célébrations, en pop art (dessinées et animées ici, sans vidéo) :
 * - « bull »    : la fléchette déchire l'écran, traverse et se plante dans le bull (victoire, record) ;
 * - « triple »  : trois fléchettes s'enchaînent dans le triple 20 (180, 9 touches) ;
 * - « shatter » : la fléchette frappe la cible, qui se fissure et vole en éclats (bust, éliminé).
 *
 * Une seule horloge (`time`, en secondes) pilote tout : chaque élément calcule sa position à partir d'elle.
 * Sans animation (réglage « réduire les animations »), la scène s'affiche directement dans son état final.
 */
import { type MotionValue, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { POP } from "./Pop";

export type SceneKind = "bull" | "triple" | "shatter";
export const SCENE_DURATION = 2.6;

/* ---------- Petits outils de minutage ---------- */

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Avancement de 0 à 1 entre les instants a et b. */
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const easeIn = (u: number) => u * u;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** Rebond « sticker » : dépasse un peu puis se pose. */
const pop = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.28 * Math.sin(u * Math.PI));

function useTimeline(): MotionValue<number> {
  const time = useMotionValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      time.set(SCENE_DURATION);
      return;
    }
    const c = animate(time, SCENE_DURATION, { duration: SCENE_DURATION, ease: "linear" });
    return () => c.stop();
  }, [time, reduce]);
  return time;
}

/** Groupe SVG dont l'attribut `transform` suit l'horloge (Motion ne le fait pas tout seul pour un attribut SVG). */
function MG({ transform, opacity, children }: { transform: MotionValue<string>; opacity?: MotionValue<number>; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  useMotionValueEvent(transform, "change", (v) => ref.current?.setAttribute("transform", v));
  return (
    <motion.g ref={ref} transform={transform.get()} style={opacity ? { opacity } : undefined}>
      {children}
    </motion.g>
  );
}

/* ---------- La cible pop art (centre 200,200, rayon 140) ---------- */

const C = 200;
const polar = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
function ringPath(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z`;
}

/** Un secteur complet (simple + double + triple), dessiné à part pour pouvoir voler en éclats. */
function Sector({ i }: { i: number }) {
  const a0 = i * 18 - 9;
  const a1 = i * 18 + 9;
  const dark = i % 2 === 0;
  const ring = i % 2 === 0 ? POP.pink : POP.cyan;
  const line = { stroke: POP.ink, strokeWidth: 2.5, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d={ringPath(18, 118, a0, a1)} fill={dark ? POP.ink : "#FFF4DC"} {...line} />
      <path d={ringPath(106, 118, a0, a1)} fill={ring} {...line} />
      <path d={ringPath(64, 76, a0, a1)} fill={ring} {...line} />
    </g>
  );
}

function Bull() {
  return (
    <g stroke={POP.ink} strokeWidth={2.5}>
      <circle cx={C} cy={C} r={18} fill={POP.cyan} />
      <circle cx={C} cy={C} r={8} fill={POP.pink} />
    </g>
  );
}

/* ---------- La fléchette : pointe en (0,0), corps vers le bas, inclinée ensuite ---------- */

function Dart() {
  const line = { stroke: POP.ink, strokeWidth: 3, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d="M0 0 L-2.5 22 L2.5 22 Z" fill="#D9D9D9" {...line} />
      <rect x={-8} y={22} width={16} height={46} rx={4} fill={POP.white} {...line} />
      <rect x={-8} y={34} width={16} height={7} fill={POP.pink} />
      <rect x={-8} y={50} width={16} height={7} fill={POP.pink} />
      <rect x={-8} y={22} width={16} height={46} rx={4} fill="none" {...line} />
      <rect x={-3.5} y={68} width={7} height={46} fill={POP.cyan} {...line} />
      <path d="M0 92 L-30 132 L-8 150 L0 128 Z" fill={POP.pink} {...line} />
      <path d="M0 92 L30 132 L8 150 L0 128 Z" fill={POP.yellow} {...line} />
    </g>
  );
}

/** Une fléchette qui vole du coin bas-droit (en gros plan) jusqu'à sa cible, puis vibre en se plantant. */
function FlyingDart({ time, tx, ty, t0, t1, angle = 32 }: { time: MotionValue<number>; tx: number; ty: number; t0: number; t1: number; angle?: number }) {
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

/** Onde de choc à l'impact. */
function Shock({ time, x, y, t0, color = POP.white }: { time: MotionValue<number>; x: number; y: number; t0: number; color?: string }) {
  const r = useTransform(time, (t) => lerp(10, 170, easeOut(seg(t, t0, t0 + 0.45))));
  const opacity = useTransform(time, (t) => (t < t0 ? 0 : 1 - seg(t, t0, t0 + 0.45)));
  return <motion.circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={8} opacity={opacity} />;
}

/** Onomatopée de BD qui claque à un instant donné. */
function Boom({ time, t0, children, className, rotate = -8 }: { time: MotionValue<number>; t0: number; children: ReactNode; className: string; rotate?: number }) {
  const scale = useTransform(time, (t) => pop(seg(t, t0, t0 + 0.25)));
  const opacity = useTransform(time, (t): number => (t < t0 ? 0 : 1));
  return (
    <motion.div style={{ scale, opacity, rotate }} className={`pointer-events-none absolute ${className}`}>
      <span
        className="inline-block whitespace-nowrap border-[3px] border-noir bg-blanc px-2.5 py-0.5 text-[26px] font-black uppercase italic leading-tight text-noir"
        style={{ boxShadow: `5px 5px 0 ${POP.ink}` }}
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

/** Le fond de la célébration apparaît à travers une déchirure qui s'ouvre (bord de papier blanc). */
export function Tear({ time, className, style, children }: { time: MotionValue<number>; className: string; style?: React.CSSProperties; children: ReactNode }) {
  const w = (t: number) => lerp(0, 125, easeOut(seg(t, 0.12, 0.6)));
  const paper = useTransform(time, (t) => tearPolygon(w(t) + 2.2));
  const inner = useTransform(time, (t) => tearPolygon(w(t)));
  return (
    <>
      <motion.div className="absolute inset-0 bg-blanc" style={{ clipPath: paper }} />
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

/** La cible et ce qui lui arrive. `time` vient de useSceneTime(). */
export function SceneBoard({ kind, time, boom }: { kind: SceneKind; time: MotionValue<number>; boom?: string }) {
  // Avec déchirure, la cible attend que l'écran soit ouvert.
  const from = kind === "shatter" ? 0.15 : 0.42;
  const appear = useTransform(time, (t) => `translate(${C} ${C}) scale(${lerp(0.55, 1, pop(seg(t, from, from + 0.3)))}) translate(${-C} ${-C})`);
  const boardOpacity = useTransform(time, (t): number => (t < from ? 0 : 1));
  // Secousse de l'écran à l'impact.
  const impact = kind === "triple" ? 1.25 : kind === "bull" ? 0.85 : 0.62;
  const shake = useTransform(time, (t) => {
    const a = Math.max(0, t - impact);
    return t > impact ? 9 * Math.sin(a * 70) * Math.exp(-a * 9) : 0;
  });

  return (
    <motion.div style={{ x: shake }} className="relative mx-auto aspect-square w-[min(88vw,400px)]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <MG transform={appear} opacity={boardOpacity}>
          {kind === "shatter" ? <Shatter time={time} /> : <WholeBoard />}
        </MG>
        {kind === "bull" && (
          <>
            <Shock time={time} x={C} y={C} t0={0.85} />
            <Shock time={time} x={C} y={C} t0={0.98} color={POP.yellow} />
            <FlyingDart time={time} tx={C} ty={C} t0={0.45} t1={0.85} />
          </>
        )}
        {kind === "triple" &&
          [-5, 0, 5].map((a, k) => {
            const [x, y] = polar(70, a);
            const t1 = 0.75 + k * 0.25;
            return (
              <g key={a}>
                <Shock time={time} x={x} y={y} t0={t1} />
                <FlyingDart time={time} tx={x} ty={y} t0={t1 - 0.22} t1={t1} angle={28 + k * 5} />
              </g>
            );
          })}
        {kind === "shatter" && <ShatterDart time={time} />}
      </svg>
      {kind === "bull" && (
        <Boom time={time} t0={0.88} className="left-[2%] top-[6%]">
          {boom ?? "Bull !"}
        </Boom>
      )}
      {kind === "triple" &&
        ["Tchak", "Tchak", "Tchak !"].map((w, k) => (
          <Boom key={k} time={time} t0={0.77 + k * 0.25} className={["left-[0%] top-[4%]", "left-[30%] top-[-4%]", "right-[0%] top-[4%]"][k]} rotate={[-10, 4, 10][k]}>
            {w}
          </Boom>
        ))}
      {kind === "shatter" && (
        <Boom time={time} t0={0.62} className="left-[4%] top-[8%]" rotate={-12}>
          {boom ?? "Crac !"}
        </Boom>
      )}
    </motion.div>
  );
}

function WholeBoard() {
  return (
    <g>
      <circle cx={C + 8} cy={C + 8} r={140} fill={POP.ink} />
      <circle cx={C} cy={C} r={140} fill={POP.ink} stroke={POP.ink} strokeWidth={3} />
      {Array.from({ length: 20 }, (_, i) => (
        <Sector key={i} i={i} />
      ))}
      <Bull />
    </g>
  );
}

/* ---------- Bust : impact, fissures, éclats ---------- */

const HIT = polar(92, 126);
const CRACKS = [
  [HIT, polar(70, 150), polar(40, 170), polar(10, 200)],
  [HIT, polar(110, 100), polar(130, 80)],
  [HIT, polar(60, 110), polar(30, 60), polar(60, 20)],
  [HIT, polar(125, 150), polar(136, 175)],
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
        <Crack key={k} time={time} d={`M${pts.map(([x, y]) => `${x} ${y}`).join(" L")}`} delay={k * 0.04} />
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

function Rim({ time, shadow = false }: { time: MotionValue<number>; shadow?: boolean }) {
  const opacity = useTransform(time, (t) => 1 - seg(t, 0.95, 1.2));
  const o = shadow ? 8 : 0;
  return <motion.circle cx={C + o} cy={C + o} r={140} fill={POP.ink} style={{ opacity }} />;
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
  return (
    <MG transform={transform}>
      <Bull />
    </MG>
  );
}

function Crack({ time, d, delay }: { time: MotionValue<number>; d: string; delay: number }) {
  const offset = useTransform(time, (t) => 1 - easeOut(seg(t, 0.62 + delay, 0.85 + delay)));
  const opacity = useTransform(time, (t) => (t < 0.62 ? 0 : 1 - seg(t, 0.95, 1.1)));
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={POP.white}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      style={{ strokeDashoffset: offset }}
      opacity={opacity}
    />
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
