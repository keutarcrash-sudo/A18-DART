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
