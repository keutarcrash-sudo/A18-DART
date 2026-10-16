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
import { POP_PILL } from "@/components/x01/Volley";
import { Head } from "@/components/pop/Heads";

const noopSubscribe = () => () => {};

export function MenuButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} className={POP_PILL}>
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

  const item = "pop-shadow pop-press h-14 w-full rounded-full border-2 border-encre font-display text-[18px] font-extrabold";
  const help = "-mt-1 mb-1 px-2 text-xs font-medium text-attenue";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          className="absolute inset-0 z-[60] flex flex-col overflow-y-auto bg-creme px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(14px+env(safe-area-inset-top))] text-encre"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex min-h-11 items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
            <span>
              <b className="text-encre">{t(label)}</b> · {t("Partie en pause")}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Fermer le menu")}
              className="pop-shadow-sm pop-press grid h-11 w-11 place-items-center rounded-full border-2 border-encre bg-carte text-xl font-black leading-none text-encre"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="font-display text-[40px] font-black leading-[0.95] tracking-tight">{t("Pause")}</h1>
            <Head kind="langue" size={56} className="rotate-6" />
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button type="button" onClick={onClose} className={`${item} bg-violet text-white`}>
              {t("Reprendre la partie")}
            </button>
            <button
              type="button"
              onClick={() => {
                onRestart();
                onClose();
              }}
              className={`${item} bg-carte text-encre`}
            >
              {t("Recommencer")}
            </button>
            <p className={help}>{t("Mêmes joueurs, même jeu, tout repart de zéro.")}</p>
            <button
              type="button"
              onClick={() => {
                // On ferme d'abord : Next garde l'écran en mémoire, il doit être propre au retour.
                onClose();
                clearPartie();
                router.push("/nouvelle");
              }}
              className={`${item} bg-carte text-encre`}
            >
              {t("Nouvelle partie")}
            </button>
            <p className={help}>{t("Autres joueurs ou autre jeu. La partie en cours s'arrête.")}</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/");
              }}
              className="mt-1 h-12 w-full font-display text-[16px] font-extrabold text-encre underline decoration-ambre decoration-4 underline-offset-8"
            >
              {t("Accueil")}
            </button>
            <p className={`${help} text-center`}>{t("La partie reste en mémoire : « Reprendre » la relance.")}</p>
          </div>

          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => {
              setMuted(!muted);
              setMutedChoice(!muted);
            }}
            className="pop-shadow-sm pop-press mt-auto flex min-h-12 items-center gap-2.5 self-start rounded-full border-2 border-encre bg-carte px-4 py-2 text-sm font-bold"
          >
            <i className={`relative h-5 w-9 rounded-full border-2 border-encre ${muted ? "bg-muted" : "bg-violet"}`}>
              <i className={`absolute top-px h-3 w-3 rounded-full border-2 border-encre bg-carte transition-all ${muted ? "left-px" : "left-[15px]"}`} />
            </i>
            {muted ? t("Sons coupés") : t("Sons activés")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
