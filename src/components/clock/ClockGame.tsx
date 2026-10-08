"use client";
/**
 * Écran de partie du Tour de l'horloge (référence : docs/parcours.html, écran « Horloge »).
 * Le numéro visé en géant, deux énormes boutons TOUCHÉ / RATÉ (en Bonus : Simple / Double / Triple).
 * La volée passe toute seule après la 3e fléchette.
 */
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink } from "@/components/Celebration";
import { GameMenu, MenuButton } from "@/components/GameMenu";
import { type Action, type Dart, type Mult, dartLabel } from "@/engine/types";
import {
  type ClockEvent,
  type ClockState,
  applyClock,
  clockLength,
  clockTarget,
  currentMemberClock,
  rankingClock,
  targetAt,
} from "@/engine/clock";
import { useWakeLock } from "@/lib/device";
import { fitFont } from "@/lib/fit";
import { clearPartie, useClockPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";

const targetText = (n: number) => (n === 25 ? "BULL" : String(n));

export function ClockGame() {
  const { partie, state, push, undo, restart } = useClockPartie();
  const [busy, setBusy] = useState(false);
  const [cele, setCele] = useState<CeleSpec | null>(null);
  const [wink, setWink] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  // L'écran de fin n'apparaît qu'après la célébration de la victoire.
  const [wonShown, setWonShown] = useState(false);
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

  // Une partie déjà gagnée qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<ClockState | null>(null);
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

  // La volée passe toute seule après la 3e fléchette (Annuler reste possible juste avant).
  useEffect(() => {
    if (!state || busy || state.status !== "full") return;
    const t = setTimeout(() => push({ type: "next" }), 900);
    return () => clearTimeout(t);
  }, [state, busy, push]);

  // Victoire, après un court délai (le temps de corriger avec Annuler).
  useEffect(() => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    const t = setTimeout(() => {
      handled.current = state;
      const w = state.winner!;
      sounds.win();
      setBusy(true);
      void celebrate({
        level: "max",
        tone: "cyan",
        kicker: `Le tour complet · tour ${state.winTurn}`,
        big: state.setup.sides[w].members.length > 1 ? state.setup.sides[w].name : currentMemberClock(state, w),
        numeric: false,
        sub: "Tour de l'horloge",
        slot: "victoire",
      }).then(() => {
        setBusy(false);
        setWonShown(true);
      });
    }, 700);
    return () => clearTimeout(t);
  }, [state, busy, celebrate]);

  if (!state) return <div className="h-dvh bg-noir" />;

  const sides = state.setup.sides;
  const side = state.current;
  const who = currentMemberClock(state);
  const target = clockTarget(state);
  const { bonus, bullFinish } = state.setup.options;
  const end = clockLength(state.setup);
  const team = sides[side].members.length > 1;
  const canThrow = !busy && state.status === "open";
  const over = state.status === "match" && wonShown && !busy && !cele;

  const play = async (dart: Dart) => {
    if (!canThrow) return;
    const action: Action = { type: "dart", dart };
    const next = applyClock(state, action);
    if (next.events.length === 0) return;
    push(action);
    const has = (t: ClockEvent["type"]) => next.events.some((e) => e.type === t);
    if (dart.m === 3) sounds.triple();
    else if (dart.m === 2) sounds.double();
    else sounds.dart();

    if (has("matchWon")) return;
    if (has("threeHits")) {
      setBusy(true);
      sounds.ton();
      await celebrate({ level: "mid", word: "Sans faute", num: "3/3" });
      setBusy(false);
    } else if (has("bullNext")) {
      showWink("Plus que le bull. Respire.");
    } else if (has("threeMisses")) {
      showWink("Trois à côté. Ça arrive aux meilleurs.");
    }
  };

  const hit = (m: Mult) => void play({ n: target, m });

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-noir">
      <div className="flex h-full flex-col px-3.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
          <span>
            <b className="text-blanc">Horloge</b>
            {bonus && " · Bonus"} · Fin {bullFinish ? "au bull" : "au 20"}
          </span>
          <span className="flex items-center gap-2">
            Tour <b className="text-blanc">{state.turn}</b>
            <MenuButton onClick={() => setMenu(true)} />
          </span>
        </div>

        {team && <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">{sides[side].name}</div>}

        <div className="mt-2 h-10 shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="whitespace-nowrap font-black uppercase italic leading-[40px] tracking-tight"
              style={{ fontSize: fitFont(who, 40, 30) }}
            >
              {who}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Le numéro visé, en géant */}
        <div className="relative -mx-3.5 mt-3 h-[150px] shrink-0 overflow-hidden">
          <div className="skew-18 absolute inset-y-0 -left-6 right-6 bg-cyan" />
          <span className="absolute left-7 top-3 text-[11px] font-black uppercase tracking-[0.22em] text-noir">Vise le</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${side}-${target}`}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`absolute bottom-1 right-12 font-num leading-none text-noir ${target === 25 ? "text-[96px]" : "text-[140px]"}`}
            >
              {targetText(target)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* La course : une case par numéro */}
        <div className="mt-3 flex shrink-0 flex-col gap-1.5">
          {sides.map((s, i) => {
            const me = i === side;
            return (
              <div key={i} className="flex items-center gap-2" aria-label={`${s.name} : vise le ${targetText(targetAt(state.pos[i]))}`}>
                <span className={`w-[78px] shrink-0 truncate text-[11px] font-black uppercase italic ${me ? "text-cyan" : "text-[#cfcfcf]"}`}>{s.name}</span>
                <span className="flex flex-1 gap-[2px]">
                  {Array.from({ length: end }, (_, q) => (
                    <i
                      key={q}
                      className={`skew-18 block h-2.5 flex-1 transition-colors duration-300 ${
                        q < state.pos[i] ? (me ? "bg-cyan" : "bg-blanc") : q === 20 ? "bg-[#3a3a3a]" : "bg-[#2c2c2c]"
                      }`}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Les 3 fléchettes de la volée */}
        <div className="mx-1 mt-3 grid h-[40px] shrink-0 grid-cols-3 gap-2">
          {[0, 1, 2].map((k) => {
            const dt = state.volley[k];
            const ok = dt && dt.n > 0;
            const tone = !dt ? "border-[#3a3a3a]" : dt.m === 3 ? "border-chartreuse bg-chartreuse" : ok ? "border-cyan bg-cyan" : "border-blanc";
            return (
              <div key={k} className={`skew-18 grid place-items-center border-[1.5px] ${tone}`}>
                <span className={`unskew-18 font-num text-[19px] ${!dt ? "text-gris-2" : ok ? "text-noir" : "text-blanc"}`}>
                  {!dt ? "—" : ok ? dartLabel(dt) : "✕"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Deux énormes boutons */}
        <div className="mt-auto flex shrink-0 flex-col gap-2 pt-3">
          {bonus ? (
            <div className={`grid gap-2 ${target === 25 ? "grid-cols-2" : "grid-cols-3"}`} style={{ "--h": "84px" } as React.CSSProperties}>
              <button
                type="button"
                disabled={!canThrow}
                onClick={() => hit(1)}
                className="btn-18 h-[84px] bg-blanc text-[15px] font-black uppercase italic leading-tight text-noir active:bg-cyan disabled:opacity-40"
              >
                Simple
                <br />
                {target === 25 ? "25" : target}
              </button>
              <button
                type="button"
                disabled={!canThrow}
                onClick={() => hit(2)}
                className="btn-18 h-[84px] bg-cyan text-[15px] font-black uppercase italic leading-tight text-noir active:bg-blanc disabled:opacity-40"
              >
                Double
                <br />
                {target === 25 ? "Bull" : target}
              </button>
              {target !== 25 && (
                <button
                  type="button"
                  disabled={!canThrow}
                  onClick={() => hit(3)}
                  className="btn-18 h-[84px] bg-chartreuse text-[15px] font-black uppercase italic leading-tight text-noir active:bg-blanc disabled:opacity-40"
                >
                  Triple
                  <br />
                  {target}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={!canThrow}
              onClick={() => hit(1)}
              style={{ "--h": "84px" } as React.CSSProperties}
              className="btn-18 h-[84px] bg-cyan text-[28px] font-black uppercase italic text-noir active:bg-blanc disabled:opacity-40"
            >
              Touché {target === 25 ? "le bull" : target}
            </button>
          )}
          <button
            type="button"
            disabled={!canThrow}
            onClick={() => void play({ n: 0, m: 1 })}
            style={{ "--h": "64px" } as React.CSSProperties}
            className="btn-18 h-16 bg-blanc text-[22px] font-black uppercase italic text-noir active:bg-cyan disabled:opacity-40"
          >
            Raté
          </button>
          <button
            type="button"
            disabled={busy || !partie?.actions.length}
            onClick={undo}
            className="h-11 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a8a8a8] active:text-cyan disabled:opacity-30"
          >
            Annuler la dernière fléchette
          </button>
        </div>
      </div>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Horloge" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinClock state={state} onRevanche={() => restart(rankingClock(state)[sides.length - 1])} onQuit={() => clearPartie()} />
      )}
    </main>
  );
}

function FinClock({ state, onRevanche, onQuit }: { state: ClockState; onRevanche: () => void; onQuit: () => void }) {
  const sides = state.setup.sides;
  const winner = sides[state.winner!].name;
  const order = rankingClock(state);
  const end = clockLength(state.setup);
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
        <span className="text-[30px]">le Tour de l&apos;horloge</span>
      </div>
      <ol className="mt-6 flex flex-col">
        {order.map((s, i) => (
          <li key={s} className="flex items-center justify-between gap-3 border-t border-filet py-2.5">
            <span className="min-w-0 truncate text-lg font-black uppercase italic">
              <span className={i === 0 ? "text-cyan" : "text-gris"}>{i + 1}</span> {sides[s].name}
            </span>
            <span className="shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-gris">
              {state.pos[s] >= end ? "Arrivé" : "Visait le"}
              {state.pos[s] < end && (
                <b className="ml-2 font-num text-2xl font-normal tracking-normal text-blanc">{targetText(targetAt(state.pos[s]))}</b>
              )}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-end justify-between border-t border-filet pt-2.5">
        <div>
          <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">Tours pour finir</small>
          <span className="text-[13px] font-black uppercase italic">{winner}</span>
        </div>
        <div className="font-num text-4xl leading-none text-chartreuse">{state.winTurn}</div>
      </div>
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
