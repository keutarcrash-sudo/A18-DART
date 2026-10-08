"use client";
/**
 * Création d'une partie : Joueurs → Jeu → Réglages → Au bull → Partie.
 * Un écran = une question (docs/02-principes-ux.md).
 */
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Cta, Screen, Seg, Title, TopBar } from "@/components/ui";
import { DEFAULT_X01_OPTIONS, type X01Options } from "@/engine/x01";
import { type CricketMode, DEFAULT_CRICKET_OPTIONS } from "@/engine/cricket";
import type { Side } from "@/engine/types";
import { GAMES, type GameInfo, estimateMinutes } from "@/lib/games";
import { savePartie } from "@/lib/partie";
import { cleanName, loadRecents, rememberNames, uniqueName } from "@/lib/recents";

type Step = "players" | "game" | "options" | "bull";
interface Player {
  name: string;
  team: "A" | "B";
}

const MAX_PLAYERS = 8;

export function NewGame() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState(false);
  const [game, setGame] = useState<GameInfo>(GAMES[0]);
  const [opts, setOpts] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketMode, setCricketMode] = useState<CricketMode>(DEFAULT_CRICKET_OPTIONS.mode);

  const sides: Side[] = teams
    ? (["A", "B"] as const)
        .map((t) => ({ name: `Équipe ${t}`, members: players.filter((p) => p.team === t).map((p) => p.name) }))
        .filter((s) => s.members.length > 0)
    : players.map((p) => ({ name: p.name, members: [p.name] }));

  const start = (firstSide: number, firstMember?: string) => {
    const ordered = sides.map((s, i) =>
      i === firstSide && firstMember ? { ...s, members: [firstMember, ...s.members.filter((m) => m !== firstMember)] } : s,
    );
    rememberNames(players.map((p) => p.name));
    if (game.id === "cricket") {
      savePartie({ kind: "cricket", setup: { sides: ordered, options: { mode: cricketMode }, firstSide }, actions: [] });
    } else {
      savePartie({
        kind: "x01",
        setup: { sides: ordered, options: { ...opts, start: Number(game.id) as X01Options["start"] }, firstSide },
        actions: [],
      });
    }
    router.push("/partie");
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {step === "players" && (
          <Players
            players={players}
            setPlayers={setPlayers}
            teams={teams}
            setTeams={setTeams}
            onBack={() => router.push("/")}
            onNext={() => setStep("game")}
          />
        )}
        {step === "game" && (
          <Games
            count={players.length}
            label={teams ? `${sides.length} équipes` : `${players.length} joueur${players.length > 1 ? "s" : ""}`}
            onBack={() => setStep("players")}
            onPick={(g) => {
              setGame(g);
              setStep("options");
            }}
          />
        )}
        {step === "options" && (
          <Options
            game={game}
            opts={opts}
            setOpts={setOpts}
            cricketMode={cricketMode}
            setCricketMode={setCricketMode}
            onBack={() => setStep("game")}
            onNext={() => setStep("bull")}
          />
        )}
        {step === "bull" && (
          <Bull
            players={players}
            sides={sides}
            onBack={() => setStep("options")}
            onPick={(name) => {
              const side = sides.findIndex((s) => s.members.includes(name));
              start(Math.max(0, side), name);
            }}
            onSkip={() => start(0)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------- 1. Joueurs ---------- */

function Players({
  players,
  setPlayers,
  teams,
  setTeams,
  onBack,
  onNext,
}: {
  players: Player[];
  setPlayers: (p: Player[]) => void;
  teams: boolean;
  setTeams: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du téléphone
  useEffect(() => setRecents(loadRecents()), []);

  const names = players.map((p) => p.name);
  const add = (raw: string) => {
    const n = cleanName(raw);
    if (!n || players.length >= MAX_PLAYERS) return;
    setPlayers([...players, { name: uniqueName(n, names), team: players.length % 2 ? "B" : "A" }]);
  };
  const free = recents.filter((r) => !names.includes(r)).slice(0, 5);
  const teamsOk = !teams || (players.some((p) => p.team === "A") && players.some((p) => p.team === "B"));

  return (
    <Screen>
      <TopBar
        onBack={onBack}
        left={
          <>
            Étape <b className="mx-1 text-blanc">1</b>/3
          </>
        }
        right={`${players.length} joueur${players.length > 1 ? "s" : ""}`}
      />
      <Title>Qui joue ?</Title>

      <form
        className="mt-[18px] flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
          setDraft("");
          input.current?.focus();
        }}
      >
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={14}
          placeholder="Prénom"
          enterKeyHint="next"
          autoComplete="off"
          aria-label="Prénom du joueur"
          disabled={players.length >= MAX_PLAYERS}
          className="h-[54px] min-w-0 flex-1 border-b-2 border-cyan bg-case px-3.5 text-xl font-black uppercase italic text-blanc outline-none placeholder:normal-case placeholder:text-gris-2"
        />
        <button type="submit" className="w-[62px] bg-cyan text-[15px] font-black italic text-noir active:bg-blanc">
          OK
        </button>
      </form>

      {free.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <small className="mr-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gris">Récents sur ce téléphone</small>
          {free.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => add(r)}
              className="border-[1.5px] border-[#3a3a3a] px-2.5 py-1.5 text-xs font-bold text-[#d0d0d0] active:bg-case"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col">
        {players.length === 0 && (
          <p className="border-b border-filet py-5 text-[13px] leading-relaxed text-gris">
            Tape un prénom puis OK. Seul, ça marche aussi : idéal pour s&apos;entraîner.
          </p>
        )}
        {players.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex h-[52px] items-center gap-3 border-b border-filet"
          >
            <span className="skew-18 grid h-[26px] w-[30px] shrink-0 place-items-center bg-case">
              <span className="unskew-18 font-num text-sm text-gris">{i + 1}</span>
            </span>
            <span className="min-w-0 flex-1 truncate text-2xl font-black uppercase italic">{p.name}</span>
            {teams && (
              <button
                type="button"
                aria-label={`Changer ${p.name} d'équipe`}
                onClick={() => setPlayers(players.map((q, j) => (j === i ? { ...q, team: q.team === "A" ? "B" : "A" } : q)))}
                style={{ "--h": "26px" } as React.CSSProperties}
                className={`btn-18 h-[26px] w-[38px] text-[13px] font-black italic text-noir ${p.team === "A" ? "bg-cyan" : "bg-blanc"}`}
              >
                {p.team}
              </button>
            )}
            <button
              type="button"
              aria-label={`Retirer ${p.name}`}
              onClick={() => setPlayers(players.filter((_, j) => j !== i))}
              className="h-10 w-8 text-xl text-gris"
            >
              ×
            </button>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={teams}
        onClick={() => setTeams(!teams)}
        className="mt-3.5 flex items-center gap-2.5 self-start border-[1.5px] border-filet px-3 py-2.5 text-xs font-bold"
      >
        <i className={`skew-18 relative h-4 w-[30px] ${teams ? "bg-cyan" : "bg-[#333]"}`}>
          <i className={`absolute top-0.5 h-3 w-3 transition-all ${teams ? "left-4 bg-noir" : "left-0.5 bg-gris"}`} />
        </i>
        Jouer en équipes
      </button>

      <div className="min-h-4 flex-1" />
      <Cta disabled={players.length === 0 || !teamsOk || (teams && players.length < 2)} onClick={onNext}>
        {teams && !teamsOk ? "Il faut 2 équipes" : "Choisir le jeu →"}
      </Cta>
    </Screen>
  );
}

/* ---------- 2. Jeu ---------- */

function Games({ count, label, onBack, onPick }: { count: number; label: string; onBack: () => void; onPick: (g: GameInfo) => void }) {
  return (
    <Screen>
      <TopBar
        onBack={onBack}
        left={
          <>
            Étape <b className="mx-1 text-blanc">2</b>/3
          </>
        }
        right={label}
      />
      <Title>À quoi on joue ?</Title>
      <div className="mt-3.5 flex flex-col">
        {GAMES.map((g) => {
          const min = estimateMinutes(g, count);
          const tooFew = g.minPlayers && count < g.minPlayers;
          const disabled = !g.ready || !!tooFew;
          return (
            <button
              key={g.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(g)}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 border-b border-filet py-3.5 text-left active:bg-case disabled:opacity-35"
            >
              <span className={g.numeric ? "font-num text-[32px] leading-none" : "text-[26px] font-black uppercase italic leading-none"}>
                {g.name}
              </span>
              <span className="row-span-2 text-right text-[10px] font-bold uppercase leading-normal tracking-widest text-gris">
                {!g.ready ? (
                  "Bientôt"
                ) : tooFew ? (
                  <>
                    {g.minPlayers} joueurs
                    <br />
                    minimum
                  </>
                ) : (
                  <>
                    <b className={`block font-num text-xl font-normal tracking-normal ${min >= 10 && min <= 30 ? "text-cyan" : "text-blanc"}`}>
                      ~{min}
                    </b>
                    min
                  </>
                )}
              </span>
              <span className="text-xs leading-snug text-[#a8a8a8]">{g.desc}</span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

/* ---------- 3. Réglages ---------- */

const CRICKET_HELP: Record<CricketMode, string> = {
  classic:
    "Ferme 15 à 20 et le centre (3 touches chacun). Un numéro fermé rapporte des points tant que les autres ne l'ont pas fermé. Il faut tout fermer et mener aux points.",
  none: "Pas de points : le premier qui ferme tout gagne.",
  cut: "Tes points vont aux adversaires qui n'ont pas fermé. Il faut tout fermer avec le plus petit score.",
};

function Options({
  game,
  opts,
  setOpts,
  cricketMode,
  setCricketMode,
  onBack,
  onNext,
}: {
  game: GameInfo;
  opts: X01Options;
  setOpts: (o: X01Options) => void;
  cricketMode: CricketMode;
  setCricketMode: (m: CricketMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Screen>
      <TopBar
        onBack={onBack}
        left={
          <>
            Étape <b className="mx-1 text-blanc">3</b>/3
          </>
        }
        right="Réglages"
      />
      <Title numeric={game.numeric}>{game.name}</Title>
      {game.id === "cricket" ? (
        <Seg
          label="Règle"
          value={cricketMode}
          options={[
            { value: "classic", label: "Classique" },
            { value: "none", label: "Sans points" },
            { value: "cut", label: "Cut-throat" },
          ]}
          help={CRICKET_HELP[cricketMode]}
          onChange={setCricketMode}
        />
      ) : (
        <X01Settings opts={opts} setOpts={setOpts} />
      )}
      <div className="min-h-4 flex-1" />
      <Cta tone="cyan" onClick={onNext}>
        Au bull →
      </Cta>
    </Screen>
  );
}

function X01Settings({ opts, setOpts }: { opts: X01Options; setOpts: (o: X01Options) => void }) {
  return (
    <>
      <Seg
        label="Fin de partie"
        value={opts.finish}
        options={[
          { value: "simple", label: "Pile à zéro" },
          { value: "double", label: "Double out" },
        ]}
        help={
          opts.finish === "simple"
            ? "Il suffit de tomber pile à zéro, avec n'importe quelle fléchette."
            : "Règle officielle : la dernière fléchette doit être un double (ou le bull)."
        }
        onChange={(finish) => setOpts({ ...opts, finish })}
      />
      <Seg
        label="Début de partie"
        value={opts.doubleIn}
        options={[
          { value: false, label: "Libre" },
          { value: true, label: "Double in" },
        ]}
        help={opts.doubleIn ? "Le score ne commence à descendre qu'après un premier double." : "On marque dès la première fléchette."}
        onChange={(doubleIn) => setOpts({ ...opts, doubleIn })}
      />
      <Seg
        label="Manches"
        value={opts.legs}
        options={[
          { value: 1, label: "1" },
          { value: 3, label: "3" },
          { value: 5, label: "5" },
        ]}
        help={opts.legs === 1 ? "Une seule manche, on va droit au but." : `Le premier à ${Math.ceil(opts.legs / 2)} manches gagne.`}
        onChange={(legs) => setOpts({ ...opts, legs })}
      />
    </>
  );
}

/* ---------- 4. Au bull ---------- */

function Bull({
  players,
  sides,
  onBack,
  onPick,
  onSkip,
}: {
  players: Player[];
  sides: Side[];
  onBack: () => void;
  onPick: (name: string) => void;
  onSkip: () => void;
}) {
  return (
    <Screen>
      <TopBar onBack={onBack} left="Qui commence ?" />
      <div className="relative mt-4">
        <h1 className="text-[70px] font-black uppercase italic leading-[0.85] tracking-tighter">
          Au
          <br />
          <span className="text-cyan">bull !</span>
        </h1>
        <div className="slot-perso absolute -top-1.5 right-0 flex h-[110px] w-[84px] items-end justify-center p-1.5 text-center text-[8px] font-bold uppercase tracking-[0.14em]">
          Perso 3D
          <br />« au bull »
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-normal text-[#bdbdbd]">
        Chacun lance une fléchette vers le centre. Touche le prénom du plus proche : {sides.length < players.length ? "son équipe commence, avec lui." : "il commence."}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {players.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onPick(p.name)}
            style={{ "--h": "58px" } as React.CSSProperties}
            className="btn-18 h-[58px] truncate bg-blanc px-3.5 text-base font-black uppercase italic text-noir active:bg-cyan"
          >
            {p.name}
          </button>
        ))}
      </div>
      <button type="button" onClick={onSkip} className="mt-4 self-start py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gris">
        Passer · ordre de saisie
      </button>
    </Screen>
  );
}
