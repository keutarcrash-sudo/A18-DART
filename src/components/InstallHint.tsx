"use client";
/**
 * Petit lien discret sur l'accueil : « Installer l'app ».
 * Android : ouvre la fenêtre d'installation du téléphone. iPhone : explique les deux gestes dans Safari.
 * Invisible si l'app est déjà installée ou si le navigateur ne sait pas l'installer.
 */
import { AnimatePresence, motion } from "motion/react";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { useInstall } from "@/lib/pwa";

export function InstallHint() {
  const t = useT();
  const { mode, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (mode === "none") return null;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => (mode === "android" ? install() : setHelp(!help))}
        aria-expanded={mode === "ios" ? help : undefined}
        className="flex min-h-11 items-center gap-2.5 text-sm font-bold text-encre"
      >
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-encre bg-menthe">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M12 4v12M6 11l6 6 6-6M5 20h14" />
          </svg>
        </span>
        {t("Installer l'app sur ton téléphone")}
      </button>
      <AnimatePresence initial={false}>
        {help && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden text-[13px] leading-relaxed text-attenue"
          >
            <li className="mt-1 flex gap-2.5">
              <span className="font-num font-extrabold text-violet">1</span>
              <span>
                {t("Dans Safari, touche")} <b className="text-encre">{t("Partager")}</b> {t("(le carré avec une flèche vers le haut).")}
              </span>
            </li>
            <li className="mt-1 flex gap-2.5">
              <span className="font-num font-extrabold text-violet">2</span>
              <span>
                {t("Choisis")} <b className="text-encre">{t("Sur l'écran d'accueil")}</b>. {t("L'app s'ouvre ensuite en plein écran, même sans réseau.")}
              </span>
            </li>
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
