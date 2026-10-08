"use client";
/** Records d'Arena18 sous le bouton JOUER (référence : docs/parcours.html, écran « Accueil »). */
import { useState } from "react";
import { type Period, recordsEnabled, useRecordsSummary } from "@/lib/records";

export function Records() {
  const [period, setPeriod] = useState<Period>("day");
  const state = useRecordsSummary(period);
  if (!recordsEnabled) return null;

  const data = state.status === "ok" ? state.data : null;
  const wait = state.status === "loading" ? "…" : "—";
  const day = period === "day";
  const ones = data?.one_eighties ?? [];

  return (
    <section className="mt-12" aria-label="Records d'Arena18">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[26px] font-black uppercase italic leading-none tracking-tight">Records</h2>
        <div className="flex gap-1" style={{ "--h": "30px" } as React.CSSProperties}>
          {(["day", "week"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={p === period}
              onClick={() => setPeriod(p)}
              className={`btn-18 h-[30px] px-4 text-[10px] font-black uppercase italic tracking-wide ${p === period ? "bg-cyan text-noir" : "bg-case text-[#cfcfcf]"}`}
            >
              {p === "day" ? "Aujourd'hui" : "Semaine"}
            </button>
          ))}
        </div>
      </div>

      {state.status === "error" ? (
        <p className="mt-4 border-b border-filet pb-4 text-[13px] text-gris">Records indisponibles pour l&apos;instant. Ils reviennent avec le réseau.</p>
      ) : (
        <div className="mt-2">
          <Row
            label={`Meilleure volée ${day ? "du jour" : "de la semaine"}`}
            who={data?.best_volley?.name ?? (data ? "Personne encore. Toi ?" : wait)}
            value={data?.best_volley ? String(data.best_volley.value) : wait}
          />
          <Row
            label="Plus gros checkout"
            who={data?.best_checkout?.name ?? (data ? "Personne encore. Toi ?" : wait)}
            value={data?.best_checkout ? String(data.best_checkout.value) : wait}
          />
          <Row
            label={`180 ${day ? "du jour" : "de la semaine"}`}
            who={ones.length ? ones.slice(0, 3).join(" · ") + (ones.length > 3 ? ` +${ones.length - 3}` : "") : data ? "Personne encore. Toi ?" : wait}
            value={ones.length ? (ones.length > 1 ? `×${ones.length}` : "180") : "—"}
            white={!ones.length}
          />
          <Row
            label={`Parties ${day ? "aujourd'hui" : "cette semaine"}`}
            who="À l'Arena18"
            value={data ? String(data.games) : wait}
            white
          />
        </div>
      )}
    </section>
  );
}

function Row({ label, who, value, white = false }: { label: string; who: string; value: string; white?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-filet py-3.5">
      <div className="min-w-0">
        <small className="block text-[9px] font-bold uppercase tracking-[0.2em] text-gris">{label}</small>
        <span className="block truncate text-[15px] font-black uppercase italic">{who}</span>
      </div>
      <span className={`shrink-0 font-num text-[38px] leading-none ${white ? "text-blanc" : "text-chartreuse"}`}>{value}</span>
    </div>
  );
}
