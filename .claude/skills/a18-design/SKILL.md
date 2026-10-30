---
name: a18-design
description: Direction « Pop » d'A18 Darts (app de fléchettes d'Arena18, style Playful Geometric). À charger AVANT toute création ou modification d'interface, d'écran, de composant, de style, d'animation, de son ou de texte affiché dans ce dépôt — même pour un petit ajustement visuel. Fixe la palette crème / encre / violet, les polices Outfit et Plus Jakarta Sans, les contours et ombres dures, les têtes déjantées et leurs moments, la cible et la surbrillance pour finir, les patterns de saisie par jeu, le ton (tutoiement) et les interdits. Ces règles priment sur toute skill de design générique.
---

# A18 Darts — direction « Pop »

App web de fléchettes d'Arena18 (complexe padel / soccer / bar), ouverte par QR code. Public : **des groupes de potes au bar**, debout, un verre à la main, qui ne connaissent pas forcément les règles. Objectif n°1 : **rendre le moment plus fun**.

La direction visuelle est la **refonte « Pop »** validée par le client (`docs/08-refonte-pop.md`) : toute l'app, écran de jeu compris, est un **album de stickers**, pas un outil de calcul. En ouvrant l'app au bar, on a envie de sourire avant même de lancer une fléchette — et l'écran de jeu reste aussi rapide et lisible qu'avant.

L'ancienne direction « 18° » (fond noir, cyan, chartreuse, angle de 18°, chiffres « Élan gras ») est **abandonnée** : `docs/04-direction-18.md` n'est plus qu'une archive. Ne jamais y revenir par réflexe.

## Priorité des règles

1. Ce que le client dit dans la conversation.
2. Cette skill et les documents `docs/` (décisions validées par le client, en tête `docs/08-refonte-pop.md`).
3. La skill `.claude/skills/playful-geometric/` (variante **Standard**) pour tout ce que cette skill ne précise pas : formes, motifs, composants, animations. Jetons prêts à copier : `.claude/skills/playful-geometric/references/tokens.css`.
4. Les skills génériques (frontend-design, animation, bonnes pratiques React…) : elles s'appliquent **seulement** là où les deux skills ci-dessus ne disent rien. En cas de conflit (fond crème, ombres dures, contours épais, police, palette…), **cette skill gagne**.

Avant de proposer quelque chose qui contredit une décision ci-dessous, demande au client. Ne « corrige » jamais une décision validée de ta propre initiative.

## Les règles Pop

1. **Fond crème, encre, aplats.** Fond `#FFFDF5`, texte et contours encre `#1E293B`, cartes blanches. Couleurs vives en aplats uniquement.
2. **Violet = action principale, et rien d'autre.** Rose, ambre et menthe tournent pour le décor, les pastilles et les mots mis en valeur (effet confettis) ; jamais deux éléments décoratifs voisins de la même couleur.
3. **Contours épais et ombres dures.** Contour 2 px encre ; ombre `4px 4px 0 #1E293B` (2 px sur les petites touches), **sans flou**. Survol : l'élément se soulève (−2 px, ombre 6 px). Appui : il s'enfonce (+2 px, ombre 2 px). Rebond `cubic-bezier(0.34, 1.56, 0.64, 1)`.
4. **Le chiffre est le héros.** Scores en **Outfit** très grasse (800–900), chiffres de même largeur (`tabular-nums`). Score du joueur actif lisible à 2 m.
5. **Grille stable, décor vivant.** La saisie vit dans des zones propres ; formes géométriques, trame de points et confettis flottent **derrière**, jamais sous le doigt ni par-dessus un texte. Les arrondis remplacent ce qui était incliné.
6. **Les têtes déjantées racontent les moments** (voir la table). Elles décorent, elles ne bloquent jamais la saisie.
7. **L'animation raconte un chiffre ou un moment** : « −60 » qui poppe dans le score, changement de joueur, dépassement au classement, entrée qui rebondit. `prefers-reduced-motion` : plus de rebond, de confettis ni de têtes qui bougent ; **sans animation, l'écran doit rester beau et lisible**.

