"use client";
/** Briques communes aux écrans à pavé (301 / 501, Plus gros score) : fléchettes sur la cible et rangée des 3 fléchettes. */
import { motion } from "motion/react";
import { type Dart, dartLabel } from "@/engine/types";
import { useT } from "@/lib/i18n";

/** Bouton arrondi de la barre du haut (Tableau, Menu). La zone qu'on peut toucher dépasse en hauteur : au moins 48 px. */
export const POP_PILL =
  "relative h-10 [@media(max-height:700px)]:h-9 rounded-full border-2 border-encre bg-carte px-3.5 font-display text-[13px] font-extrabold tracking-wide text-encre pop-shadow-sm pop-press after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']";

/*
 * Carte du joueur actif (301 / 501, Plus gros score) : nom + score géant à gauche, cible à droite.
 * Sur les grands écrans (820 px de haut et plus), la carte, la cible et le pavé grandissent pour occuper la hauteur ;
 * la largeur du score reste la limite (score à 3 chiffres + « −140 » à côté de la cible).
 * Classes écrites en entier (Tailwind ne voit pas les classes construites par morceaux).
 */
export const PLAYER_CARD =
  "mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_128px] items-center gap-x-2 rounded-3xl border-2 border-encre bg-carte px-3.5 pb-2.5 pt-3 shadow-[6px_6px_0_0_var(--color-rose)] [@media(max-height:700px)]:mt-1 [@media(max-height:700px)]:pb-1.5 [@media(max-height:700px)]:pt-2 [@media(min-height:820px)]:mt-4 [@media(min-height:820px)]:grid-cols-[minmax(0,1fr)_140px] [@media(min-height:820px)]:gap-x-1.5 [@media(min-height:820px)]:px-3 [@media(min-height:820px)]:pb-4 [@media(min-height:820px)]:pt-5";
/** Boîte de la cible (affichage seulement : la fléchette qui dépasse ne capte jamais une tape). */
export const BOARD_BOX = "pointer-events-none h-[128px] w-[128px] [@media(min-height:820px)]:h-[140px] [@media(min-height:820px)]:w-[140px]";
/** Le « −60 » / « +60 » qui poppe à côté du score. */
export const GAIN_SIZE = "text-[22px] [@media(min-height:820px)]:text-[20px]";

/**
 * Fléchettes de la volée pour la cible. Graine de chaque fléchette = sa place dans la liste des actions
 * sauvegardées (on remonte la série de fléchettes en fin de liste) : position stable, même après rechargement.
 */
export function boardDartsOf(actions: { type: string }[], volley: Dart[]) {
  const dartIdx: number[] = [];
  for (let i = actions.length - 1; i >= 0 && actions[i].type === "dart"; i--) dartIdx.unshift(i);
  const seeds = dartIdx.slice(-volley.length);
  return volley.map((dart, k) => ({ dart, seed: seeds[k] ?? k }));
}

/** Case vide de la rangée des 3 fléchettes : contour et numéro en attenue (contraste >= 3:1 sur la crème). */
export function EmptySlot({ n }: { n: number }) {
  return (
    <div className="grid h-11 place-items-center rounded-[14px] border-2 border-dashed border-attenue font-display text-[18px] font-extrabold text-attenue [@media(max-height:700px)]:h-10 [@media(min-height:820px)]:h-14 [@media(min-height:820px)]:text-[20px]">
      {n}
    </div>
  );
}

/** Les 3 fléchettes de la volée : Simple blanc, Double ambre, Triple rose ; cases vides en pointillés. */
export function DartRow({ volley, points }: { volley: Dart[]; points: number }) {
  const t = useT();
  return (
    <div className="grid h-11 [@media(max-height:700px)]:h-10 [@media(min-height:820px)]:h-14 grid-cols-[1fr_1fr_1fr_54px] items-center gap-2">
      {[0, 1, 2].map((k) => {
        const dt = volley[k];
        if (!dt) return <EmptySlot key={`${k}-x`} n={k + 1} />;
        const tone = dt.m === 3 ? "bg-rose" : dt.m === 2 && dt.n !== 0 ? "bg-ambre" : "bg-carte";
        return (
          <motion.div
            key={`${k}-${dartLabel(dt)}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className={`grid h-11 [@media(max-height:700px)]:h-10 [@media(min-height:820px)]:h-14 [@media(min-height:820px)]:text-[20px] place-items-center rounded-[14px] border-2 border-encre font-display text-[18px] font-extrabold shadow-[3px_3px_0_0_var(--color-encre)] ${tone}`}
          >
            {dt.n === 0 ? t("Raté") : dartLabel(dt)}
          </motion.div>
        );
      })}
      <div className="text-right font-num text-[26px] font-black [@media(min-height:820px)]:text-[30px]">{points}</div>
    </div>
  );
}

/** Les autres joueurs en bas de la carte : grille qui s'agrandit, nom tronqué si besoin, score toujours entier. */
export function OthersGrid({ items }: { items: { key: number; name: string; score: number; lead: boolean }[] }) {
  if (items.length === 0) return null;
  const cols = items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className={`col-span-2 mt-2 grid ${cols} gap-x-2 gap-y-0.5 border-t-2 border-dashed border-bord pt-1.5 text-[12px] leading-[17px] text-attenue [@media(max-height:700px)]:mt-1 [@media(max-height:700px)]:pt-1 [@media(min-height:820px)]:mt-3 [@media(min-height:820px)]:text-[14px] [@media(min-height:820px)]:leading-[20px]`}>
      {items.map((o) => (
        <span key={o.key} className="flex min-w-0 items-baseline gap-1">
          <span className="min-w-0 truncate">{o.name}</span>
          <b className={`shrink-0 font-num text-[14px] font-extrabold [@media(min-height:820px)]:text-[16px] ${o.lead ? "text-violet" : "text-encre"}`}>{o.score}</b>
        </span>
      ))}
    </div>
  );
}
