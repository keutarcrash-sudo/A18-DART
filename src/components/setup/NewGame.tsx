"use client";
/**
 * Création d'une partie : Joueurs → Jeu → Réglages → Qui commence (« À vous de jouer ! ») → Partie.
 * Un écran = une question (docs/02-principes-ux.md).
 */
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Head } from "@/components/pop/Heads";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Cta, Pill, Screen, Seg, Title, TopBar } from "@/components/ui";
import { DEFAULT_X01_OPTIONS, type X01Options } from "@/engine/x01";
import { type CricketMode, DEFAULT_CRICKET_OPTIONS } from "@/engine/cricket";
import { DEFAULT_KILLER_OPTIONS } from "@/engine/killer";
import { type ClockOptions, DEFAULT_CLOCK_OPTIONS } from "@/engine/clock";
import { DEFAULT_HIGH_OPTIONS } from "@/engine/high";
import type { Side } from "@/engine/types";
import { GAMES, type GameInfo, estimateMinutes } from "@/lib/games";
import { savePartie } from "@/lib/partie";
import { enterFullscreen } from "@/lib/pwa";
import { cleanName, loadRecents, rememberNames, uniqueName } from "@/lib/recents";

type Step = "players" | "game" | "options" | "bull";
interface Player {
  name: string;
  team: "A" | "B";
}

const MAX_PLAYERS = 8;

