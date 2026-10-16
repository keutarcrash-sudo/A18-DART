import { JouerButton } from "@/components/JouerButton";
import { InstallHint } from "@/components/InstallHint";
import { LangSwitch } from "@/components/LangSwitch";
import { Records } from "@/components/Records";
import { Punch } from "@/components/Punch";

/** Accueil : un seul geste possible, JOUER ou REPRENDRE. Les records d'Arena18 en faisant défiler. */
export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      {/* Confettis en bordure : décor, derrière le contenu, jamais sous un texte */}
      <svg className="confetti-bob pointer-events-none absolute right-[-14px] top-[170px] z-0" style={{ "--t": "6s" } as React.CSSProperties} width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
        <circle cx="30" cy="30" r="26" fill="#F472B6" stroke="#1E293B" strokeWidth="3" />
      </svg>
      <svg className="confetti-spin pointer-events-none absolute left-[-10px] top-[470px] z-0" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <path d="M16 3 H28 V16 H41 V28 H28 V41 H16 V28 H3 V16 H16 Z" fill="#34D399" stroke="#1E293B" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-[460px] flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="pop-shadow-sm grid h-[34px] w-[34px] place-items-center rounded-[10px] border-2 border-encre bg-ambre">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#1E293B" strokeWidth="2.5" />
                <circle cx="10" cy="10" r="3" fill="#1E293B" />
              </svg>
            </span>
            A18 Darts
          </div>
          <LangSwitch />
        </div>

        <JouerButton />

        <p className="mt-7 max-w-[26ch] font-display text-xl font-bold leading-tight">
          <Punch>{"À l'Arena18, le 180 joue à domicile."}</Punch>
        </p>

        <Records />
        <InstallHint />
      </main>
    </div>
  );
}
