"use client";
/** FR · EN en pastille en haut de l'accueil : la langue active en encre. Le choix est gardé sur le téléphone. */
import { type Lang, setLang, useLang } from "@/lib/i18n";

export function LangSwitch() {
  const lang = useLang();
  const item = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      aria-label={l === "fr" ? "Français" : "English"}
      className={`min-h-9 min-w-11 px-3 text-xs font-bold ${lang === l ? "bg-encre text-creme" : "bg-carte text-encre"}`}
    >
      {label}
    </button>
  );
  return (
    <span className="flex items-center overflow-hidden rounded-full border-2 border-encre">
      {item("fr", "FR")}
      {item("en", "EN")}
    </span>
  );
}