export function NewGame() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState<Step>("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState(false);
  const [game, setGame] = useState<GameInfo>(GAMES[0]);
  const [opts, setOpts] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketMode, setCricketMode] = useState<CricketMode>(DEFAULT_CRICKET_OPTIONS.mode);
  const [lives, setLives] = useState(DEFAULT_KILLER_OPTIONS.lives);
  const [clockOpts, setClockOpts] = useState<ClockOptions>(DEFAULT_CLOCK_OPTIONS);
  const [rounds, setRounds] = useState(DEFAULT_HIGH_OPTIONS.rounds);

  // Next garde cet écran en mémoire entre deux visites : on repart toujours de « Qui joue ? »,
  // en gardant les prénoms (pratique quand le même groupe enchaîne sur un autre jeu).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- remise à zéro à chaque visite de l'écran
    setStep("players");
  }, []);

  const sides: Side[] = teams
    ? (["A", "B"] as const)
        .map((team) => ({ name: `${t("Équipe")} ${team}`, members: players.filter((p) => p.team === team).map((p) => p.name) }))
        .filter((s) => s.members.length > 0)
    : players.map((p) => ({ name: p.name, members: [p.name] }));

  const start = (firstSide: number, firstMember?: string) => {
    // Lancement de la partie (une tape du joueur) : plein écran sur Android.
    enterFullscreen();
    const ordered = sides.map((s, i) =>
      i === firstSide && firstMember ? { ...s, members: [firstMember, ...s.members.filter((m) => m !== firstMember)] } : s,
    );
    rememberNames(players.map((p) => p.name));
    if (game.id === "high") {
      savePartie({ kind: "high", setup: { sides: ordered, options: { rounds }, firstSide }, actions: [] });
    } else if (game.id === "clock") {
      savePartie({ kind: "clock", setup: { sides: ordered, options: clockOpts, firstSide }, actions: [] });
    } else if (game.id === "killer") {
      savePartie({ kind: "killer", setup: { sides: ordered, options: { lives }, firstSide }, actions: [] });
    } else if (game.id === "cricket") {
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
            label={teams ? t("{n} équipes", { n: sides.length }) : players.length > 1 ? t("{n} joueurs", { n: players.length }) : t("{n} joueur", { n: players.length })}
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
            lives={lives}
            setLives={setLives}
            clockOpts={clockOpts}
            setClockOpts={setClockOpts}
            rounds={rounds}
            setRounds={setRounds}
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
  const t = useT();
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
            {t("Étape")} <b className="mx-1 text-encre">1</b>/3
          </>
        }
        right={players.length > 1 ? t("{n} joueurs", { n: players.length }) : t("{n} joueur", { n: players.length })}
      />
      <Title>{t("Qui joue ?")}</Title>

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
          placeholder={t("Prénom")}
          enterKeyHint="next"
          autoComplete="off"
          aria-label={t("Prénom du joueur")}
          disabled={players.length >= MAX_PLAYERS}
          className="h-14 min-w-0 flex-1 rounded-lg border-2 border-[#CBD5E1] bg-carte px-4 font-display text-xl font-extrabold text-encre outline-none transition-[border-color,box-shadow] duration-200 ease-pop placeholder:font-text placeholder:text-base placeholder:font-medium placeholder:text-attenue focus:border-violet focus:shadow-[4px_4px_0_0_var(--color-violet)] disabled:bg-muted"
        />
        <button
          type="submit"
          className="pop-shadow-sm pop-press h-14 w-[66px] rounded-full border-2 border-encre bg-violet font-display text-base font-extrabold text-white"
        >
          OK
        </button>
      </form>

      {free.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <small className="mr-1 text-[11px] font-bold uppercase tracking-[0.08em] text-attenue">{t("Récents sur ce téléphone")}</small>
          {free.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => add(r)}
              className="pop-shadow-sm pop-press min-h-[46px] rounded-full border-2 border-encre bg-carte px-4 text-sm font-bold text-encre"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {players.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-[#CBD5E1] px-4 py-5 text-[13px] leading-relaxed text-attenue">
            {t("Tape un prénom puis OK. Seul, ça marche aussi : idéal pour s'entraîner.")}
          </p>
        )}
        {players.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pop-shadow-sm flex min-h-[54px] items-center gap-3 rounded-2xl border-2 border-encre bg-carte py-1 pl-2.5 pr-1.5"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-encre font-num text-sm font-black text-encre ${
                ["bg-ambre", "bg-rose", "bg-menthe"][i % 3]
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-2xl font-extrabold">{p.name}</span>
            {teams && (
              <button
                type="button"
                aria-label={t("Changer {name} d'équipe", { name: p.name })}
                onClick={() => setPlayers(players.map((q, j) => (j === i ? { ...q, team: q.team === "A" ? "B" : "A" } : q)))}
                className={`pop-shadow-sm pop-press h-[46px] w-[46px] rounded-full border-2 border-encre font-display text-sm font-extrabold ${
                  p.team === "A" ? "bg-violet text-white" : "bg-ambre text-encre"
                }`}
              >
                {p.team}
              </button>
            )}
            <button
              type="button"
              aria-label={t("Retirer {name}", { name: p.name })}
              onClick={() => setPlayers(players.filter((_, j) => j !== i))}
              className="grid h-[46px] w-[46px] place-items-center text-2xl font-bold text-attenue"
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
        className="pop-shadow-sm pop-press mt-4 flex min-h-[46px] items-center gap-3 self-start rounded-full border-2 border-encre bg-carte py-1.5 pl-3 pr-4 text-sm font-bold"
      >
        <i className={`relative h-6 w-[42px] rounded-full border-2 border-encre transition-colors ${teams ? "bg-violet" : "bg-muted"}`}>
          <i
            className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-encre bg-carte transition-all duration-300 ease-pop ${teams ? "left-[20px]" : "left-0.5"}`}
          />
        </i>
        {t("Jouer en équipes")}
      </button>

      <div className="min-h-4 flex-1" />
      <Cta disabled={players.length === 0 || !teamsOk || (teams && players.length < 2)} onClick={onNext}>
        {teams && !teamsOk ? t("Il faut 2 équipes") : t("Choisir le jeu →")}
      </Cta>
    </Screen>
  );
}

/* ---------- 2. Jeu ---------- */

function Games({ count, label, onBack, onPick }: { count: number; label: string; onBack: () => void; onPick: (g: GameInfo) => void }) {
  const t = useT();
  return (
    <Screen>
      <TopBar
        onBack={onBack}
        left={
          <>
            {t("Étape")} <b className="mx-1 text-encre">2</b>/3
          </>
        }
        right={label}
      />
      <Title>{t("À quoi on joue ?")}</Title>
      <div className="mt-5 flex flex-col gap-3">
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
              className="pop-shadow pop-press flex min-h-[74px] items-center gap-3.5 rounded-[18px] border-2 border-encre bg-carte px-3.5 py-3 text-left disabled:border-bord disabled:bg-muted disabled:shadow-none"
            >
              <GameShape id={g.id} ready={g.ready} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-extrabold leading-tight">{t(g.name)}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-attenue">{t(g.desc)}</span>
              </span>
              <span className="self-start">
                {!g.ready ? (
                  <Pill small>{t("Bientôt")}</Pill>
                ) : tooFew ? (
                  <Pill small>
                    {t("{n} joueurs", { n: g.minPlayers ?? 0 })} {t("minimum")}
                  </Pill>
                ) : (
                  <Pill small tone={min >= 10 && min <= 30 ? "menthe" : "blanc"}>
                    ~{min} min
                  </Pill>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

const SHAPE_ICON = {
  killer: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

/** Forme et couleur propres à chaque jeu (maquette « Choix du jeu »). */
function GameShape({ id, ready }: { id: GameInfo["id"]; ready: boolean }) {
  const base = "grid h-[50px] w-[50px] shrink-0 place-items-center border-2 border-encre font-display text-base font-black";
  const label = id === "501" || id === "301" ? id : id === "cricket" ? "20" : id === "high" ? "180" : null;
  const style: Record<GameInfo["id"], { cls: string; radius: string }> = {
    "501": { cls: "bg-violet text-white", radius: "50%" },
    "301": { cls: "bg-violet text-white", radius: "50%" },
    cricket: { cls: "bg-rose text-encre", radius: "6px" },
    killer: { cls: "bg-ambre text-encre", radius: "24px 24px 24px 4px" },
    clock: { cls: "bg-menthe text-encre", radius: "999px 999px 6px 6px" },
    high: { cls: "bg-violet text-white", radius: "6px 24px 6px 24px" },
    originals: { cls: "bg-carte text-attenue", radius: "12px" },
  };
  const st = style[id];
  return (
    <span aria-hidden="true" className={`${base} ${ready ? st.cls : "border-dashed bg-carte text-attenue"}`} style={{ borderRadius: st.radius }}>
      {label ?? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.6" strokeLinecap="round">
          {id === "killer" || id === "clock" ? SHAPE_ICON[id] : <path d="M12 6v12M6 12h12" />}
        </svg>
      )}
    </span>
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
  lives,
  setLives,
  clockOpts,
  setClockOpts,
  rounds,
  setRounds,
  onBack,
  onNext,
}: {
  game: GameInfo;
  opts: X01Options;
  setOpts: (o: X01Options) => void;
  cricketMode: CricketMode;
  setCricketMode: (m: CricketMode) => void;
  lives: number;
  setLives: (n: number) => void;
  clockOpts: ClockOptions;
  setClockOpts: (o: ClockOptions) => void;
  rounds: number;
  setRounds: (n: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();
  return (
    <Screen>
      <TopBar
        onBack={onBack}
        left={
          <>
            {t("Étape")} <b className="mx-1 text-encre">3</b>/3
          </>
        }
        right={t("Réglages")}
      />
      <Title numeric={game.numeric}>{t(game.name)}</Title>
      {game.id === "high" ? (
        <Seg
          label={t("Volées")}
          value={rounds}
          options={[3, 5, 8, 10].map((v) => ({ value: v, label: String(v) }))}
          help={t("{n} volées de 3 fléchettes chacun. Le plus gros total gagne.", { n: rounds })}
          onChange={setRounds}
        />
      ) : game.id === "clock" ? (
        <>
          <Seg
            label={t("Avance")}
            value={clockOpts.bonus}
            options={[
              { value: false, label: t("Une case") },
              { value: true, label: t("Bonus") },
            ]}
            help={
              clockOpts.bonus
                ? t("Simple = +1, double = +2, triple = +3. Les bons lanceurs filent.")
                : t("Chaque touche fait avancer d'un numéro, simple, double ou triple.")
            }
            onChange={(bonus) => setClockOpts({ ...clockOpts, bonus })}
          />
          <Seg
            label={t("Fin")}
            value={clockOpts.bullFinish}
            options={[
              { value: false, label: t("Au 20") },
              { value: true, label: t("Au centre") },
            ]}
            help={clockOpts.bullFinish ? t("Après le 20, il faut encore toucher le centre.") : t("Le premier qui touche le 20 gagne.")}
            onChange={(bullFinish) => setClockOpts({ ...clockOpts, bullFinish })}
          />
        </>
      ) : game.id === "killer" ? (
        <Seg
          label={t("Vies")}
          value={lives}
          options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))}
          help={
            lives === 1
              ? t("Une seule vie : un double et c'est fini. Partie express.")
              : t("Chacun a {n} vies. Touche ton double pour devenir tueur, puis vise le double des autres.", { n: lives })
          }
          onChange={setLives}
        />
      ) : game.id === "cricket" ? (
        <Seg
          label={t("Règle")}
          value={cricketMode}
          options={[
            { value: "classic", label: t("Classique") },
            { value: "none", label: t("Sans points") },
            { value: "cut", label: t("Cut-throat") },
          ]}
          help={t(CRICKET_HELP[cricketMode])}
          onChange={setCricketMode}
        />
      ) : (
        <X01Settings opts={opts} setOpts={setOpts} />
      )}
      <div className="min-h-4 flex-1" />
      <Cta tone="violet" onClick={onNext}>
        {t("À vous de jouer →")}
      </Cta>
    </Screen>
  );
}

function X01Settings({ opts, setOpts }: { opts: X01Options; setOpts: (o: X01Options) => void }) {
  const t = useT();
  return (
    <>
      <Seg
        label={t("Fin de partie")}
        value={opts.finish}
        options={[
          { value: "simple", label: t("Pile à zéro") },
          { value: "double", label: t("Double out") },
        ]}
        help={
          opts.finish === "simple"
            ? t("Il suffit de tomber pile à zéro, avec n'importe quelle fléchette.")
            : t("Règle officielle : la dernière fléchette doit être un double (ou le bull).")
        }
        onChange={(finish) => setOpts({ ...opts, finish })}
      />
      <Seg
        label={t("Début de partie")}
        value={opts.doubleIn}
        options={[
          { value: false, label: t("Libre") },
          { value: true, label: t("Double in") },
        ]}
        help={opts.doubleIn ? t("Le score ne commence à descendre qu'après un premier double.") : t("On marque dès la première fléchette.")}
        onChange={(doubleIn) => setOpts({ ...opts, doubleIn })}
      />
      <Seg
        label={t("Manches")}
        value={opts.legs}
        options={[
          { value: 1, label: t("1") },
          { value: 3, label: t("3") },
          { value: 5, label: t("5") },
        ]}
        help={opts.legs === 1 ? t("Une seule manche, on va droit au but.") : t("Le premier à {n} manches gagne.", { n: Math.ceil(opts.legs / 2) })}
        onChange={(legs) => setOpts({ ...opts, legs })}
      />
    </>
  );
}

/* ---------- 4. Qui commence : « À vous de jouer ! » ---------- */

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
  const t = useT();
  return (
    <Screen>
      <TopBar onBack={onBack} left={t("Qui commence ?")} />
      <div className="relative mt-4">
        <h1 className="font-display text-[60px] font-black leading-[0.9] tracking-tighter">
          {t("À vous")}
          <br />
          <span className="text-violet">{t("de jouer !")}</span>
        </h1>
        <div className="absolute -top-1 right-0">
          <Head kind="crispe" size={104} />
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-normal text-attenue">
        {t("Chacun lance une fléchette vers le centre. Touche le prénom du plus proche :")}{" "}
        {sides.length < players.length ? t("son équipe commence, avec lui.") : t("il commence.")}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {players.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onPick(p.name)}
            className="pop-shadow pop-press h-14 truncate rounded-full border-2 border-encre bg-carte px-3.5 font-display text-base font-extrabold text-encre active:bg-ambre"
          >
            {p.name}
          </button>
        ))}
      </div>
      <button type="button" onClick={onSkip} className="mt-5 min-h-[46px] self-start px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-attenue underline decoration-2 underline-offset-4">
        {t("Passer · ordre de saisie")}
      </button>
    </Screen>
  );
}
