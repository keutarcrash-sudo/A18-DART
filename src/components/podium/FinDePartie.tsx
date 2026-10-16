"use client";
/**
 * Fin de partie commune à tous les jeux : le podium, puis Revanche et Partager à égalité
 * (docs/00-cadrage.md). « Partager » prépare l'image story 9:16 et ouvre le partage du téléphone.
 */
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { clearPartie } from "@/lib/partie";
import { type PodiumData, PodiumScene, todayLabel } from "./PodiumScene";

/** L'image est dessinée à 360 × 640 puis exportée ×3 : 1080 × 1920, le format story. */
const STORY_W = 360;
const STORY_H = 640;

const BTN = "pop-shadow pop-press h-14 rounded-full border-2 border-encre font-display text-lg font-extrabold";
const LINK = "flex min-h-[46px] items-center px-1 text-sm font-bold underline decoration-ambre decoration-4 underline-offset-[6px]";

/** Décor du fond : quelques formes en bordure, derrière le contenu. */
function Confettis({ story = false }: { story?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className={story ? "absolute -right-3 top-[300px]" : "confetti-bob absolute -right-3 top-[210px]"} width="46" height="46" viewBox="0 0 46 46">
        <circle cx="23" cy="23" r="19" fill="#34D399" stroke="#1E293B" strokeWidth="3" />
      </svg>
      <svg className={story ? "absolute -left-3 top-[360px]" : "confetti-spin absolute -left-3 top-[300px]"} width="40" height="40" viewBox="0 0 44 44">
        <path d="M16 3 H28 V16 H41 V28 H28 V41 H16 V28 H3 V16 H16 Z" fill="#F472B6" stroke="#1E293B" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function FinDePartie({ data, onRevanche }: { data: PodiumData; onRevanche: () => void }) {
  const t = useT();
  const [sharing, setSharing] = useState(false);
  const [date] = useState(todayLabel);

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-creme px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))] text-encre">
      <Confettis />
      <div className="relative min-h-0 flex-1">
        <PodiumScene data={data} width={340} date={date} />
      </div>
      <div className="relative mt-3 grid shrink-0 grid-cols-2 gap-2.5">
        <button type="button" onClick={onRevanche} className={`${BTN} bg-violet text-white`}>
          {t("Revanche")}
        </button>
        <button
          type="button"
          onClick={() => setSharing(true)}
          className={`${BTN} bg-carte text-encre`}
        >
          {t("Partager")}
        </button>
      </div>
      <div className="relative mt-1 flex shrink-0 justify-between px-1.5">
        <Link href="/nouvelle" onClick={() => clearPartie()} className={LINK}>
          {t("Autre jeu")}
        </Link>
        <Link href="/" className={LINK}>
          {t("Accueil")}
        </Link>
      </div>

      <AnimatePresence>{sharing && <Partage data={data} date={date} onClose={() => setSharing(false)} />}</AnimatePresence>
    </div>
  );
}

/* ---------- L'image story et le partage ---------- */

function Partage({ data, date, onClose }: { data: PodiumData; date: string; onClose: () => void }) {
  const t = useT();
  const story = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  // L'aperçu s'adapte à la place disponible.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / STORY_W, el.clientHeight / STORY_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // On prépare l'image dès l'ouverture : le partage du téléphone doit partir tout de suite à la tape.
  useEffect(() => {
    let alive = true;
    (async () => {
      const node = story.current;
      if (!node) return;
      try {
        await document.fonts.ready;
        const opts = { width: STORY_W, height: STORY_H, pixelRatio: 3, backgroundColor: "#FFFDF5" };
        // Safari dessine parfois mal le premier essai (polices, logo) : on en fait un pour rien.
        await toPng(node, opts).catch(() => null);
        const url = await toPng(node, opts);
        const blob = await (await fetch(url)).blob();
        if (alive) setFile(new File([blob], "arena18-darts.png", { type: "image/png" }));
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const text = t("{title} à l'Arena18. À vous de jouer !", { title: data.title.join(" ") });
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  const share = () => {
    if (!file) return;
    navigator.share({ files: [file], text }).catch(() => {});
  };

  const save = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaved(true);
  };

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col bg-creme px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] text-encre"
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex min-h-12 items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
        <button
          type="button"
          onClick={onClose}
          className="pop-shadow-sm pop-press flex h-12 items-center gap-2 rounded-full border-2 border-encre bg-carte px-4 font-display text-[14px] font-extrabold normal-case tracking-normal text-encre"
        >
          <span aria-hidden className="text-base leading-none">
            ←
          </span>
          {t("Partager")}
        </button>
        <span>{t("Format story 9:16")}</span>
      </div>

      {/* Aperçu : l'image est dessinée en vrai à 360 × 640, puis réduite pour tenir à l'écran. */}
      <div ref={box} className="relative mt-2 min-h-0 flex-1">
        <div
          className="absolute left-1/2 top-0 border-2 border-encre shadow-[4px_4px_0_0_var(--color-encre)]"
          style={{ width: STORY_W * scale + 4, height: STORY_H * scale + 4, marginLeft: -(STORY_W * scale + 4) / 2 }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: STORY_W, height: STORY_H }}>
            <div ref={story} className="relative overflow-hidden bg-creme px-6 pb-6 pt-7 text-encre" style={{ width: STORY_W, height: STORY_H }}>
              <Confettis story />
              <div className="relative h-full">
                <PodiumScene data={data} story width={300} date={date} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 shrink-0">
        <p className="mb-2 h-4 text-center text-[12px] font-bold text-attenue">
          {error ? t("L'image n'a pas pu être préparée.") : !file ? t("Préparation de l'image…") : saved ? t("Image enregistrée.") : ""}
        </p>
        <div className={`grid gap-2.5 ${canShare ? "grid-cols-[1.4fr_1fr]" : "grid-cols-1"}`}>
          {canShare && (
            <button type="button" onClick={share} className={`${BTN} bg-violet text-white`}>
              {t("Partager")}
            </button>
          )}
          <button
            type="button"
            disabled={!file}
            onClick={save}
            className={`${BTN} bg-carte text-encre disabled:border-bord disabled:bg-muted disabled:text-attenue disabled:shadow-none`}
          >
            {t("Enregistrer")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
