"use client";
/** Texte traduit dans une page fixe : <Tr>Arena18 · Fléchettes</Tr>. */
import { useT } from "@/lib/i18n";

export function Tr({ children }: { children: string }) {
  const t = useT();
  return <>{t(children)}</>;
}
