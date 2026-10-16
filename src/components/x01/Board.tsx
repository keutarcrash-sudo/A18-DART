"use client";
/**
 * Cible affichée (jamais cliquable) : les fléchettes de la volée s'y plantent,
 * et les cases « pour finir » s'allument en ambre. Dessin repris de la maquette Pop.
 * Repère : origine au centre, rayon 100 (voir src/lib/board.ts).
 */
import type { Dart } from "@/engine/types";
import { dartLabel } from "@/engine/types";
import { RINGS, SECTOR_ORDER, dartSpot, zonePath } from "@/lib/board";
import { useT } from "@/lib/i18n";

const INK = "#1E293B";
const CREAM = "#FFFDF5";
const PINK = "#F472B6";
const MINT = "#34D399";
const VIOLET = "#8B5CF6";
const AMBER = "#FBBF24";

const f = (v: number) => Math.round(v * 100) / 100;
const pt = (a: number, r: number) => `${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`;

function wedge(a0: number, a1: number, r0: number, r1: number): string {
  return `M${pt(a0, r1)}A${r1} ${r1} 0 0 1 ${pt(a1, r1)}L${pt(a1, r0)}A${r0} ${r0} 0 0 0 ${pt(a0, r0)}Z`;
}

/** Les 20 secteurs de la cible, calculés une seule fois. */
const SECTORS = SECTOR_ORDER.map((n, i) => {
  const c = (i * 18 - 90) * (Math.PI / 180);
  const a0 = c - Math.PI / 20;
  const a1 = c + Math.PI / 20;
  const even = i % 2 === 0;
  return {
    n,
    single: wedge(a0, a1, RINGS.outer, RINGS.doubleOut),
    double: wedge(a0, a1, RINGS.doubleIn, RINGS.doubleOut),
    triple: wedge(a0, a1, RINGS.tripleIn, RINGS.tripleOut),
    singleFill: even ? INK : CREAM,
    ringFill: even ? PINK : MINT,
  };
});

function BoardBase() {
  return (
    <>
      <circle cx={5} cy={5} r={106} fill={INK} />
      <circle r={106} fill={INK} />
      {SECTORS.map((s) => (
        <g key={s.n}>
          <path d={s.single} fill={s.singleFill} />
          <path d={s.double} fill={s.ringFill} />
          <path d={s.triple} fill={s.ringFill} />
        </g>
      ))}
      <circle r={RINGS.outer} fill={MINT} stroke={INK} strokeWidth={2} />
      <circle r={RINGS.bull} fill={PINK} stroke={INK} strokeWidth={2} />
      <circle r={RINGS.doubleOut} fill="none" stroke={INK} strokeWidth={3} />
    </>
  );
}

function DartShape({ x, y, fresh }: { x: number; y: number; fresh: boolean }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(1.35)`}>
      <g className={fresh ? "board-stick" : undefined}>
        <line x1={0} y1={0} x2={20} y2={-26} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path
          d="M17 -22 l14 -6 l-4 -4 l-6 -14 z"
          fill={VIOLET}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle r={4.5} fill={AMBER} stroke={INK} strokeWidth={2.5} />
      </g>
    </g>
  );
}

export function Board({
  darts,
  zones,
  size,
}: {
  darts: { dart: Dart; seed: number }[];
  zones: Dart[];
  size: number;
}) {
  const t = useT();
  const label = darts.length
    ? t("Cible : {list}", { list: darts.map((d) => dartLabel(d.dart)).join(", ") })
    : t("Cible");
  const spots = darts.map((d) => dartSpot(d.dart, d.seed));
  const last = darts.length - 1;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox="-108 -108 220 220"
      className="shrink-0 overflow-visible"
    >
      <BoardBase />
      {zones.length > 0 && <circle r={106} fill={CREAM} opacity={0.55} />}
      {zones.map((z) => (
        <path
          key={`${z.n}-${z.m}`}
          className="board-zone"
          d={zonePath(z)}
          fill={AMBER}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
      {spots.map((p, i) => p && <DartShape key={i} x={p.x} y={p.y} fresh={i === last} />)}
    </svg>
  );
}