## Jetons (classes Tailwind de `src/app/globals.css`)

| Jeton | Valeur | Classes | Rôle |
|---|---|---|---|
| crème | `#FFFDF5` | `bg-creme` | fond de l'app |
| encre | `#1E293B` | `text-encre`, `border-encre` | texte, contours, ombres |
| carte | `#FFFFFF` | `bg-carte` | cartes, touches |
| violet | `#8B5CF6` | `bg-violet` | actions principales, joueur actif, meneur, « fermé » |
| rose | `#F472B6` | `bg-rose` | Triple, décor |
| ambre | `#FBBF24` | `bg-ambre` | Double, surbrillance « pour finir », surligneur |
| menthe | `#34D399` | `bg-menthe` | décor, durée 10–30 min |
| bord | `#E2E8F0` | `border-bord` | contours discrets, séparateurs |
| muted | `#F1F5F9` | `bg-muted` | fonds atténués |
| atténué | `#64748B` | `text-attenue` | texte secondaire |
| bleu larme | `#7DD3FC` | `text-larme`, `fill-larme` | **uniquement** les larmes du Mort de rire |

- Polices : `font-display` (Outfit 700–900, titres), `font-num` (Outfit + chiffres tabulaires, scores), `font-text` (Plus Jakarta Sans 400/500/700, texte courant, police par défaut du `body`). Chargées par `next/font/google` dans `src/app/layout.tsx`.
- Utilitaires : `pop-shadow` (ombre dure 4 px), `pop-shadow-sm` (2 px), `pop-press` (soulèvement / enfoncement avec rebond, à combiner avec l'une des deux ombres), `dots` (trame de points), `ease-pop` (courbe de rebond).
- **Contraste** : texte encre sur crème, blanc ou couleurs claires. Texte blanc **seulement** sur violet ou encre (jamais sur ambre, rose ou menthe).
- **Bust : pas de rouge.** Le bust est raconté par la Fondue et sa scène (la cible qui se brise).
- Logo provisoire en haut d'accueil : petite cible dans un carré ambre + « A18 Darts ». Jamais le logo A18 (c'est celui de l'app de réservation d'Arena18).

## Les têtes et leurs moments

Huit personnages dessinés en SVG (contours encre, aplats de la palette), qui bougent en boucle et s'arrêtent si le téléphone demande moins d'animations. Elles remplacent **partout** l'ancienne mascotte smiley. Dessins de référence : symboles `h-*` dans `docs/refonte-pop/maquettes.html`.

| Tête | Description | Moment |
|---|---|---|
| L'Explosée | yeux exorbités, crâne en étoile qui tourne | 180 et grosses volées |
| Le Frimeur | lunettes noires, sourire en coin | victoire, passer devant |
| Le Coup de cœur | cœurs qui battent à la place des yeux | record du jour |
| Le Mort de rire | jaune, plié de rire, larmes bleu clair qui giclent | ton-up (100 et plus) |
| Le Tire-langue | clin d'œil, langue tirée | chambrage, le 26 |
| Le Tournis | yeux en spirale, bouche en zigzag | trois ratés |
| La Fondue | tête qui coule | bust, éliminé (Killer) |
| Le Crispé | dents serrées, goutte de sueur | « À vous de jouer ! » (qui commence), dernier double |

- On les branche sur les célébrations qui existent déjà (`CeleSpec` dans `Celebration.tsx`), sans en inventer. Si deux moments tombent ensemble, la priorité actuelle des célébrations décide.
- Sur le podium, les **initiales restent** dans leurs pastilles ; les têtes décorent autour.
- Ce sont des dessins, **pas des emojis**.

## La cible et la surbrillance pour finir (301 / 501, Plus gros score)

