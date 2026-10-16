"use client";
/**
 * Écran de partie du 301 / 501 (référence : docs/parcours.html, écran « Partie »).
 * L'interface ne connaît pas les règles : elle affiche l'état du moteur et joue ses événements.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { type Dart, type Mult, dartLabel } from "@/engine/types";
import {
  type X01Event,
  type X01State,
  bestVolley,
  currentMember,
  finishZones,
  rankingX01,
  suggestCheckout,
  volleyScore,
} from "@/engine/x01";
import { useFlatPhone, useWakeLock } from "@/lib/device";
import { useX01Partie } from "@/lib/partie";
import { fitFont } from "@/lib/fit";
import { sounds } from "@/lib/sound";
import { type T, useT } from "@/lib/i18n";
import { isDayRecord, submitRecords, useDayBest } from "@/lib/records";
import { recordsX01 } from "@/lib/recordEntries";
import { FinDePartie } from "@/components/podium/FinDePartie";
import type { PodiumData } from "@/components/podium/PodiumScene";
import { GameMenu } from "@/components/GameMenu";
import { Board } from "./Board";
import { Pad } from "./Pad";
import { Tableau } from "./Tableau";
import { DartRow, OthersGrid, POP_PILL, boardDartsOf } from "./Volley";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function X01Game() {
  const { partie, state, push, setLastMult, undo, restart } = useX01Partie();
  const t = useT();
  const [busy, setBusy] = useState(false);
  // L'écran de fin n'apparaît qu'après la célébration de la victoire.
  const [wonShown, setWonShown] = useState(false);
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
        const ms = celeDuration(spec);
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
        await celebrate({ level: "max", tone: "bust", kicker: who, big: "Bust", numeric: false, sub: t("On revient à {n}", { n: st.volleyStart }), slot: "bust" });
        showWink(t("Trop fort, littéralement."));
        push({ type: "next" });
        setBusy(false);
        return;
      }

      // Le score affiché est déjà ce qui reste (« −60 » a poppé à chaque fléchette) :
      // on laisse juste le temps de voir la volée avant de passer au suivant.
      const { points } = volleyScore(st);
      const from = st.volleyStart;
      if (points > 0) await sleep(700);
      sounds.validate();
      if (st.status === "match") submitRecords(recordsX01(st));

      const record = isDayRecord(dayBest, points);
      if (record) {
        beatDay(points);
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "chartreuse", kicker: t("Record du jour à l'Arena18"), big: String(points), numeric: true, sub: who, slot: "record" });
      } else if (ev.has("oneEighty")) {
        sounds.oneEighty();
        await celebrate({ level: "max", tone: "cyan", kicker: who, big: "180", numeric: true, sub: t("Le maximum. Rien que ça."), slot: "180" });
      } else if (ev.has("ton")) {
        sounds.ton();
        await celebrate({ level: "scene", kind: "ton", kicker: "Ton-up", num: String(points) });
      } else if (ev.has("twentySix")) showWink(t("26… le classique."));
      else if (ev.has("threeMisses")) {
        await celebrate({ level: "scene", kind: "misses", text: t("Trois à côté. Ça arrive aux meilleurs.") });
      }

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

      if (st.status !== "match") push({ type: "next" });
      else setWonShown(true);
      setBusy(false);
    },
    [celebrate, push, showWink, dayBest, beatDay, t],
  );

  // Une partie déjà terminée qu'on recharge ne rejoue pas sa célébration.
  const handled = useRef<X01State | null>(null);
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

  if (!state || !partie) return <div className="h-dvh bg-creme" />;

  const side = state.current;
  const opts = state.setup.options;
  const who = currentMember(state);
  const { points, opened } = volleyScore(state);
  const doubleOut = opts.finish === "double";
  const over = state.status === "match" && wonShown && !busy && !cele;
  const bust = state.status === "bust";
  const rest = state.volleyStart - points;
  const dartsLeft = 3 - state.volley.length;

  // Cases « pour finir » (cible + pavé) : rien sur un bust, ni une fois la volée gagnante (en attente de « Valider »).
  const zones = finishZones(rest, opts.finish, dartsLeft, opened, state.status !== "open");

  const boardDarts = boardDartsOf(partie.actions, state.volley);

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
      if (bust) return t("Bust · trop haut");
      if (state.status === "leg" || state.status === "match") return t("Pile ! Valide la volée.");
      // Encore des fléchettes à lancer : on redonne le chemin pour finir avec celles qui restent.
      const next = state.status === "open" && opened && rest <= 170 ? suggestCheckout(rest, opts.finish, dartsLeft) : null;
      if (next) return `${t("Pour finir :")} ${next.map(dartLabel).join(" · ")}`;
      return `${t("Reste après la volée :")} ${rest}`;
    }
    if (!state.opened[side]) return t("Double in : cherche un double pour démarrer");
    const route = state.volleyStart <= 170 ? suggestCheckout(state.volleyStart, opts.finish) : null;
    if (route && (doubleOut || route.length < 3)) return `${t("Pour finir :")} ${route.map(dartLabel).join(" · ")}`;
    return t("Volée en cours");
  })();

  const order = rankingX01(state);
  const leader = order[0];
  const start = opts.start;
  const nSides = state.setup.sides.length;
  // Les autres joueurs, dans l'ordre où ils vont jouer.
  const others = Array.from({ length: nSides - 1 }, (_, k) => (side + 1 + k) % nSides);
  // Pendant la volée, le score affiché est déjà ce qui reste (sauf bust : on revient au score de départ).
  const shownScore = bust ? state.volleyStart : rest;
  // Score géant, un peu plus petit à 3 chiffres pour ne jamais toucher la cible ; plus grand sur les écrans hauts.
  const scoreSize =
    String(shownScore).length >= 3
      ? "text-[70px] [@media(min-height:740px)]:text-[82px] [@media(max-width:379px)]:text-[62px]"
      : "text-[92px] [@media(min-height:740px)]:text-[104px]";
  const team = state.setup.sides[side].members.length > 1 ? state.setup.sides[side].name : null;
  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-creme text-encre">
      <div className="flex h-full flex-col px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] [@media(max-height:700px)]:pt-[calc(8px+env(safe-area-inset-top))]">
        {/* Barre du haut : jeu, volée, Tableau / Menu */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="font-display text-[20px] font-black">{start}</span>
              {team && <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-violet">{team}</span>}
            </div>
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
              {doubleOut ? "Double out" : t("Fin simple")} · {t("Volée")} {state.turn}
              {opts.legs > 1 && ` · M${state.leg}`}
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

        {/* Carte du joueur actif : nom, score géant, pour finir ; cible à droite ; les autres en bas */}
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
              <span
                className={`font-num font-black leading-[0.9] tracking-[-0.04em] ${scoreSize} ${bust ? "line-through decoration-[6px]" : ""}`}
              >
                {shownScore}
              </span>
              <AnimatePresence>
                {points > 0 && !bust && (
                  <motion.span
                    key={points}
                    className="mt-1 shrink-0 font-num text-[22px] font-black text-violet"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    −{points}
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
            <Board darts={boardDarts} zones={zones} size={128} />
          </div>
          <OthersGrid items={others.map((i) => ({ key: i, name: state.setup.sides[i].name, score: state.scores[i], lead: i === leader }))} />
        </div>

        <div className="mt-auto pt-3">
          {/* Les 3 fléchettes de la volée (Double / Triple viennent s'afficher par-dessus) */}
          <DartRow volley={state.volley} points={points} />

          <Pad
            disabled={busy || state.status !== "open"}
            multFor={!busy ? multFor : null}
            canValidate={state.status !== "open" && !busy && !wonShown}
            canUndo={!busy && state.history.length + state.volley.length > 0}
            glow={zones}
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
            className="absolute inset-0 z-20 bg-creme"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            exit={{ clipPath: "inset(100% 0 0 0)" }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Tableau
              title={
                <>
                  <b className="text-encre">{start}</b> · {t("Course vers zéro")}
                </>
              }
              who={who}
              current={side}
              rows={order.map((i) => ({
                side: i,
                name: state.setup.sides[i].name,
                value: state.scores[i],
                fill: (start - state.scores[i]) / start,
                sub: `${opts.legs > 1 ? `${t(state.legsWon[i] > 1 ? "{n} manches" : "{n} manche", { n: state.legsWon[i] })} · ` : ""}${t("{n} points marqués", { n: start - state.scores[i] })}`,
              }))}
              onClose={() => setView("saisie")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label={String(start)} />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie data={podiumX01(state, t)} onRevanche={() => restart(order[order.length - 1])} />
      )}
    </main>
  );
}

function podiumX01(state: X01State, t: T): PodiumData {
  const sides = state.setup.sides;
  const multi = state.setup.options.legs > 1;
  const best = bestVolley(state);
  return {
    title: [sides[state.winner!].name, t("gagne"), t("le {game}", { game: state.setup.options.start })],
    ranking: rankingX01(state).map((s) => ({
      name: sides[s].name,
      value: multi ? t(state.legsWon[s] > 1 ? "{n} manches" : "{n} manche", { n: state.legsWon[s] }) : s === state.winner ? undefined : t("Reste {n}", { n: state.scores[s] }),
    })),
    highlight: best ? { label: t("Volée de la partie"), who: `${best.member} · ${t("Tour")} ${best.turn}`, value: String(best.points) } : undefined,
  };
}
