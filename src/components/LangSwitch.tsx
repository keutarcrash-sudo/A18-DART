"use client";
/** FR · EN en pastille en haut de l'accueil : la langue active en encre. Le choix est gardé sur le téléphone. Zone tactile ≥ 46 px. */
import { type Lang, setLang, useLang } from "@/lib/i18n";

export function LangSwitch() {
  const lang = useLang();
  const item = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      aria-label={l === "fr" ? "Français" : "English"}
      className={`relative min-h-[42px] min-w-[46px] px-3 text-xs font-bold first:rounded-l-full last:rounded-r-full after:absolute after:inset-x-0 after:-inset-y-[3px] after:content-[''] ${lang === l ? "bg-encre text-creme" : "bg-carte text-encre"}`}
    >
      {label}
    </button>
  );
  return (
    <span className="flex items-center rounded-full border-2 border-encre">
      {item("fr", "FR")}
      {item("en", "EN")}
    </span>
  );
}
