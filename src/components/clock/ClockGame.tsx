"use client";
/**
 * Écran de partie du Tour de l'horloge (référence : docs/parcours.html, écran « Horloge »).
 * Le numéro visé en géant, deux énormes boutons TOUCHÉ / RATÉ (en Bonus : Simple / Double / Triple).
 * La volée passe toute seule après la 3e fléchette.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { GameMenu } from "@/components/GameMenu";
import { EmptySlot, POP_PILL } from "@/components/x01/Volley";
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
import { useClockPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";
import { type T, useT } from "@/lib/i18n";
import { submitRecords } from "@/lib/records";
import { gameEntry } from "@/lib/recordEntries";
import { FinDePartie } from "@/components/podium/FinDePartie";
import type { PodiumData } from "@/components/podium/PodiumScene";

const targetText = (n: number) => (n === 25 ? "BULL" : String(n));

export function ClockGame() {
  const { partie, state, push, undo, restart } = useClockPartie();
  const t = useT();
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
        setTimeout(finish, celeDuration(spec));
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

  // Victoire, confirmée par « Valider la volée » (on peut encore corriger avec Annuler avant).
  const confirmWin = () => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    handled.current = state;
    const w = state.winner!;
    submitRecords([gameEntry(state.setup.sides[w].name, "clock")]);
    sounds.win();
    setBusy(true);
    void celebrate({
      level: "max",
      tone: "violet",
      kicker: t("Le tour complet · tour {n}", { n: state.winTurn ?? 0 }),
      big: state.setup.sides[w].members.length > 1 ? state.setup.sides[w].name : currentMemberClock(state, w),
      numeric: false,
      sub: t("Tour de l'horloge"),
      slot: "victoire",
    }).then(() => {
      setBusy(false);
      setWonShown(true);
    });
  };

  if (!state) return <div className="h-dvh bg-creme" />;

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
      await celebrate({ level: "mid", word: t("Sans faute"), num: "3/3" });
      setBusy(false);
    } else if (has("bullNext")) {
      showWink(t("Plus que le bull. Respire."));
    } else if (has("threeMisses")) {
      // « Raté » = le numéro visé est manqué, pas forcément la cible : simple bulle.
      showWink(t("Trois à côté. Ça arrive aux meilleurs."));
    }
  };

  const hit = (m: Mult) => void play({ n: target, m });

  const bullTarget = target === 25;
  const huge = "pad-key pop-press pop-shadow h-[84px] [@media(max-height:700px)]:h-[72px] rounded-3xl border-2 border-encre font-display font-black uppercase leading-tight text-encre disabled:opacity-40";

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-creme text-encre">
      <div className="flex h-full flex-col px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] [@media(max-height:700px)]:pb-[calc(8px+env(safe-area-inset-bottom))] [@media(max-height:700px)]:pt-[calc(8px+env(safe-area-inset-top))]">
        {/* Barre du haut : jeu, réglages, tour, Menu */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-display text-[20px] font-black">{t("Horloge")}</span>
              {team && <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-violet">{sides[side].name}</span>}
            </div>
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
              {bonus && `${t("Bonus")} · `}
              {bullFinish ? t("Fin au bull") : t("Fin au 20")} · {t("Tour")} {state.turn}
            </div>
          </div>
          <button type="button" onClick={() => setMenu(true)} className={POP_PILL}>
            {t("MENU")}
          </button>
        </div>

        {/* Joueur actif */}
        <div className="mt-2.5 flex h-[46px] shrink-0 items-center rounded-3xl border-2 border-encre bg-carte px-3.5 shadow-[4px_4px_0_0_var(--color-rose)] [@media(max-height:700px)]:mt-1.5 [@media(max-height:700px)]:h-[40px]">
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
              <span className="truncate whitespace-nowrap font-display font-black uppercase leading-none tracking-tight" style={{ fontSize: fitFont(who, 26, 90) }}>
                {who}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Le numéro visé, en géant dans un cercle */}
        <div className="mt-2.5 flex shrink-0 flex-col items-center [@media(max-height:700px)]:mt-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-attenue">{t("Vise le")}</span>
          <div className="pop-shadow relative mt-1 h-[168px] w-[168px] overflow-hidden rounded-full border-2 border-encre bg-ambre [@media(max-height:700px)]:h-[124px] [@media(max-height:700px)]:w-[124px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${side}-${target}`}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`absolute inset-0 grid place-items-center font-num font-black leading-none tracking-[-0.03em] text-encre ${
                  bullTarget ? "text-[56px] [@media(max-height:700px)]:text-[42px]" : "text-[104px] [@media(max-height:700px)]:text-[76px]"
                }`}
              >
                {targetText(target)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* La course : une pastille par numéro */}
        <div className="mt-3 flex shrink-0 flex-col gap-1 [@media(max-height:700px)]:mt-2" style={{ paddingRight: 3 }}>
          {sides.map((s, i) => {
            const me = i === side;
            return (
              <div key={i} className="flex items-center gap-2" aria-label={t("{name} : vise le {n}", { name: s.name, n: targetText(targetAt(state.pos[i])) })}>
                <span className={`w-[78px] shrink-0 truncate font-display text-[12px] font-black uppercase ${me ? "text-violet" : "text-encre"}`}>{s.name}</span>
                <span className="flex flex-1 gap-[2px]">
                  {Array.from({ length: end }, (_, q) => {
                    const on = q < state.pos[i];
                    const tone = on
                      ? q === 20
                        ? "border-encre bg-ambre"
                        : me
                          ? "border-encre bg-violet"
                          : "border-encre bg-encre"
                      : "border-attenue bg-transparent";
                    return <i key={q} className={`block aspect-square min-w-0 flex-1 rounded-full border-[1.5px] transition-colors duration-300 ${tone}`} />;
                  })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex shrink-0 flex-col gap-2 pt-2 [@media(max-height:700px)]:gap-1.5 [@media(max-height:700px)]:pt-1.5">
          {/* Les 3 fléchettes de la volée */}
          <div data-dart-row className="grid h-11 grid-cols-3 gap-2 [@media(max-height:700px)]:h-10">
            {[0, 1, 2].map((k) => {
              const dt = state.volley[k];
              if (!dt) return <EmptySlot key={`${k}-x`} n={k + 1} />;
              const ok = dt.n > 0;
              const tone = dt.m === 3 && ok ? "bg-rose" : dt.m === 2 && ok ? "bg-ambre" : "bg-carte";
              return (
                <div key={k} className={`grid h-11 place-items-center rounded-[14px] border-2 border-encre font-display text-[18px] font-extrabold shadow-[3px_3px_0_0_var(--color-encre)] [@media(max-height:700px)]:h-10 ${tone} ${ok ? "" : "text-attenue"}`}>
                  {ok ? dartLabel(dt) : "✕"}
                </div>
              );
            })}
          </div>

          {/* Deux énormes boutons */}
          {state.status === "match" ? (
            <button
              type="button"
              disabled={busy}
              onClick={confirmWin}
              className="pad-key pop-press pop-shadow h-[84px] rounded-3xl border-2 border-encre bg-violet font-display text-[24px] font-black uppercase text-white disabled:bg-muted disabled:text-attenue disabled:opacity-100 disabled:shadow-none [@media(max-height:700px)]:h-[72px]"
            >
              {t("Valider la volée")}
            </button>
          ) : bonus ? (
            <div className={`grid gap-2 ${bullTarget ? "grid-cols-2" : "grid-cols-3"}`}>
              <button type="button" disabled={!canThrow} onClick={() => hit(1)} className={`${huge} bg-carte text-[15px]`}>
                {t("Simple")}
                <br />
                {bullTarget ? "25" : target}
              </button>
              <button type="button" disabled={!canThrow} onClick={() => hit(2)} className={`${huge} bg-ambre text-[15px]`}>
                {t("Double")}
                <br />
                {bullTarget ? "Bull" : target}
              </button>
              {!bullTarget && (
                <button type="button" disabled={!canThrow} onClick={() => hit(3)} className={`${huge} bg-rose text-[15px]`}>
                  {t("Triple")}
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
              className="pad-key pop-press pop-shadow h-[84px] rounded-3xl border-2 border-encre bg-violet font-display text-[28px] font-black uppercase text-white disabled:opacity-40 [@media(max-height:700px)]:h-[72px]"
            >
              {bullTarget ? t("Touché le bull") : t("Touché {n}", { n: target })}
            </button>
          )}
          <button
            type="button"
            disabled={!canThrow}
            onClick={() => void play({ n: 0, m: 1 })}
            className="pad-key pop-press pop-shadow-sm h-16 rounded-full border-2 border-encre bg-carte font-display text-[22px] font-black uppercase text-encre disabled:opacity-40 [@media(max-height:700px)]:h-[56px]"
          >
            {t("Raté")}
          </button>
          <button
            type="button"
            disabled={busy || !partie?.actions.length}
            onClick={undo}
            className="pad-key pop-press h-[46px] rounded-xl border-2 border-dashed border-encre bg-transparent font-display text-[12px] font-black uppercase tracking-[0.08em] text-encre disabled:opacity-40"
          >
            {t("Annuler la dernière fléchette")}
          </button>
        </div>
      </div>

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Horloge" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie data={podiumClock(state, t)} onRevanche={() => restart(rankingClock(state)[sides.length - 1])} />
      )}
    </main>
  );
}

function podiumClock(state: ClockState, t: T): PodiumData {
  const sides = state.setup.sides;
  const end = clockLength(state.setup);
  const winner = sides[state.winner!].name;
  return {
    title: [winner, t("gagne"), t("le Tour de l'horloge")],
    ranking: rankingClock(state).map((s) => ({
      name: sides[s].name,
      value: state.pos[s] >= end ? t("Arrivé") : t("Au {n}", { n: targetText(targetAt(state.pos[s])) }),
    })),
    highlight: { label: t("Tours pour finir"), who: winner, value: String(state.winTurn) },
  };
}
