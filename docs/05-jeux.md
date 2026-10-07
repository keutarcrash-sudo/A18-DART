# 05 — Les jeux

Chaque jeu est un module du moteur (voir `02-principes-ux.md`, section « Moteur de jeu : le contrat »). Ce document fixe, jeu par jeu, les règles par défaut, les options et ce que l'écran doit montrer.

## Cricket

| Sujet | Décision |
|---|---|
| Règle par défaut | **Cricket classique** : fermer 15, 16, 17, 18, 19, 20 et le centre (3 touches chacun ; double = 2 touches, triple = 3). Un numéro fermé rapporte des points tant qu'un adversaire ne l'a pas fermé. Il faut tout fermer **et** mener aux points. |
| Options | « Sans points » (le premier qui ferme tout gagne) et « Cut-throat » (les points vont aux adversaires, le plus petit score gagne). |
| Affichage des touches | **3 barres inclinées à 18°** par numéro et par joueur, qui se remplissent (blanc), puis passent toutes en cyan quand le numéro est fermé. |
