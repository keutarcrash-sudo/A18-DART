"use client";
/** Vue Tableau (téléphone posé à plat) : le classement en géant, « qui mène » en premier. Commune aux jeux à score. */
import { motion } from "motion/react";
import { useT } from "@/lib/i18n";
import type { ReactNode } from "react";
import { fitFont } from "@/lib/fit";
import { Head } from "@/components/pop/Heads";

export interface TableauRow {
  side: number;
  name: string;
  value: number;
  /** Avancement de 0 à 1 (la barre de 12 pastilles). */
  fill: number;
  sub: string;
}

interface Props {
  title: ReactNode;
  /** Qui lance maintenant. */
  who: string;
  current: number;
  /** Lignes déjà classées, la première mène. */
  rows: TableauRow[];
  onClose: () => void;
}

export function Tableau({ title, who, current, rows, onClose }: Props) {
  const t = useT();
  const n = rows.length;
  const rh = Math.min(112, Math.floor(480 / n));
  const small = rh < 70;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-creme px-4 pb-4 pt-[calc(14px+env(safe-area-inset-top))] text-encre">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">{title}</span>
        <button
          type="button"
          onClick={onClose}
          className="pop-shadow-sm pop-press relative h-11 shrink-0 rounded-full border-2 border-encre bg-carte px-4 font-display text-[13px] font-extrabold tracking-wide text-encre"
        >
          {t("SAISIR")}
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-2.5 whitespace-nowrap">
        <small className="text-[12px] font-bold uppercase tracking-[0.08em] text-attenue">{t("À toi")}</small>
        <span
          className="bg-[linear-gradient(transparent_62%,var(--color-ambre)_62%_92%,transparent_92%)] font-display font-black leading-none tracking-tight"
          style={{ fontSize: fitFont(who, 30, 150) }}
        >
          {who}
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-1 pr-1">
        {rows.map(({ side, name, value, fill, sub }, rank) => {
          const filled = Math.round(Math.min(1, Math.max(0, fill)) * 12);
          const first = rank === 0;
          const badge = Math.max(30, Math.round(rh * 0.42));
          return (
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              key={side}
              style={{ minHeight: rh, gap: 10 }}
              className={`flex shrink-0 items-center rounded-3xl border-2 border-encre px-3 ${
                first ? "bg-violet text-white shadow-[4px_4px_0_0_var(--color-encre)]" : "bg-carte text-encre shadow-[3px_3px_0_0_var(--color-bord)]"
              }`}
            >
              <span
                className={`grid shrink-0 place-items-center rounded-full border-2 border-encre font-display font-black leading-none text-encre ${first ? "bg-ambre" : "bg-muted"}`}
                style={{ width: badge, height: badge, fontSize: badge * 0.55 }}
              >
                {rank + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 overflow-hidden font-display font-extrabold" style={{ fontSize: small ? 16 : 19 }}>
                  <span className="truncate">{name}</span>
                  {side === current && (
                    <span className="shrink-0 rounded-full border-2 border-encre bg-ambre px-2 py-px text-[10px] font-extrabold tracking-[0.08em] text-encre">
                      {t("À TOI")}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex gap-[3px]" style={{ height: small ? 8 : 11 }}>
                  {Array.from({ length: 12 }, (_, k) => (
                    <i
                      key={k}
                      className={`flex-1 rounded-full border-[1.5px] border-encre ${k < filled ? (first ? "bg-ambre" : "bg-violet") : first ? "bg-carte" : "bg-muted"}`}
                    />
                  ))}
                </div>
                {!small && <div className={`mt-1 truncate text-[11px] font-bold ${first ? "text-white" : "text-attenue"}`}>{sub}</div>}
              </div>
              {first && n > 1 && <Head kind="frimeur" size={Math.min(64, Math.round(rh * 0.6))} className="-mr-1 shrink-0 rotate-6" />}
              <div className="shrink-0 text-right font-num font-black leading-none" style={{ fontSize: Math.min(48, rh * 0.42) }}>
                {value}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
