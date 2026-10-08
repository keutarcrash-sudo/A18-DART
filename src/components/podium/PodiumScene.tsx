/**
 * La scène du podium (référence : docs/parcours.html, écrans « Podium » et « Story »).
 * Sert deux fois : à l'écran en fin de partie, et dans l'image story 9:16 à partager.
 */
import { useT } from "@/lib/i18n";

export interface PodiumData {
  /** Trois lignes du titre, celle du milieu en cyan : « GUILLAUME / GAGNE / LE 501 ». */
  title: [string, string, string];
  /** Classement complet, le premier gagne. */
  ranking: { name: string; value?: string }[];
  /** Le chiffre qui résume la partie (en chartreuse). */
  highlight?: { label: string; who: string; value: string; unit?: string };
}

/** Taille (px) qui fait tenir un texte en Montserrat Black italique capitales sur une ligne de `width` px. */
export function fitPx(text: string, maxPx: number, width: number): number {
  return Math.min(maxPx, Math.floor(width / (Math.max(1, text.length) * 0.7)));
}

export function todayLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const STEP = [
  { h: 112, bg: "bg-cyan" },
  { h: 76, bg: "bg-blanc" },
  { h: 58, bg: "bg-[#bdbdbd]" },
] as const;

/**
 * @param story  version image : pas de cadre « Perso 3D » en pointillé (le personnage n'existe pas encore),
 *               les initiales le remplacent, et la signature Arena18 en bas.
 * @param width  largeur utile en px (pour ajuster les grands textes).
 */
export function PodiumScene({ data, story = false, width, date }: { data: PodiumData; story?: boolean; width: number; date: string }) {
  const t = useT();
  const [l1, l2, l3] = data.title;
  // Ordre des marches à l'écran : 2e, 1er, 3e.
  const places = [1, 0, 2].filter((r) => r < data.ranking.length);
  const rest = data.ranking.slice(3);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe, aussi capturé dans l'image */}
        <img src="/logo-a18.png" alt="Arena18" className="h-[30px] w-auto" />
        <span className="text-right text-[9px] font-bold uppercase leading-relaxed tracking-[0.2em] text-gris">
          Arena18
          <br />
          {date}
        </span>
      </div>

      <div className="mt-4 font-black uppercase italic leading-[0.88] tracking-tight">
        <span className="block whitespace-nowrap" style={{ fontSize: fitPx(l1, 52, width) }}>
          {l1}
        </span>
        <span className="block whitespace-nowrap text-cyan" style={{ fontSize: fitPx(l2, 52, width) }}>
          {l2}
        </span>
        <span className="block whitespace-nowrap" style={{ fontSize: fitPx(l3, l3.length > 8 ? 30 : 52, width) }}>
          {l3}
        </span>
      </div>

      <div className="min-h-2 flex-1" />

      {/* Le podium */}
      <div className="-mx-1 flex items-end justify-center">
        {places.map((r) => {
          const p = data.ranking[r];
          const first = r === 0;
          return (
            <div key={r} className="flex w-1/3 min-w-0 flex-col items-center">
              <span className="w-full truncate px-1 text-center text-[12px] font-black uppercase italic">{p.name}</span>
              {p.value && <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gris">{p.value}</span>}
              {first && !story ? (
                <div className="slot-perso mb-2 mt-1 flex h-[104px] w-[74%] items-end justify-center p-1 text-center text-[7px] font-bold uppercase tracking-[0.14em]">
                  {t("Perso 3D")}
                  <br />
                  {t("victoire")}
                </div>
              ) : (
                <div
                  className={`mb-2 mt-1 grid w-[64%] place-items-center border-[1.5px] ${first ? "h-[96px] border-cyan" : "h-[64px] border-filet"}`}
                >
                  <span className={`font-black uppercase italic ${first ? "text-[46px] text-cyan" : "text-[30px] text-[#cfcfcf]"}`}>
                    {p.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className={`skew-18 grid w-full place-items-center ${STEP[r].bg}`} style={{ height: STEP[r].h }}>
                <span className="unskew-18 font-num text-[40px] leading-none text-noir">{r + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-3 truncate text-[11px] font-black uppercase italic text-gris">
          {rest.map((p, i) => (
            <span key={i} className="mr-3">
              <span className="font-num font-normal not-italic">{i + 4}</span> {p.name}
            </span>
          ))}
        </div>
      )}

      {data.highlight && (
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-filet pt-2.5">
          <div className="min-w-0">
            <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">{data.highlight.label}</small>
            <span className="block truncate text-[13px] font-black uppercase italic">{data.highlight.who}</span>
          </div>
          <div className="shrink-0 font-num text-[38px] leading-none text-chartreuse">
            {data.highlight.value}
            {data.highlight.unit && (
              <small className="ml-1 font-text text-[11px] font-bold uppercase not-italic tracking-[0.14em] text-gris">{data.highlight.unit}</small>
            )}
          </div>
        </div>
      )}

      {story && (
        <div className="mt-4 flex items-end justify-between">
          <span className="whitespace-nowrap text-[17px] font-black uppercase italic tracking-tight">
            {t("À vous de")} <span className="text-cyan">{t("jouer")}</span>
          </span>
          <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.18em] text-gris">{t("Fléchettes · Arena18")}</span>
        </div>
      )}
    </div>
  );
}
