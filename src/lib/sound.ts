/**
 * Effets sonores sobres, synthétisés dans le navigateur (aucun fichier, aucun service externe).
 * Pas de voix en V1 (décision client) : chaque événement a un emplacement prêt pour une annonce future.
 */
import { readJSON, writeJSON } from "./storage";

const MUTE_KEY = "a18:muet";
let ctx: AudioContext | null = null;
let muted: boolean | null = null;

export function isMuted(): boolean {
  if (muted === null) muted = readJSON<boolean>(MUTE_KEY) ?? false;
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  writeJSON(MUTE_KEY, value);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || isMuted()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "triangle", gain = 0.12) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sounds = {
  /** Une fléchette saisie : petit « tac » sec. */
  dart: () => tone(880, 0, 0.06, "square", 0.05),
  double: () => {
    tone(880, 0, 0.06, "square", 0.05);
    tone(1175, 0.06, 0.08, "square", 0.05);
  },
  triple: () => {
    tone(880, 0, 0.05, "square", 0.05);
    tone(1175, 0.05, 0.05, "square", 0.05);
    tone(1568, 0.1, 0.1, "square", 0.05);
  },
  validate: () => tone(523, 0, 0.12, "triangle", 0.08),
  bust: () => {
    tone(330, 0, 0.18, "sawtooth", 0.06);
    tone(220, 0.16, 0.3, "sawtooth", 0.06);
  },
  ton: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.2)),
  oneEighty: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.28, "triangle", 0.14)),
  win: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.4, "triangle", 0.14)),
};
