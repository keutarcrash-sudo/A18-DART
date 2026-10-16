# 08 — Refonte visuelle « Pop » (Playful Geometric)

Statut : **faite (en attente de validation client sur captures)** (octobre 2026). Toute l'app est passée en Pop sur la branche de travail ; la mise en ligne attend l'accord du client sur les captures. Une fois validé, ce document fait foi.
Maquettes cliquables : [`docs/refonte-pop/maquettes.html`](refonte-pop/maquettes.html) (copie de la page partagée au client).

Ce document remplace, pour tout ce qui se voit, la direction « 18° » (`04-direction-18.md`) et les règles visuelles de la skill `a18-design`. Les règles des jeux (`05-jeux.md`), les choix techniques (`06-technique.md`) et le fonctionnement de la saisie ne changent pas.

## Pourquoi

Le client trouve l'app « pas assez alignée avec la direction artistique voulue, trop sombre, manque de fun ». La V1 suit la charte Arena18 (fond noir, cyan, angle de 18°) ; le pop art n'arrive que pendant les célébrations. Le client veut que **toute l'app** respire la bonne humeur : un album de stickers, pas un outil de calcul.

Succès = en ouvrant l'app au bar, on a envie de sourire avant même de lancer une fléchette, et l'écran de jeu reste aussi rapide et lisible qu'aujourd'hui.

## Objectifs

- Passer **tous les écrans**, écran de jeu compris, au style **Playful Geometric** (skill `.claude/skills/playful-geometric/`, variante **Standard**).
- Ajouter les **têtes déjantées** (8 personnages) liées aux moments de jeu.
- Ajouter sur l'écran de jeu 301/501 une **cible permanente** où les fléchettes de la volée se plantent, et la **surbrillance des cases pour finir**.

## Non-objectifs

- Changer les règles, le moteur, les options de partie, la sauvegarde, les records, la PWA, la langue.
- Adapter les têtes au visuel de Pierre : on le fera quand il l'enverra (voir « Plus tard »).

## Anti-objectifs (ce qui serait un échec même si ça marche)

- Un écran de jeu moins lisible : score illisible à 2 m, touches trop petites, cible qui gêne la saisie.
- Des têtes ou des formes qui bloquent la saisie ou passent sous le doigt.
- Un écran qui clignote de partout (trop de surbrillances, trop de confettis).
- Revenir par réflexe à l'ancien style (noir, cyan, 18°) parce que l'ancienne skill le dit.

## Décisions du client

1. **Refonte complète**, écran de jeu compris, **animations comprises**.
2. **Abandonnés** : fond noir, cyan et chartreuse, angle unique de 18°, chiffres « A18 Élan Gras », logo A18 en haut d'écran.
3. **Style Playful Geometric**, comme dans les maquettes : fond crème `#FFFDF5`, encre `#1E293B`, violet `#8B5CF6` (actions principales), rose `#F472B6`, ambre `#FBBF24`, menthe `#34D399` ; contours noirs épais ; ombres dures décalées sans flou ; formes qui flottent en fond ; boutons qui se soulèvent et s'enfoncent.
4. **Têtes déjantées** (validées toutes les huit, « Mort de rire » corrigé : tête jaune, yeux plissés, larmes bleu clair qui giclent). Le bleu clair `#7DD3FC` est autorisé **uniquement** pour ces larmes.
5. **Cible sur l'écran de jeu** (idée reprise de la version de Pierre) : affichée **en permanence**, les 3 fléchettes de la volée s'y plantent au bon endroit (simple, double, triple, 25, bull) et y restent jusqu'à « Valider la volée ».
6. **Surbrillance pour finir** :
   - si on peut finir **en une fléchette**, **toutes** les façons de le faire s'allument (ex. reste 2 en sortie simple : le 2 et le Double 1 ; en sortie double : le Double 1 seul) ;
   - sinon, seul le **chemin conseillé** s'allume (ex. reste 100 : Triple 20 puis Double 20), recalculé après chaque fléchette ;
   - la surbrillance est jaune ambre et pulse doucement, **sur la cible et sur le pavé** (pastille D / T sur la touche).
7. **Scènes animées : mêmes histoires, redessinées dans le nouveau style.** La fléchette qui déchire l'écran et se plante dans le bull, la cible qui se brise sur un bust, la fléchette enflammée du ton-up, le cadenas du numéro fermé, les trois ratés dans le panneau en bois : même déroulé et même durée qu'aujourd'hui, mais dessinés en Playful Geometric (fond crème ou aplats de la palette, contours noirs épais, ombres dures, confettis géométriques) et avec la tête du moment à la place du smiley. Le bandeau de niveau moyen et la bulle de clin d'œil suivent le même style.
8. Toujours valables : **rien ne se termine tout seul** (victoire et bust attendent « Valider la volée »), Annuler toujours visible, Double / Triple au-dessus du pavé sans cacher de touche, pas d'initiales remplacées par des têtes sur le podium (les initiales restent, les têtes décorent autour).

## Les têtes et leurs moments

| Tête | Description | Moment |
|---|---|---|
| L'Explosée | yeux exorbités, crâne en étoile qui tourne | 180 et grosses volées |
| Le Frimeur | lunettes noires, sourire en coin | victoire, passer devant |
| Le Coup de cœur | cœurs qui battent à la place des yeux | record du jour |
| Le Mort de rire | jaune, plié de rire, larmes qui giclent | ton-up (100 et plus) |
| Le Tire-langue | clin d'œil, langue tirée | chambrage, le 26 |
| Le Tournis | yeux en spirale, bouche en zigzag | trois ratés |
| La Fondue | tête qui coule | bust, éliminé (Killer) |
| Le Crispé | dents serrées, goutte de sueur | « Au bull ! », dernier double |