- **Cible affichée en permanence** à côté de la carte joueur. Les 3 fléchettes de la volée s'y plantent au bon endroit (simple, double, triple, 25, bull) et y restent jusqu'à « Valider la volée ». Leur position dans la case est un peu au hasard **mais stable** (tirée de l'index de la fléchette, jamais de `Math.random()` au rendu).
- **La cible est un affichage** : on ne tape pas dessus, la saisie se fait au pavé.
- **Surbrillance pour finir** (301 / 501 seulement, pas Plus gros score) :
  - si on peut finir **en une fléchette**, **toutes** les façons de le faire s'allument (reste 2 en sortie simple : le 2 et le Double 1 ; en sortie double : le Double 1 seul) ;
  - sinon, seul le **chemin conseillé** s'allume (reste 100 : Triple 20 puis Double 20), recalculé après chaque fléchette ;
  - en **ambre** qui pulse doucement, sur la cible **et** sur le pavé (pastille D / T sur la touche) ;
  - **rien ne s'allume** tant qu'un joueur en Double in n'est pas ouvert, ni quand la volée est en bust.
- La cible et la surbrillance **lisent le moteur** (`suggestCheckout` et ses voisines dans `src/engine/x01.ts`) ; l'interface ne calcule pas les règles.

## Patterns validés

| Écran / jeu | Pattern |
|---|---|
| Accueil | Grosse carte violette **« Reprendre »** (ou « Jouer » si aucune partie), bouton secondaire « Nouvelle partie ». Phrase « À l'Arena18, le 180 joue à domicile. » avec surligneur ambre sous « 180 ». Records sur une carte sticker (Aujourd'hui / Semaine). FR · EN en pastille. |
| Joueurs | Prénoms au clavier, un par un. Chips **« Récents sur ce téléphone »**. Équipes formées par le groupe (A/B). |
| Choix du jeu | Une carte par jeu, chacune avec sa forme et sa couleur. Durée estimée selon le nombre de joueurs, en pastille (menthe si 10–30 min). |
| Réglages | Les règles se choisissent **avant** la partie, jamais modifiées par l'app ensuite. Une phrase d'explication par option. |
| Qui commence | Écran **« À vous de jouer ! »** (avec le Crispé) : on touche le prénom du plus proche du centre. |
| 301 / 501 / Plus gros score | Carte joueur blanche (nom, score géant, « −60 » qui poppe, pastille « Pour finir »), cible à droite, autres joueurs en bas de la carte. Rangée des 3 fléchettes (Simple blanc, Double ambre, Triple rose). Pavé **« numéro d'abord »** en touches arrondies à ombre dure : une tape = simple ; Double / Triple apparaissent juste au-dessus du pavé (par-dessus la rangée des 3 fléchettes, jamais sur un bouton de saisie) **sans chrono**, jusqu'à la fléchette suivante. 25 / BULL / RATÉ / Annuler. « Valider la volée » en grand bouton violet. |
| Cricket | **Le tableau est le pavé** : on touche la ligne du numéro (20→15, B), puis Double / Triple. Marques en pastilles rondes, violet quand fermé. Pas de cible. |
| Tour de l'horloge | Deux énormes boutons **TOUCHÉ n / RATÉ** (en mode Bonus : Simple / Double / Triple). Numéro visé en géant. La volée passe seule après 3 fléchettes. Pas de cible. |
| Killer | Numéros attribués au **lancer main faible**. **Les joueurs sont le pavé** : une tape = double touché sur ce joueur. Vies en pastilles, badge « TUEUR ». Pas de cible. |
| Chambrage | La tête surgit en bas avec une bulle, **sans bloquer la saisie** ; une tape la fait disparaître. |
| Vue Tableau | Téléphone posé à plat (bascule auto + bouton) : classement en géant, **qui mène** en premier. |
| Fin | Podium : marches de formes différentes (1 violet, 2 rose, 3 menthe), initiales dans des pastilles, têtes autour du titre, « Volée de la partie ». **Revanche** et **Partager** (image story 9:16) côte à côte. Le dernier commence la revanche. |

Les 4 autres jeux (Cricket, Killer, Horloge, Plus gros score) gardent exactement leur façon de saisir (`docs/05-jeux.md`) et sont repeints avec les mêmes briques que le 501 : ce qui était incliné devient arrondi, ce qui était cyan (fermé, meneur, actif) devient violet.

