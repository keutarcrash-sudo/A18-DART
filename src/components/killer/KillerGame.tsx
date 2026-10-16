"use client";
/**
 * Écran de partie du Killer (référence : docs/parcours.html, écran « Killer »).
 * 1. « Main faible ! » : chacun lance de sa main faible, on touche le numéro obtenu.
 * 2. Les joueurs sont le pavé : une tape sur un joueur = son double touché (seuls les doubles comptent).
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink, celeDuration } from "@/components/Celebration";
import { GameMenu } from "@/components/GameMenu";
import { EmptySlot, POP_PILL } from "@/components/x01/Volley";
import type { Action, Dart } from "@/engine/types";
import {
  type KillerEvent,
  type KillerState,
  applyKiller,
  currentMemberKiller,
  isOut,
  nextToNumber,
  rankingKiller,
} from "@/engine/killer";
import { useWakeLock } from "@/lib/device";
import { fitFont } from "@/lib/fit";
import { useKillerPartie } from "@/lib/partie";
import { sounds } from "@/lib/sound";
import { type T, useT } from "@/lib/i18n";
import { submitRecords } from "@/lib/records";
import { gameEntry } from "@/lib/recordEntries";
import { FinDePartie } from "@/components/podium/FinDePartie";
import type { PodiumData } from "@/components/podium/PodiumScene";

type Ev<T extends KillerEvent["type"]> = Extract<KillerEvent, { type: T }>;

function dartText(d: Dart): string {
  if (d.n === 0) return "✕";
  return (d.m === 2 ? "D" : d.m === 3 ? "T" : "") + d.n;
}

export function KillerGame() {
  const { state, push, undo, restart } = useKillerPartie();
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
  const handled = useRef<KillerState | null>(null);
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

  // Victoire : le dernier en vie, confirmée par « Valider la volée » (on peut encore corriger avant).
  const confirmWin = () => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    handled.current = state;
    const w = state.winner!;
    submitRecords([gameEntry(state.setup.sides[w].name, "killer")]);
    sounds.win();
    setBusy(true);
    void celebrate({
      level: "max",
      tone: "violet",
      kicker: t("Dernier debout"),
      big: state.setup.sides[w].members.length > 1 ? state.setup.sides[w].name : currentMemberKiller(state, w),
      numeric: false,
      sub: "Killer",
      slot: "victoire",
    }).then(() => {
      setBusy(false);
      setWonShown(true);
    });
  };

  if (!state) return <div className="h-dvh bg-creme" />;

  const sides = state.setup.sides;
  const name = (i: number) => (sides[i].members.length > 1 ? sides[i].name : sides[i].members[0]);

  // On calcule la fléchette ici pour réagir tout de suite à ce qu'elle provoque.
  const play = async (dart: Dart) => {
    if (busy) return;
    const action: Action = { type: "dart", dart };
    const next = applyKiller(state, action);
    if (next === state || next.events.length === 0) return;
    push(action);
    const ev = next.events;
    const find = <T extends KillerEvent["type"]>(t: T) => ev.find((e): e is Ev<T> => e.type === t);

    if (find("numbersDone")) {
      sounds.validate();
      showWink(t("Numéros attribués. Que le meilleur gagne !"));
      return;
    }
    if (find("numberSet")) {
      sounds.dart();
      return;
    }

    const out = find("eliminated");
    const self = find("selfHit");
    const hit = find("hit");
    const killer = find("killer");
    if (dart.m === 2) sounds.double();
    else sounds.dart();

    if (out) {
      setBusy(true);
      sounds.bust();
      await celebrate({
        level: "max",
        tone: "bust",
        kicker: out.by === out.side ? t("Son propre double") : t("Par {name}", { name: name(out.by) }),
        big: `${t("Éliminé")} · ${name(out.side)}`,
        numeric: false,
        slot: "chambrage",
      });
      setBusy(false);
    } else if (killer) {
      setBusy(true);
      sounds.ton();
      await celebrate({ level: "mid", word: t("Tueur"), num: String(next.numbers[killer.side]) });
      setBusy(false);
    } else if (self) {
      showWink(t(self.lives > 1 ? "Ton propre double… Il te reste {n} vies." : "Ton propre double… Il te reste {n} vie.", { n: self.lives }));
    } else if (hit) {
      showWink(t(hit.lives > 1 ? "{name} : plus que {n} vies." : "{name} : plus que {n} vie.", { name: name(hit.side), n: hit.lives }));
    } else if (dart.m === 2 && !next.killer[next.current]) {
      showWink(t("Pas encore tueur : vise d'abord ton double {n}.", { n: next.numbers[next.current] }));
    }
  };

  const finishVolley = async () => {
    if (state.status === "match") return confirmWin();
    if (busy || state.status !== "full") return;
    sounds.validate();
    // « Raté / Autre » peut être un simple ou un autre numéro : simple bulle, pas de fléchettes dans le bois.
    if (state.volley.length === 3 && state.volley.every((d) => d.n === 0)) showWink(t("Trois à côté. Ça arrive aux meilleurs."));
    push({ type: "next" });
  };

  const lives = state.setup.options.lives;
  const over = state.status === "match" && wonShown && !busy && !cele;
  const nothingToUndo = state.numbers.every((n) => !n);

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-creme text-encre">
      {state.status === "numbers" ? (
        <Numbers state={state} onPick={(n) => void play({ n, m: 1 })} onUndo={undo} canUndo={!nothingToUndo} onMenu={() => setMenu(true)} />
      ) : (
        <Board state={state} busy={busy} lives={lives} name={name} onPlay={(d) => void play(d)} onUndo={undo} onValidate={() => void finishVolley()} onMenu={() => setMenu(true)} />
      )}

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Killer" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie data={podiumKiller(state, name, t)} onRevanche={() => restart(rankingKiller(state)[sides.length - 1])} />
      )}
    </main>
  );
}

/* ---------- Main faible : on attribue les numéros ---------- */

