/**
 * La scène du podium (référence : docs/refonte-pop/maquettes.html, écran « Podium »).
 * Sert deux fois : à l'écran en fin de partie, et dans l'image story 9:16 à partager.
 */
import { useT } from "@/lib/i18n";
import { Head } from "@/components/pop/Heads";

export interface PodiumData {
  /** Trois lignes du titre, celle du milieu en surligneur : « GUILLAUME / GAGNE / LE 501 ». */
  title: [string, string, string];
  /** Classement complet, le premier gagne. */
  ranking: { name: string; value?: string }[];
  /** Le chiffre qui résume la partie . */
  highlight?: { label: string; who: string; value: string; unit?: string };
}

/** Taille (px) qui fait tenir un texte Outfit très gras sur une ligne de `width` px. */
export function fitPx(text: string, maxPx: number, width: number, minPx = 20): number {
  return Math.max(minPx, Math.min(maxPx, Math.floor(width / (Math.max(1, text.length) * 0.6))));
}

export function todayLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Marches : 1 violet (coins vifs en haut), 2 rose (arche), 3 menthe. */
const STEP = [
  { h: "h-[128px] [@media(min-height:800px)]:h-[150px] [@media(max-height:700px)]:h-[96px]", cls: "rounded-t-[22px] bg-violet text-white", pad: "pt-2.5" },
  { h: "h-[92px] [@media(min-height:800px)]:h-[104px] [@media(max-height:700px)]:h-[68px]", cls: "rounded-t-[999px] bg-rose text-encre", pad: "pt-3" },
  { h: "h-[68px] [@media(min-height:800px)]:h-[76px] [@media(max-height:700px)]:h-[50px]", cls: "rounded-t-xl bg-menthe text-encre", pad: "pt-1.5" },
] as const;

/**
 * @param story  version image : les initiales restent dans leurs pastilles, avec la signature Arena18 en bas.
 * @param width  largeur utile en px (pour ajuster les grands textes).
 */
export function PodiumScene({ data, story = false, width, date }: { data: PodiumData; story?: boolean; width: number; date: string }) {
  const t = useT();
  const [l1, l2, l3] = data.title;
  // Ordre des marches à l'écran : 2e, 1er, 3e.
  const places = [1, 0, 2].filter((r) => r < data.ranking.length);
  const rest = data.ranking.slice(3);

  return (
    <div className="relative flex h-full flex-col text-encre">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-[17px] font-extrabold">
          <span className="grid h-[28px] w-[28px] place-items-center rounded-[9px] border-2 border-encre bg-ambre">
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#1E293B" strokeWidth="2.5" />
              <circle cx="10" cy="10" r="3" fill="#1E293B" />
            </svg>
          </span>
          A18 Darts
        </div>
        <span className="text-right text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-attenue">
          Arena18 · {date}
        </span>
      </div>

      {/* Le titre, avec le Frimeur et le Coup de cœur autour */}
      <div className="mt-3 text-center font-display font-black leading-[0.98] tracking-tight [@media(max-height:700px)]:mt-1.5">
        <span className="block whitespace-nowrap" style={{ fontSize: fitPx(l1, 46, width) }}>
          {l1}
        </span>
        <div className="mt-0.5 flex h-[42px] items-center justify-center gap-1">
          <Head kind="coeurs" size={50} className="-ml-2 shrink-0 -rotate-12" />
          <span
            className="bg-[linear-gradient(transparent_55%,var(--color-ambre)_55%_92%,transparent_92%)] px-1 whitespace-nowrap"
            style={{ fontSize: fitPx(l2, 40, width - 130) }}
          >
            {l2}
          </span>
          <Head kind="frimeur" size={58} className="-mr-2 shrink-0 rotate-[10deg]" />
        </div>
        <span className="mt-0.5 block whitespace-nowrap font-extrabold text-attenue" style={{ fontSize: fitPx(l3, 22, width, 14) }}>
          {l3}
        </span>
      </div>

      <div className="min-h-2 flex-1" />

      {/* Le podium */}
      <div className={`mx-auto flex w-full items-end gap-2 ${places.length < 3 ? "max-w-[78%]" : ""}`}>
        {places.map((r) => {
          const p = data.ranking[r];
          const first = r === 0;
          return (
            <div key={r} className={`flex min-w-0 flex-col items-center ${first ? "flex-[1.1]" : "flex-1"}`}>
              <span
                className={`grid shrink-0 place-items-center rounded-full border-2 border-encre font-display font-black shadow-[3px_3px_0_0_var(--color-encre)] ${
                  first ? "h-[72px] w-[72px] bg-ambre text-[32px] [@media(max-height:700px)]:h-[60px] [@media(max-height:700px)]:w-[60px] [@media(max-height:700px)]:text-[27px]" : "h-[56px] w-[56px] bg-carte text-[24px] [@media(max-height:700px)]:h-[48px] [@media(max-height:700px)]:w-[48px] [@media(max-height:700px)]:text-[21px]"
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="mt-1.5 w-full truncate px-0.5 text-center text-[13px] font-bold leading-tight">{p.name}</span>
              <span className="mb-1.5 h-4 w-full truncate text-center text-[12px] font-medium leading-4 text-attenue">{p.value ?? ""}</span>
              <div className={`grid w-full place-items-start justify-items-center border-2 border-encre font-display text-[34px] font-black leading-none ${STEP[r].h} ${STEP[r].cls} ${STEP[r].pad}`}>
                {r + 1}
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-bold text-attenue">
          {rest.map((p, i) => (
            <span key={i} className="max-w-full truncate">
              <span className="font-num">{i + 4}</span> {p.name}
            </span>
          ))}
        </div>
      )}

      {data.highlight && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border-2 border-encre bg-carte px-3.5 py-2.5 shadow-[4px_4px_0_0_var(--color-bord)]">
          <div className="min-w-0">
            <small className="block text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">{data.highlight.label}</small>
            <span className="mt-0.5 block truncate text-[14px] font-bold">{data.highlight.who}</span>
          </div>
          <div className="shrink-0 font-num text-[40px] font-black leading-none text-violet">
            {data.highlight.value}
            {data.highlight.unit && <small className="ml-1 font-text text-[12px] font-bold text-attenue">{data.highlight.unit}</small>}
          </div>
        </div>
      )}

      {story && (
        <div className="mt-4 flex items-end justify-between">
          <span className="whitespace-nowrap font-display text-[20px] font-black tracking-tight">
            {t("À vous de")}{" "}
            <span className="bg-[linear-gradient(transparent_55%,var(--color-ambre)_55%_92%,transparent_92%)] px-0.5">{t("jouer")}</span>
          </span>
          <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.08em] text-attenue">{t("Fléchettes · Arena18")}</span>
        </div>
      )}
    </div>
  );
}
