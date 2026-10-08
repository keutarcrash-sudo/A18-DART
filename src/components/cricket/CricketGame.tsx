"use client";
/**
 * Écran de partie du Cricket (référence : docs/parcours.html, écran « Cricket »).
 * Le tableau EST le pavé : on touche la ligne du numéro touché (simple), puis Double / Triple
 * sous le pouce, sans chrono. « Raté / Autre » pour les fléchettes hors 15-20 et centre.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink } from "@/components/Celebration";
import type { Dart, Mult } from "@/engine/types";
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
import { clearPartie, useCricketPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";
import { GameMenu, MenuButton } from "@/components/GameMenu";

const MODE_LABEL = { classic: "Classique", none: "Sans points", cut: "Cut-throat" } as const;
const label = (n: number) => (n === 25 ? "B" : String(n));

function dartText(d: Dart): string {
  if (d.n === 0) return "✕";
  return (d.m === 2 ? "D" : d.m === 3 ? "T" : "") + label(d.n);
}

export function CricketGame() {
  const { state, push, setLastMult, undo, restart } = useCricketPartie();
  const [busy, setBusy] = useState(false);
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
        setTimeout(finish, spec.level === "max" ? 2000 : 1100);
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
      const closed = ev.filter((e): e is Extract<CricketEvent, { type: "closed" }> => e.type === "closed");
      const marks = ev.find((e): e is Extract<CricketEvent, { type: "volley" }> => e.type === "volley")?.marks ?? 0;

      sounds.validate();
      if (has("nineMarks")) {
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "cyan", kicker: who, big: "9", numeric: true, sub: "Neuf touches. Le maximum.", slot: "exploit" });
      } else if (has("manyMarks")) {
        sounds.ton();
        await celebrate({ level: "mid", word: "Touches", num: String(marks) });
      } else if (closed.length && st.status !== "match") {
        showWink(`Le ${closed[0].n === 25 ? "bull" : closed[0].n} est fermé. Les autres, attention.`);
      } else if (has("noMarks")) {
        showWink("Rien sur le tableau. Ça arrive aux meilleurs.");
      }

      if (st.status === "match") {
        sounds.win();
        await celebrate({
          level: "max",
          tone: "cyan",
          kicker: "Victoire",
          big: who,
          numeric: false,
          sub: st.setup.sides[side].members.length > 1 ? st.setup.sides[side].name : "Cricket",
          slot: "victoire",
        });
      } else {
        push({ type: "next" });
      }
      setBusy(false);
    },
    [celebrate, push, showWink],
  );

  // Une partie déjà gagnée qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<CricketState | null>(null);
  const firstSeen = useRef(false);
  useEffect(() => {
    if (!state || firstSeen.current) return;
    firstSeen.current = true;
    if (state.status === "match") handled.current = state;
  }, [state]);

  // La victoire termine la volée d'elle-même (court délai pour corriger Double / Triple).
  useEffect(() => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    const t = setTimeout(() => {
      handled.current = state;
      void finishVolley(state);
    }, 700);
    return () => clearTimeout(t);
  }, [state, busy, finishVolley]);

  if (!state) return <div className="h-dvh bg-noir" />;

  const n = state.setup.sides.length;
  const side = state.current;
  const who = currentMemberCricket(state);
  const mode = state.setup.options.mode;
  const showPoints = mode !== "none";
  const cols = `52px repeat(${n}, minmax(0, 1fr))`;
  const over = state.status === "match" && !busy && !cele;
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
            <b className="text-blanc">Cricket</b> · {MODE_LABEL[mode]}
          </span>
          <span className="flex items-center gap-2">
            Tour <b className="text-blanc">{state.turn}</b>
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
              <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">Points</small>
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
                aria-label={`Touché ${num === 25 ? "le bull" : `le ${num}`}`}
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
              RATÉ / AUTRE
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
              ANNULER
            </button>
            {multFor !== null && !busy && state.status !== "match" && (
              <div className={`absolute inset-y-0 left-0 right-[calc(33.333%+1.7px)] grid gap-[5px] bg-noir ${multFor === 25 ? "grid-cols-1" : "grid-cols-2"}`}>
                <button type="button" onClick={() => onMult(2)} className="h-[46px] bg-cyan text-[14px] font-black italic text-noir active:bg-blanc">
                  {multFor === 25 ? "DOUBLE BULL" : `DOUBLE ${multFor}`}
                </button>
                {multFor !== 25 && (
                  <button type="button" onClick={() => onMult(3)} className="h-[46px] bg-chartreuse text-[14px] font-black italic text-noir active:bg-blanc">
                    TRIPLE {multFor}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={state.status !== "full" || busy}
            onClick={() => void finishVolley(state)}
            style={{ "--h": "56px" } as React.CSSProperties}
            className="btn-18 h-14 bg-blanc text-[17px] font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
          >
            Valider la volée
          </button>
        </div>
      </div>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Cricket" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinCricket state={state} onRevanche={() => restart(rankingCricket(state)[n - 1])} onQuit={() => clearPartie()} />
      )}
    </main>
  );
}

function FinCricket({ state, onRevanche, onQuit }: { state: CricketState; onRevanche: () => void; onQuit: () => void }) {
  const winner = state.setup.sides[state.winner!].name;
  const order = rankingCricket(state);
  const best = bestCricketVolley(state);
  const showPoints = state.setup.options.mode !== "none";
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-noir px-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(22px+env(safe-area-inset-top))]">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe */}
      <img src="/logo-a18.png" alt="Arena18" className="h-[30px] w-auto self-start" />
      <div className="mt-[18px] text-[52px] font-black uppercase italic leading-[0.86] tracking-tight">
        <span className="block whitespace-nowrap" style={{ fontSize: fitFont(winner, 52, 40) }}>
          {winner}
        </span>
        <span className="text-cyan">gagne</span>
        <br />
        le Cricket
      </div>
      <ol className="mt-6 flex flex-col">
        {order.map((s, i) => (
          <li key={s} className="flex items-center justify-between gap-3 border-t border-filet py-2.5">
            <span className="min-w-0 truncate text-lg font-black uppercase italic">
              <span className={i === 0 ? "text-cyan" : "text-gris"}>{i + 1}</span> {state.setup.sides[s].name}
            </span>
            <span className="shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-gris">
              {closedCount(state, s)}/7 fermés
              {showPoints && <b className="ml-2 font-num text-2xl font-normal tracking-normal text-blanc">{state.points[s]}</b>}
            </span>
          </li>
        ))}
      </ol>
      {best && (
        <div className="mt-3 flex items-end justify-between border-t border-filet pt-2.5">
          <div>
            <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">Meilleure volée</small>
            <span className="text-[13px] font-black uppercase italic">
              {best.member} · Tour {best.turn}
            </span>
          </div>
          <div className="font-num text-4xl leading-none text-chartreuse">
            {best.marks}
            <small className="ml-1 font-text text-[11px] font-bold uppercase not-italic tracking-[0.14em] text-gris">touches</small>
          </div>
        </div>
      )}
      <div className="mt-auto grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onRevanche}
          className="btn-18 h-14 bg-cyan text-base font-black uppercase italic text-noir"
          style={{ "--h": "56px" } as React.CSSProperties}
        >
          Revanche
        </button>
        <Link
          href="/nouvelle"
          onClick={onQuit}
          className="btn-18 grid h-14 place-items-center bg-blanc text-[15px] font-black uppercase italic text-noir"
          style={{ "--h": "56px" } as React.CSSProperties}
        >
          Nouvelle partie
        </Link>
      </div>
    </div>
  );
}