**Rien ne se termine tout seul** (décision client) : victoire et bust attendent « Valider la volée », pour pouvoir corriger (Double / Triple, Annuler) avant. **Annuler** toujours visible pendant la partie.

Célébrations sur 3 niveaux, toujours passables d'une tape : **Max** (180, victoire, record Arena18) plein écran ~2 s ; **Moyen** (volée ≥ 100, checkout > 100) bandeau ~1 s ; **Clin d'œil** (bust, 3 ratés, le « 26 ») bulle de la tête, sans bloquer la saisie. Les scènes animées gardent **les mêmes histoires, le même déroulé et la même durée** (fléchette qui déchire l'écran et se plante dans le bull, cible qui se brise sur un bust, fléchette enflammée du ton-up, cadenas du numéro fermé, trois ratés dans le panneau en bois), redessinées en Pop avec la tête du moment. Les mots qui claquent (« BULL ! », « TCHAK », « BUST », « PLOC », « CLAC »…) restent.

## Ton et textes

- **Tutoiement**, chaleureux, simple, comme un pote. Chambrer **gentiment** : « 26… le classique. », « Trois à côté. Ça arrive aux meilleurs. »
- Français + anglais (langue du téléphone) : tout nouveau texte passe par `t()` avec sa traduction dans `src/lib/i18n-en.ts`.
- Tagline Arena18 : « À vous de jouer ».
- Pas de jargon technique à l'écran.
- Les `aria-label` et libellés de boutons existants ne changent pas (les scénarios `e2e/` s'en servent).

## Son

- **Pas de voix en V1** (le client préfère rien à une voix médiocre ; voix pro = option future VIP). Prévoir un emplacement « annonce » par événement.
- Effets sonores **sobres** : petit son par fléchette, sons marqués pour les célébrations. Bouton muet toujours accessible.

## Interdits

- Ombres floues, glow, néons, glassmorphism.
- Dégradés décoratifs (les trames de points et rayures en motif sont permises).
- Fond noir, cyan, chartreuse, angle de 18°, chiffres « Élan gras » : l'ancienne direction ne revient pas.
- Rouge pour l'erreur.
- **Emojis** (les têtes sont des dessins SVG), cliparts, illustrations 3D génériques.
- Le bleu clair `#7DD3FC` ailleurs que sur les larmes du Mort de rire.
- Texte blanc sur ambre, rose ou menthe.
- Esthétique cyberpunk, crypto, « gaming » générique, dashboards SaaS.
- Formes, têtes ou confettis qui passent sous le doigt ou cachent une touche ; écran qui clignote de partout (trop de surbrillances, trop de confettis).
- Timers qui pressent l'utilisateur.

## Contraintes d'usage

- Mobile d'abord, utilisation à une main, debout. Zones tactiles ≥ 46 px (≥ 56 px pour les actions principales), actions de jeu dans le tiers inférieur.
- Score du joueur actif lisible à 2 m.
- Tout est réversible (« Annuler » toujours visible pendant la partie), pas de « Êtes-vous sûr ? » en jeu.
- La partie survit à un onglet fermé (sauvegarde locale après chaque fléchette).
- Moteur de jeu séparé de l'interface (règles → moteur → interface) : l'interface affiche l'état et joue les événements.

## Références

- `docs/08-refonte-pop.md` — la direction Pop et les décisions du client
- `docs/refonte-pop/maquettes.html` — maquettes cliquables (écrans, têtes `h-*`)
- `.claude/skills/playful-geometric/` — le système de design (variante Standard), ses jetons et composants
- `docs/05-jeux.md` — règles de chaque jeu
- `docs/00-cadrage.md` — toutes les décisions du client
- `docs/06-technique.md` — pile technique (Next.js + TypeScript, Motion, Supabase, Vercel, PWA)
- `e2e/README.md` — les 34 scénarios de vérification de bout en bout
- `docs/04-direction-18.md` — archive de l'ancienne direction « 18° » (ne plus appliquer)
