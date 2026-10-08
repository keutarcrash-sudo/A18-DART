"use client";
/** Ouvre l'écran du bon jeu selon la partie enregistrée sur le téléphone. */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CricketGame } from "@/components/cricket/CricketGame";
import { X01Game } from "@/components/x01/X01Game";
import { type SavedPartie, loadPartie } from "@/lib/partie";

export function PartieRouter() {
  const router = useRouter();
  const [kind, setKind] = useState<SavedPartie["kind"] | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
    setKind(loadPartie()?.kind ?? null);
  }, []);

  useEffect(() => {
    if (kind === null) router.replace("/nouvelle");
  }, [kind, router]);

  if (kind === "cricket") return <CricketGame />;
  if (kind === "x01") return <X01Game />;
  return <div className="h-dvh bg-noir" />;
}
