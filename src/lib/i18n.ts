"use client";
/**
 * Français / anglais (docs/00-cadrage.md : « FR + EN, langue du téléphone »).
 *
 * - Le texte français EST la clé : on écrit `t("Qui joue ?")` et l'anglais vient du dictionnaire.
 *   Une phrase absente du dictionnaire reste en français (rien ne casse).
 * - Variables : `t("Plus que {n} vies", { n: 2 })`.
 * - Langue : celle choisie sur l'accueil (FR · EN), sinon celle du téléphone.
 */
import { useCallback, useSyncExternalStore } from "react";
import { EN } from "./i18n-en";

export type Lang = "fr" | "en";
const KEY = "a18:langue";

const listeners = new Set<() => void>();
let current: Lang | null = null;

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "fr" || saved === "en") return saved;
  } catch {}
  return typeof navigator !== "undefined" && !navigator.language.toLowerCase().startsWith("fr") ? "en" : "fr";
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "fr";
  if (!current) {
    current = detect();
    document.documentElement.lang = current;
  }
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {}
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export type Vars = Record<string, string | number>;
export type T = (fr: string, vars?: Vars) => string;

export function translate(lang: Lang, fr: string, vars?: Vars): string {
  let s = lang === "en" ? (EN[fr] ?? fr) : fr;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Langue en cours (le serveur dessine en français, le téléphone corrige aussitôt). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "fr");
}

/** La fonction de traduction, liée à la langue en cours. */
export function useT(): T {
  const lang = useLang();
  return useCallback((fr: string, vars?: Vars) => translate(lang, fr, vars), [lang]);
}
