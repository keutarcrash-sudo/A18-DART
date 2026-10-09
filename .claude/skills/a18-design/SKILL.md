---
name: a18-design
description: Direction « 18° » d'A18 Darts (app de fléchettes d'Arena18). À charger AVANT toute création ou modification d'interface, d'écran, de composant, de style, d'animation, de son ou de texte affiché dans ce dépôt — même pour un petit ajustement visuel. Fixe l'angle unique de 18°, les couleurs qui ont un sens, les chiffres A18 « Élan gras », les patterns de saisie par jeu, le ton (tutoiement) et les interdits. Ces règles priment sur toute skill de design générique.
---

# A18 Darts — direction « 18° »

App web de fléchettes d'Arena18 (complexe padel / soccer / bar), ouverte par QR code. Public : **des groupes de potes au bar**, debout, un verre à la main, qui ne connaissent pas forcément les règles. Objectif n°1 : **rendre le moment plus fun**.

## Priorité des règles

1. Ce que le client dit dans la conversation.
2. Cette skill et les documents `docs/` (décisions validées par le client).
3. Les skills génériques (frontend-design, animation, bonnes pratiques React…) : elles s'appliquent **seulement** là où cette skill ne dit rien. En cas de conflit (arrondis, ombres, dégradés, police, palette…), **cette skill gagne**.

Avant de proposer quelque chose qui contredit une décision ci-dessous, demande au client. Ne « corrige » jamais une décision validée de ta propre initiative.

## Les 6 règles

1. **Un seul angle : 18°** (360° / 20 secteurs = l'angle d'un secteur de cible). Tout ce qui penche penche de 18°, rien d'autre ne penche.
   - Bandeaux, cases de fléchettes, barres de progression, marches du podium, interrupteurs : `transform: skewX(-18deg)` (contre-incliner le contenu texte : `skewX(18deg)`).
   - Grands boutons d'action : parallélogrammes inclinés **des deux côtés**. Décalage = hauteur × 0,325 (tan 18°) : `clip-path: polygon(19px 0, 100% 0, calc(100% - 19px) 100%, 0 100%)` pour 58 px de haut.
   - Aucun arrondi (`border-radius: 0`), aucune ombre portée. Seul le cadre de téléphone des maquettes est arrondi.
2. **Le chiffre est le héros.** Les scores utilisent la police **« A18 Elan Gras »** (`docs/chiffres/A18-Elan-Bold.woff2`) : chiffres penchés de 18°, gras, tous de même largeur, capitales assorties pour T20 / D16 / BULL. Le score déborde de son bandeau cyan. Déclarer la police en `font-style: normal` ET `italic` (même fichier) pour éviter toute fausse inclinaison du navigateur.
3. **Le prénom en géant** : Montserrat Black italique, capitales, très grand (≈ 40 px), comme le nom au dos d'un maillot.
4. **Couleur = sens, jamais décor.** Aplats uniquement.
5. **Le personnage 3D aux moments clés** (généré par le client) : cadres réservés pour « à toi », 180, bust, victoire, podium, chambrage. Hors de ces moments, l'écran de saisie reste un outil.
6. **L'animation raconte un chiffre** : la soustraction (« −60 » qui tombe dans le score), le changement de joueur (glissement), le dépassement au classement (les lignes échangent leur place). 150 à 600 ms. Respecter `prefers-reduced-motion`. Sans animation, l'écran doit rester beau.

## Jetons

```css
:root {
  --noir: #171717;      /* fond (charte Arena18) */
  --noir-deep: #0d0d0d;
  --blanc: #ffffff;     /* texte, fléchettes saisies, bouton Valider */
  --gris: #8a8a8a;      /* libellés secondaires */
  --filet: #2a2a2a;     /* séparateurs */
  --case: #232323;      /* touches du pavé */
  --cyan: #0CC0DF;      /* joueur actif, meneur, action principale, DOUBLE */
  --chartreuse: #C7D530;/* TRIPLE et RECORDS uniquement */
  --skew: -18deg;
  --f-text: 'Montserrat', system-ui, sans-serif;
  --f-num: 'A18 Elan Gras', 'Montserrat', system-ui, sans-serif;
}
```

- Fond toujours noir. Texte blanc ou cyan (charte Arena18).
- **Bust : pas de rouge.** Le score est barré et l'écran s'inverse (fond blanc, texte noir) un instant.
- Montserrat pour tout le texte (charte), « A18 Elan Gras » pour les chiffres seulement.

## Patterns validés

