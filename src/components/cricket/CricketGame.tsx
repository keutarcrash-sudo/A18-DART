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
import { GameMenu, MenuButton } from "@/components/GameMenu";

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

  if (!state) return <div className="h-dvh bg-noir" />;

  const n = state.setup.sides.length;
  const side = state.current;
  const who = currentMemberCricket(state);
  const mode = state.setup.options.mode;
  const showPoints = mode !== "none";
  const cols = `52px repeat(${n}, minmax(0, 1fr))`;
  const over = state.status === "match" && wonShown && !busy && !cele;
  const shortName = (s: string) => (n > 4 ? s.slice(0, 3) : s);
  const team = state.setup.sides[side].members.length > 1;

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
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-noir">
      <div className="flex h-full flex-col px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
          <span>
            <b className="text-blanc">Cricket</b> · {t(MODE_LABEL[mode])}
          </span>
          <span className="flex items-center gap-2">
            {t("Tour")} <b className="text-blanc">{state.turn}</b>
            <MenuButton onClick={() => setMenu(true)} />
          </span>
        </div>

        {team && <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">{state.setup.sides[side].name}</div>}

        {/* Joueur actif + ses points */}
        <div className="mt-2 flex h-10 shrink-0 items-end justify-between gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="whitespace-nowrap font-black uppercase italic leading-none tracking-tight"
              style={{ fontSize: fitFont(who, 34, showPoints ? 110 : 30) }}
            >
              {who}
            </motion.div>
          </AnimatePresence>
          {showPoints && (
            <div className="shrink-0 text-right">
              <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">{t("Points")}</small>
              <span className="font-num text-[32px] leading-none text-cyan">{state.points[side]}</span>
            </div>
          )}
        </div>

        {/* Le tableau = le pavé */}
        <div className="mt-2.5 flex shrink-0 flex-col gap-1">
          <div className="grid h-[30px] items-end gap-1 pr-1.5" style={{ gridTemplateColumns: cols }}>
            <div />
            {state.setup.sides.map((s, i) => (
              <div
                key={i}
                className={`truncate text-center text-[10px] font-black uppercase italic leading-tight ${i === side ? "text-cyan" : "text-gris"}`}
              >
                {shortName(s.name)}
                {showPoints && (
                  <b className={`block font-num text-[13px] font-normal not-italic ${i === side ? "text-cyan" : "text-[#cfcfcf]"}`}>
                    {state.points[i]}
                  </b>
                )}
              </div>
            ))}
          </div>
          {CRICKET_NUMBERS.map((num: CricketNumber) => {
            const dead = isDead(state, num);
            return (
              <button
                key={num}
                type="button"
                disabled={busy || state.status !== "open"}
                onClick={() => hit(num)}
                aria-label={num === 25 ? t("Touché le bull") : t("Touché le {n}", { n: num })}
                className={`grid h-[46px] items-stretch gap-1 bg-case pr-1.5 text-center active:bg-[#303030] ${dead ? "opacity-30" : ""}`}
                style={{ gridTemplateColumns: cols }}
              >
                <span className="font-num text-[26px] leading-[46px]">{label(num)}</span>
                {state.marks.map((m, i) => {
                  const shut = m[num] >= 3;
                  return (
                    <span key={i} className={`flex items-center justify-center gap-[3px] px-0.5 ${i === side ? "bg-cyan/15" : ""}`}>
                      {[0, 1, 2].map((q) => (
                        <i
                          key={q}
                          className={`skew-18 block w-[9px] max-w-[28%] transition-[height,background-color] duration-200 ${
                            q < m[num] ? `h-[22px] ${shut ? "bg-cyan" : "bg-blanc"}` : "h-3 bg-[#3a3a3a]"
                          }`}
                        />
                      ))}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>

        {/* Les 3 fléchettes de la volée */}
        <div className="mx-1 mt-2 grid h-[40px] shrink-0 grid-cols-3 gap-2">
          {[0, 1, 2].map((k) => {
            const dt = state.volley[k];
            const tone = !dt ? "border-[#3a3a3a]" : dt.m === 3 ? "border-chartreuse bg-chartreuse" : dt.m === 2 && dt.n ? "border-cyan bg-cyan" : "border-blanc";
            const txt = !dt ? "text-gris-2" : dt.m >= 2 && dt.n ? "text-noir" : "text-blanc";
            return (
              <div key={k} className={`skew-18 grid place-items-center border-[1.5px] ${tone}`}>
                <span className={`unskew-18 font-num text-[19px] ${txt}`}>{dt ? dartText(dt) : "—"}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-[5px] pt-2.5">
          <div className="relative grid grid-cols-[2fr_1fr] gap-[5px]">
            <button
              type="button"
              disabled={busy || state.status !== "open"}
              onClick={() => hit(0)}
              className="h-[46px] bg-case text-[12px] font-black tracking-wide active:bg-blanc active:text-noir disabled:opacity-40"
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
              className="h-[46px] border-[1.5px] border-[#3a3a3a] text-[12px] font-black tracking-wide text-[#cfcfcf] active:bg-case disabled:opacity-30"
            >
              {t("ANNULER")}
            </button>
            {multFor !== null && !busy && (
              // Au-dessus des boutons, par-dessus la rangée des 3 fléchettes : RATÉ / AUTRE et ANNULER restent accessibles.
              <div className={`absolute inset-x-0 bottom-[calc(100%+5px)] grid h-[50px] gap-[5px] bg-noir ${multFor === 25 ? "grid-cols-1" : "grid-cols-2"}`}>
                <button type="button" onClick={() => onMult(2)} className="h-[50px] bg-cyan text-[15px] font-black italic text-noir active:bg-blanc">
                  {multFor === 25 ? "DOUBLE BULL" : `DOUBLE ${multFor}`}
                </button>
                {multFor !== 25 && (
                  <button type="button" onClick={() => onMult(3)} className="h-[50px] bg-chartreuse text-[15px] font-black italic text-noir active:bg-blanc">
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
            style={{ "--h": "56px" } as React.CSSProperties}
            className="btn-18 h-14 bg-blanc text-[17px] font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
          >
            {t("Valider la volée")}
          </button>
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
