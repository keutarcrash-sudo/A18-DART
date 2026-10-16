"use client";
/** Briques d'interface communes, direction « Pop » (voir .claude/skills/a18-design/SKILL.md). */
import type { CSSProperties, ReactNode } from "react";
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
    <div className="flex min-h-12 items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
      <span className="flex items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("Retour")}
            className="pop-shadow-sm pop-press mr-2 grid h-12 w-12 place-items-center rounded-full border-2 border-encre bg-carte text-xl font-black leading-none text-encre"
          >
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
    <h1 className="mt-4 font-num text-[64px] font-black leading-none">{children}</h1>
  ) : (
    <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1] tracking-tight text-balance">{children}</h1>
  );
}

type PillTone = "blanc" | "violet" | "ambre" | "menthe" | "rose";
const PILL_TONE: Record<PillTone, string> = {
  blanc: "bg-carte text-encre",
  violet: "bg-violet text-white",
  ambre: "bg-ambre text-encre",
  menthe: "bg-menthe text-encre",
  rose: "bg-rose text-encre",
};

/** Pastille / bouton arrondi avec contour encre et ombre dure. Sans onClick : simple étiquette. */
export function Pill({
  children,
  onClick,
  tone = "blanc",
  small,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: PillTone;
  small?: boolean;
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-full border-2 border-encre font-bold ${PILL_TONE[tone]} ${
    small ? "min-h-9 px-3.5 text-[13px]" : "min-h-12 px-5 text-base"
  }`;
  if (!onClick) return <span className={base}>{children}</span>;
  return (
    <button type="button" onClick={onClick} className={`${base} pop-shadow-sm pop-press`}>
      {children}
    </button>
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
  tone?: "blanc" | "violet";
}) {
  const violet = tone === "violet";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pop-shadow pop-press h-14 w-full shrink-0 rounded-full border-2 font-display text-lg font-extrabold disabled:border-bord disabled:bg-muted disabled:text-attenue disabled:shadow-none ${
        violet ? "border-encre bg-violet text-white" : "border-encre bg-carte text-encre"
      }`}
    >
      {children}
    </button>
  );
}

/** Choix exclusif (réglages) : pastilles arrondies, le choix actif en violet. */
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
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">{label}</h2>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={o.value === value}
            style={{ minHeight: 50 } as CSSProperties}
            className={`pop-shadow-sm pop-press flex-1 rounded-2xl border-2 border-encre px-1 font-display text-[15px] font-extrabold ${
              o.value === value ? "bg-violet text-white" : "bg-carte text-encre"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-9 text-xs leading-normal text-attenue">{help}</p>
    </div>
  );
}
