# 03 — Directions créatives

Quatre pistes avec quatre philosophies différentes, pas quatre palettes. Chacune est montrée sur **le même écran** (501, Guillaume, 281, tour 04, volée 20 · 20 · 20) dans `docs/directions.html`, avec son animation de soustraction 281 → 221.

Point commun à toutes : la géométrie du jeu (secteur de 18°, 180, ordre des numéros) sert de langage graphique. Aucune ne dessine de cible complète.

---

## A — SECTEUR 18° · « Sport premium »

**Philosophie.** L'objet. La cible elle-même fournit tout : sa palette (noir, sisal, rouge, vert) et sa géométrie (le secteur de 18°). Premium par la retenue, sportif par la coupe.

| | |
|---|---|
| Couleurs | Noir charbon `#141513`, sisal `#E8DFCB` (la fibre de la cible), rouge cible `#C8342A`, vert cible `#1E7349`. Rouge = Double, vert = Triple, comme sur la vraie cible : couleur = sens. |
| Typographies | *Big Shoulders Display* (condensée, héritage des tableaux de stade) pour les chiffres et les noms ; *Archivo* pour le texte. |
| Formes | Tout ce qui est actif est coupé à 18° (angle haut droit). Les cases de fléchettes sont des parallélogrammes inclinés à 18°. Aucun arrondi. |
| Chiffres | Énormes, très condensés, crème sur noir. Le score occupe toute la largeur. |
| Boutons | Bandes pleines pleine largeur, coupe à 18°. Primaire = sisal plein ; secondaire = contour. |
| Navigation | Linéaire pendant la création de partie (étapes horizontales), 3 onglets libellés ailleurs. |
| Animations | Changement de joueur : balayage en secteur (un « quartier » de 18° qui tourne). Soustraction : le « −60 » glisse depuis le total de la volée vers le score qui défile. 180 : les trois cases se rejoignent en un secteur plein. |
| Langage graphique | Secteurs, arcs fins, l'angle de 18° répété. |
| Risque | Rester « élégant » au point d'être sage. |

---

## B — ARDOISE · « Club brutaliste »

**Philosophie.** L'héritage du pub. Avant les apps, le score des fléchettes s'écrivait à la craie : on écrit le reste, on barre l'ancien, on écrit le nouveau dessous. L'interface reprend ce geste, sans imiter la craie : grille visible, typographie brute, historique qui reste à l'écran.

| | |
|---|---|
| Couleurs | Ardoise `#262A28`, craie `#ECEBE4`, poussière (craie à 35 %), une seule couleur de signal : jaune craie `#F0D447` pour le joueur actif. |
| Typographies | *Archivo* en largeur étendue et graisse noire pour les chiffres (lourds, larges) ; *IBM Plex Mono* pour les libellés. |
| Formes | La grille est visible (filets 1 px). Cases carrées, aucun arrondi, aucune ombre. Les colonnes de joueurs sont celles d'une ardoise de pub. |
| Chiffres | Chaque joueur a sa colonne avec l'historique de ses restes, **barrés**. Le reste actuel est le seul non barré. |
| Boutons | Cellules de la grille. Le bouton Valider est une cellule pleine en craie. |
| Navigation | Texte brut, en capitales, numérotation des étapes réelle (1/4, 2/4). |
| Animations | La soustraction est un trait qui barre 281, puis 221 « s'écrit » dessous de gauche à droite. Changement de joueur : la colonne active s'élargit, les autres se resserrent. |
| Langage graphique | Filets, traits barrés, colonnes. Le passé reste visible : l'écran raconte la partie entière. |
| Risque | Moins « spectaculaire » au premier regard ; demande une exécution typographique très précise. |

---

## C — LA UNE · « Éditorial compétition »

**Philosophie.** Chaque partie est une histoire racontée comme un journal sportif. Titres générés (« Guillaume doit encore 281 »), tableaux de résultats façon page résultats, écran de fin = une « Une » à partager.

