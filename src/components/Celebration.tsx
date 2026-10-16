"use client";
/**
 * Célébrations sur 3 niveaux, toujours passables d'une tape, en style Pop (docs/08-refonte-pop.md, décision 7) :
 * - max : plein écran ~2,6 s (180, victoire, record, bust, éliminé) : aplat violet ou ambre (bust : crème, texte encre),
 *   trame de points, la scène (components/pop/Scene.tsx), confettis géométriques, et la tête du moment ;
 * - mid : bandeau-carte ~1 s (Touches, Sans faute, Tueur) avec le Mort de rire ;
 * - wink : bulle de la tête, ne bloque pas la saisie (26, passe devant, chambrage…).
 * Sans animation (« réduire les animations ») : tout s'affiche directement dans son état final, têtes immobiles.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useT } from "@/lib/i18n";
import { fitFont } from "@/lib/fit";
import { Head, type HeadKind } from "@/components/pop/Heads";
import { POP, PopIn, Shape, type ShapeName, halftone } from "@/components/pop/Pop";
import { SCENE_DURATION, type SceneKind, SceneBoard, Tear, useAppear, useSceneTime } from "@/components/pop/Scene";
import { MINI_DURATION, MiniScene, type MiniSpec } from "@/components/pop/MiniScenes";

/** Durée d'une célébration (ms) avant de passer toute seule : le temps que la scène se joue. */
export function celeDuration(spec: CeleSpec): number {
  if (spec.level === "max") return SCENE_DURATION * 1000 + 300;
  if (spec.level === "scene") return MINI_DURATION[spec.kind] * 1000 + 300;
  return 1100;
}

export type CeleTone = "violet" | "ambre" | "bust";

export type CeleSpec =
  | { level: "max"; tone: CeleTone; kicker: string; big: string; numeric: boolean; sub?: string; slot: string }
  | { level: "mid"; word: string; num: string }
  | ({ level: "scene" } & MiniSpec);

/** Fond, trame et couleurs du texte de chaque ton. Texte blanc seulement sur violet. */
const TONES: Record<CeleTone, { bg: string; dots: string; text: string; big: React.CSSProperties; sub: string }> = {
  violet: {
    bg: "bg-violet",
    dots: "rgb(255 255 255 / 0.16)",
    text: "text-white",
    big: { textShadow: `5px 5px 0 ${POP.ink}` },
    sub: "text-white",
  },
  ambre: {
    bg: "bg-ambre",
    dots: "rgb(30 41 59 / 0.13)",
    text: "text-encre",
    big: { textShadow: `5px 5px 0 ${POP.white}` },
    sub: "text-encre",
  },
  bust: {
    bg: "bg-creme",
    dots: "rgb(30 41 59 / 0.11)",
    text: "text-encre",
    // Surligneur ambre à bords nets sous le mot (pas de rouge pour un bust).
    big: {
      backgroundImage: `linear-gradient(transparent 56%, ${POP.ambre} 56%, ${POP.ambre} 90%, transparent 90%)`,
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
    },
    sub: "text-encre",
  },
};

interface Deco {
  shape: ShapeName;
  fill: string;
  size: number;
  rotate: number;
  pos: React.CSSProperties;
}

/**
 * Chaque moment a sa tête et ses confettis, placés sur les bords (derrière la cible et le texte)
 * pour laisser le chiffre lisible. Jamais un confetti de la couleur du fond, jamais deux voisins de la même couleur.
 */
