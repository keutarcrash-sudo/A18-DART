"use client";
/**
 * Écran de partie du 301 / 501 (référence : docs/parcours.html, écran « Partie »).
 * L'interface ne connaît pas les règles : elle affiche l'état du moteur et joue ses événements.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Celebration, type CeleSpec, Wink } from "@/components/Celebration";
import { type Dart, type Mult, dartLabel } from "@/engine/types";
import {
  type X01Event,
  type X01State,
  bestVolley,
  currentMember,
  rankingX01,
  suggestCheckout,
  volleyScore,
} from "@/engine/x01";
import { useFlatPhone, useWakeLock } from "@/lib/device";
import { clearPartie, useX01Partie } from "@/lib/partie";
import { isMuted, setMuted, sounds } from "@/lib/sound";
import { Pad } from "./Pad";
import { Tableau } from "./Tableau";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const noopSubscribe = () => () => {};

export function X01Game() {
  const router = useRouter();
  const { loaded, state, push, setLastMult, undo, restart } = useX01Partie();
  const [busy, setBusy] = useState(false);
  const [animScore, setAnimScore] = useState<number | null>(null);
  const [minus, setMinus] = useState<{ id: number; text: string } | null>(null);
  const [cele, setCele] = useState<CeleSpec | null>(null);
  const [wink, setWink] = useState<string | null>(null);
  const [multFor, setMultFor] = useState<number | null>(null);
  const [view, setView] = useState<"saisie" | "tableau">("saisie");
  const [mutedChoice, setMutedState] = useState<boolean | null>(null);
  const mutedStored = useSyncExternalStore(noopSubscribe, isMuted, () => false);
  const muted = mutedChoice ?? mutedStored;
  const celeDone = useRef<(() => void) | null>(null);
  const winkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { flat, askPermission } = useFlatPhone();

  useWakeLock(true);
  // Pas de partie en cours : on part créer la partie.
  useEffect(() => {
    if (loaded && !state) router.replace("/nouvelle");
  }, [loaded, state, router]);
  // Téléphone posé à plat → vue Tableau ; repris en main → vue Saisie. Le bouton reste prioritaire jusqu'au prochain changement.
  const [prevFlat, setPrevFlat] = useState(flat);
  if (flat !== prevFlat) {
    setPrevFlat(flat);
    if (flat !== null) setView(flat ? "tableau" : "saisie");
  }

  const celebrate = useCallback(
    (spec: CeleSpec) =>
      new Promise<void>((resolve) => {
        const ms = spec.level === "max" ? 2000 : 1100;
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
        setTimeout(finish, ms);
      }),
    [],
  );

  const showWink = useCallback((text: string) => {
    setWink(text);
    if (winkTimer.current) clearTimeout(winkTimer.current);
    winkTimer.current = setTimeout(() => setWink(null), 2400);
  }, []);

  /** Fin de volée : raconte la soustraction, joue les célébrations, puis passe au suivant. */
  const finishVolley = useCallback(
    async (st: X01State) => {
      setBusy(true);
      setMultFor(null);
      const side = st.current;
      const who = currentMember(st);
      const ev = new Set<X01Event["type"]>(st.events.map((e) => e.type));

      if (st.status === "bust") {
        sounds.bust();
        await celebrate({ level: "max", tone: "bust", kicker: who, big: "Bust", numeric: false, sub: `On revient à ${st.volleyStart}`, slot: "bust" });
        showWink("Trop fort, littéralement.");
        push({ type: "next" });
        setBusy(false);
        return;
      }

      const { points } = volleyScore(st);
      const from = st.volleyStart;
      const to = st.scores[side];
      if (points > 0) {
        setMinus({ id: Date.now(), text: `−${points}` });
        await sleep(250);
        await countTo(from, to, 520, setAnimScore);
      }
      sounds.validate();

      if (ev.has("oneEighty")) {
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "cyan", kicker: who, big: "180", numeric: true, sub: "Le maximum. Rien que ça.", slot: "180" });
      } else if (ev.has("ton")) {
        sounds.ton();
        await celebrate({ level: "mid", word: "Ton-up", num: String(points) });
      } else if (ev.has("twentySix")) showWink("26… le classique.");
      else if (ev.has("threeMisses")) showWink("Trois à côté. Ça arrive aux meilleurs.");

      if (st.status === "leg" || st.status === "match") {
        sounds.win();
        await celebrate({
          level: "max",
          tone: "cyan",
          kicker: from >= 100 ? `Game shot · checkout ${from}` : "Game shot",
          big: who,
          numeric: false,
          sub: st.setup.sides[side].members.length > 1 ? st.setup.sides[side].name : undefined,
          slot: "victoire",
        });
      }

      setAnimScore(null);
      setMinus(null);
      if (st.status !== "match") push({ type: "next" });
      setBusy(false);
    },
    [celebrate, push, showWink],
  );

  // Une partie déjà terminée qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<X01State | null>(null);
  const firstSeen = useRef(false);
  useEffect(() => {
    if (!state || firstSeen.current) return;
    firstSeen.current = true;
    if (state.status === "match") handled.current = state;
  }, [state]);

  // Victoire et bust terminent la volée d'eux-mêmes (après un court délai pour pouvoir corriger Double / Triple).
  useEffect(() => {
    if (!state || busy || handled.current === state) return;
    if (state.status !== "bust" && state.status !== "leg" && state.status !== "match") return;
    const t = setTimeout(() => {
      handled.current = state;
      void finishVolley(state);
    }, 700);
    return () => clearTimeout(t);
  }, [state, busy, finishVolley]);

  if (!state) return <div className="h-dvh bg-noir" />;

  const side = state.current;
  const opts = state.setup.options;
  const who = currentMember(state);
  const { points } = volleyScore(state);
  const doubleOut = opts.finish === "double";
  const over = state.status === "match" && !busy && !cele;

  const onNumber = (n: number, m: Mult = 1) => {
    if (busy || state.status !== "open") return;
    askPermission();
    const dart: Dart = { n, m };
    push({ type: "dart", dart });
    if (n === 25 && m === 2) sounds.double();
    else sounds.dart();
    setMultFor(n >= 1 && n <= 20 ? n : null);
  };

  const onMult = (m: Mult) => {
    if (busy) return;
    setLastMult(m);
    if (m === 2) sounds.double();
    else sounds.triple();
    setMultFor(null);
  };

  const onUndo = () => {
    if (busy) return;
    undo();
    setMultFor(null);
  };

  const hint = (() => {
    if (state.volley.length) {
      const rest = state.volleyStart - points;
      if (state.status === "bust") return <b>Bust · trop haut</b>;
      return (
        <>
          Reste après la volée : <b className="text-blanc">{rest}</b>
        </>
      );
    }
    if (!state.opened[side]) return "Double in : cherche un double pour démarrer";
    const route = state.volleyStart <= 170 ? suggestCheckout(state.volleyStart, opts.finish) : null;
    if (route && (doubleOut || route.length < 3)) {
      return (
        <>
          Pour finir : <b className="text-cyan">{route.map(dartLabel).join(" · ")}</b>
        </>
      );
    }
    return "Volée en cours";
  })();

  const order = rankingX01(state);
  const leader = order[0];
  const start = opts.start;
  const shownScore = animScore ?? state.volleyStart;

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-noir">
      <div className="flex h-full flex-col px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        {/* Barre du haut */}
        <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
          <span>
            <b className="text-blanc">{start}</b> · {doubleOut ? "Double out" : "Fin simple"}
            {opts.legs > 1 && ` · M${state.leg}`}
          </span>
          <span className="flex items-center gap-2">
            Tour <b className="text-blanc">{state.turn}</b>
            <button
              type="button"
              onClick={() => {
                const v = !muted;
                setMuted(v);
                setMutedState(v);
              }}
              className="h-[30px] border-[1.5px] border-[#3a3a3a] px-2.5 text-[10px] font-bold tracking-[0.14em] text-[#cfcfcf]"
            >
              {muted ? "SON" : "MUET"}
            </button>
            <button
              type="button"
              onClick={() => setView("tableau")}
              className="h-[30px] border-[1.5px] border-[#3a3a3a] px-2.5 text-[10px] font-bold tracking-[0.14em] text-[#cfcfcf]"
            >
              TABLEAU
            </button>
          </span>
        </div>

        {/* Mini-piste : qui mène */}
        <div className="relative mt-1.5 h-[30px] shrink-0">
          <div className="absolute left-0 right-3.5 top-3.5 h-0.5 bg-filet" />
          <div className="absolute right-0 top-1 text-[9px] font-black text-gris">0</div>
          {state.setup.sides.map((s, i) => (
            <motion.div
              key={i}
              className={`skew-18 absolute top-[5px] -ml-[11px] grid h-5 w-[22px] place-items-center text-[10px] font-black italic ${
                i === side ? "z-10 bg-cyan text-noir" : i === leader ? "bg-blanc text-noir" : "bg-[#3a3a3a] text-blanc"
              }`}
              animate={{ left: `calc(${((start - state.scores[i]) / start) * 92}% + 11px)` }}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
            >
              <span className="unskew-18">{s.members.length > 1 ? s.name.slice(-1) : s.name.charAt(0)}</span>
            </motion.div>
          ))}
        </div>

        {state.setup.sides[side].members.length > 1 && (
          <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">{state.setup.sides[side].name}</div>
        )}

        {/* Joueur actif */}
        <div className="relative mt-2 h-11 shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute left-0 z-10 whitespace-nowrap text-[40px] font-black uppercase italic leading-[44px] tracking-tight"
            >
              {who}
            </motion.div>
          </AnimatePresence>
          <div className="slot-perso absolute -top-[30px] right-[-4px] z-0 flex h-[126px] w-[90px] items-end justify-center p-1.5 text-center text-[8px] font-bold uppercase tracking-[0.14em]">
            Perso 3D
            <br />« à toi »
          </div>
        </div>

        {/* Bandeau du score */}
        <div className="relative z-10 ml-1.5 mt-2 h-[104px] shrink-0">
          <div className="skew-18 absolute left-0 right-5 top-5 h-[66px] bg-cyan" />
          <div
            className={`absolute left-[18px] top-0 font-num text-[96px] leading-none text-noir ${state.status === "bust" ? "line-through decoration-[8px]" : ""}`}
          >
            {shownScore}
          </div>
          <AnimatePresence>
            {minus && (
              <motion.div
                key={minus.id}
                className="absolute right-[30px] top-9 font-num text-[34px] text-noir"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: [0, 1, 1, 0], y: [-30, 0, 0, 0], x: [0, 0, -90, -140], scale: [1, 1, 0.9, 0.6] }}
                transition={{ duration: 0.7, times: [0, 0.35, 0.75, 1], ease: [0.2, 0.8, 0.2, 1] }}
              >
                {minus.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-1 mt-1 h-4 shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-gris">{hint}</div>

        {/* Les 3 fléchettes de la volée */}
        <div className="ml-2 mr-1 mt-2.5 grid h-[42px] shrink-0 grid-cols-[1fr_1fr_1fr_60px] gap-2">
          {[0, 1, 2].map((k) => {
            const dt = state.volley[k];
            const tone = !dt ? "border-[#3a3a3a]" : dt.m === 3 ? "border-chartreuse bg-chartreuse" : dt.m === 2 && dt.n !== 0 ? "border-cyan bg-cyan" : "border-blanc";
            const txt = !dt ? "text-gris-2" : dt.m >= 2 && dt.n !== 0 ? "text-noir" : "text-blanc";
            return (
              <motion.div
                key={`${k}-${dt ? dartLabel(dt) : "x"}`}
                initial={dt ? { scale: 0.8 } : false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="grid"
              >
                {/* L'inclinaison est sur un élément à part : l'animation d'échelle ne doit pas l'écraser. */}
                <div className={`skew-18 grid place-items-center border-[1.5px] ${tone}`}>
                  <span className={`unskew-18 font-num text-[19px] ${txt}`}>{dt ? dartLabel(dt) : "—"}</span>
                </div>
              </motion.div>
            );
          })}
          <div className="grid place-items-center font-num text-2xl">{points}</div>
        </div>

        <div className="mt-auto">
          <Pad
            disabled={busy || state.status !== "open"}
            multFor={!busy && state.status !== "match" ? multFor : null}
            canValidate={state.status === "full" && !busy}
            canUndo={!busy && state.history.length + state.volley.length > 0}
            onNumber={onNumber}
            onMult={onMult}
            onUndo={onUndo}
            onValidate={() => void finishVolley(state)}
          />
        </div>
      </div>

      {/* Vue Tableau, par-dessus */}
      <AnimatePresence>
        {view === "tableau" && (
          <motion.div
            key="tab"
            className="absolute inset-0 z-20 bg-noir"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            exit={{ clipPath: "inset(100% 0 0 0)" }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Tableau state={state} onClose={() => setView("saisie")} />
          </motion.div>
        )}
      </AnimatePresence>

      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie
          state={state}
          onRevanche={() => restart(order[order.length - 1])}
          onQuit={() => clearPartie()}
        />
      )}
    </main>
  );
}

