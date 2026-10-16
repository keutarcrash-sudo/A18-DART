"use client";
/** La grosse carte violette de l'accueil. Devient « Reprendre » si une partie est en cours sur ce téléphone. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Head } from "@/components/pop/Heads";
import { loadPartie, partieEnCours, partieLabel } from "@/lib/partie";
import { enterFullscreen } from "@/lib/pwa";
import { useT } from "@/lib/i18n";

export function JouerButton() {
  const t = useT();
  const [resume, setResume] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPartie();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
    if (p && partieEnCours(p)) setResume(partieLabel(p));
  }, []);

  return (
    <>
      <div className="relative mt-9">
        {/* Le Tire-langue dépasse de la carte (décoratif) */}
        <Head kind="langue" size={74} className="absolute -top-[30px] right-[-8px] z-10 rotate-12" />
        <Link
          href={resume ? "/partie" : "/nouvelle"}
          onClick={resume ? enterFullscreen : undefined}
          aria-label={resume ? t("Reprendre la partie") : t("Jouer")}
          className="pop-shadow pop-press block overflow-hidden rounded-[28px_28px_28px_6px] border-2 border-encre bg-violet px-5 pb-5 pt-[22px] text-white"
          style={{ "--pop": "6px" } as React.CSSProperties}
        >
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em]">
            {resume ? `${t("Partie en cours")} · ${t(resume)}` : t("À vous de jouer")}
          </span>
          <span className="mb-[18px] mt-2 block font-display text-[46px] font-black leading-[0.95] tracking-tight">
            {resume ? t("Reprendre") : t("Jouer")}
          </span>
          <span className="flex items-center justify-end">
            <span className="grid h-[54px] w-[54px] place-items-center rounded-full border-2 border-encre bg-ambre pop-shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </span>
        </Link>
      </div>
      {resume ? (
        <Link
          href="/nouvelle"
          className="pop-shadow pop-press mt-4 grid min-h-14 place-items-center rounded-full border-2 border-encre bg-carte font-display text-lg font-extrabold text-encre"
        >
          {t("Nouvelle partie")}
        </Link>
      ) : null}
    </>
  );
}

