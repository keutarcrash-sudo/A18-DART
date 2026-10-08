"use client";
/**
 * Écran de partie du Killer (référence : docs/parcours.html, écran « Killer »).
 * 1. « Main faible ! » : chacun lance de sa main faible, on touche le numéro obtenu.
 * 2. Les joueurs sont le pavé : une tape sur un joueur = son double touché (seuls les doubles comptent).
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Celebration, type CeleSpec, Wink } from "@/components/Celebration";
import { GameMenu, MenuButton } from "@/components/GameMenu";
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

  // Victoire : le dernier en vie, après un court délai (le temps de corriger avec Annuler).
  useEffect(() => {
    if (!state || busy || handled.current === state || state.status !== "match") return;
    const t = setTimeout(() => {
      handled.current = state;
      const w = state.winner!;
      submitRecords([gameEntry(state.setup.sides[w].name, "killer")]);
      sounds.win();
      setBusy(true);
      void celebrate({
        level: "max",
        tone: "cyan",
        kicker: "Dernier debout",
        big: state.setup.sides[w].members.length > 1 ? state.setup.sides[w].name : currentMemberKiller(state, w),
        numeric: false,
        sub: "Killer",
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
      showWink("Numéros attribués. Que le meilleur gagne !");
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
        kicker: out.by === out.side ? "Son propre double" : `Par ${name(out.by)}`,
        big: `Éliminé · ${name(out.side)}`,
        numeric: false,
        slot: "chambrage",
      });
      setBusy(false);
    } else if (killer) {
      setBusy(true);
      sounds.ton();
      await celebrate({ level: "mid", word: "Tueur", num: String(next.numbers[killer.side]) });
      setBusy(false);
    } else if (self) {
      showWink(`Ton propre double… Il te reste ${self.lives} vie${self.lives > 1 ? "s" : ""}.`);
    } else if (hit) {
      showWink(`${name(hit.side)} : plus que ${hit.lives} vie${hit.lives > 1 ? "s" : ""}.`);
    } else if (dart.m === 2 && !next.killer[next.current]) {
      showWink(`Pas encore tueur : vise d'abord ton double ${next.numbers[next.current]}.`);
    }
  };

  const finishVolley = () => {
    if (busy || state.status !== "full") return;
    sounds.validate();
    if (state.volley.length === 3 && state.volley.every((d) => d.n === 0)) showWink("Trois à côté. Ça arrive aux meilleurs.");
    push({ type: "next" });
  };

  const lives = state.setup.options.lives;
  const over = state.status === "match" && wonShown && !busy && !cele;
  const nothingToUndo = state.numbers.every((n) => !n);

  return (
    <main className="relative mx-auto h-dvh max-w-[460px] overflow-hidden bg-noir">
      {state.status === "numbers" ? (
        <Numbers state={state} onPick={(n) => void play({ n, m: 1 })} onUndo={undo} canUndo={!nothingToUndo} onMenu={() => setMenu(true)} />
      ) : (
        <Board state={state} busy={busy} lives={lives} name={name} onPlay={(d) => void play(d)} onUndo={undo} onValidate={finishVolley} onMenu={() => setMenu(true)} />
      )}

      <GameMenu open={menu} onClose={() => setMenu(false)} onRestart={() => restart(state.setup.firstSide)} label="Killer" />
      <Wink text={wink} />
      <Celebration spec={cele} onDone={() => celeDone.current?.()} />

      {over && state.winner !== null && (
        <FinDePartie data={podiumKiller(state, name)} onRevanche={() => restart(rankingKiller(state)[sides.length - 1])} />
      )}
    </main>
  );
}

/* ---------- Main faible : on attribue les numéros ---------- */

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
  const side = nextToNumber(state) ?? 0;
  const who = currentMemberKiller(state, side);
  const total = state.setup.sides.length;
  const done = state.numbers.filter(Boolean).length;
  const owner = (n: number) => state.numbers.indexOf(n);

  return (
    <div className="flex h-full flex-col px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
        <span>
          <b className="text-blanc">Killer</b> · Les numéros
        </span>
        <span className="flex items-center gap-2">
          <span>
            <b className="text-blanc">{done + 1}</b>/{total}
          </span>
          <MenuButton onClick={onMenu} />
        </span>
      </div>

      <h1 className="mt-4 text-[44px] font-black uppercase italic leading-[0.9] tracking-tight">
        Main
        <br />
        faible !
      </h1>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={side}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-2 text-[13px] leading-normal text-[#bdbdbd]"
        >
          <b className="font-black uppercase italic text-cyan">{who}</b>, lance une fléchette de ta main faible, puis touche le numéro obtenu.
        </motion.p>
      </AnimatePresence>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 20 }, (_, k) => k + 1).map((n) => {
          const o = owner(n);
          return (
            <button
              key={n}
              type="button"
              disabled={o >= 0}
              onClick={() => onPick(n)}
              aria-label={o >= 0 ? `${n}, déjà pris par ${state.setup.sides[o].name}` : `Numéro ${n}`}
              className="relative grid h-[52px] place-items-center bg-case active:bg-blanc active:text-noir disabled:bg-transparent disabled:outline disabled:outline-[1.5px] disabled:-outline-offset-[1.5px] disabled:outline-filet"
            >
              <span className={`font-num text-[24px] leading-none ${o >= 0 ? "text-gris-2" : ""}`}>{n}</span>
              {o >= 0 && (
                <span className="absolute inset-x-1 bottom-1 truncate text-center text-[8px] font-black uppercase italic text-gris">
                  {state.setup.sides[o].name}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-gris">Hors cible ou numéro déjà pris : on relance</p>

      <div className="mt-auto pt-2.5">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="h-[46px] w-full border-[1.5px] border-[#3a3a3a] text-[12px] font-black tracking-wide text-[#cfcfcf] active:bg-case disabled:opacity-30"
        >
          ANNULER
        </button>
      </div>
    </div>
  );
}

/* ---------- La partie : les joueurs sont le pavé ---------- */

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
  const side = state.current;
  const who = currentMemberKiller(state);
  const amKiller = state.killer[side];
  const team = state.setup.sides[side].members.length > 1;
  const canThrow = !busy && state.status === "open";

  return (
    <div className="flex h-full flex-col px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <div className="flex min-h-6 items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
        <span>
          <b className="text-blanc">Killer</b> · {lives} vie{lives > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-2">
          Tour <b className="text-blanc">{state.turn}</b>
          <MenuButton onClick={onMenu} />
        </span>
      </div>

      {team && <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan">{state.setup.sides[side].name}</div>}

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
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gris">
        {amKiller ? (
          <>
            <b className="text-cyan">Tueur</b> · vise le double des autres
          </>
        ) : (
          <>
            Vise ton <b className="text-cyan">double {state.numbers[side]}</b> pour devenir tueur
          </>
        )}
      </div>

      {/* Les joueurs = le pavé */}
      <div className="mt-2.5 flex min-h-0 flex-1 flex-col gap-1">
        {state.setup.sides.map((s, i) => {
          const dead = isOut(state, i);
          const active = i === side;
          const num = state.numbers[i];
          return (
            <button
              key={i}
              type="button"
              disabled={!canThrow || dead}
              onClick={() => onPlay({ n: num, m: 2 })}
              aria-label={`Double ${num} touché · ${name(i)}`}
              className={`flex max-h-[56px] min-h-[40px] flex-1 items-stretch text-left outline-offset-[-1.5px] active:bg-[#303030] ${
                active ? "bg-case outline outline-[1.5px] outline-cyan" : "bg-case"
              } ${dead ? "opacity-35" : ""}`}
            >
              <span className={`grid w-[52px] shrink-0 place-items-center font-num text-[26px] ${active ? "bg-cyan text-noir" : "bg-[#2c2c2c]"}`}>
                {num}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <span className={`min-w-0 truncate text-[17px] font-black uppercase italic ${dead ? "line-through decoration-2" : ""}`}>{name(i)}</span>
                {state.killer[i] && !dead && (
                  <span className="shrink-0 bg-blanc px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-noir">Tueur</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-[3px] pr-3" aria-label={`${state.lives[i]} vie${state.lives[i] > 1 ? "s" : ""}`}>
                {Array.from({ length: lives }, (_, q) => (
                  <i
                    key={q}
                    className={`skew-18 block h-[18px] w-[7px] transition-colors duration-300 ${q < state.lives[i] ? "bg-blanc" : "bg-[#3a3a3a]"}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gris">Seuls les doubles comptent. Touche le joueur dont tu as touché le double, toi compris.</p>

      {/* Les 3 fléchettes de la volée */}
      <div className="mx-1 mt-2 grid h-[40px] shrink-0 grid-cols-3 gap-2">
        {[0, 1, 2].map((k) => {
          const dt = state.volley[k];
          const tone = !dt ? "border-[#3a3a3a]" : dt.m === 2 && dt.n ? "border-cyan bg-cyan" : "border-blanc";
          const txt = !dt ? "text-gris-2" : dt.m === 2 && dt.n ? "text-noir" : "text-blanc";
          return (
            <div key={k} className={`skew-18 grid place-items-center border-[1.5px] ${tone}`}>
              <span className={`unskew-18 font-num text-[19px] ${txt}`}>{dt ? dartText(dt) : "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-[5px] pt-2.5">
        <div className="grid grid-cols-[2fr_1fr] gap-[5px]">
          <button
            type="button"
            disabled={!canThrow}
            onClick={() => onPlay({ n: 0, m: 1 })}
            className="h-[46px] bg-case text-[12px] font-black tracking-wide active:bg-blanc active:text-noir disabled:opacity-40"
          >
            RATÉ / AUTRE
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onUndo}
            className="h-[46px] border-[1.5px] border-[#3a3a3a] text-[12px] font-black tracking-wide text-[#cfcfcf] active:bg-case disabled:opacity-30"
          >
            ANNULER
          </button>
        </div>
        <button
          type="button"
          disabled={state.status !== "full" || busy}
          onClick={onValidate}
          style={{ "--h": "56px" } as React.CSSProperties}
          className="btn-18 h-14 bg-blanc text-[17px] font-black uppercase italic text-noir active:bg-cyan disabled:bg-case disabled:text-gris-2"
        >
          Valider la volée
        </button>
      </div>
    </div>
  );
}

/* ---------- Fin de partie ---------- */

function podiumKiller(state: KillerState, name: (i: number) => string): PodiumData {
  const w = state.winner!;
  const lives = state.lives[w];
  return {
    title: [name(w), "gagne", "le Killer"],
    ranking: rankingKiller(state).map((s) => ({ name: name(s), value: `N° ${state.numbers[s]}` })),
    highlight: { label: "Dernier debout", who: `${name(w)} · Tour ${state.turn}`, value: String(lives), unit: lives > 1 ? "vies" : "vie" },
  };
}
