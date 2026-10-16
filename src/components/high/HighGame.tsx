"use client";
/**
 * Écran de partie du Plus gros score (référence : docs/parcours.html, écran « Plus gros score »).
 * Même pavé qu'au 501, mais le score monte. « Volée 3/8 » remplace le tour.
 * La partie s'arrête toute seule après la dernière volée du dernier joueur.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { GameMenu } from "@/components/GameMenu";
import { Board } from "@/components/x01/Board";
import { Pad } from "@/components/x01/Pad";
import { Tableau } from "@/components/x01/Tableau";
import { DartRow, OthersGrid, POP_PILL, boardDartsOf } from "@/components/x01/Volley";
import type { Dart, Mult } from "@/engine/types";
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
  const { partie, state, push, setLastMult, undo, restart } = useHighPartie();
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

  // Rien ne se termine tout seul : victoire et bust attendent « Valider la volée » (on peut corriger avant).

  if (!state || !partie) return <div className="h-dvh bg-creme" />;

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
          {t("Total après la volée :")} <b>{state.volleyStart + points}</b>
        </>
      );
    }
    const best = Math.max(...state.scores.filter((_, i) => i !== side));
    const mine = state.scores[side];
    if (sides.length < 2 || top === 0) return t("Volée {n} sur {total}", { n: state.turn, total: rounds });
    if (mine === best) return t("À égalité avec le premier");
    if (mine > best)
      return (
        <>
          {t("Tu mènes de")} <b>{mine - best}</b>
        </>
      );
    return (
      <>
        {t("Pour passer devant :")} <b>{best - mine + 1}</b>
      </>
    );
  })();

  const boardDarts = boardDartsOf(partie.actions, state.volley);
  const nSides = sides.length;
  // Les autres joueurs, dans l'ordre où ils vont jouer.
  const others = Array.from({ length: nSides - 1 }, (_, k) => (side + 1 + k) % nSides);
  const scoreSize =
    String(shownScore).length >= 3
      ? "text-[70px] [@media(min-height:740px)]:text-[82px] [@media(max-width:379px)]:text-[62px] [@media(max-height:700px)]:text-[58px]"
      : "text-[92px] [@media(min-height:740px)]:text-[104px] [@media(max-height:700px)]:text-[68px]";
  const team = sides[side].members.length > 1 ? sides[side].name : null;

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-creme text-encre">
      <div className="flex h-full flex-col px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] [@media(max-height:700px)]:pt-[calc(8px+env(safe-area-inset-top))]">
        {/* Barre du haut : jeu, volée, Tableau / Menu */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-display text-[20px] font-black">{t("Plus gros score")}</span>
              {team && <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-violet">{team}</span>}
            </div>
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
              {t("Volée")} {state.turn}/{rounds}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setView("tableau")} className={POP_PILL}>
              {t("TABLEAU")}
            </button>
            <button type="button" onClick={() => setMenu(true)} className={POP_PILL}>
              {t("MENU")}
            </button>
          </div>
        </div>

        {/* Piste : qui mène (le meilleur score tout à droite) */}
        <div className="relative mt-2 h-[34px] shrink-0 px-[11px] [@media(max-height:700px)]:mt-0.5 [@media(max-height:700px)]:h-[26px]" aria-hidden="true">
          <div className="absolute left-[11px] right-[11px] top-[11px] h-1 rounded-full bg-bord" />
          <div className="relative h-full">
            {sides.map((sd, i) => {
              const isLeader = top > 0 && i === order[0];
              const tone =
                i === side
                  ? "z-10 bg-violet text-white"
                  : isLeader
                    ? "z-[5] bg-ambre text-encre"
                    : "bg-carte text-encre";
              return (
                <motion.div
                  key={i}
                  className={`absolute grid h-[22px] w-[22px] -translate-x-1/2 place-items-center rounded-full border-2 border-encre font-display text-[10px] font-black ${tone} ${isLeader && i === side ? "shadow-[0_0_0_3px_var(--color-ambre)]" : ""}`}
                  style={{ top: i % 2 ? 6 : 0 }}
                  animate={{ left: `${top > 0 ? (state.scores[i] / top) * 100 : 0}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 24 }}
                >
                  {sd.members.length > 1 ? sd.name.slice(-1) : sd.name.charAt(0)}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Carte du joueur actif : nom, score géant, point de la volée ; cible à droite ; les autres en bas */}
        <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_128px] items-center gap-x-2 rounded-3xl border-2 border-encre bg-carte px-3.5 pb-2.5 pt-3 shadow-[6px_6px_0_0_var(--color-rose)] [@media(max-height:700px)]:mt-1 [@media(max-height:700px)]:pb-1.5 [@media(max-height:700px)]:pt-2">
          <div className="min-w-0">
            <motion.div
              key={`${side}-${who}`}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex min-w-0 items-center gap-2"
            >
              <i className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-encre bg-rose" aria-hidden="true" />
              <span
                className="truncate font-display font-black uppercase leading-none tracking-tight"
                style={{ fontSize: fitFont(who, 26, 250) }}
              >
                {who}
              </span>
            </motion.div>
            <div className="mt-1 flex items-start gap-1">
              <span className={`font-num font-black leading-[0.9] tracking-[-0.04em] ${scoreSize}`}>{shownScore}</span>
              <AnimatePresence>
                {plus && (
                  <motion.span
                    key={plus.id}
                    className="mt-1 shrink-0 font-num text-[22px] font-black text-violet"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {plus.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-1.5 inline-block max-w-full rounded-2xl border-2 border-encre bg-menthe px-2.5 py-[3px] text-[12px] font-bold leading-snug">
              {hint}
            </div>
          </div>
          {/* La cible est un affichage : la fléchette qui dépasse ne doit jamais capter une tape (Menu juste au-dessus). */}
          <div className="pointer-events-none">
            <Board darts={boardDarts} zones={[]} size={128} />
          </div>
          <OthersGrid items={others.map((i) => ({ key: i, name: sides[i].name, score: state.scores[i], lead: i === order[0] && top > 0 }))} />
        </div>

        <div className="mt-auto pt-3 [@media(max-height:700px)]:pt-1.5">
          {/* Les 3 fléchettes de la volée (Double / Triple viennent s'afficher par-dessus) */}
          <DartRow volley={state.volley} points={points} />

          <Pad
            disabled={busy || state.status !== "open"}
            multFor={!busy ? multFor : null}
            canValidate={(state.status === "full" || state.status === "match") && !busy && !wonShown}
            canUndo={!busy && state.history.length + state.volley.length > 0}
            glow={[]}
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