const SETS: Record<string, { head: HeadKind; scene: SceneKind; boom?: string; deco: Deco[] }> = {
  "180": {
    scene: "triple",
    head: "explosee",
    deco: [
      { shape: "star", fill: POP.ambre, size: 58, rotate: -14, pos: { left: "-10px", top: "16%" } },
      { shape: "dot", fill: POP.menthe, size: 34, rotate: 0, pos: { right: "4%", top: "11%" } },
      { shape: "plus", fill: POP.rose, size: 40, rotate: 12, pos: { right: "-8px", top: "52%" } },
      { shape: "triangle", fill: POP.ambre, size: 36, rotate: -18, pos: { left: "8%", top: "58%" } },
    ],
  },
  exploit: {
    scene: "triple",
    head: "explosee",
    deco: [
      { shape: "plus", fill: POP.ambre, size: 44, rotate: -10, pos: { left: "-8px", top: "18%" } },
      { shape: "star", fill: POP.rose, size: 50, rotate: 16, pos: { right: "2%", top: "10%" } },
      { shape: "square", fill: POP.menthe, size: 34, rotate: 18, pos: { right: "-6px", top: "54%" } },
    ],
  },
  victoire: {
    scene: "bull",
    head: "frimeur",
    deco: [
      { shape: "star", fill: POP.ambre, size: 60, rotate: -12, pos: { left: "-10px", top: "18%" } },
      { shape: "dot", fill: POP.rose, size: 32, rotate: 0, pos: { right: "6%", top: "9%" } },
      { shape: "square", fill: POP.menthe, size: 34, rotate: 20, pos: { right: "-6px", top: "50%" } },
      { shape: "triangle", fill: POP.rose, size: 34, rotate: -14, pos: { left: "7%", top: "60%" } },
      { shape: "plus", fill: POP.ambre, size: 30, rotate: 8, pos: { left: "44%", top: "5%" } },
    ],
  },
  record: {
    scene: "bull",
    boom: "Record !",
    head: "coeurs",
    deco: [
      { shape: "heart", fill: POP.rose, size: 54, rotate: -12, pos: { left: "-8px", top: "18%" } },
      { shape: "star", fill: POP.white, size: 48, rotate: 14, pos: { right: "3%", top: "9%" } },
      { shape: "dot", fill: POP.violet, size: 30, rotate: 0, pos: { right: "-4px", top: "54%" } },
      { shape: "plus", fill: POP.menthe, size: 32, rotate: 10, pos: { left: "8%", top: "60%" } },
    ],
  },
  bust: {
    scene: "shatter",
    boom: "Bust !",
    head: "fondue",
    deco: [
      { shape: "triangle", fill: POP.ambre, size: 40, rotate: -18, pos: { left: "-6px", top: "20%" } },
      { shape: "square", fill: POP.violet, size: 30, rotate: 14, pos: { right: "4%", top: "10%" } },
      { shape: "dot", fill: POP.menthe, size: 30, rotate: 0, pos: { right: "-4px", top: "56%" } },
    ],
  },
  chambrage: {
    scene: "shatter",
    boom: "Out !",
    head: "fondue",
    deco: [
      { shape: "plus", fill: POP.rose, size: 40, rotate: -16, pos: { left: "-8px", top: "20%" } },
      { shape: "dot", fill: POP.ambre, size: 30, rotate: 0, pos: { right: "4%", top: "10%" } },
      { shape: "triangle", fill: POP.menthe, size: 34, rotate: 12, pos: { right: "-6px", top: "56%" } },
    ],
  },
};

export function Celebration({ spec, onDone }: { spec: CeleSpec | null; onDone: () => void }) {
  const t = useT();
  const set = spec?.level === "max" ? (SETS[spec.slot] ?? SETS.victoire) : null;
  return (
    <AnimatePresence>
      {spec?.level === "max" && set && <MaxCele key="max" spec={spec} set={set} onDone={onDone} label={t("Touche pour continuer")} />}
      {spec?.level === "scene" && (
        <motion.button
          type="button"
          key={`scene-${spec.kind}`}
          onClick={onDone}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-40 overflow-hidden text-left"
        >
          <MiniScene spec={spec} />
          <ContinueHint label={t("Touche pour continuer")} />
        </motion.button>
      )}
      {spec?.level === "mid" && <MidCele key="mid" spec={spec} onDone={onDone} />}
    </AnimatePresence>
  );
}

/** « Touche pour continuer », en petite pastille lisible sur n'importe quel fond. */
function ContinueHint({ label }: { label: string }) {
  return (
    <span className="absolute bottom-[calc(14px+env(safe-area-inset-bottom))] left-4 rounded-full border-2 border-encre bg-carte px-2.5 py-1 font-text text-[11px] font-bold text-encre">
      {label}
    </span>
  );
}

