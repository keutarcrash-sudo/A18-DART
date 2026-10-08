"use client";
/** FR · EN en haut de l'accueil : la langue active en blanc. Le choix est gardé sur le téléphone. */
import { type Lang, setLang, useLang } from "@/lib/i18n";

export function LangSwitch() {
  const lang = useLang();
  const item = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      aria-label={l === "fr" ? "Français" : "English"}
      className={`px-1.5 py-2 ${lang === l ? "text-blanc" : "text-gris"}`}
    >
      {label}
    </button>
  );
  return (
    <span className="-mr-1.5 flex items-center text-[10px] font-bold tracking-[0.16em] text-gris">
      {item("fr", "FR")}·{item("en", "EN")}
    </span>
  );
}
