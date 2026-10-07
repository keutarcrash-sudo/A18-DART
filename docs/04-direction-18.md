# 04 — Direction créative « 18° »

Remplace les 4 pistes de `03-directions-creatives.md`, qui sont conservées comme archive. Cette direction intègre toutes les réponses du cadrage (`00-cadrage.md`).

Planche visuelle cliquable : `docs/direction-18.html`.

## L'idée en une phrase

**L'énergie d'un jeu, la rigueur d'un tableau de score, et un seul angle pour tout : 18°, celui d'un secteur de cible.**

## Les 6 règles

1. **Un seul angle : 18°.** Tout ce qui est incliné (bandeaux, onglets, cases de fléchettes, transitions) l'est exactement de 18°. Rien d'autre n'est penché. Les grands boutons d'action sont des **parallélogrammes inclinés à 18° des deux côtés** : le décalage vaut hauteur × 0,325 (tan 18°), par exemple 19 px pour un bouton de 58 px. *(Décision après test client.)* C'est la signature d'Arena18 : visible sans couleur, sans logo, sans personnage.
2. **Le chiffre est le héros.** Les scores utilisent des chiffres Arena18 dessinés sur mesure, dans l'esprit du « 18 » du logo (empattements carrés, style numéro de maillot). Ils débordent de leur bandeau, comme les personnages débordent des cartes dans les références. **Variante retenue : « Élan gras »** : dérivée de Roboto Slab Black (licence Apache 2.0), penchée de 18°, épaissie, chiffres de même largeur, capitales assorties pour T20 / D16 / BULL. Fichiers et script de génération dans `docs/chiffres/`, comparaison dans `docs/chiffres.html`. Premier jet, à affiner par un graphiste.
3. **Le prénom en géant.** Le joueur actif est écrit en Montserrat Black italique, en capitales, très grand, comme le nom au dos d'un maillot.
4. **Couleur = sens, jamais décor.** Toutes les couleurs sont en aplat, sans dégradé ni lueur.
   - Noir Arena `#171717` : le fond.
   - Blanc : le texte.
   - Cyan Arena `#0CC0DF` : le joueur actif, le meneur, l'action principale, le **Double**.
   - Chartreuse `#C7D530` : le **Triple** et les **records**. La couleur historique du logo retrouve un rôle précis.
   - Bust : pas de rouge. Le score est barré et l'écran s'inverse (blanc sur noir → noir sur blanc) pendant un instant.
5. **Le personnage aux moments clés.** Le personnage 3D (généré par le client) a une place réservée pour chaque moment : à toi de lancer, 180, bust, victoire, podium, chambrage. Hors de ces moments, il disparaît : l'écran de saisie reste un outil.
6. **L'animation raconte un chiffre.** Soustraction (« −80 » qui tombe dans le score), changement de joueur (glissement à 18°), dépassement au classement (les lignes échangent leur place), record (bandeau chartreuse).

## Les deux vues de l'écran de jeu

| Vue **Saisie** (téléphone en main) | Vue **Tableau** (téléphone posé à plat) |
|---|---|
| Prénom géant + score dans un bandeau cyan incliné | Classement de la course vers zéro, en géant |
| Les 3 fléchettes de la volée | Rang en grand italique, prénom, reste |
| Mini-piste de course en haut (qui mène) | Barre de progression inclinée par joueur |
| Pavé « numéro d'abord » : une tape = simple ; Double / Triple apparaissent sous le pouce et y restent jusqu'à la fléchette suivante | Bandeau « À toi : Guillaume » en haut |

Bascule automatique selon la position du téléphone, plus un bouton pour forcer la vue.

## Le pavé « numéro d'abord »

- 20 touches (1 à 20) en 4 rangées de 5, puis une rangée : `25` · `BULL` · `RATÉ` · `ANNULER`.
- Taper un numéro enregistre un **simple** tout de suite.
- La dernière rangée est alors remplacée par deux grandes touches : `DOUBLE 20` (cyan) et `TRIPLE 20` (chartreuse). **Pas de chrono** : elles restent affichées jusqu'à la fléchette suivante, une annulation ou la validation. Une tape transforme le simple en double ou en triple. *(Décision après test client : 1,5 s ne laissait pas assez de temps.)*
- La 3e fléchette saisie fait apparaître « Valider la volée ». En cas de victoire ou de bust, la volée se termine d'elle-même.

## Ce qui reste à valider sur la planche

- La lisibilité du score à 2 m (taille, contraste du noir sur cyan).
- La vue Tableau à 6 joueurs ou plus (lignes plus serrées, ou défilement ?).
- Le dessin des chiffres sur mesure (à faire dessiner par un typographe, ou à dessiner nous-mêmes en SVG).
