"use client";
/**
 * Petit lien discret sur l'accueil : « Installer l'app ».
 * Android : ouvre la fenêtre d'installation du téléphone. iPhone : explique les deux gestes dans Safari.
 * Invisible si l'app est déjà installée ou si le navigateur ne sait pas l'installer.
 */
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInstall } from "@/lib/pwa";

export function InstallHint() {
  const { mode, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (mode === "none") return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => (mode === "android" ? install() : setHelp(!help))}
        aria-expanded={mode === "ios" ? help : undefined}
        className="flex items-center gap-2.5 py-2 text-[11px] font-black uppercase italic tracking-[0.12em] text-[#cfcfcf] active:text-cyan"
      >
        <i className="skew-18 block h-3.5 w-2 bg-cyan" />
        Installer l&apos;app sur ton téléphone
      </button>
      <AnimatePresence initial={false}>
        {help && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden text-[13px] leading-relaxed text-[#bdbdbd]"
          >
            <li className="mt-1 flex gap-2.5">
              <span className="font-num text-cyan">1</span>
              <span>
                Dans Safari, touche <b className="text-blanc">Partager</b> (le carré avec une flèche vers le haut).
              </span>
            </li>
            <li className="mt-1 flex gap-2.5">
              <span className="font-num text-cyan">2</span>
              <span>
                Choisis <b className="text-blanc">Sur l&apos;écran d&apos;accueil</b>. L&apos;app s&apos;ouvre ensuite en plein écran, même sans réseau.
              </span>
            </li>
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
