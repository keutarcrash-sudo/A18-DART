"use client";
/**
 * Ouvre l'écran du bon jeu selon la partie enregistrée sur le téléphone.
 * Next garde les écrans visités en mémoire : on relit donc la partie à chaque retour sur cet écran,
 * et on démonte le jeu quand on le quitte, pour ne jamais rouvrir une ancienne partie.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CricketGame } from "@/components/cricket/CricketGame";
import { ClockGame } from "@/components/clock/ClockGame";
import { KillerGame } from "@/components/killer/KillerGame";
import { X01Game } from "@/components/x01/X01Game";
import { type SavedPartie, loadPartie } from "@/lib/partie";

export function PartieRouter() {
  const router = useRouter();
  const [kind, setKind] = useState<SavedPartie["kind"] | null | undefined>(undefined);

  useEffect(() => {
    const k = loadPartie()?.kind ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage du téléphone à chaque visite
    setKind(k);
    if (k === null) router.replace("/nouvelle");
    return () => setKind(undefined);
  }, [router]);

  if (kind === "cricket") return <CricketGame />;
  if (kind === "killer") return <KillerGame />;
  if (kind === "clock") return <ClockGame />;
  if (kind === "x01") return <X01Game />;
  return <div className="h-dvh bg-noir" />;
}
