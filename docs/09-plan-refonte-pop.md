# Refonte « Pop » — plan de travail

> **Pour les agents :** sous-skill requise : `subagent-driven-development` (recommandé) ou `executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases `- [ ]`.

**But :** passer toute l'app A18 Darts au style Playful Geometric (écrans, jeux, podium, célébrations, scènes), avec les 8 têtes déjantées, la cible permanente au 301/501 et Plus gros score, et la surbrillance des cases pour finir.

**Architecture :** on remplace les jetons de couleur et les polices dans `globals.css` / `layout.tsx`, on refait les briques communes (`ui.tsx`), puis on convertit écran par écran. Deux nouveautés de logique, testées : les zones pour finir (moteur, `src/engine/x01.ts`) et la géométrie de la cible (`src/lib/board.ts`). Les têtes deviennent un composant SVG (`src/components/pop/Heads.tsx`) qui remplace `Mascot` partout.

**Pile :** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Motion 14 (`motion/react`), Vitest, Playwright (vérification visuelle).

**Spec :** [`docs/08-refonte-pop.md`](08-refonte-pop.md) (validé par le client) + maquettes [`docs/refonte-pop/maquettes.html`](refonte-pop/maquettes.html) + skill `.claude/skills/playful-geometric/`.

## Contraintes globales

- Palette : crème `#FFFDF5`, encre `#1E293B`, violet `#8B5CF6` (actions principales), rose `#F472B6`, ambre `#FBBF24`, menthe `#34D399`, bord `#E2E8F0`, muted `#F1F5F9`, texte atténué `#64748B`, carte `#FFFFFF`. Bleu clair `#7DD3FC` **uniquement** pour les larmes du Mort de rire.
- Polices : Outfit 700–900 (titres, chiffres, `tabular-nums`), Plus Jakarta Sans 400/500/700 (texte), via `next/font/google`.
- Contours 2 px encre ; ombre dure `4px 4px 0 #1E293B` (2 px sur les petites touches), survol −2 px / ombre 6 px, appui +2 px / ombre 2 px ; aucune ombre floue, aucun dégradé décoratif.
- Touches ≥ 46 px, actions principales ≥ 56 px. Score du joueur actif lisible à 2 m.
- `prefers-reduced-motion` : plus de rebond, confettis, têtes animées ; tout reste lisible à l'arrêt.
- Texte blanc seulement sur violet ou encre. Pas de rouge pour l'erreur.
- Les règles de jeu, le moteur, la sauvegarde, les records, la PWA ne changent pas. « Rien ne se termine tout seul », Annuler toujours visible, Double / Triple au-dessus du pavé sans cacher de touche.
- Tout nouveau texte passe par `t()` avec sa traduction dans `src/lib/i18n-en.ts`.
- Les `aria-label` et libellés de boutons existants restent identiques (les scénarios de vérification s'en servent).
- Avant chaque commit : `npm run typecheck && npm run lint && npm test` sans erreur. Pousser sur la branche de travail seulement ; **pas de mise en ligne (`main`) avant l'accord du client** sur l'ensemble.

## Points de vigilance (non couverts par les tests unitaires)

1. **Fléchettes qui bougent toutes seules sur la cible** : la position d'une fléchette dans sa case doit être stable d'un rendu à l'autre et après rechargement → position tirée d'une graine (index de la fléchette dans la partie), jamais de `Math.random()` au rendu. Test dans la tâche 4.
2. **Surbrillance fausse sur un bust ou en Double in non ouvert** : rien ne doit s'allumer. Tests dans la tâche 3.
3. **Correction Double / Triple** : quand on passe la dernière fléchette en Double ou Triple, elle doit changer de case sur la cible (pas rester en simple). Vérification dans la tâche 6.
4. **Textes des scènes** : les mots qui claquent (« BULL ! », « TCHAK », « BUST », « PLOC », « CLAC »…) doivent rester présents, sinon le client perd le repère et les scénarios cassent. Vérification dans les tâches 13 et 14.
5. **Image story partagée** : `html-to-image` doit capturer les nouvelles polices et le fond crème (pas d'écran noir ou de police de secours). Vérification dans la tâche 12.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/app/globals.css` | jetons Tailwind `@theme` de la nouvelle palette, utilitaires `pop-shadow`, `pop-press`, `dots` ; suppression de `btn-18`, `skew-18`, `unskew-18`, `slot-perso` à la fin |
| `src/app/layout.tsx`, `src/app/manifest.ts` | polices Outfit / Plus Jakarta Sans, couleur de thème crème |
| `src/components/ui.tsx` | briques communes restylées (`Screen`, `TopBar`, `Title`, `Cta`, `Seg`) + `Pill` |
| `src/components/pop/Heads.tsx` (nouveau) | les 8 têtes en SVG animé |
| `src/engine/x01.ts` | `oneDartFinishes`, `finishZones` |
| `src/lib/board.ts` (nouveau) | géométrie de la cible : ordre des secteurs, position d'une fléchette, zones |
| `src/components/x01/Board.tsx` (nouveau) | cible affichée avec fléchettes et zones lumineuses |
| `src/components/x01/Pad.tsx` | touches restylées + surbrillance |
| écrans existants (`X01Game`, `HighGame`, `CricketGame`, `KillerGame`, `ClockGame`, `NewGame`, `page.tsx`, `Records`, `InstallHint`, `LangSwitch`, `JouerButton`, `GameMenu`, `Tableau`, `PodiumScene`, `FinDePartie`, `Celebration`, `Scene`, `MiniScenes`, `Pop`) | restylés |
| `e2e/scenarios.js` (nouveau) | les 34 scénarios de vérification de bout en bout, rapatriés dans le projet |
| `.claude/skills/a18-design/SKILL.md` | réécrite avec la direction Pop |

---

### Tâche 1 : Fondations (jetons, polices, skill, scénarios)

**Fichiers :** modifier `src/app/globals.css`, `src/app/layout.tsx`, `src/app/manifest.ts`, `.claude/skills/a18-design/SKILL.md` ; créer `e2e/scenarios.js`, `e2e/README.md`.

**Interfaces produites :** classes Tailwind `bg-creme text-encre bg-carte bg-violet bg-rose bg-ambre bg-menthe bg-muted text-attenue border-encre border-bord`, `font-display` (Outfit), `font-text` (Plus Jakarta Sans), `font-num` (= Outfit + `tabular-nums`) ; utilitaires `pop-shadow` (ombre 4 px), `pop-shadow-sm` (2 px), `pop-press` (soulèvement / enfoncement avec rebond `cubic-bezier(0.34,1.56,0.64,1)`), `dots` (trame de points).

- [ ] Copier le harnais de scénarios (`alltests.js` du dossier de travail de la session) dans `e2e/scenarios.js`, sans changer son contenu ; `e2e/README.md` dit comment le lancer (`npm run build && npx next start -p 3018`, puis `PW=$(npm root -g)/playwright node e2e/scenarios.js <dossier-captures>`).
- [ ] Lancer les scénarios sur l'app actuelle : **34/34 réussis** attendus (référence avant refonte).
- [ ] Ajouter les nouveaux jetons et utilitaires dans `@theme` **à côté** des anciens (les anciens restent jusqu'à la tâche 15 pour que l'app compile pendant la conversion). Retirer `--radius-*: initial` et `--shadow-*: initial`.
- [ ] `layout.tsx` : charger Outfit et Plus Jakarta Sans ; `body` en `bg-creme text-encre font-text` ; `themeColor: "#FFFDF5"` ; `statusBarStyle: "default"`. `manifest.ts` : `background_color` et `theme_color` à `#FFFDF5`.
- [ ] Réécrire `.claude/skills/a18-design/SKILL.md` : garder le nom, la description (« À charger AVANT toute… ») et les sections Public / Priorité / Patterns de saisie / Ton / Son / Contraintes d'usage ; remplacer les 6 règles, les jetons, l'évolution pop art et les interdits par la direction Pop (`docs/08-refonte-pop.md`) et un renvoi à `.claude/skills/playful-geometric/` ; ajouter la table des têtes et de leurs moments. `docs/04-direction-18.md` reçoit en tête « Archive : remplacée par `08-refonte-pop.md` ».
- [ ] Vérifier : `npm run typecheck && npm run lint && npm test && npm run build` OK.
- [ ] Commit « Refonte pop : fondations (couleurs, polices, skill, scénarios) ».

### Tâche 2 : Les têtes déjantées

**Fichiers :** créer `src/components/pop/Heads.tsx`.

**Interfaces produites :** `export type HeadKind = "explosee" | "frimeur" | "coeurs" | "mdr" | "langue" | "tournis" | "fondue" | "crispe";` et `export function Head({ kind, size, className }: { kind: HeadKind; size: number; className?: string })`, rendu en SVG `viewBox="0 0 120 120"`, `aria-hidden`.

- [ ] Porter les 8 dessins des symboles `h-*` de `docs/refonte-pop/maquettes.html` (mêmes tracés, mêmes couleurs, mêmes animations CSS : yeux qui tournent, cœurs qui battent, tête qui fond, langue, sueur, larmes, rire). Animations en CSS (classes dans `globals.css`), arrêtées par `prefers-reduced-motion`.
- [ ] Ajouter temporairement une page de contrôle `src/app/tetes/page.tsx` qui affiche les 8 têtes ; capture Playwright comparée à la galerie des maquettes ; supprimer la page avant le commit.
- [ ] Vérifier typecheck / lint / build. Commit « Têtes déjantées ».

### Tâche 3 : Zones pour finir (moteur)

**Fichiers :** modifier `src/engine/x01.ts`, `src/engine/x01.test.ts`.

**Interfaces consommées :** `Dart`, `dartPoints`, `isDouble` (`types.ts`), `suggestCheckout(rest, finish, dartsLeft)`.
**Interfaces produites :**
- `export function oneDartFinishes(rest: number, finish: "simple" | "double"): Dart[]` — toutes les fléchettes uniques qui font exactement `rest` en respectant la sortie (double : seulement les doubles et le bull 50 ; simple : simples, doubles, triples, 25, bull), sans doublon de case, triées par n décroissant.
- `export function finishZones(rest: number, finish: "simple" | "double", dartsLeft: number, opened: boolean, bust: boolean): Dart[]` — `[]` si `bust`, si `!opened`, si `dartsLeft === 0` ; sinon `oneDartFinishes` s'il n'est pas vide, sinon `suggestCheckout(rest, finish, dartsLeft) ?? []`.

- [ ] Écrire les tests :
  - `oneDartFinishes(2, "double")` → `[{n:1,m:2}]`
  - `oneDartFinishes(2, "simple")` → contient `{n:2,m:1}` et `{n:1,m:2}`, longueur 2
  - `oneDartFinishes(50, "double")` → `[{n:25,m:2}]`
  - `oneDartFinishes(60, "simple")` → contient `{n:20,m:3}` (et `{n:..}` d'autres façons s'il y en a), aucune case en double
  - `oneDartFinishes(3, "double")` → `[]`
  - `finishZones(100, "double", 3, true, false)` → `[{n:20,m:3},{n:20,m:2}]`
  - `finishZones(2, "double", 1, true, true)` → `[]` (bust)
  - `finishZones(40, "double", 3, false, false)` → `[]` (Double in pas encore ouvert)
  - `finishZones(171, "double", 3, true, false)` → `[]`
- [ ] Lancer `npm test -- x01` : échec attendu (fonctions absentes).
- [ ] Implémenter.
- [ ] `npm test` : tout passe. Commit « Zones pour finir ».

### Tâche 4 : Géométrie de la cible

**Fichiers :** créer `src/lib/board.ts`, `src/lib/board.test.ts`.

**Interfaces produites :**
- `export const SECTOR_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5] as const;`
- `export const RINGS = { bull: 7, outer: 15, tripleIn: 54, tripleOut: 64, doubleIn: 90, doubleOut: 100 };` (rayon de la cible = 100, le 20 en haut)
- `export function sectorAngle(n: number): number` — angle en radians du centre du secteur (`-π/2` pour le 20, sens horaire, 18° par secteur).
- `export function dartSpot(d: Dart, seed: number): { x: number; y: number } | null` — `null` pour un raté ; sinon un point **dans la bonne case** (simple : extérieur ou intérieur, choisi par la graine), décalé de façon pseudo-aléatoire mais **déterministe** à partir de `seed`.
- `export function zonePath(d: Dart): string` — chemin SVG de la case (secteur × anneau, ou disque du 25 / bull).

- [ ] Écrire les tests :
  - `dartSpot({n:20,m:3}, s)` pour s = 0..50 : rayon entre `tripleIn` et `tripleOut`, angle à moins de 9° de `sectorAngle(20)`
  - `dartSpot({n:1,m:2}, s)` : rayon entre `doubleIn` et `doubleOut`, dans le secteur du 1
  - `dartSpot({n:25,m:2}, s)` : rayon < `bull` ; `{n:25,m:1}` : entre `bull` et `outer`
  - `dartSpot({n:7,m:1}, s)` : dans le secteur du 7, hors des anneaux double et triple, rayon > `outer`
  - `dartSpot({n:0,m:1}, 3)` → `null`
  - même entrée et même graine → même point (deux appels égaux)
- [ ] `npm test -- board` : échec attendu. Implémenter. `npm test` : OK. Commit « Géométrie de la cible ».

### Tâche 5 : Composant cible et pavé lumineux

**Fichiers :** créer `src/components/x01/Board.tsx` ; modifier `src/components/x01/Pad.tsx`.

**Interfaces consommées :** tâche 4 (`SECTOR_ORDER`, `RINGS`, `dartSpot`, `zonePath`).
**Interfaces produites :**
- `export function Board({ darts, zones, size }: { darts: { dart: Dart; seed: number }[]; zones: Dart[]; size: number })` — couleurs de la maquette (simples encre / crème, anneaux rose / menthe, contour encre, ombre dure) ; zones en ambre qui pulsent avec le reste de la cible atténué ; la dernière fléchette arrive avec l'animation « stick » (rebond) ; `role="img"` et `aria-label` traduit qui liste les fléchettes (ex. « Cible : T20, D19 »).
- `Pad` reçoit une prop `glow?: Dart[]` : les touches concernées passent en fond ambre clair qui pulse, avec une pastille « D » ou « T » (ou « 1 » pour un simple quand la même touche a aussi un double / triple). Touches restylées : carte blanche, contour encre 2 px, `rounded-xl`, ombre 2 px ; BULL menthe, RATÉ muted, Annuler en pointillé ; la surcouche Double (ambre) / Triple (rose) garde sa place actuelle au-dessus du pavé.

- [ ] Vérifier en isolation (page temporaire, supprimée avant commit) : capture Playwright de `Board` avec `[T20, D19, BULL]` et `zones=[D1]`, comparée à la maquette.
- [ ] typecheck / lint / build. Commit « Cible et pavé lumineux ».

### Tâche 6 : Écran de jeu 301/501

**Fichiers :** modifier `src/components/x01/X01Game.tsx`.

**Interfaces consommées :** `Head`, `Board`, `Pad glow`, `finishZones`, briques `ui.tsx` (tâche 7 peut être faite avant ou après : utiliser directement les classes de la tâche 1 si `ui.tsx` n'est pas encore converti).

- [ ] Mise en page de la maquette : barre du haut (jeu, volée, Tableau / Menu en pilules) ; carte joueur blanche avec ombre rose (nom, score Outfit géant, « −60 » qui poppe, pastille menthe « Pour finir : … »), `Board` à droite (128 px), autres joueurs en bas de la carte ; rangée des 3 fléchettes (Simple blanc, Double ambre, Triple rose, emplacements vides en pointillé) ; pavé ; « Valider la volée » en grand bouton violet.
- [ ] Brancher `Board darts` sur les fléchettes de la volée en cours (graine = nombre total d'actions avant la fléchette) et `zones` / `Pad glow` sur `finishZones(rest, finish, dartsLeft, opened, bust)`.
- [ ] Vérifier avec Playwright : reste 2 en double → touche 1 lumineuse avec « D » ; taper 20 puis Triple → la fléchette passe dans l'anneau triple ; bust → plus aucune surbrillance ; capture à 390 px de large, rien ne déborde.
- [ ] Scénarios 501 de `e2e/scenarios.js` : tous OK. Commit « Écran 501 pop ».

### Tâche 7 : Briques communes, accueil

**Fichiers :** modifier `src/components/ui.tsx`, `src/app/page.tsx`, `src/components/JouerButton.tsx`, `src/components/Records.tsx`, `src/components/InstallHint.tsx`, `src/components/LangSwitch.tsx`.

**Interfaces produites :** mêmes signatures qu'aujourd'hui pour `Screen`, `TopBar`, `Title`, `Cta` (le `tone` accepte `"violet" | "blanc"`, `"cyan"` devient un alias de `"violet"` jusqu'à la tâche 15), `Seg` ; nouveau `Pill({ children, onClick, tone, small })`.

- [ ] Accueil comme la maquette : logo provisoire (cible dans carré ambre + « A18 Darts »), FR · EN en pastille, grosse carte violette « Reprendre » (bulle aux coins vifs en bas à gauche) ou « Jouer », Tire-langue qui dépasse de la carte, « Nouvelle partie » en pilule, phrase avec surligneur ambre sous « 180 », Records sur carte sticker (onglets menthe), lien d'installation avec icône dans un rond menthe, 2 ou 3 confettis en bordure.
- [ ] Capture 390 px ; scénarios OK. Commit « Accueil pop ».

### Tâche 8 : Création de partie

**Fichiers :** modifier `src/components/setup/NewGame.tsx`, `src/lib/games.ts` si la forme / couleur de chaque jeu y est déclarée.

- [ ] Joueurs, choix du jeu (une carte par jeu avec forme et couleur de la maquette, durée en pastille, menthe pour 10–30 min), réglages (`Seg` pop), écran « Au bull ! » avec le **Crispé** à la place de la mascotte.
- [ ] Capture de chaque étape à 390 px ; scénarios OK. Commit « Création de partie pop ».

### Tâche 9 : Plus gros score

**Fichiers :** modifier `src/components/high/HighGame.tsx`.

- [ ] Même mise en page que la tâche 6 (carte joueur + `Board`), **sans** surbrillance pour finir (`zones=[]`).
- [ ] Scénarios « Plus gros score » OK. Commit.

### Tâche 10 : Cricket

**Fichiers :** modifier `src/components/cricket/CricketGame.tsx`.

- [ ] Le tableau reste le pavé (une ligne par numéro 20→15, B). Les 3 barres à 18° deviennent 3 pastilles rondes à contour encre, pleines quand touchées ; numéro fermé = ligne violette avec texte blanc ; joueur actif en carte à ombre rose ; Double / Triple au-dessus comme aujourd'hui.
- [ ] Scénarios Cricket OK. Commit.

### Tâche 11 : Killer et Tour de l'horloge

**Fichiers :** modifier `src/components/killer/KillerGame.tsx`, `src/components/clock/ClockGame.tsx`.

- [ ] Killer : les joueurs restent le pavé (cartes stickers) ; vies en pastilles rondes ; badge « TUEUR » en étoile ambre ; éliminé grisé.
- [ ] Horloge : numéro visé en géant Outfit dans un cercle ; TOUCHÉ (violet) / RATÉ (pilule blanche) ; mode Bonus : Simple / Double (ambre) / Triple (rose).
- [ ] Scénarios Killer et Horloge OK. Commit (un par jeu).

### Tâche 12 : Tableau, menu, podium, partage

**Fichiers :** modifier `src/components/x01/Tableau.tsx`, `src/components/GameMenu.tsx`, `src/components/podium/PodiumScene.tsx`, `src/components/podium/FinDePartie.tsx`.

- [ ] Tableau : classement en cartes, meneur en tête avec le Frimeur.
- [ ] Podium comme la maquette : marches 1 violet (coins vifs en haut), 2 rose (arche), 3 menthe ; initiales dans des pastilles (1er en ambre, plus grande) ; Frimeur et Coup de cœur autour du titre ; « Volée de la partie » en carte ; Revanche (violet) et Partager (blanc) côte à côte ; Autre jeu / Accueil en liens.
- [ ] Image story : capture `toPng` vérifiée (fond crème, polices Outfit présentes, rien de coupé) — enregistrer le PNG produit et le regarder.
- [ ] Scénarios de fin de partie OK. Commit.

### Tâche 13 : Célébrations (niveau max, moyen, clin d'œil)

**Fichiers :** modifier `src/components/Celebration.tsx`, `src/components/pop/Pop.tsx`.

**Interfaces :** `CeleSpec` garde sa forme ; `tone: "cyan" | "chartreuse" | "bust"` est renommé `"violet" | "ambre" | "bust"` (mettre à jour les appelants dans les 5 jeux). Dans `SETS`, `mood: Mood` devient `head: HeadKind` : `180` et `exploit` → `explosee`, `victoire` → `frimeur`, `record` → `coeurs`, `bust` et `chambrage` → `fondue`. Bandeau moyen (100 et plus) → `mdr`. `Wink` prend `head?: HeadKind` (défaut `langue` ; « passe devant » → `frimeur`). `Mascot` et `Mood` sont supprimés de `Pop.tsx` ; `POP` est aligné sur la nouvelle palette.

- [ ] Fonds en aplats de la palette (violet, ambre ; bust = crème avec texte encre), contours épais, ombres dures, confettis géométriques ; bulle de clin d'œil = carte bulle à ombre dure.
- [ ] Vérifier par scénarios : 180, ton-up, victoire, bust, record, 26, passe devant ; capture de chaque célébration. Commit.

### Tâche 14 : Scènes animées redessinées

**Fichiers :** modifier `src/components/pop/Scene.tsx`, `src/components/pop/MiniScenes.tsx`.

- [ ] Mêmes histoires, mêmes durées (`SCENE_DURATION = 2.6`, `MINI_DURATION` inchangé), mêmes mots qui claquent : la fléchette déchire l'écran et se plante dans le bull (victoire, record), le triple (180), la cible qui se brise (bust, éliminé) ; mini-scènes trois ratés (panneau OSB + **Tournis**), ton-up (fléchette enflammée + **Mort de rire**), numéro fermé (cadenas). Redessinées : cible aux couleurs de `Board`, contours encre épais, ombres dures, fonds en aplats / crème avec trame de points, têtes du moment à la place du smiley.
- [ ] Capture de chaque scène à mi-parcours ; scénarios OK. Commit.

### Tâche 15 : Nettoyage et vérification complète

**Fichiers :** `src/app/globals.css`, `src/app/layout.tsx`, `src/app/fonts/`, `README.md`, `docs/08-refonte-pop.md`.

- [ ] `grep -rn "bg-noir\|bg-cyan\|text-cyan\|chartreuse\|bg-case\|skew-18\|btn-18\|font-a18\|Mascot" src` → aucun résultat ; supprimer les anciens jetons et utilitaires, la police A18 Élan de `layout.tsx` (le fichier reste dans `docs/chiffres/` comme archive).
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` OK ; `e2e/scenarios.js` **34/34** ; captures de tous les écrans à 390 px envoyées au client.
- [ ] `README.md` et `docs/08-refonte-pop.md` : statut « faite ». Commit et push sur la branche.
- [ ] Mise en ligne (`main`) **seulement après l'accord du client** sur les captures.
