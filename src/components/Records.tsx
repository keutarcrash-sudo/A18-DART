"use client";
/** Records d'Arena18 sous le bouton JOUER (référence : docs/parcours.html, écran « Accueil »). */
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { type Period, recordsEnabled, useRecordsSummary } from "@/lib/records";

export function Records() {
  const t = useT();
  const [period, setPeriod] = useState<Period>("day");
  const state = useRecordsSummary(period);
  if (!recordsEnabled) return null;

  const data = state.status === "ok" ? state.data : null;
  const wait = state.status === "loading" ? "…" : "—";
  const day = period === "day";
  const ones = data?.one_eighties ?? [];

  return (
    <section className="mt-6 rounded-[20px] border-2 border-encre bg-carte px-3.5 pb-2.5 pt-3.5" style={{ boxShadow: "6px 6px 0 var(--color-bord)" }} aria-label={t("Records d'Arena18")}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-extrabold leading-none">{t("Records")}</h2>
        <div className="flex gap-1">
          {(["day", "week"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={p === period}
              onClick={() => setPeriod(p)}
              className={`relative min-h-9 rounded-full border-2 border-encre px-3 text-[11px] font-bold after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-[''] ${p === period ? "bg-menthe" : "bg-carte"}`}
            >
              {p === "day" ? t("Aujourd'hui") : t("Semaine")}
            </button>
          ))}
        </div>
      </div>

      {state.status === "error" ? (
        <p className="border-t-2 border-dashed border-bord py-3 text-[13px] text-attenue">{t("Records indisponibles pour l'instant. Ils reviennent avec le réseau.")}</p>
      ) : (
        <div>
          <Row
            icon="etoile"
            label={day ? t("Meilleure volée du jour") : t("Meilleure volée de la semaine")}
            who={data?.best_volley?.name ?? (data ? t("Personne encore. Toi ?") : wait)}
            value={data?.best_volley ? String(data.best_volley.value) : wait}
          />
          <Row
            icon="cible"
            label={t("Plus gros checkout")}
            who={data?.best_checkout?.name ?? (data ? t("Personne encore. Toi ?") : wait)}
            value={data?.best_checkout ? String(data.best_checkout.value) : wait}
          />
          <Row
            icon="eclair"
            label={day ? t("180 du jour") : t("180 de la semaine")}
            who={ones.length ? ones.slice(0, 3).join(" · ") + (ones.length > 3 ? ` +${ones.length - 3}` : "") : data ? t("Personne encore. Toi ?") : wait}
            value={ones.length ? (ones.length > 1 ? `×${ones.length}` : "180") : "—"}
          />
          <Row
            icon="fleche"
            label={day ? t("Parties aujourd'hui") : t("Parties cette semaine")}
            who={t("À l'Arena18")}
            value={data ? String(data.games) : wait}
          />
        </div>
      )}
    </section>
  );
}

const ICONES = {
  etoile: { bg: "bg-ambre", d: <path d="M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z" fill="#1E293B" /> },
  cible: {
    bg: "bg-rose",
    d: (
      <g fill="none" stroke="#1E293B" strokeWidth="3">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" fill="#1E293B" />
      </g>
    ),
  },
  eclair: { bg: "bg-violet", d: <path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="#fff" /> },
  fleche: { bg: "bg-menthe", d: <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> },
} as const;

function Row({ icon, label, who, value }: { icon: keyof typeof ICONES; label: string; who: string; value: string }) {
  const ic = ICONES[icon];
  return (
    <div className="flex items-center gap-2.5 border-t-2 border-dashed border-bord py-2 first:border-t-0">
      <span className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border-2 border-encre ${ic.bg}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          {ic.d}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm">{who}</b>
        <span className="block text-xs text-attenue">{label}</span>
      </div>
      <span className="shrink-0 font-num text-2xl font-extrabold leading-none">{value}</span>
    </div>
  );
}
