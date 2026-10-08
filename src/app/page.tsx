import { JouerButton } from "@/components/JouerButton";
import { InstallHint } from "@/components/InstallHint";
import { LangSwitch } from "@/components/LangSwitch";
import { Records } from "@/components/Records";
import { Tr } from "@/components/Tr";

/** Accueil : un seul geste possible, JOUER. Les records d'Arena18 en faisant défiler. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[460px] flex-col px-3.5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe */}
        <img src="/logo-a18.png" alt="Arena18" className="h-[30px] w-auto" />
        <LangSwitch />
      </div>
      <div className="mt-[34px] text-[11px] font-bold uppercase tracking-[0.24em] text-gris">
        <Tr>Arena18 · Fléchettes</Tr>
      </div>

      <JouerButton />

      <p className="mt-10 max-w-[30ch] text-sm leading-relaxed text-[#bdbdbd]">
        <Tr>{"À l'Arena18, le 180 joue à domicile."}</Tr>
      </p>

      <Records />
      <InstallHint />
    </main>
  );
}