| | |
|---|---|
| Couleurs | Papier froid `#F2F1EC`, encre `#121212`, rouge titre `#D7140C`. Mode sombre « édition du soir » prévu (encre/papier inversés). |
| Typographies | *Barlow Condensed* italique très grasse (titres de presse sportive) ; *Newsreader* pour les phrases et légendes. |
| Formes | Colonnes, filets épais / fins, surtitres, numéros d'édition (« Cible 2 · Édition du 07.10 »). |
| Chiffres | Italiques, géants, intégrés dans les titres. |
| Boutons | Blocs encre pleins, rectangulaires, libellés en capitales. |
| Navigation | Rubriques (Jouer · Classement · Profil) comme les rubriques d'un journal. |
| Animations | Effet « bandeau défilant » vertical pour les scores ; le titre se réécrit à chaque volée (« Guillaume enchaîne : 60 »). |
| Langage graphique | Mise en page de presse : hiérarchie titres / chapô / tableau. Écran de résultats directement partageable (image). |
| Risque | Le fond clair éblouit dans un bar sombre ; le mode sombre doit être aussi soigné. |

---

## D — INSTRUMENT · « Précision »

**Philosophie.** Les fléchettes comme sport de mesure. L'interface est un instrument : graduations, cotes réelles (pas de tir 2,37 m, cible à 1,73 m), arcs gradués, impacts placés sur un secteur abstrait.

| | |
|---|---|
| Couleurs | Graphite `#1B1E20`, aluminium `#CDD2D3`, ambre phosphore `#FFB000` (lecture d'instrument). |
| Typographies | *Chivo Mono* très fin pour les chiffres (élégance par la finesse, à l'opposé des trois autres) ; *Chivo* pour le texte. |
| Formes | Filets fins, graduations, arcs partiels. Contours plutôt que pleins. |
| Chiffres | Fins et grands, avec unités et cotes autour. |
| Boutons | Contours fins, état actif plein. |
| Navigation | Molette / curseurs pour les options (nombre de joueurs, legs). |
| Animations | L'arc du reste se rétracte (281/501 → 221/501) ; les impacts apparaissent sur le secteur abstrait du 20. |
| Langage graphique | Graduations, impacts, trajectoires, coordonnées. Très fort pour les statistiques et le profil. |
| Risque | Les chiffres fins sont moins lisibles à 2 m ; dérive possible vers le « dashboard ». |

---

## Comparatif

| Critère | A · Secteur 18° | B · Ardoise | C · La Une | D · Instrument |
|---|---|---|---|---|
| Lisible à 2 m | ●●●● | ●●●● | ●●● | ●● |
| Lumière de bar (fond sombre) | ●●●● | ●●●● | ●● | ●●●● |
| Caractère sans couleur | ●●● | ●●●● | ●●●● | ●●● |
| Ancré dans la culture fléchettes | ●●●● | ●●●● | ●● | ●●● |
| Animation qui raconte | ●●● | ●●●● | ●●● | ●●● |
| Force pour stats / ladder | ●●● | ●●● | ●●●● | ●●●● |
| Éloignement des codes « app IA » | ●●● | ●●●● | ●●●● | ●●● |

## Recommandation

**B · ARDOISE comme base, avec l'angle de 18° et la palette « couleur = sens » de A.**

- C'est la seule direction dont l'idée centrale est une **mécanique**, pas un style : le score barré raconte la soustraction, même sans animation, même en noir et blanc. Elle passe les trois tests du brief.
- Elle vient de la culture des fléchettes de bar, ce qu'est exactement Arena18 (un complexe avec un bar), et pas de l'esthétique des apps.
- Les éléments de A (secteur de 18° pour les transitions, rouge = Double, vert = Triple sur le pavé de saisie) lui ajoutent la signature Arena18 et la dimension sportive.
- C et D restent utiles pour plus tard : la logique « La Une » pour l'écran de résultats partageable, la logique « Instrument » pour les statistiques du profil.

Le choix final vous appartient : vous pouvez aussi garder une direction pure ou demander un autre mélange.