function countTo(from: number, to: number, ms: number, set: (v: number) => void) {
  return new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      set(to);
      return resolve();
    }
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      set(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** Fin de partie provisoire (le podium complet et le partage arrivent à l'étape suivante). */
function FinDePartie({ state, onRevanche, onQuit }: { state: X01State; onRevanche: () => void; onQuit: () => void }) {
  const winner = state.setup.sides[state.winner!].name;
  const best = bestVolley(state);
  const order = rankingX01(state);
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-noir px-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(22px+env(safe-area-inset-top))]">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo fixe, pas besoin d'optimisation */}
      <img src="/logo-a18.png" alt="Arena18" className="h-[30px] w-auto self-start" />
      <div className="mt-[18px] text-[52px] font-black uppercase italic leading-[0.86] tracking-tight">
        {winner}
        <br />
        <span className="text-cyan">gagne</span>
        <br />
        le {state.setup.options.start}
      </div>
      <ol className="mt-6 flex flex-col">
        {order.map((s, i) => (
          <li key={s} className="flex items-center justify-between border-t border-filet py-2.5">
            <span className="text-lg font-black uppercase italic">
              <span className={i === 0 ? "text-cyan" : "text-gris"}>{i + 1}</span> {state.setup.sides[s].name}
            </span>
            <span className="font-num text-2xl">{state.scores[s]}</span>
          </li>
        ))}
      </ol>
      {best && (
        <div className="mt-3 flex items-end justify-between border-t border-filet pt-2.5">
          <div>
            <small className="block text-[9px] font-bold uppercase tracking-[0.18em] text-gris">Volée de la partie</small>
            <span className="text-[13px] font-black uppercase italic">
              {best.member} · Tour {best.turn}
            </span>
          </div>
          <div className="font-num text-4xl leading-none text-chartreuse">{best.points}</div>
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
