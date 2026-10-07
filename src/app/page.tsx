import { JouerButton } from "@/components/JouerButton";

/** Accueil : un seul geste possible, JOUER. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[460px] flex-col px-3.5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe */}
        <img src="/logo-a18.png" alt="Arena18" className="h-[30px] w-auto" />
        <span className="text-[10px] font-bold tracking-[0.16em] text-gris">
          <b className="text-blanc">FR</b> · EN
        </span>
      </div>
      <div className="mt-[34px] text-[11px] font-bold uppercase tracking-[0.24em] text-gris">Arena18 · Fléchettes</div>

      <JouerButton />

      <p className="mt-10 max-w-[30ch] text-sm leading-relaxed text-[#bdbdbd]">
        Scanne, entre vos prénoms, choisis le jeu. L&apos;app compte les points, toi tu vises.
      </p>
    </main>
  );
}
