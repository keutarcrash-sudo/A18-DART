"use client";
/**
 * Écran de partie du Plus gros score (référence : docs/parcours.html, écran « Plus gros score »).
 * Même pavé qu'au 501, mais le score monte. « Volée 3/8 » remplace le tour.
 * La partie s'arrête toute seule après la dernière volée du dernier joueur.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { GameMenu, MenuButton } from "@/components/GameMenu";
import { Pad } from "@/components/x01/Pad";
import { Tableau } from "@/components/x01/Tableau";
import { type Dart, type Mult, dartLabel } from "@/engine/types";
import { type HighEvent, type HighState, bestHighVolley, currentMemberHigh, highRounds, rankingHigh } from "@/engine/high";
import { useFlatPhone, useWakeLock } from "@/lib/device";
import { fitFont } from "@/lib/fit";
import { useHighPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";
import { type T, useT } from "@/lib/i18n";
import { isDayRecord, submitRecords, useDayBest } from "@/lib/records";
import { recordsHigh } from "@/lib/recordEntries";
import { FinDePartie } from "@/components/podium/FinDePartie";
import type { PodiumData } from "@/components/podium/PodiumScene";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function HighGame() {
  const { state, push, setLastMult, undo, restart } = useHighPartie();
  const t = useT();
  const [busy, setBusy] = useState(false);
  // L'écran de fin n'apparaît qu'après la célébration de la victoire.
  const [wonShown, setWonShown] = useState(false);
  const [animScore, setAnimScore] = useState<number | null>(null);
  const [plus, setPlus] = useState<{ id: number; text: string } | null>(null);
  const [cele, setCele] = useState<CeleSpec | null>(null);
  const [wink, setWink] = useState<string | null>(null);
  const [multFor, setMultFor] = useState<number | null>(null);
  const [view, setView] = useState<"saisie" | "tableau">("saisie");
  const [menu, setMenu] = useState(false);
  const celeDone = useRef<(() => void) | null>(null);
  const winkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { flat, askPermission } = useFlatPhone();
  const { best: dayBest, beat: beatDay } = useDayBest();

  useWakeLock(true);
  // Téléphone posé à plat → vue Tableau ; repris en main → vue Saisie. Le bouton reste prioritaire jusqu'au prochain changement.
  const [prevFlat, setPrevFlat] = useState(flat);
  if (flat !== prevFlat) {
    setPrevFlat(flat);
    if (flat !== null) setView(flat ? "tableau" : "saisie");
  }

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

  /** Fin de volée : le score monte, les célébrations, puis joueur suivant (ou fin de partie). */
  const finishVolley = useCallback(
    async (st: HighState) => {
      setBusy(true);
      setMultFor(null);
      const side = st.current;
      const who = currentMemberHigh(st);
      const find = <T extends HighEvent["type"]>(t: T) => st.events.find((e): e is Extract<HighEvent, { type: T }> => e.type === t);
      const from = st.volleyStart;
      const to = st.scores[side];
      const points = to - from;

      if (points > 0) {
        setPlus({ id: Date.now(), text: `+${points}` });
        await sleep(250);
        await countTo(from, to, 520, setAnimScore);
      }
      sounds.validate();
      if (st.status === "match") submitRecords(recordsHigh(st));

      const record = isDayRecord(dayBest, points);
      if (record) {
        beatDay(points);
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "chartreuse", kicker: t("Record du jour à l'Arena18"), big: String(points), numeric: true, sub: who, slot: "record" });
      } else if (find("oneEighty")) {
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "cyan", kicker: who, big: "180", numeric: true, sub: t("Le maximum. Rien que ça."), slot: "180" });
      } else if (find("ton")) {
        sounds.ton();
        await celebrate({ level: "scene", kind: "ton", kicker: "Ton-up", num: String(points) });
      } else if (find("twentySix")) showWink(t("26… le classique."));
      else if (find("threeMisses")) {
        await celebrate({ level: "scene", kind: "misses", text: t("Trois à côté. Ça arrive aux meilleurs.") });
      }
      else if (find("takesLead") && st.status !== "match") showWink(t("{name} passe devant.", { name: st.setup.sides[side].name }));

      const won = find("matchWon");
      if (won) {
        sounds.win();
        const names = won.sides.map((i) => st.setup.sides[i].name);
        await celebrate(
          names.length > 1
            ? { level: "max", tone: "cyan", kicker: t("{n} points chacun", { n: st.scores[won.sides[0]] }), big: t("Égalité"), numeric: false, sub: names.join(" · "), slot: "victoire" }
            : { level: "max", tone: "cyan", kicker: `${t("Plus gros score")} · ${st.scores[won.sides[0]]}`, big: names[0], numeric: false, slot: "victoire" },
        );
      }

      setAnimScore(null);
      setPlus(null);
      if (st.status !== "match") push({ type: "next" });
      else setWonShown(true);
      setBusy(false);
    },
    [celebrate, push, showWink, dayBest, beatDay, t],
  );

  // Une partie déjà finie qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<HighState | null>(null);
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
  // Annuler ou recommencer après la fin : on revient en jeu.
  if (wonShown && state && state.status !== "match") setWonShown(false);

  // La dernière volée termine la partie d'elle-même (court délai pour corriger Double / Triple).
  useEffect(() => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    const t = setTimeout(() => {
      handled.current = state;
      void finishVolley(state);
    }, 700);
    return () => clearTimeout(t);
  }, [state, busy, finishVolley]);

  if (!state) return <div className="h-dvh bg-noir" />;

  const sides = state.setup.sides;
  const side = state.current;
  const who = currentMemberHigh(state);
  const rounds = highRounds(state.setup);
  const points = state.volley.reduce((a, d) => a + d.n * d.m, 0);
  const over = state.status === "match" && wonShown && !busy && !cele;
  const order = rankingHigh(state);
  const top = Math.max(...state.scores);
  const shownScore = animScore ?? state.volleyStart;

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

  const hint = (() => {
    if (state.volley.length) {
      return (
        <>
          {t("Total après la volée :")} <b className="text-blanc">{state.volleyStart + points}</b>
        </>
      );
    }
    const others = Math.max(...state.scores.filter((_, i) => i !== side));
    const mine = state.scores[side];
    if (sides.length < 2 || top === 0) return t("Volée {n} sur {total}", { n: state.turn, total: rounds });
    if (mine === others) return t("À égalité avec le premier");
    if (mine > others)
      return (
        <>
          {t("Tu mènes de")} <b className="text-cyan">{mine - others}</b>
        </>
      );
    return (
      <>
        {t("Pour passer devant :")} <b className="text-cyan">{others - mine + 1}</b>
      </>
    );
  })();

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-noir">
      <div className="flex h-full flex-col px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        {/* Barre du haut */}
        <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
          <span>
            <b className="text-blanc">{t("Plus gros score")}</b>
            <br />
            {t("Volée")} <b className="text-blanc">{state.turn}</b>/{rounds}
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("tableau")}
              className="h-[30px] border-[1.5px] border-[#3a3a3a] px-2.5 text-[10px] font-bold tracking-[0.14em] text-[#cfcfcf]"
            >
              {t("TABLEAU")}
            </button>
            <MenuButton onClick={() => setMenu(true)} />
          </span>
        </div>

        {/* Mini-piste : qui mène (le meilleur score tout à droite) */}
        <div className="relative mt-1.5 h-[30px] shrink-0">
          <div className="absolute left-0 right-3.5 top-3.5 h-0.5 bg-filet" />
          {sides.map((s, i) => (
            <motion.div
              key={i}
              className={`skew-18 absolute top-[5px] -ml-[11px] grid h-5 w-[22px] place-items-center text-[10px] font-black italic ${
                i === side ? "z-10 bg-cyan text-noir" : i === order[0] && top > 0 ? "bg-blanc text-noir" : "bg-[#3a3a3a] text-blanc"
              }`}
              animate={{ left: `calc(${top > 0 ? (state.scores[i] / top) * 92 : 0}% + 11px)` }}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
            >
              <span className="unskew-18">{s.members.length > 1 ? s.name.slice(-1) : s.name.charAt(0)}</span>
            </motion.div>
          ))}
        </div>

        {sides[side].members.length > 1 && <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">{sides[side].name}</div>}

        {/* Joueur actif */}
        <div className="relative mt-2 h-11 shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute bottom-0 left-0 z-10 whitespace-nowrap font-black uppercase italic leading-none tracking-tight"
              style={{ fontSize: fitFont(who, 40, 34) }}
            >
              {who}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bandeau du score : il monte */}
        <div className="relative z-10 ml-1.5 mt-2 h-[104px] shrink-0">
          <div className="skew-18 absolute left-0 right-5 top-5 h-[66px] bg-cyan" />
          <div className="absolute left-[18px] top-0 font-num text-[96px] leading-none text-noir">{shownScore}</div>
          <AnimatePresence>
            {plus && (
              <motion.div
                key={plus.id}
                className="absolute right-[30px] top-9 font-num text-[34px] text-noir"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: [0, 1, 1, 0], y: [-30, 0, 0, 0], x: [0, 0, -90, -140], scale: [1, 1, 0.9, 0.6] }}
                transition={{ duration: 0.7, times: [0, 0.35, 0.75, 1], ease: [0.2, 0.8, 0.2, 1] }}
              >
                {plus.text}
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
            onUndo={() => {
              if (busy) return;
              undo();
              setMultFor(null);
            }}
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
            <Tableau
              title={
                <>
                  <b className="text-blanc">{t("Plus gros score")}</b> · {t("Volée")} {state.turn}/{rounds}
                </>
              }
              who={who}
              current={side}
              rows={order.map((i) => {
                const n = state.history.filter((v) => v.side === i).length;
                return {
                  side: i,
                  name: sides[i].name,
                  value: state.scores[i],
                  fill: top > 0 ? state.scores[i] / top : 0,
                  sub: `${t(n > 1 ? "{n} volées sur {total}" : "{n} volée sur {total}", { n, total: rounds })}${n ? ` · ${t("moyenne {n}", { n: Math.round(state.scores[i] / n) })}` : ""}`,
                };
              })}
              onClose={() => setView("saisie")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Plus gros score" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && <FinDePartie data={podiumHigh(state, t)} onRevanche={() => restart(order[order.length - 1])} />}
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

function podiumHigh(state: HighState, t: T): PodiumData {
  const sides = state.setup.sides;
  const best = bestHighVolley(state);
  const tie = state.winners.length > 1;
  return {
    title: tie ? [t("Égalité"), t("au"), t("Plus gros score")] : [sides[state.winners[0]].name, t("gagne"), t("le Plus gros score")],
    ranking: rankingHigh(state).map((s) => ({ name: sides[s].name, value: `${state.scores[s]} pts` })),
    highlight: best ? { label: t("Volée de la partie"), who: `${best.member} · ${t("Volée")} ${best.turn}`, value: String(best.points) } : undefined,
  };
}
