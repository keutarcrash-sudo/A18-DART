/** Prénoms déjà joués sur ce téléphone (« Récents sur ce téléphone »). */
import { readJSON, writeJSON } from "./storage";

const KEY = "a18:recents";
const MAX = 8;

export function loadRecents(): string[] {
  return readJSON<string[]>(KEY) ?? [];
}

export function rememberNames(names: string[]): void {
  const merged = [...names, ...loadRecents().filter((n) => !names.includes(n))].slice(0, MAX);
  writeJSON(KEY, merged);
}

/** « tHOMAS » → « Thomas » ; tronque à 14 caractères. */
export function cleanName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ").slice(0, 14);
  return t ? t.charAt(0).toLocaleUpperCase("fr") + t.slice(1).toLocaleLowerCase("fr") : "";
}

/** Évite les doublons : « Thomas », « Thomas 2 »… */
export function uniqueName(name: string, taken: string[]): string {
  let out = name;
  for (let k = 2; taken.includes(out); k++) out = `${name} ${k}`;
  return out;
}
