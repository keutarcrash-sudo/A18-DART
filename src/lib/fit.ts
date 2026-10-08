/**
 * Taille de police qui fait tenir un prénom en géant sur UNE seule ligne, sans jamais le couper.
 * Montserrat Black italique en capitales : une lettre fait environ 0,7 fois la taille de la police.
 *
 * @param text     le texte affiché (prénom, nom d'équipe…)
 * @param maxPx    taille maximale (celle de la maquette pour un prénom court)
 * @param marginPx place occupée autour du texte (marges de l'écran, étiquettes à côté…)
 */
export function fitFont(text: string, maxPx: number, marginPx: number): string {
  const chars = Math.max(1, text.length);
  // L'app occupe au plus 460 px de large (voir les écrans), même sur un grand écran.
  return `min(${maxPx}px, calc((min(100vw, 460px) - ${marginPx}px) / ${(chars * 0.7).toFixed(2)}))`;
}