/** Niveau moyen : une carte-bandeau qui rebondit au milieu de l'écran, avec le Mort de rire. */
function MidCele({ spec, onDone }: { spec: Extract<CeleSpec, { level: "mid" }>; onDone: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onDone}
      className="absolute inset-0 z-40 flex items-center overflow-hidden px-4"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        initial={reduce ? false : { x: "-115%", rotate: -4 }}
        animate={{ x: 0, rotate: -2 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative w-full"
      >
        <div
          className="relative flex h-[118px] items-center justify-between gap-3 rounded-[24px] border-[3px] border-encre bg-carte pl-[92px] pr-6 text-encre"
          style={{ boxShadow: `6px 6px 0 ${POP.ink}`, ...halftone("rgb(30 41 59 / 0.07)", 12) }}
        >
          <b className="min-w-0 truncate font-display text-[30px] font-black uppercase leading-none tracking-tight">{spec.word}</b>
          <span className="shrink-0 rounded-[16px] border-[3px] border-encre bg-violet px-3 pb-1 pt-0.5 font-num text-[58px] font-black leading-none text-white">
            {spec.num}
          </span>
        </div>
        <PopIn delay={0.16} rotate={-10} className="pointer-events-none absolute -left-1 top-1/2 -mt-[52px]">
          <Head kind="mdr" size={96} />
        </PopIn>
      </motion.div>
      <PopIn delay={0.22} rotate={-14} className="pointer-events-none absolute left-[10%] top-[calc(50%-122px)]">
        <Shape name="triangle" fill={POP.rose} size={44} />
      </PopIn>
      <PopIn delay={0.28} rotate={12} className="pointer-events-none absolute right-[12%] top-[calc(50%-112px)]">
        <Shape name="dot" fill={POP.menthe} size={34} />
      </PopIn>
      <PopIn delay={0.34} rotate={18} className="pointer-events-none absolute right-[18%] top-[calc(50%+80px)]">
        <Shape name="star" fill={POP.ambre} size={50} />
      </PopIn>
    </motion.button>
  );
}

/** La bulle de la tête : elle chambre sans bloquer la saisie (une tape ailleurs continue la partie). */
export function Wink({ text, head = "langue" }: { text: string | null; head?: HeadKind }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className="pointer-events-none absolute inset-x-3.5 bottom-[352px] z-30 flex items-end gap-1.5"
        >
          <PopIn rotate={-8} className="shrink-0">
            <Head kind={head} size={64} />
          </PopIn>
          <p
            className="relative mb-3 rounded-[18px] rounded-bl-[4px] border-2 border-encre bg-carte px-4 py-2.5 font-text text-[15px] font-bold leading-snug text-encre"
            style={{ boxShadow: `4px 4px 0 ${POP.ink}` }}
          >
            {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Grande célébration : la scène (déchirure, fléchette, cible), puis le texte qui claque au moment de l'impact. */
function MaxCele({
  spec,
  set,
  onDone,
  label,
}: {
  spec: Extract<CeleSpec, { level: "max" }>;
  set: (typeof SETS)[string];
  onDone: () => void;
  label: string;
}) {
  const time = useSceneTime();
  const textAt = set.scene === "triple" ? 1.45 : set.scene === "bull" ? 0.95 : 0.75;
  const kick = useAppear(time, textAt);
  const big = useAppear(time, textAt + 0.08);
  const sub = useAppear(time, textAt + 0.2);
  const head = useAppear(time, textAt + 0.25);
  const tone = TONES[spec.tone];
  const dots = halftone(tone.dots);

  return (
    <motion.button
      type="button"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`absolute inset-0 z-40 overflow-hidden text-left ${tone.text}`}
    >
      {set.scene === "shatter" ? (
        <motion.div className={`absolute inset-0 ${tone.bg}`} style={dots} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
      ) : (
        <Tear time={time} className={tone.bg} style={dots}>
          {null}
        </Tear>
      )}

      {/* Confettis géométriques, sur les bords, derrière la cible et le texte. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {set.deco.map((d, i) => (
          <PopIn key={i} delay={textAt + 0.05 * i} rotate={d.rotate} className="absolute" style={d.pos}>
            <Shape name={d.shape} fill={d.fill} size={d.size} />
          </PopIn>
        ))}
      </div>

      <div className="relative flex h-full flex-col px-5 pb-[calc(66px+env(safe-area-inset-bottom))] pt-[calc(48px+env(safe-area-inset-top))]">
        <SceneBoard kind={set.scene} time={time} boom={set.boom} />

        <div className="mt-auto pr-[84px]">
          <motion.span
            style={kick}
            className="relative z-10 inline-block origin-left rounded-full border-2 border-encre bg-carte px-3 py-1 font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-encre shadow-[2px_2px_0_0_var(--color-encre)]"
          >
            {spec.kicker}
          </motion.span>
          <motion.span
            style={{ ...big, ...(spec.numeric ? {} : { fontSize: fitFont(spec.big, 60, 150) }) }}
            className={
              spec.numeric
                ? "relative z-10 mt-2 block origin-left font-num text-[120px] font-black leading-[0.9]"
                : "relative z-10 mt-2.5 block origin-left whitespace-nowrap font-display font-black uppercase leading-[0.95] tracking-tight"
            }
          >
            <span style={tone.big}>{spec.big}</span>
          </motion.span>
          {spec.sub && (
            <motion.span style={sub} className={`relative z-10 mt-2 block origin-left font-display text-xl font-extrabold ${tone.sub}`}>
              {spec.sub}
            </motion.span>
          )}
        </div>
      </div>

      <motion.div style={head} className="pointer-events-none absolute bottom-[calc(56px+env(safe-area-inset-bottom))] right-3 origin-bottom-right">
        <Head kind={set.head} size={104} />
      </motion.div>
      <ContinueHint label={label} />
    </motion.button>
  );
}
