# Recette : hero de landing page Memphis animé (variante Loud)

Exemple de référence : le produit fictif **« Loopa »**, un outil SaaS pour équipes. Remplacer nom, textes et chiffres par ceux du vrai sujet, garder la structure. Page fonctionnelle : [`../exemples/hero-memphis.html`](../exemples/hero-memphis.html).

## Cadre

- Une page qui défile, pensée pour un écran de bureau de 1440 px de large, le premier écran = le hero.
- Fond **crème chaud `#F5EFE2`**, encre **`#17140D`**.
- Palette plate : corail `#FF5B57`, turquoise `#12B3A4`, moutarde `#FFC531`, violet `#6B5BE6`, bleu ciel `#3AA0FF`.
- **Signature** : contours noirs épais sur chaque élément, ombres dures décalées (pas de flou, pas de dégradé), confettis géométriques animés, soulignements façon surligneur.
- **Aucun tiret cadratin** dans les textes.

## 1. Confettis animés (fond)

Éparpillés sur tout le fond, chacun en SVG inline avec contour noir épais, animé **en CSS uniquement (pas de JS)** : dérive, rotation ou flottement, durées et délais différents.

1. un triangle corail ;
2. un quart d'arc turquoise ;
3. un cercle moutarde à pois ;
4. un signe plus violet qui tourne ;
5. une ligne gribouillis noire en forme de « bactérie » ;
6. un demi-cercle moutarde ;
7. un petit point turquoise ;
8. un zigzag bleu ciel ;
9. un cercle corail rayé.

Tous `aria-hidden`, en `position:absolute`, derrière le contenu (`z-index` négatif ou couche à part), jamais sur le texte. Sur mobile, n'en garder que 3 ou 4 en bordure.

## 2. Navigation

- Logo : tuile carrée arrondie **moutarde** avec un gribouillis noir dedans + le mot « Loopa » en **Bricolage Grotesque 800**.
- Quatre liens au centre.
- Bouton pilule **turquoise** « Start free » à droite, contour noir, ombre dure décalée.

## 3. Hero (2 colonnes asymétriques)

**Colonne gauche (texte), environ 55 % :**
- **Pastille eyebrow violette** : « NEW - Team plans just dropped » avec un point moutarde.
- **Titre énorme** en Bricolage Grotesque 800, **76 px**, `line-height: .98` : « Ship work that actually gets done. »
  - barre de surligneur **moutarde** sous « actually » ;
  - barre de surligneur **turquoise** sous « done. ».
- **Paragraphe d'intro** d'environ 19 px, couleur atténuée.
- **Deux boutons** :
  - principal : pilule **corail** « Start free -> » ;
  - secondaire : pilule **blanche** « Watch the demo » ;
  - les deux : contour noir 3 px + ombre dure **8 px 8 px** noire, qui **s'enfonce** au survol et au clic.
- **Ligne de confiance** : quatre avatars ronds qui se chevauchent (contour noir) + deux lignes « 12,000+ teams / ship with Loopa every week ».

**Colonne droite : maquette de tableau de bord, inclinée à -2°.**
- Carte blanche façon fenêtre de navigateur : trois pastilles rondes contourées (feux tricolores) + barre de titre « This week - Design squad ».
- Corps : titre « Sprint velocity » + pastille turquoise « +38% ».
- **Graphique à 6 barres** : moutarde, corail, violet, turquoise, bleu ciel, corail ; chacune contourée en noir, haut arrondi.
- **Checklist de 3 lignes** : deux cochées en turquoise, une vide.
- Contour noir 3 px + ombre dure 8 px.

## 4. Bande de logos

- Bande **noire** pleine largeur.
- Libellé moutarde « TRUSTED BY TEAMS AT ».
- Cinq noms de marques en crème (en texte, typographies variées), éventuellement en défilement (marquee).

## 5. Fonctionnalités

- Section centrée : pastille eyebrow violette + titre Bricolage 800 sur deux lignes : « Boring tools kill momentum. / Loopa keeps it loud. »
- **Rangée de 3 cartes** blanches contourées avec ombre dure :
  - une pastille d'icône contourée de couleur (corail / turquoise / violet) ;
  - un titre Bricolage ;
  - une ligne de texte ;
  - un **cercle translucide** de la couleur de la carte, coupé dans un coin (accent doux).

## Animation

- Entrée du hero en cascade : eyebrow, titre, paragraphe, boutons, confiance, puis la maquette qui poppe avec son inclinaison ; les barres du graphique montent une par une.
- Confettis en boucle infinie lente.
- Boutons : soulèvement au survol (ombre 10 px), enfoncement à l'appui (ombre 3 px).
- `prefers-reduced-motion` : tout s'affiche directement, plus rien ne bouge.

## Adaptation mobile

- Une seule colonne : texte puis maquette (inclinaison réduite à -1°).
- Titre à environ 44 px.
- Ombres 4 px, boutons pleine largeur, 48 px de haut minimum.
- Liens de navigation cachés derrière un bouton menu ; le bouton « Start free » reste visible.
