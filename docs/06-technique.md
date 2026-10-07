# 06 — Choix techniques

Critère principal : le client fait du vibe coding. L'app doit rester simple à faire évoluer avec une IA : technologies très répandues et bien documentées, peu de pièces, pas de serveur à administrer.

| Sujet | Décision | Pourquoi |
|---|---|---|
| Hébergement | **Vercel** | Choix du client. Mise en ligne automatique à chaque modification du dépôt GitHub, HTTPS inclus, adresse personnalisée possible (ex. `darts.arena18.fr`). |
| Base de données | **Supabase**, compte existant du client | Records du jour et de la semaine en V1 ; profils, historique et Ladder en V2. L'interface de Supabase permet de supprimer un record à la main (modération choisie). Un projet dédié « arena18-darts » sera créé dans le compte. |
| Voix de synthèse | **Pas de voix en V1** | Le client préfère ne rien proposer plutôt qu'une voix de qualité médiocre, et ne veut pas payer pour l'instant. La voix pro (service payant, phrases générées une fois puis réutilisées) reste une **option future, par exemple pour une offre VIP payante**. L'architecture prévoit dès la V1 un emplacement « annonce » sur chaque événement (180, bust, victoire, à toi…) pour la brancher plus tard sans rien refaire. |