Elles remplacent **partout** la mascotte smiley actuelle (`Mascot` dans `src/components/pop/Pop.tsx`) : bulles de clin d'œil, écran « Au bull ! », célébrations de niveau moyen. Dessins de référence : symboles SVG `h-*` dans `docs/refonte-pop/maquettes.html`. Chaque tête bouge en boucle (yeux qui tournent, tête qui fond…) et s'arrête si le téléphone demande moins d'animations.

## Écrans (voir maquettes)

- **Accueil** : grosse carte violette « Reprendre » (ou « Jouer » si aucune partie), bouton secondaire « Nouvelle partie », phrase « À l'Arena18, le 180 joue à domicile. » avec surligneur ambre sous « 180 », records sur une carte sticker (onglets Aujourd'hui / Semaine), lien d'installation en bas. FR · EN en pastille.
- **Choix du jeu** : une carte par jeu, chacune avec sa forme et sa couleur, durée en pastille (menthe quand 10 à 30 min).
- **Écran de jeu 301/501** : carte joueur blanche (nom, score géant, « −60 » qui poppe, pastille « Pour finir »), cible à droite, autres joueurs en bas de la carte ; rangée des 3 fléchettes (Simple blanc, Double ambre, Triple rose) ; pavé 1–20 en touches arrondies à ombre dure ; 25 / BULL / RATÉ / Annuler ; « Valider la volée » en grand bouton violet.
- **Chambrage** : la tête surgit en bas avec une bulle, sans bloquer la saisie ; une tape la fait disparaître.
- **Podium** : marches de formes différentes (1 violet, 2 rose, 3 menthe), initiales dans des pastilles, têtes autour du titre, « Volée de la partie », Revanche et Partager côte à côte.

## Contraintes

- Mobile d'abord, une main, debout au bar. Touches ≥ 46 px, actions principales ≥ 56 px, actions de jeu dans le bas de l'écran.
- Score du joueur actif lisible à 2 m (police Outfit très grasse, chiffres de même largeur).
- `prefers-reduced-motion` : plus de rebond, de confettis ni de têtes qui bougent ; tout reste beau à l'arrêt.
- Contraste : texte encre sur crème ou blanc ; texte blanc uniquement sur violet ou encre.
- Pas de rouge pour l'erreur (le bust reste raconté par la Fondue et la scène existante).
- Français et anglais : tous les nouveaux textes passent par `t()` et le dictionnaire `src/lib/i18n-en.ts`.
- Moteur et interface séparés : la cible et la surbrillance lisent l'état du moteur (`suggestCheckout` existe déjà dans `src/engine/x01.ts`), elles ne calculent pas les règles elles-mêmes.

## Choix laissés au développeur (marqués comme choix de Claude)

- Police des titres et des chiffres : **Outfit** (800–900, chiffres tabulaires) ; texte courant : **Plus Jakarta Sans**. Via `next/font/google`.
- Logo provisoire en haut d'accueil : petite cible dans un carré ambre + « A18 Darts », en attendant l'icône pop art finale.
- La skill `a18-design` est **réécrite** avec ces règles (elle reste la skill prioritaire de l'app) ; l'ancienne direction « 18° » reste dans `docs/04-direction-18.md` comme archive.
- Position exacte des fléchettes dans une zone : un peu au hasard dans la bonne case, pour faire vrai.
- Ordre des travaux, découpage en étapes, composants à créer.
- **Les 4 autres jeux** (Cricket, Killer, Tour de l'horloge, Plus gros score) gardent exactement leur façon de saisir (`05-jeux.md`) et sont seulement **repeints** avec les mêmes briques que le 501 : carte joueur, touches à ombre dure, couleurs Playful. Ce qui était « incliné à 18° » devient arrondi ; ce qui était « cyan » (fermé, meneur, actif) devient violet ; les marques de Cricket deviennent des pastilles rondes. **Plus gros score** reçoit aussi la cible (même pavé que le 501), sans surbrillance pour finir. Cricket, Killer et Horloge n'ont pas de cible : chez eux, le tableau ou les joueurs sont déjà le pavé.
- **Déclencheurs des têtes** : on branche les têtes sur les célébrations qui existent déjà (`CeleSpec` dans `Celebration.tsx`) sans en créer de nouvelles. « Grosses volées » = le 180 ; « passer devant » = le clin d'œil existant ; « dernier double » = l'écran de pression existant s'il y en a un, sinon seulement « Au bull ! ». Si deux moments tombent ensemble, la priorité actuelle des célébrations décide.
- **La cible est un affichage**, on ne tape pas dessus : la saisie se fait uniquement au pavé, comme aujourd'hui.
- **Pas de surbrillance** tant qu'un joueur en Double in n'est pas ouvert, ni quand la volée est en bust (en attente de « Valider »). Le moteur exposera une fonction « toutes les façons de finir en une fléchette » à côté de `suggestCheckout`, avec ses tests.

## Plus tard

- Adapter les têtes au visuel de Pierre quand il l'enverra (même liste de têtes et de moments, nouveau dessin).
