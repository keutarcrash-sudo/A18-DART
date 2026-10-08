# 06 — Choix techniques

Critère principal : le client fait du vibe coding. L'app doit rester simple à faire évoluer avec une IA : technologies très répandues et bien documentées, peu de pièces, pas de serveur à administrer.

| Sujet | Décision | Pourquoi |
|---|---|---|
| Hébergement | **Vercel** | Choix du client. Mise en ligne automatique à chaque modification du dépôt GitHub, HTTPS inclus, adresse personnalisée possible (ex. `darts.arena18.fr`). |
| Base de données | **Supabase**, compte existant du client | Records du jour et de la semaine en V1 ; profils, historique et Ladder en V2. L'interface de Supabase permet de supprimer un record à la main (modération choisie). Un projet dédié « arena18-darts » sera créé dans le compte. |
| Voix de synthèse | **Pas de voix en V1** | Le client préfère ne rien proposer plutôt qu'une voix de qualité médiocre, et ne veut pas payer pour l'instant. La voix pro (service payant, phrases générées une fois puis réutilisées) reste une **option future, par exemple pour une offre VIP payante**. L'architecture prévoit dès la V1 un emplacement « annonce » sur chaque événement (180, bust, victoire, à toi…) pour la brancher plus tard sans rien refaire. |
| Effets sonores | **Oui, sobres** | Un son discret à chaque fléchette saisie, des sons plus marqués pour les célébrations (180, victoire, bust, record). Fichiers courts libres de droits (licence CC0) ou sons synthétisés directement dans le navigateur (Web Audio) : gratuits, légers, sans service externe. Bouton muet toujours accessible ; le choix est mémorisé sur le téléphone. |
| Outil de développement | **Claude Code**, directement dans ce dépôt GitHub | Déjà utilisé par le client. |

## La pile retenue (validée par le client)

Base connue du client (Next.js sur Vercel), plus quelques outils nouveaux, choisis parce qu'ils lui ouvrent des portes.

| Brique | Outil | Rôle | Nouveau pour le client ? |
|---|---|---|---|
| Framework | **Next.js** (React) + **TypeScript** | L'app elle-même. TypeScript signale les erreurs avant la mise en ligne : précieux quand c'est une IA qui écrit le code. | Next.js : non. TypeScript : peut-être. |
| Styles | **Tailwind CSS** + les jetons du design « 18° » (couleurs, angle, typos) | Les règles de la direction deviennent des classes réutilisables. | Peut-être |
| Animations | **Motion** (ex-Framer Motion) | Glissements à 18°, chiffres qui défilent, lignes du classement qui échangent leur place. | Oui |
| Personnages animés (V2) | **Rive** | Animer les personnages 3D du client (lancer, 180, bust, victoire) avec des fichiers très légers qui réagissent au jeu. | Oui |
| Moteur de jeu | **TypeScript pur**, séparé de l'interface, testé avec **Vitest** | Chaque jeu est un module (règles → moteur → interface). Les tests automatiques vérifient les règles à chaque modification : on peut ajouter un ARENA18 ORIGINAL sans casser le 501. | Oui |
| Hors ligne / installable | **PWA** (Serwist) | L'app s'ouvre même si la 5G faiblit, la partie en cours est gardée sur le téléphone, et elle peut s'installer sur l'écran d'accueil. | Oui |
| Données | **Supabase** | Records partagés (V1), profils et Ladder (V2). | Non |
| Hébergement | **Vercel** | Mise en ligne automatique depuis GitHub. | Non |
| Capture du podium | **html-to-image** + partage natif du téléphone (Web Share) | Génère l'image story du podium et ouvre WhatsApp / Instagram. | Oui |

## QR code

| Sujet | Décision | Conséquence |
|---|---|---|
| Nombre de QR codes | **Un seul QR** pour toutes les cibles | L'app ne sait pas sur quelle cible on joue : aucune mention « Cible 1 / 2 » à l'écran ni sur l'image partagée. Records et stats sont globaux à Arena18. |

## Nom

| Sujet | Décision |
|---|---|
| Nom de l'app | **A18 Darts** (court, reprend le logo, tient sous une icône de téléphone). Adresse web à définir, par exemple `darts.arena18.fr` ou l'adresse Vercel par défaut au départ. |

## Records (Supabase)

| Sujet | Mise en place |
|---|---|
| Base | Projet Supabase « arena18-darts ». La table et le résumé se créent en collant `supabase/records.sql` dans **SQL Editor** (on peut le relancer sans risque). |
| Clés | L'adresse du projet et la clé publique (« publishable ») sont écrites dans `src/lib/records.ts` : elles sont faites pour être visibles. On peut les remplacer par `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Vercel ou `.env.local`, modèle `.env.example`). La clé « secret » / « service_role » ne doit jamais aller dans l'app. |
| Ce qui est envoyé | En fin de partie seulement (une partie abandonnée n'envoie rien) : volées de 60 et plus, 180, checkouts (301/501), et la partie (pour « Parties aujourd'hui »). Si le réseau manque, l'envoi attend sur le téléphone. |
| Sécurité | Le téléphone peut seulement **ajouter** des lignes et lire le **résumé** ; la base refuse les scores impossibles. Filtre de gros mots dans l'app. |
| Modération | Supabase → Table Editor → `records` → sélectionner la ligne → Delete. |
| Record du jour battu | Une volée de 60 et plus qui dépasse la meilleure volée du jour : célébration plein écran en chartreuse. |
