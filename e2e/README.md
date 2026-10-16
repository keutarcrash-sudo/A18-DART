# Scénarios de vérification de bout en bout

`scenarios.js` rejoue **34 scénarios** dans un vrai navigateur (iPhone 13 simulé, en français) : 501, Plus gros score, Cricket, Killer et Tour de l'horloge. Pour chacun, il prépare une partie, touche les boutons comme un joueur, puis vérifie que les bons textes apparaissent (« TCHAK », « BUST », « PLOC », « CLAC », « BULL ! »…) et que le podium arrive quand il le faut.

Il s'appuie sur les libellés et les `aria-label` des boutons (« TRIPLE 20 », « Valider la volée », « Touché le 20 »…) : ne les change pas sans mettre ce fichier à jour.

## Lancer

1. Construire et démarrer l'app sur le port 3018 :

   ```bash
   npm run build && npx next start -p 3018
   ```

2. Dans un autre terminal, lancer les scénarios (Playwright installé globalement, avec Chromium) :

   ```bash
   PW=$(npm root -g)/playwright node e2e/scenarios.js <dossier-captures>
   ```

   `<dossier-captures>` doit exister : une capture d'écran par scénario y est enregistrée (`01.png`, `02.png`…).

Pour ne lancer que certains scénarios, filtrer par un morceau de leur nom : `ONLY=Cricket PW=... node e2e/scenarios.js <dossier>`.

## Résultat

Une ligne par scénario : `OK` ou `FAIL` suivi du détail (étape qui a échoué, texte manquant ou interdit, erreur dans la page, podium absent). Attendu : **34 OK**.