const PAD_PAD =
  "px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] [@media(max-height:700px)]:pb-[calc(8px+env(safe-area-inset-bottom))] [@media(max-height:700px)]:pt-[calc(8px+env(safe-area-inset-top))]";

function Numbers({
  state,
  onPick,
  onUndo,
  canUndo,
  onMenu,
}: {
  state: KillerState;
  onPick: (n: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onMenu: () => void;
}) {
  const t = useT();
  const side = nextToNumber(state) ?? 0;
  const who = currentMemberKiller(state, side);
  const total = state.setup.sides.length;
  const done = state.numbers.filter(Boolean).length;
  const owner = (n: number) => state.numbers.indexOf(n);

  return (
    <div className={`flex h-full flex-col ${PAD_PAD}`}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-[20px] font-black">Killer</div>
          <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
            {t("Les numéros")} · {done + 1}/{total}
          </div>
        </div>
        <button type="button" onClick={onMenu} className={POP_PILL}>
          {t("MENU")}
        </button>
      </div>

      <h1 className="mt-3 font-display text-[44px] font-black uppercase leading-[0.92] tracking-tight [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-[38px]">
        {t("Main")}
        <br />
        <span className="mt-1 inline-block rounded-lg bg-ambre px-1.5">{t("faible !")}</span>
      </h1>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={side}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          className="mt-3 text-[14px] font-medium leading-snug [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-[13px]"
        >
          <b className="font-display font-black uppercase text-violet">{who}</b>, {t("lance une fléchette de ta main faible, puis touche le numéro obtenu.")}
        </motion.p>
      </AnimatePresence>

      <div className="mt-3 grid grid-cols-5 gap-2 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:gap-1.5">
        {Array.from({ length: 20 }, (_, k) => k + 1).map((n) => {
          const o = owner(n);
          const taken = o >= 0;
          return (
            <button
              key={n}
              type="button"
              disabled={taken}
              onClick={() => onPick(n)}
              aria-label={taken ? t("{n}, déjà pris par {name}", { n, name: state.setup.sides[o].name }) : t("Numéro {n}", { n })}
              className={`pad-key relative grid h-[54px] place-items-center rounded-2xl border-2 [@media(max-height:700px)]:h-[48px] ${
                taken ? "border-bord bg-muted text-attenue" : "pop-press pop-shadow-sm border-encre bg-carte text-encre"
              }`}
            >
              <span className={`font-num text-[24px] font-black leading-none ${taken ? "-translate-y-1" : ""}`}>{n}</span>
              {taken && (
                <span className="absolute inset-x-1 bottom-[3px] truncate text-center font-display text-[9px] font-extrabold uppercase text-attenue">
                  {state.setup.sides[o].name}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-attenue [@media(max-height:700px)]:mt-2">{t("Hors cible ou numéro déjà pris : on relance")}</p>

      <div className="mt-auto pt-2.5">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="pad-key pop-press h-[46px] w-full rounded-xl border-2 border-dashed border-encre bg-transparent font-display text-[13px] font-black tracking-wide text-encre disabled:opacity-40"
        >
          {t("ANNULER")}
        </button>
      </div>
    </div>
  );
}

/* ---------- La partie : les joueurs sont le pavé ---------- */

/** Étoile ambre du badge TUEUR (dessin, pas un emoji). */
function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="var(--color-ambre)" stroke="var(--color-encre)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Board({
  state,
  busy,
  lives,
  name,
  onPlay,
  onUndo,
  onValidate,
  onMenu,
}: {
  state: KillerState;
  busy: boolean;
  lives: number;
  name: (i: number) => string;
  onPlay: (d: Dart) => void;
  onUndo: () => void;
  onValidate: () => void;
  onMenu: () => void;
}) {
  const t = useT();
  const side = state.current;
  const who = currentMemberKiller(state);
  const amKiller = state.killer[side];
  const team = state.setup.sides[side].members.length > 1;
  const canThrow = !busy && state.status === "open";
  const many = state.setup.sides.length > 5;

  return (
    <div className={`flex h-full flex-col ${PAD_PAD}`}>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-display text-[20px] font-black">Killer</span>
            {team && <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-violet">{state.setup.sides[side].name}</span>}
          </div>
          <div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">
            {t(lives > 1 ? "{n} vies" : "{n} vie", { n: lives })} · {t("Tour")} {state.turn}
          </div>
        </div>
        <button type="button" onClick={onMenu} className={POP_PILL}>
          {t("MENU")}
        </button>
      </div>

      {/* Qui joue et ce qu'il doit viser */}
      <div className="mt-2 flex h-[42px] shrink-0 items-center gap-3 overflow-hidden [@media(max-height:700px)]:mt-1 [@media(max-height:700px)]:h-[36px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${side}-${who}`}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="max-w-[55%] shrink-0 truncate whitespace-nowrap font-display font-black uppercase leading-none tracking-tight"
            style={{ fontSize: fitFont(who, 30, 190) }}
          >
            {who}
          </motion.div>
        </AnimatePresence>
        <div className="min-w-0 flex-1 text-[12px] font-bold leading-tight text-attenue">
          {amKiller ? (
            <>
              <b className="font-display font-black uppercase text-violet">{t("Tueur")}</b> · {t("vise le double des autres")}
            </>
          ) : (
            <>
              {t("Vise ton")} <b className="font-display font-black text-violet">{t("double {n}", { n: state.numbers[side] })}</b> {t("pour devenir tueur")}
            </>
          )}
        </div>
      </div>

      {/* Les joueurs = le pavé */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5 pr-[3px] [@media(max-height:700px)]:gap-[5px]">
        {state.setup.sides.map((s, i) => {
          const dead = isOut(state, i);
          const active = i === side;
          const num = state.numbers[i];
          const tone = dead
            ? "border-bord bg-muted text-attenue"
            : active
              ? "pop-shadow-sm border-encre bg-violet text-white"
              : "pop-shadow-sm border-encre bg-carte text-encre";
          return (
            <button
              key={i}
              type="button"
              disabled={!canThrow || dead}
              onClick={() => onPlay({ n: num, m: 2 })}
              aria-label={t("Double {n} touché · {name}", { n: num, name: name(i) })}
              className={`pad-key ${dead ? "" : "pop-press"} flex max-h-[60px] min-h-[46px] flex-1 items-center gap-2.5 rounded-2xl border-2 px-2 text-left ${tone}`}
            >
              <span
                className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-2 font-num text-[18px] font-black leading-none ${
                  dead ? "border-attenue bg-transparent text-attenue" : active ? "border-encre bg-white text-encre" : "border-encre bg-muted text-encre"
                }`}
              >
                {num}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className={`min-w-0 truncate font-display text-[17px] font-black uppercase ${dead ? "line-through decoration-2" : ""}`}>{name(i)}</span>
                {state.killer[i] && !dead && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border-2 border-encre bg-ambre py-px pl-1 pr-1.5 font-display text-[10px] font-black uppercase tracking-[0.06em] text-encre">
                    <Star />
                    {t("Tueur")}
                  </span>
                )}
              </span>
              <span className={`flex shrink-0 items-center ${lives > 3 ? "gap-[3px]" : "gap-1"} pr-1`} aria-label={t(state.lives[i] > 1 ? "{n} vies" : "{n} vie", { n: state.lives[i] })}>
                {Array.from({ length: lives }, (_, q) => {
                  const full = !dead && q < state.lives[i];
                  const dot = full
                    ? active
                      ? "border-encre bg-white"
                      : "border-encre bg-rose"
                    : dead
                      ? "border-attenue bg-transparent"
                      : active
                        ? "border-white bg-transparent"
                        : "border-attenue bg-transparent";
                  return <i key={q} className={`block rounded-full border-2 transition-colors duration-300 ${many || lives > 3 ? "h-[14px] w-[14px]" : "h-[18px] w-[18px]"} ${dot}`} />;
                })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] font-medium leading-snug text-attenue [@media(max-height:700px)]:hidden">
        {t("Seuls les doubles comptent. Touche le joueur dont tu as touché le double, toi compris.")}
      </p>

      <div className="mt-auto flex shrink-0 flex-col gap-[6px] pt-2 [@media(max-height:700px)]:gap-[5px] [@media(max-height:700px)]:pt-1.5">
        {/* Les 3 fléchettes de la volée */}
        <div data-dart-row className="grid h-11 grid-cols-3 gap-2 [@media(max-height:700px)]:h-10">
          {[0, 1, 2].map((k) => {
            const dt = state.volley[k];
            if (!dt) return <EmptySlot key={`${k}-x`} n={k + 1} />;
            const tone = dt.m === 2 && dt.n ? "bg-ambre" : "bg-carte";
            return (
              <div key={k} className={`grid h-11 place-items-center rounded-[14px] border-2 border-encre font-display text-[18px] font-extrabold shadow-[3px_3px_0_0_var(--color-encre)] [@media(max-height:700px)]:h-10 ${tone}`}>
                {dartText(dt)}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-[6px]">
          <button
            type="button"
            disabled={!canThrow}
            onClick={() => onPlay({ n: 0, m: 1 })}
            className="pad-key pop-press pop-shadow-sm h-[46px] rounded-xl border-2 border-encre bg-muted font-display text-[12px] font-black tracking-wide text-encre disabled:opacity-40"
          >
            {t("RATÉ / AUTRE")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onUndo}
            className="pad-key pop-press h-[46px] rounded-xl border-2 border-dashed border-encre bg-transparent font-display text-[12px] font-black tracking-wide text-encre disabled:opacity-40"
          >
            {t("ANNULER")}
          </button>
        </div>
        <button
          type="button"
          disabled={(state.status !== "full" && state.status !== "match") || busy}
          onClick={onValidate}
          className="pad-key pop-press pop-shadow h-14 rounded-2xl border-2 border-encre bg-violet font-display text-[17px] font-black uppercase text-white disabled:bg-muted disabled:text-attenue disabled:opacity-100 disabled:shadow-none"
        >
          {t("Valider la volée")}
        </button>
      </div>
    </div>
  );
}

/* ---------- Fin de partie ---------- */

function podiumKiller(state: KillerState, name: (i: number) => string, t: T): PodiumData {
  const w = state.winner!;
  const lives = state.lives[w];
  return {
    title: [name(w), t("gagne"), t("le Killer")],
    ranking: rankingKiller(state).map((s) => ({ name: name(s), value: t("N° {n}", { n: state.numbers[s] }) })),
    highlight: { label: t("Dernier debout"), who: `${name(w)} · ${t("Tour")} ${state.turn}`, value: String(lives), unit: lives > 1 ? t("vies") : t("vie") },
  };
}
