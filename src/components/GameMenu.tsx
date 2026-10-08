"use client";
/**
 * Menu de la partie (bouton MENU en haut de l'écran de jeu).
 * Le menu lui-même sert de confirmation : deux tapes pour quitter, jamais de « Êtes-vous sûr ? ».
 */
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { clearPartie } from "@/lib/partie";
import { isMuted, setMuted } from "@/lib/sound";
import { useT } from "@/lib/i18n";

const noopSubscribe = () => () => {};

export function MenuButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[30px] border-[1.5px] border-[#3a3a3a] px-2.5 text-[10px] font-bold tracking-[0.14em] text-[#cfcfcf] active:bg-case"
    >
      {t("MENU")}
    </button>
  );
}

export function GameMenu({ open, onClose, onRestart, label }: { open: boolean; onClose: () => void; onRestart: () => void; label: string }) {
  const router = useRouter();
  const t = useT();
  const [mutedChoice, setMutedChoice] = useState<boolean | null>(null);
  const mutedStored = useSyncExternalStore(noopSubscribe, isMuted, () => false);
  const muted = mutedChoice ?? mutedStored;

  const item = "btn-18 h-[58px] w-full text-[17px] font-black uppercase italic";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          className="absolute inset-0 z-[60] flex flex-col bg-noir px-3.5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
            <span>
              <b className="text-blanc">{t(label)}</b> · {t("Partie en pause")}
            </span>
            <button type="button" onClick={onClose} aria-label={t("Fermer le menu")} className="px-2 py-1 text-xl font-black leading-none text-blanc">
              ×
            </button>
          </div>
          <h1 className="mt-4 text-[40px] font-black uppercase italic leading-[0.95] tracking-tight">{t("Pause")}</h1>

          <div className="mt-8 flex flex-col gap-2.5" style={{ "--h": "58px" } as React.CSSProperties}>
            <button type="button" onClick={onClose} className={`${item} bg-cyan text-noir active:bg-blanc`}>
              {t("Reprendre la partie")}
            </button>
            <button
              type="button"
              onClick={() => {
                onRestart();
                onClose();
              }}
              className={`${item} bg-blanc text-noir active:bg-cyan`}
            >
              {t("Recommencer")}
            </button>
            <p className="-mt-1 mb-1 text-xs text-[#a8a8a8]">{t("Mêmes joueurs, même jeu, tout repart de zéro.")}</p>
            <button
              type="button"
              onClick={() => {
                // On ferme d'abord : Next garde l'écran en mémoire, il doit être propre au retour.
                onClose();
                clearPartie();
                router.push("/nouvelle");
              }}
              className={`${item} bg-case text-blanc active:bg-blanc active:text-noir`}
            >
              {t("Nouvelle partie")}
            </button>
            <p className="-mt-1 mb-1 text-xs text-[#a8a8a8]">{t("Autres joueurs ou autre jeu. La partie en cours s'arrête.")}</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/");
              }}
              className="mt-1 h-12 w-full text-[15px] font-black uppercase italic tracking-wide text-[#cfcfcf] underline decoration-filet decoration-2 underline-offset-8 active:text-cyan"
            >
              {t("Accueil")}
            </button>
            <p className="-mt-1 text-xs text-[#a8a8a8]">{t("La partie reste en mémoire : « Reprendre » la relance.")}</p>
          </div>

          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => {
              setMuted(!muted);
              setMutedChoice(!muted);
            }}
            className="mt-auto flex items-center gap-2.5 self-start border-[1.5px] border-filet px-3 py-2.5 text-xs font-bold"
          >
            <i className={`skew-18 relative h-4 w-[30px] ${muted ? "bg-[#333]" : "bg-cyan"}`}>
              <i className={`absolute top-0.5 h-3 w-3 transition-all ${muted ? "left-0.5 bg-gris" : "left-4 bg-noir"}`} />
            </i>
            {muted ? t("Sons coupés") : t("Sons activés")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
