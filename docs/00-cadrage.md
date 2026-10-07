# 00 — Cadrage du brief

## Le produit en une phrase

Un outil de scoring si évident qu'on l'utilise sans explication, avec une identité si nette qu'on reconnaît Arena18 même écran éteint à moitié, et une mécanique (stats, ladder) qui donne envie de revenir.

## Ce que le brief impose (non négociable)

- Zéro compte, zéro installation pour jouer. QR → partie en moins de 30 secondes.
- Utilisation debout, une main, dans un bar bruyant, éclairage variable, plusieurs personnes qui regardent.
- Score principal lisible à plusieurs mètres.
- Architecture « règles → moteur → interface » séparée, pour ajouter des jeux (et les ARENA18 ORIGINALS) sans tout reconstruire.
- Aucun code visuel « app gaming générée par IA » : pas de néon, glow, glassmorphism, gradient bleu/violet, emoji, 3D générique.
- Test de robustesse du design : sans animation → reste beau ; sans couleur → garde du caractère ; sans illustration → reste reconnaissable.

## L'insight fondateur : le 18 est déjà dans la cible

En préparant ce dossier, un fait simple ressort : **Arena18 et les fléchettes partagent le même nombre.**

| Fait | Pourquoi c'est utile |
|---|---|
| Une cible a 20 secteurs. 360° / 20 = **18°**. Chaque secteur fait exactement 18°. | L'angle de 18° devient la forme signature : coupes de boutons, inclinaisons, transitions en balayage. C'est une forme, pas une couleur, donc elle survit au test « sans couleur ». |
| Le score maximum d'une volée est **180** (3 × triple 20). | Le moment « 180 » est le moment le plus célébré du jeu. Il contient « 18 ». C'est l'animation de célébration naturelle d'Arena18. |
| Sur la cible, le **18 est voisin du 20** (ordre : 20 · 1 · 18 · 4 · 13 …). | Détail d'initié, utilisable dans l'iconographie ou un écran de chargement. |

Le langage graphique peut donc venir de la géométrie du jeu, sans dessiner de cible.

## Décisions qui restent à prendre

Classées par urgence. Les premières bloquent l'étape suivante.

### Bloquant pour la suite

1. **Direction créative** — choisir une des 4 pistes (ou un mélange explicite) dans `03-directions-creatives.md`.
2. **Identité Arena18 existante** — y a-t-il un logo, des couleurs, une typo officiels ? La web app doit-elle s'y aligner strictement, s'en inspirer, ou peut-elle s'en écarter ?
3. **Mode de saisie du score** — voir ci-dessous, c'est la décision UX la plus structurante.

### Mode de saisie : la vraie question

| Option | Pour | Contre |
|---|---|---|
| **A. Fléchette par fléchette** (pavé 1–20 + Simple/Double/Triple + Bull + Raté) | Indispensable pour Cricket, Around the Clock, Shanghai, Killer. Permet de valider un Double Out automatiquement, de calculer les checkouts, les vraies stats. | 3 à 6 tapes par volée. |
| **B. Total de la volée** (pavé numérique 0–9) | Très rapide pour 301/501. | Impossible pour le Cricket. Stats pauvres. Le Double Out repose sur la bonne foi. |
| **C. Hybride** (A par défaut, B en option pour X01) | Le meilleur des deux. | Un réglage de plus à expliquer. |

**Recommandation : C.** La saisie fléchette par fléchette est le mode par défaut et unique pour les jeux qui l'exigent. En X01, un bouton discret « saisir le total » bascule vers le pavé numérique. Les stats du ladder ne comptent que les parties saisies fléchette par fléchette.

### À décider avant le développement

4. **Un téléphone pour tous ou un téléphone par joueur ?** Recommandation V1 : un seul téléphone, posé ou tenu par « le marqueur » (comme le marqueur à la craie dans un pub). Multi-appareils en V3 (écran public, Arena TV).
5. **Langue** — français seul en V1 ? Anglais prévu (clientèle touristique) ?
6. **Hébergement et nom de domaine** — ex. `darts.arena18.xx`. Le QR code doit pointer vers une URL stable, idéalement avec l'identifiant de la cible (`/c/1`, `/c/2`) pour savoir où la partie a été jouée.
7. **Jeux V1** — proposition : 301, 501, Cricket, Around the Clock, Killer, High Score. Le reste en V1.1.
8. **Ladder : qui peut y entrer ?** Un pseudo + code PIN suffit-il (V2), ou faut-il un vrai compte (email) ? Comment éviter la triche (scores inventés) ? Piste : une partie ne compte pour le ladder que si au moins 2 joueurs Arena y participent, ou si elle est validée au bar.
9. **Données personnelles** — dès qu'on stocke des pseudos liés à des performances (V2), il faut une mention RGPD simple et une suppression de profil possible.

### Pour plus tard (V2/V3), à garder en tête dès l'architecture

10. Système de rating (Elo, Glicko, ou propriétaire) — à concevoir pour que le volume de parties ne suffise pas à dominer le classement.
11. Écran public / Arena TV — prévoir que l'état d'une partie puisse être diffusé en temps réel (Supabase Realtime le permet).
12. Format des ARENA18 ORIGINALS — définir un « contrat » commun à tous les jeux (voir `02-principes-ux.md`, section moteur).