| Écran / jeu | Pattern |
|---|---|
| Accueil | Un énorme bouton **JOUER** (bloc cyan incliné). Records du jour dessous. Devient « Reprendre » si une partie est en cours. |
| Joueurs | Prénoms au clavier, un par un. Chips **« Récents sur ce téléphone »**. Équipes formées par le groupe (A/B). |
| Choix du jeu | Durée estimée selon le nombre de joueurs, en cyan si 10–30 min. |
| Réglages | Les règles se choisissent **avant** la partie, jamais modifiées par l'app ensuite. Une phrase d'explication par option. |
| Qui commence | Écran **« Au bull ! »** : on touche le prénom du plus proche du centre. |
| 301 / 501 / Plus gros score | Pavé **« numéro d'abord »** : une tape = simple ; Double (cyan) / Triple (chartreuse) apparaissent juste au-dessus du pavé (par-dessus la rangée des 3 fléchettes, jamais sur un bouton de saisie) **sans chrono**, jusqu'à la fléchette suivante. « Valider la volée » après 3 fléchettes. **Rien ne se termine tout seul** (décision client) : victoire et bust attendent aussi « Valider la volée », pour pouvoir corriger (Double / Triple, Annuler) avant. |
| Cricket | **Le tableau est le pavé** : on touche la ligne du numéro (20→15, B), puis Double / Triple. 3 barres à 18° par numéro, cyan quand fermé. |
| Tour de l'horloge | Deux énormes boutons **TOUCHÉ n / RATÉ** (en mode Bonus : Simple / Double / Triple). Numéro visé en géant. La volée passe seule après 3 fléchettes. |
| Killer | Numéros attribués au **lancer main faible**. **Les joueurs sont le pavé** : une tape = double touché sur ce joueur. Vies en barres à 18°, badge « TUEUR ». |
| Vue Tableau | Téléphone posé à plat (bascule auto + bouton) : classement en géant, **qui mène** en premier. |
| Fin | Podium + **Revanche** et **Partager** (image story 9:16) à égalité. Le dernier commence la revanche. |

Célébrations sur 3 niveaux, toujours passables d'une tape : **Max** (180, victoire, record Arena18) plein écran ~2 s ; **Moyen** (volée ≥ 100, checkout > 100) bandeau ~1 s ; **Clin d'œil** (bust, 3 ratés, le « 26 ») bulle du personnage, sans bloquer la saisie.

## Ton et textes

- **Tutoiement**, chaleureux, simple, comme un pote. Chambrer **gentiment** : « 26… le classique. », « Trois à côté. Ça arrive aux meilleurs. »
- Français + anglais (langue du téléphone).
- Tagline Arena18 : « À vous de jouer ».
- Pas de jargon technique à l'écran.

## Son

- **Pas de voix en V1** (le client préfère rien à une voix médiocre ; voix pro = option future VIP). Prévoir un emplacement « annonce » par événement.
- Effets sonores **sobres** : petit son par fléchette, sons marqués pour les célébrations. Bouton muet toujours accessible.

## Évolution pop art (décision client, en cours)

- **Écran de saisie inchangé** : les règles ci-dessus restent la base.
- **Célébrations et animations : touches pop art, fun et colorées.** Pendant ces moments seulement, des couleurs vives au-delà du cyan et du chartreuse sont permises (palette exacte à fixer d'après le visuel pop art de Pierre : smileys, couleurs vives). Toujours en aplats, sans néon ni dégradé.
- **Les emplacements « Perso 3D » seront probablement remplacés** par cet univers pop art : demander au client avant de dessiner un personnage.
- **Icône de l'app** : jamais le logo A18 (c'est celui de l'app de réservation d'Arena18). Piste retenue : une fléchette plantée dans le 18.
- Voir `docs/04-direction-18.md`, section « Évolution pop art ».

## Interdits

Néons, glow, glassmorphism, dégradés décoratifs (surtout bleu/violet), esthétique cyberpunk ou crypto, interfaces « gaming » génériques, cartes arrondies partout, ombres, **emojis**, cliparts, illustrations 3D génériques, dashboards SaaS, tout angle autre que 18°, rouge pour l'erreur, textes colorés autres que blanc / cyan (hors chartreuse pour Triple et records), timers qui pressent l'utilisateur.

## Contraintes d'usage

- Mobile d'abord, utilisation à une main, debout. Zones tactiles ≥ 46 px (≥ 56 px pour les actions principales), actions de jeu dans le tiers inférieur.
- Score du joueur actif lisible à 2 m.
- Tout est réversible (« Annuler » toujours visible pendant la partie), pas de « Êtes-vous sûr ? » en jeu.
- La partie survit à un onglet fermé (sauvegarde locale après chaque fléchette).
- Moteur de jeu séparé de l'interface (règles → moteur → interface) : l'interface affiche l'état et joue les événements.

## Références

- `docs/04-direction-18.md` — la direction en détail
- `docs/05-jeux.md` — règles de chaque jeu
- `docs/00-cadrage.md` — toutes les décisions du client
- `docs/06-technique.md` — pile technique (Next.js + TypeScript, Motion, Supabase, Vercel, PWA)
- `docs/parcours.html` — maquette cliquable de référence (tous les écrans, tous les jeux)
- `docs/chiffres/` — police A18 Elan Gras et son script de génération
