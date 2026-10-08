/** Catalogue des jeux (règles détaillées : docs/05-jeux.md). */

export interface GameInfo {
  id: "501" | "301" | "cricket" | "clock" | "killer" | "high" | "originals";
  name: string;
  numeric?: boolean;
  desc: string;
  /** Nombre moyen de tours pour un groupe de débutants (sert à estimer la durée). */
  rounds: number;
  minPlayers?: number;
  /** Jouable dans cette version de l'app ? */
  ready: boolean;
}

export const GAMES: GameInfo[] = [
  { id: "501", name: "501", numeric: true, desc: "Le classique. De 501 à zéro.", rounds: 17, ready: true },
  { id: "301", name: "301", numeric: true, desc: "Le même, en plus court.", rounds: 10, ready: true },
  { id: "cricket", name: "Cricket", desc: "Ferme le 15 au 20 et le centre avant les autres.", rounds: 14, ready: true },
  { id: "clock", name: "Tour de l'horloge", desc: "Du 1 au 20, dans l'ordre. Le premier au bout gagne.", rounds: 13, ready: false },
  { id: "killer", name: "Killer", desc: "Chacun son numéro et ses vies. Élimine les autres.", rounds: 9, minPlayers: 3, ready: false },
  { id: "high", name: "Plus gros score", desc: "Un nombre de volées fixé. Le plus gros total gagne.", rounds: 8, ready: false },
  { id: "originals", name: "Arena18 Originals", desc: "Nos jeux maison. Bientôt.", rounds: 0, ready: false },
];

/** Durée estimée en minutes : environ 27 secondes par volée et par joueur. */
export function estimateMinutes(g: GameInfo, players: number): number {
  return Math.max(3, Math.round(g.rounds * Math.max(1, players) * 0.45));
}
