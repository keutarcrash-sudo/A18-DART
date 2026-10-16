"use client";
/**
 * Écran de partie du Cricket (référence : docs/parcours.html, écran « Cricket »).
 * Le tableau EST le pavé : on touche la ligne du numéro touché (simple), puis Double / Triple
 * sous le pouce, sans chrono. « Raté / Autre » pour les fléchettes hors 15-20 et centre.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { type Dart, type Mult } from "@/engine/types";
import {
  CRICKET_NUMBERS,
  type CricketEvent,
  type CricketNumber,
  type CricketState,
  bestCricketVolley,
  closedCount,
  currentMemberCricket,
  isDead,
  rankingCricket,
} from "@/engine/cricket";
import { useWakeLock } from "@/lib/device";
import { fitFont } from "@/lib/fit";
import { useCricketPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";
import { type T, useT } from "@/lib/i18n";
import { submitRecords } from "@/lib/records";
import { gameEntry } from "@/lib/recordEntries";
import { FinDePartie } from "@/components/podium/FinDePartie";
import type { PodiumData } from "@/components/podium/PodiumScene";
import { GameMenu } from "@/components/GameMenu";
import { POP_PILL } from "@/components/x01/Volley";

const MODE_LABEL = { classic: "Classique", none: "Sans points", cut: "Cut-throat" } as const;
const label = (n: number) => (n === 25 ? "B" : String(n));

function dartText(d: Dart): string {
  if (d.n === 0) return "✕";
  return (d.m === 2 ? "D" : d.m === 3 ? "T" : "") + label(d.n);
}

export function CricketGame() {
  const { state, push, setLastMult, undo, restart } = useCricketPartie();
  const t = useT();
  const [busy, setBusy] = useState(false);
  // L'écran de fin n'apparaît qu'après la célébration de la victoire.
  const [wonShown, setWonShown] = useState(false);
  const [cele, setCele] = useState<CeleSpec | null>(null);
  const [wink, setWink] = useState<string | null>(null);
  const [multFor, setMultFor] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const celeDone = useRef<(() => void) | null>(null);
  const winkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useWakeLock(true);

  const celebrate = useCallback(
    (spec: CeleSpec) =>
      new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          setCele(null);
          celeDone.current = null;
          setTimeout(resolve, 150);
        };
        celeDone.current = finish;
        setCele(spec);
        setTimeout(finish, celeDuration(spec));
      }),
    [],
  );

  const showWink = useCallback((text: string) => {
    setWink(text);
    if (winkTimer.current) clearTimeout(winkTimer.current);
    winkTimer.current = setTimeout(() => setWink(null), 2400);
  }, []);

  const finishVolley = useCallback(
    async (st: CricketState) => {
      setBusy(true);
      setMultFor(null);
      const side = st.current;
      const who = currentMemberCricket(st);
      const ev = st.events;
      const has = (t: CricketEvent["type"]) => ev.some((e) => e.type === t);
      // Tous les numéros fermés pendant la volée, pas seulement par la dernière fléchette.
      const closed = st.volleyClosed.map((n) => ({ n }));
      const marks = ev.find((e): e is Extract<CricketEvent, { type: "volley" }> => e.type === "volley")?.marks ?? 0;

      sounds.validate();
      if (has("nineMarks")) {
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "cyan", kicker: who, big: "9", numeric: true, sub: t("Neuf touches. Le maximum."), slot: "exploit" });
      } else if (has("manyMarks")) {
        sounds.ton();
        await celebrate({ level: "mid", word: t("Touches"), num: String(marks) });
      } else if (closed.length && st.status !== "match") {
        // Plusieurs numéros fermés dans la même volée : on les montre tous.
        const ns = closed.map((c) => (c.n === 25 ? "BULL" : String(c.n)));
        const n = ns.join(" · ");
        await celebrate({ level: "scene", kind: "closed", num: n, text: t(ns.length > 1 ? "{n} fermés" : "{n} fermé", { n }) });
      } else if (has("noMarks")) {
        // « Raté / Autre » peut être un autre numéro : pas de scène « fléchettes dans le bois » ici.
        showWink(t("Rien sur le tableau. Ça arrive aux meilleurs."));
      }

      if (st.status === "match") {
        submitRecords([gameEntry(st.setup.sides[side].name, "cricket")]);
        sounds.win();
        await celebrate({
          level: "max",
          tone: "cyan",
          kicker: t("Victoire"),
          big: who,
          numeric: false,
          sub: st.setup.sides[side].members.length > 1 ? st.setup.sides[side].name : "Cricket",
          slot: "victoire",
        });
        setWonShown(true);
      } else {
        push({ type: "next" });
      }
      setBusy(false);
    },
    [celebrate, push, showWink, t],
  );

  // Une partie déjà gagnée qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<CricketState | null>(null);
  const firstSeen = useRef(false);
  useEffect(() => {
    if (!state || firstSeen.current) return;
    firstSeen.current = true;
    if (state.status === "match") {
      handled.current = state;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- partie déjà finie au chargement
      setWonShown(true);
    }
  }, [state]);
  // Annuler ou recommencer après une victoire : on revient en jeu.
  if (wonShown && state && state.status !== "match") setWonShown(false);

  // Rien ne se termine tout seul : victoire et bust attendent « Valider la volée » (on peut corriger avant).

  if (!state) return <div className="h-dvh bg-creme" />;

  const n = state.setup.sides.length;
  const side = state.current;
  const who = currentMemberCricket(state);
  const mode = state.setup.options.mode;
  const showPoints = mode !== "none";
  const cols = `${n > 4 ? 38 : 44}px repeat(${n}, minmax(0, 1fr))`;
  const over = state.status === "match" && wonShown && !busy && !cele;
  const shortName = (s: string) => (n > 4 ? s.slice(0, 3) : s);
  const team = state.setup.sides[side].members.length > 1;
  // Taille des pastilles selon le nombre de colonnes (8 joueurs : elles restent lisibles).
  const dot = n > 4 ? "h-[8px] w-[8px] border-[1.5px]" : n > 2 ? "h-[13px] w-[13px] border-2" : "h-[16px] w-[16px] border-2";

  const hit = (num: number) => {
    if (busy || state.status !== "open") return;
    push({ type: "dart", dart: { n: num, m: 1 } });
    sounds.dart();
    setMultFor(num === 0 ? null : num);
  };

  const onMult = (m: Mult) => {
    if (busy) return;
    setLastMult(m);
    if (m === 2) sounds.double();
    else sounds.triple();
    setMultFor(null);
  };

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-creme text-encre">
      <div className="flex h-full flex-col px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] [@media(max-height:700px)]:pb-[calc(8px+env(safe-area-inset-bottom))] [@media(max-height:700px)]:pt-[calc(8px+env(safe-area-inset-top))]">
        {/* Barre du haut : jeu, tour, Menu */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-display text-[20px] font-black">Cricket</span>
              {team && <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-violet">{state.setup.sides[side].name}</span>}
            </div>
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
              {t(MODE_LABEL[mode])} · {t("Tour")} {state.turn}
            </div>
          </div>
          <button type="button" onClick={() => setMenu(true)} className={POP_PILL}>
            {t("MENU")}
          </button>
        </div>

        {/* Joueur actif + ses points */}
        <div className="mt-2.5 flex h-[52px] shrink-0 items-center justify-between gap-3 rounded-3xl border-2 border-encre bg-carte px-3.5 shadow-[4px_4px_0_0_var(--color-rose)] [@media(max-height:700px)]:mt-1.5 [@media(max-height:700px)]:h-[46px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex min-w-0 items-center gap-2"
            >
              <i className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-encre bg-rose" aria-hidden="true" />
              <span className="truncate whitespace-nowrap font-display font-black uppercase leading-none tracking-tight" style={{ fontSize: fitFont(who, 24, showPoints ? 200 : 300) }}>
                {who}
              </span>
            </motion.div>
          </AnimatePresence>
          {showPoints && (
            <div className="flex shrink-0 items-baseline gap-1.5">
              <small className="text-[10px] font-bold uppercase tracking-[0.1em] text-attenue">{t("Points")}</small>
              <span className="font-num text-[34px] font-black leading-none tracking-[-0.03em] text-encre [@media(max-height:700px)]:text-[30px]">{state.points[side]}</span>
            </div>
          )}
        </div>

        {/* Le tableau = le pavé */}
        <div className="mt-2.5 flex shrink-0 flex-col gap-[5px] [@media(max-height:700px)]:mt-1.5 [@media(max-height:700px)]:gap-[3px]">
          <div className="grid h-[28px] items-end gap-1 pr-0.5" style={{ gridTemplateColumns: cols }}>
            <div />
            {state.setup.sides.map((s, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center leading-tight">
                <span
                  className={`max-w-full truncate rounded-full text-center ${n > 4 ? "px-1" : "px-1.5"} font-display text-[10px] font-extrabold uppercase ${i === side ? "bg-violet text-white" : "text-attenue"}`}
                >
                  {shortName(s.name)}
                </span>
                {showPoints && <b className={`font-num text-[12px] font-extrabold ${i === side ? "text-encre" : "text-attenue"}`}>{state.points[i]}</b>}
              </div>
            ))}
          </div>
          {CRICKET_NUMBERS.map((num: CricketNumber) => {
            const dead = isDead(state, num);
            const mineShut = state.marks[side][num] >= 3;
            return (
              <button
                key={num}
                type="button"
                disabled={busy || state.status !== "open"}
                onClick={() => hit(num)}
                aria-label={num === 25 ? t("Touché le bull") : t("Touché le {n}", { n: num })}
                className={`pop-press pop-shadow-sm grid h-[46px] items-stretch gap-1 rounded-xl border-2 border-encre pr-0.5 text-center ${mineShut ? "bg-violet text-white" : "bg-carte text-encre"} ${dead ? "opacity-40" : ""}`}
                style={{ gridTemplateColumns: cols }}
              >
                <span className="grid place-items-center font-num text-[24px] font-black leading-none">{label(num)}</span>
                {state.marks.map((m, i) => {
                  const shut = m[num] >= 3;
                  return (
                    <span key={i} className={`flex min-w-0 items-center justify-center rounded-lg ${n > 4 ? "gap-[2px]" : "gap-[3px]"} ${i === side && !mineShut ? "bg-muted" : ""}`}>
                      {[0, 1, 2].map((q) => {
                        const on = q < m[num];
                        const tone = on
                          ? mineShut
                            ? "border-encre bg-white"
                            : shut
                              ? "border-encre bg-violet"
                              : "border-encre bg-encre"
                          : mineShut
                            ? "border-white/60 bg-transparent"
                            : "border-bord bg-transparent";
                        return <i key={q} className={`block shrink-0 rounded-full transition-[background-color] duration-200 ${dot} ${tone}`} />;
                      })}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-2 [@media(max-height:700px)]:pt-1">
          {/* Les 3 fléchettes de la volée (Double / Triple viennent s'afficher par-dessus) */}
          <div className="grid h-11 grid-cols-3 gap-2 [@media(max-height:700px)]:h-10">
            {[0, 1, 2].map((k) => {
              const dt = state.volley[k];
              if (!dt) {
                return (
                  <div key={`${k}-x`} className="grid h-11 place-items-center rounded-[14px] border-2 border-dashed border-attenue/40 font-display text-[18px] font-extrabold text-attenue/60 [@media(max-height:700px)]:h-10">
                    {k + 1}
                  </div>
                );
              }
              const tone = dt.m === 3 ? "bg-rose" : dt.m === 2 && dt.n ? "bg-ambre" : "bg-carte";
              return (
                <div key={k} className={`grid h-11 place-items-center rounded-[14px] border-2 border-encre font-display text-[18px] font-extrabold shadow-[3px_3px_0_0_var(--color-encre)] [@media(max-height:700px)]:h-10 ${tone}`}>
                  {dartText(dt)}
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-col gap-[6px]">
            <div className="relative grid grid-cols-[2fr_1fr] gap-[6px]">
              <button
                type="button"
                disabled={busy || state.status !== "open"}
                onClick={() => hit(0)}
                className="pad-key pop-press pop-shadow-sm h-[46px] rounded-xl border-2 border-encre bg-muted font-display text-[12px] font-black tracking-wide text-encre disabled:opacity-40"
              >
                {t("RATÉ / AUTRE")}
              </button>
              <button
                type="button"
                disabled={busy || state.history.length + state.volley.length === 0}
                onClick={() => {
                  undo();
                  setMultFor(null);
                }}
                className="pad-key pop-press h-[46px] rounded-xl border-2 border-dashed border-encre bg-transparent font-display text-[12px] font-black tracking-wide text-encre disabled:opacity-40"
              >
                {t("ANNULER")}
              </button>
              {multFor !== null && !busy && (
                // Au-dessus des boutons, par-dessus la rangée des 3 fléchettes : RATÉ / AUTRE et ANNULER restent accessibles.
                <div className={`absolute inset-x-0 bottom-[calc(100%+5px)] z-10 grid h-[50px] gap-[6px] bg-creme ${multFor === 25 ? "grid-cols-1" : "grid-cols-2"}`}>
                  <button type="button" onClick={() => onMult(2)} className="pad-key pop-press pop-shadow-sm h-[46px] rounded-xl border-2 border-encre bg-ambre font-display text-[15px] font-black text-encre">
                    {multFor === 25 ? "DOUBLE BULL" : `DOUBLE ${multFor}`}
                  </button>
                  {multFor !== 25 && (
                    <button type="button" onClick={() => onMult(3)} className="pad-key pop-press pop-shadow-sm h-[46px] rounded-xl border-2 border-encre bg-rose font-display text-[15px] font-black text-encre">
                      TRIPLE {multFor}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={(state.status !== "full" && state.status !== "match") || busy || wonShown}
              onClick={() => void finishVolley(state)}
              className="pad-key pop-press pop-shadow h-14 rounded-2xl border-2 border-encre bg-violet font-display text-[17px] font-black uppercase text-blanc disabled:bg-muted disabled:text-attenue disabled:opacity-100 disabled:shadow-none"
            >
              {t("Valider la volée")}
            </button>
          </div>
        </div>
      </div>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Cricket" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie data={podiumCricket(state, t)} onRevanche={() => restart(rankingCricket(state)[n - 1])} />
      )}
    </main>
  );
}

function podiumCricket(state: CricketState, t: T): PodiumData {
  const sides = state.setup.sides;
  const best = bestCricketVolley(state);
  const points = state.setup.options.mode !== "none";
  return {
    title: [sides[state.winner!].name, t("gagne"), t("le Cricket")],
    ranking: rankingCricket(state).map((s) => ({
      name: sides[s].name,
      value: `${closedCount(state, s)}/7${points ? ` · ${state.points[s]} pts` : ` ${t("fermés")}`}`,
    })),
    highlight: best ? { label: t("Meilleure volée"), who: `${best.member} · ${t("Tour")} ${best.turn}`, value: String(best.marks), unit: t("touches") } : undefined,
  };
}
