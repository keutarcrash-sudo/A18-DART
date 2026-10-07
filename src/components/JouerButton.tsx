"use client";
/** Le gros bloc JOUER, incliné à 18°. Devient « Reprendre » si une partie est en cours sur ce téléphone. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadPartie } from "@/lib/partie";
import { replayX01 } from "@/engine/x01";

export function JouerButton() {
  const [resume, setResume] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPartie();
    if (!p) return;
    const st = replayX01(p.setup, p.actions);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
    if (st.status !== "match" && p.actions.length > 0) setResume(`${p.setup.options.start}`);
  }, []);

  return (
    <Link href={resume ? "/partie" : "/nouvelle"} className="group relative -ml-[30px] -mr-3.5 mt-3.5 block h-[190px]" aria-label={resume ? "Reprendre la partie" : "Jouer"}>
      <span className="skew-18 absolute inset-y-0 left-0 right-[26px] bg-cyan transition-transform duration-150 group-active:scale-[0.97]" />
      <span
        className={`absolute left-10 font-black italic leading-[0.82] tracking-tighter text-noir ${resume ? "top-[26px] text-[50px]" : "top-[38px] text-[78px]"}`}
      >
        {resume ? (
          <>
            REPRE
            <br />
            NDRE
          </>
        ) : (
          "JOUER"
        )}
      </span>
      <span className="absolute bottom-[22px] left-[46px] text-[13px] font-black uppercase italic tracking-[0.14em] text-noir">
        {resume ? `Partie en cours · ${resume}` : "À vous de jouer"}
      </span>
      <span className="absolute bottom-4 right-[52px] text-[40px] font-black text-noir">→</span>
    </Link>
  );
}
