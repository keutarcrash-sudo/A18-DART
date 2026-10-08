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

export function FinDePartie({ data, onRevanche }: { data: PodiumData; onRevanche: () => void }) {
  const t = useT();
  const [sharing, setSharing] = useState(false);
  const [date] = useState(todayLabel);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-noir px-[18px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(22px+env(safe-area-inset-top))]">
      <div className="min-h-0 flex-1">
        <PodiumScene data={data} width={320} date={date} />
      </div>
      <div className="mt-4 grid shrink-0 grid-cols-2 gap-1.5" style={{ "--h": "56px" } as React.CSSProperties}>
        <button type="button" onClick={onRevanche} className="btn-18 h-14 bg-cyan text-base font-black uppercase italic text-noir active:bg-blanc">
          {t("Revanche")}
        </button>
        <button
          type="button"
          onClick={() => setSharing(true)}
          className="btn-18 h-14 bg-blanc text-base font-black uppercase italic text-noir active:bg-cyan"
        >
          {t("Partager")}
        </button>
      </div>
      <div className="mt-1 flex shrink-0 justify-between">
        <Link href="/nouvelle" onClick={() => clearPartie()} className="py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8a8a8] active:text-cyan">
          {t("Autre jeu")}
        </Link>
        <Link href="/" className="py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8a8a8] active:text-cyan">
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
        const opts = { width: STORY_W, height: STORY_H, pixelRatio: 3, backgroundColor: "#171717" };
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
      className="absolute inset-0 z-10 flex flex-col bg-noir px-[18px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]"
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex min-h-8 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
        <button type="button" onClick={onClose} className="-ml-1 flex items-center gap-2 px-1 py-2 text-blanc">
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
          className="absolute left-1/2 top-0 border border-filet"
          style={{ width: STORY_W * scale + 2, height: STORY_H * scale + 2, marginLeft: -(STORY_W * scale + 2) / 2 }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: STORY_W, height: STORY_H }}>
            <div ref={story} className="bg-noir px-6 pb-6 pt-7 text-blanc" style={{ width: STORY_W, height: STORY_H }}>
              <PodiumScene data={data} story width={300} date={date} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 shrink-0">
        <p className="mb-2 h-4 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-gris">
          {error ? t("L'image n'a pas pu être préparée.") : !file ? t("Préparation de l'image…") : saved ? t("Image enregistrée.") : ""}
        </p>
        <div className={`grid gap-1.5 ${canShare ? "grid-cols-[1.4fr_1fr]" : "grid-cols-1"}`} style={{ "--h": "56px" } as React.CSSProperties}>
          {canShare && (
            <button type="button" onClick={share} className="btn-18 h-14 bg-cyan text-base font-black uppercase italic text-noir active:bg-blanc">
              {t("Partager")}
            </button>
          )}
          <button
            type="button"
            disabled={!file}
            onClick={save}
            className="btn-18 h-14 bg-blanc text-base font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
          >
            {t("Enregistrer")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
