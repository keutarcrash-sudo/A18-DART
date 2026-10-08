# 05 — Les jeux

Chaque jeu est un module du moteur (voir `02-principes-ux.md`, section « Moteur de jeu : le contrat »). Ce document fixe, jeu par jeu, les règles par défaut, les options et ce que l'écran doit montrer.

## Cricket

| Sujet | Décision |
|---|---|
| Règle par défaut | **Cricket classique** : fermer 15, 16, 17, 18, 19, 20 et le centre (3 touches chacun ; double = 2 touches, triple = 3). Un numéro fermé rapporte des points tant qu'un adversaire ne l'a pas fermé. Il faut tout fermer **et** mener aux points. |
| Options | « Sans points » (le premier qui ferme tout gagne) et « Cut-throat » (les points vont aux adversaires, le plus petit score gagne). |
| Affichage des touches | **3 barres inclinées à 18°** par numéro et par joueur, qui se remplissent (blanc), puis passent toutes en cyan quand le numéro est fermé. |
| Saisie | **Le tableau sert de pavé.** Chaque ligne (20, 19, 18, 17, 16, 15, Bull) est une grande touche : une tape sur la ligne = un simple sur ce numéro, puis Double / Triple apparaissent sous le pouce (sans chrono), comme au 501. Une touche « Raté / Autre » sous le tableau pour les fléchettes hors 15-20. Les lignes sont rangées de 20 à 15 puis Bull, dans l'ordre traditionnel de l'ardoise. |

## Tour de l'horloge

| Sujet | Décision |
|---|---|
| Règle par défaut | **Chaque touche fait avancer d'un numéro**, quel que soit le multiplicateur. |
| Option | « Bonus d'avance » : simple = +1, double = +2, triple = +3. |
| Saisie | **Deux énormes boutons par fléchette** : « TOUCHÉ 7 » et « RATÉ ». En mode bonus, « TOUCHÉ » se décline en Simple / Double / Triple. Le numéro visé est affiché en géant avec les chiffres Arena18. |
| Fin | **Au 20** par défaut ; option « Finir au bull » (après le 20, il faut toucher le centre). |

## Killer

| Sujet | Décision |
|---|---|
| Attribution des numéros | **Lancer main faible**, comme la tradition : chacun lance une fléchette de sa main faible, le numéro touché devient le sien. Relance si le numéro est déjà pris ou si la fléchette sort. L'écran affiche « Main faible ! » et un pavé 1-20 pour saisir le numéro obtenu. |
| Devenir tueur | **Règle classique** : toucher le double de son propre numéro. Ensuite, chaque double touché sur le numéro d'un adversaire lui enlève une vie. |
| Tueur qui touche son propre double | **Il perd une vie** (règle traditionnelle). Moment « clin d'œil » idéal pour le personnage. |
| Vies | **Réglable** de 1 à 5, **3 par défaut**. |
| Saisie | **Les joueurs servent de pavé.** Chaque ligne affiche le prénom, son numéro (chiffres Arena18), ses vies (barres à 18°) et un badge « TUEUR » une fois le statut gagné. Seuls les doubles comptent : une tape sur la ligne = **double de ce joueur touché** (comme sur la maquette du parcours). « Raté / Autre » pour tout le reste. La revanche refait le tirage des numéros, et c'est le dernier qui commence. Les joueurs éliminés restent visibles, barrés. |

## Plus gros score

| Sujet | Décision |
|---|---|
| Nombre de volées | **Réglable** : 3, 5, 8 ou 10, **8 par défaut**. |
| Saisie | Le **même pavé qu'au 501** (numéro d'abord, Double / Triple sans chrono) : il faut connaître chaque fléchette pour détecter les 180 et les records. |
| Affichage | La course monte au lieu de descendre : le score grimpe dans le bandeau cyan, et la vue Tableau montre qui mène. Un compteur « Volée 5/8 » remplace le numéro de tour. La partie s'arrête toute seule après la dernière volée du dernier joueur ; égalité possible (plusieurs gagnants). |
