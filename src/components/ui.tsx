"use client";
/** Briques d'interface communes, dans la direction « 18° ». */
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[460px] flex-col px-3.5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      {children}
    </main>
  );
}

export function TopBar({ onBack, left, right }: { onBack?: () => void; left: ReactNode; right?: ReactNode }) {
  const t = useT();
  return (
    <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
      <span className="flex items-center">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t("Retour")} className="-ml-1 mr-1 px-1.5 py-1 text-xl font-black leading-none text-blanc">
            ←
          </button>
        )}
        {left}
      </span>
      <span>{right}</span>
    </div>
  );
}

export function Title({ children, numeric }: { children: ReactNode; numeric?: boolean }) {
  return numeric ? (
    <h1 className="mt-4 font-num text-[64px] leading-none">{children}</h1>
  ) : (
    <h1 className="mt-4 text-[40px] font-black uppercase italic leading-[0.95] tracking-tight text-balance">{children}</h1>
  );
}

export function Cta({
  children,
  onClick,
  disabled,
  tone = "blanc",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "blanc" | "cyan";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ "--h": "58px" } as React.CSSProperties}
      className={`btn-18 h-[58px] w-full shrink-0 text-[17px] font-black uppercase italic text-noir disabled:bg-case disabled:text-gris-2 ${
        tone === "cyan" ? "bg-cyan active:bg-blanc" : "bg-blanc active:bg-cyan"
      }`}
    >
      {children}
    </button>
  );
}

/** Choix exclusif (réglages) : boutons inclinés, le choix actif en cyan. */
export function Seg<T extends string | number | boolean>({
  label,
  value,
  options,
  help,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  help: string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-5">
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gris">{label}</h2>
      <div className="flex gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={o.value === value}
            style={{ "--h": "50px" } as React.CSSProperties}
            className={`btn-18 h-[50px] flex-1 text-[13px] font-black uppercase italic ${
              o.value === value ? "bg-cyan text-noir" : "bg-case text-[#cfcfcf]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-9 text-xs leading-normal text-[#a8a8a8]">{help}</p>
    </div>
  );
}
