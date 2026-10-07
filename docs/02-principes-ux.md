# 02 — Principes UX et parcours

## Le contexte réel

Debout, un verre dans une main, le téléphone dans l'autre, 1 m à 2,37 m de la cible (distance réglementaire du pas de tir), bruit, lumière basse ou colorée, 2 à 6 personnes qui regardent l'écran.

## 8 principes

1. **Le pouce décide.** Toutes les actions de jeu sont dans le tiers inférieur de l'écran. Zone tactile minimale 56 × 56 px (au-dessus des 44 px habituels : main moins précise, doigts mouillés).
2. **Un écran = une question.** « Combien de joueurs ? », « Quel jeu ? ». Jamais deux décisions sur le même écran pendant la création de partie.
3. **Le score se lit à 2 mètres.** Score du joueur actif : au moins 120 px de haut. Tout le reste est secondaire et le montre.
4. **Le joueur actif se voit sans lire.** Il est signalé par la forme et la position, pas seulement par la couleur (test « sans couleur »).
5. **Tout est réversible.** Bouton « Annuler la dernière fléchette » toujours visible pendant la partie. Pas de fenêtre « Êtes-vous sûr ? » pendant le jeu : on annule au lieu de confirmer.
6. **Rien ne bloque le jeu.** Pas de compte, pas de pop-up, pas de cookie banner bloquant. Le mode Arena est proposé **après** la partie, jamais avant.
7. **L'animation explique.** Chaque mouvement raconte un changement de valeur ou d'état, dure 150 à 600 ms, et peut être désactivé (réglage « mouvement réduit » du téléphone respecté).
8. **Rien ne se perd.** La partie est sauvegardée sur le téléphone après chaque fléchette. Onglet fermé, écran verrouillé, batterie : on reprend là où on était.

Bonus : l'écran ne doit pas s'éteindre pendant une partie (verrouillage de mise en veille via l'API Wake Lock du navigateur).

## Parcours principal

```
QR CODE (cible 1 ou 2)
  ↓
ACCUEIL ──────────────── « Reprendre la partie » si une partie est en cours
  ↓  [Nouvelle partie]   « Rejouer la même partie » si une partie vient de finir
JOUEURS
  │  champs de prénoms, + / − ; les derniers prénoms utilisés sur ce téléphone sont proposés
  ↓
JEU
  │  liste par familles : X01 · Cricket · Entraînement · Fête · ARENA18 ORIGINALS
  ↓
OPTIONS  (sautable : options par défaut pré-réglées, 1 tape pour lancer)
  │  ex. 501 : Double Out ✓ · Double In · Nombre de legs · Ordre aléatoire
  ↓
PARTIE  ⟲  (boucle : fléchette 1 → 2 → 3 → valider → joueur suivant)
  ↓
FIN DE LEG / FIN DE PARTIE  (moment de célébration)
  ↓
RÉSULTATS  (stats de la partie, « Rejouer », « Revanche », « Enregistrer dans Arena »)
  ↓
LADDER  (optionnel, V2)
```

Nombre de tapes entre le scan et la première fléchette, en conservant les options par défaut avec 2 joueurs : **Nouvelle partie → prénom 1 → prénom 2 → 501 → Commencer = 5 tapes + saisie des prénoms.**

## Raccourcis

- **Rejouer** : mêmes joueurs, même jeu, l'ordre tourne (le perdant commence, règle de pub courante).
- **Revanche** : même chose en un bouton depuis l'écran de résultats.
- **Partie rapide** (accueil) : « 501 à 2 joueurs » en 1 tape, prénoms modifiables ensuite (Joueur 1, Joueur 2).

## L'écran de partie : contenu obligatoire

| Priorité | Information | Traitement |
|---|---|---|
| 1 | Score / état du joueur actif | Énorme, centre de l'écran |
| 1 | Nom du joueur actif | Gros, collé au score |
| 2 | Les 3 fléchettes de la volée en cours | Trois cases, remplies au fur et à mesure |
| 2 | Pavé de saisie | Tiers inférieur |
| 3 | Scores des autres joueurs | Bande compacte |
| 3 | Jeu, règle, tour | Une ligne discrète en haut |
| 4 | Suggestion de checkout (X01, si ≤ 170) | Discret, sous le score |
| 4 | Moyenne de la partie | Discret |

## Cas particuliers et erreurs

| Cas | Comportement |
|---|---|
| **Bust** (dépassement, ou reste 1, ou fini sans double en Double Out) | Animation dédiée « BUST » ; le score revient à sa valeur de début de volée ; joueur suivant après validation. |
| Erreur de saisie | « Annuler » retire la dernière fléchette, autant de fois que nécessaire, y compris à travers les changements de joueur. |
| Fléchette à côté / qui tombe | Bouton « 0 / Raté » dans le pavé. |
| Fléchette qui rebondit | Compte comme 0 (règle standard), même bouton. |
| Moins de 3 fléchettes (victoire à la 1re ou 2e) | La victoire est détectée immédiatement, pas besoin de saisir les autres. |
| Onglet fermé / téléphone verrouillé | Reprise automatique depuis l'accueil. |
| Deux parties sur deux cibles avec le même QR | Le QR contient le numéro de cible ; chaque téléphone a sa propre partie. |
| Prénoms en double | Ajout automatique d'une initiale ou d'un numéro (« Thomas », « Thomas 2 »). |
| Joueur qui part en cours de partie | « Retirer le joueur » depuis le menu de partie ; ses scores restent dans l'historique. |
| Un seul joueur | Autorisé (entraînement : High Score, Around the Clock, Bob's 27). |
| Pas de réseau | V1 : tout fonctionne hors ligne. V2 : l'envoi vers le ladder se fait plus tard, à la reconnexion. |
| Partie abandonnée | « Terminer la partie » : résultats partiels, non comptés au ladder. |

## Mode Arena (V2) : comment ne jamais bloquer

1. On joue en invité.
2. À l'écran de résultats : « Garder cette partie dans Arena18 ? » à côté de chaque joueur.
3. Le joueur choisit un pseudo + code PIN à 4 chiffres (pas d'email au premier passage).
4. La partie suivante, il tape son pseudo dans le champ prénom : l'app le reconnaît et demande le PIN.

## Moteur de jeu : le contrat (pour l'architecture)

Pour que les ARENA18 ORIGINALS soient faciles à ajouter, chaque jeu sera un module qui répond aux mêmes questions :

```
définition du jeu
  ├─ identifiant, nom, famille, nb de joueurs min/max
  ├─ options (et valeurs par défaut)
  ├─ état initial(joueurs, options)
  ├─ appliquer une fléchette(état, fléchette) → nouvel état + événements
  ├─ fin de volée(état) → nouvel état + événements
  ├─ gagnant ? (état)
  └─ données d'affichage(état) → ce que l'interface doit montrer
```

Les **événements** (« bust », « 180 », « checkout », « secteur fermé », « joueur éliminé ») sont ce qui déclenche les animations. L'interface ne connaît pas les règles : elle affiche l'état et joue les événements. Une fléchette est toujours décrite pareil : `{ secteur: 1–20 | 25, multiplicateur: 1 | 2 | 3 }` ou `raté`. Annuler = rejouer toutes les fléchettes sauf la dernière depuis l'état initial (simple et sans bug).
