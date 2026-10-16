---
name: playful-geometric
description: Système de design « Playful Geometric » (esprit Memphis années 80, nettoyé pour l'écran) — fond crème, formes géométriques, contours noirs épais, ombres dures décalées sans flou, confettis animés, animations rebondissantes. À charger quand on demande ce style par son nom (« Playful Geometric », « Memphis », « style Loopa », « confettis géométriques », « ombres dures ») ou pour une page vitrine / landing page / page marketing qui doit être fun et colorée. Ne remplace PAS la skill a18-design pour les écrans de l'app A18 Darts : là, a18-design reste prioritaire, sauf si le client demande explicitement ce style.
---

# Playful Geometric

L'antidote au minimalisme corporate et stérile. Le design crée un lien émotionnel par l'optimisme, la clarté et le plaisir du toucher.

**Concept clé : « grille stable, décor sauvage ».** Le contenu (textes, formulaires) vit dans des zones propres et lisibles. Le monde autour est vivant : formes, motifs, mouvement. Référence : le groupe Memphis (années 80), sans le chaos, avec toute l'énergie.

**L'ambiance :** amical, tactile, pop, énergique. Un terrain de jeu, ou un album de stickers bien rangé. Ça donne envie de cliquer. Ça te sourit.

## Priorité des règles

1. Ce que le client dit dans la conversation.
2. Dans ce dépôt, pour les écrans de l'app A18 Darts : **la skill `a18-design`** (angle 18°, couleurs qui ont un sens, pop art des célébrations). Playful Geometric ne s'y applique que si le client le demande.
3. Cette skill, pour tout ce qui l'invoque.
4. Les skills de design génériques (ex. `frontend-design`). Quand elles contredisent celle-ci (fond crème, libellés en majuscules, ombres dures…), **c'est celle-ci qui gagne** : ce sont des choix assumés du style, pas des réflexes.

## Les 4 signatures visuelles

- **Formes primitives** : cercles, triangles, carrés, pilules, gribouillis. En décor de fond, en masque d'image ou en support d'icône.
- **Ombres dures** : décalage net, **zéro flou**, couleur pleine. Effet sticker / papier découpé.
- **Motifs** : pois, quadrillage, rayures diagonales pour remplir formes et fonds.
- **Arrondis variés** : mélanger coins ronds et coins vifs (feuille, bulle de BD, arche, blob asymétrique).

## Deux variantes

| | **Standard** (produit, appli, formulaires) | **Loud / Memphis** (landing page, hero, affiche web) |
|---|---|---|
| Fond | `#FFFDF5` crème papier | `#F5EFE2` crème plus chaud |
| Encre | `#1E293B` slate 800 | `#17140D` presque noir |
| Couleurs | violet `#8B5CF6` (action), rose `#F472B6`, ambre `#FBBF24`, menthe `#34D399` | corail `#FF5B57` (action), turquoise `#12B3A4`, moutarde `#FFC531`, violet `#6B5BE6`, bleu ciel `#3AA0FF` |
| Contours | 2 px | 3 px, sur **tous** les éléments |
| Ombre | 4 px 4 px | 8 px 8 px |
| Titres | Outfit 700/800 | Bricolage Grotesque 800 |
| Texte | Plus Jakarta Sans 400/500 | Plus Jakarta Sans 400/500 |

Par défaut : **Standard**. Prendre **Loud** pour une page d'accueil ou une page marketing qui doit faire du bruit. Ne pas mélanger les deux palettes sur une même page.

Tous les jetons (couleurs, ombres, motifs, animations) sont prêts à copier dans [`references/tokens.css`](references/tokens.css).

## Jetons — variante Standard

```
background       #FFFDF5   crème papier
foreground       #1E293B   slate 800 (plus doux que le noir)
muted            #F1F5F9   slate 100
mutedForeground  #64748B   slate 500
accent           #8B5CF6   violet vif — couleur principale
accentForeground #FFFFFF
secondary        #F472B6   rose
tertiary         #FBBF24   ambre / jaune
quaternary       #34D399   menthe
border           #E2E8F0   slate 200
input            #FFFFFF
card             #FFFFFF
ring             #8B5CF6   focus violet
```

**Règle d'usage :** `accent` = actions principales, et rien d'autre. `secondary`, `tertiary`, `quaternary` **en rotation** pour les formes décoratives, icônes et mots mis en valeur → effet « confettis ». Jamais deux éléments voisins de la même couleur décorative.

## Typographie

- **Titres : Outfit** (Loud : Bricolage Grotesque), 700 ou 800. Géométrique avec du caractère, lettres arrondies = amical.
- **Texte : Plus Jakarta Sans**, 400 et 500. Lisible, moderne, géométrique mais humain.
- **Échelle 1,25** (tierce majeure) : 12.8 · 16 · 20 · 25 · 31.25 · 39 · 48.8 · 61 · 76 px. Texte courant à 16 px minimum, lignes de moins de 75 caractères.
- Titres serrés : `line-height` 1 à 1.1, `letter-spacing` -0.02em. Texte : `line-height` 1.6.
- Libellés de champs et petits « eyebrows » : gras, MAJUSCULES, petits, `tracking-wide`.

## Formes, arrondis, contours

```
radius-sm 8px · radius-md 16px · radius-lg 24px · radius-full 9999px
border-width 2px (Loud : 3px) — contours épais par défaut
```

Arrondis spéciaux :
- **Bulle** : `rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none`
- **Arche** : `rounded-t-full rounded-b-none`
- **Feuille** : `rounded-tl-[40px] rounded-br-[40px] rounded-tr-md rounded-bl-md`
- **Blob** : `border-radius: 62% 38% 46% 54% / 55% 44% 56% 45%`

## Ombres « Pop »

```
repos   box-shadow: 4px 4px 0 0 #1E293B
survol  box-shadow: 6px 6px 0 0 #1E293B  + translate(-2px,-2px)   → l'élément se soulève
appui   box-shadow: 2px 2px 0 0 #1E293B  + translate(2px,2px)     → l'élément s'enfonce
```

Jamais de flou, jamais de dégradé. Une ombre peut être colorée (rose pour une carte mise en avant, ou couleur d'accent au focus).

## Motifs et textures

- **Grille de points** : petits points en formation stricte (`.pg-dots`).
- **Gribouillis** : tracés SVG en séparateur de section ou en soulignement de titre.
- **Confettis** : petites formes SVG (triangles, cercles, plus, zigzags) en position absolue **derrière** les blocs de contenu, jamais par-dessus le texte.
- **Rayures diagonales** et **quadrillage** pour remplir une forme ou un fond.
- **Surligneur** (Loud) : une barre de couleur pleine sous un ou deux mots du titre, comme un coup de marqueur.

## Composants

Détails complets, classes Tailwind et code : [`references/composants.md`](references/composants.md). L'essentiel :

- **Bouton principal « bonbon »** : pilule, fond `accent`, texte blanc 700, contour 2 px encre, ombre dure 4 px, se soulève au survol et s'enfonce à l'appui. Icône flèche dans un rond blanc à l'intérieur.
- **Bouton secondaire** : pilule transparente, contour 2 px encre, sans ombre, se remplit en jaune `tertiary` au survol.
- **Carte « sticker »** : blanche, contour 2 px, `rounded-xl`, ombre dure 8 px `#E2E8F0` (ou rose pour la carte vedette). Au survol : rotation -1° et échelle 1,02. Icône dans un rond flottant à cheval sur le bord du haut.
- **Champ de saisie** : blanc, contour 2 px `#CBD5E1`, `rounded-lg`. Au focus : contour `accent` + ombre dure 4 px `accent`. Libellé gras, majuscules, petit.

## Mise en page

- Conteneur `max-w-6xl`, sections `py-24` : aéré mais jamais vide, rempli de motifs.
- Logique 12 colonnes regroupée en gros blocs (6/6 ou 4/4/4).
- **Hero** : texte à gauche, image à droite. Énorme cercle jaune derrière le texte, motif de points derrière l'image, image masquée en blob.
- **Fonctionnalités** : grille de 3 cartes reliées par une ligne SVG en pointillés en arrière-plan ; en-têtes de cartes en couleurs alternées (violet, rose, jaune).
- **Tarifs** : la carte du milieu est agrandie (1,1) avec un gros badge étoile jaune « LE PLUS CHOISI » tourné de 15°.

Recette complète d'un hero Memphis animé (variante Loud, exemple « Loopa ») : [`references/hero-memphis.md`](references/hero-memphis.md), avec une page d'exemple qui fonctionne : [`exemples/hero-memphis.html`](exemples/hero-memphis.html).

## Animation

**Sensation : rebondissante, élastique, fun.**

- **Survol** : `transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]` (léger dépassement = rebond).
- **Entrée** : les éléments ne font pas qu'apparaître en fondu, ils **poppent** (échelle 0 → 1 avec rebond). Une seule séquence d'entrée orchestrée par page, en cascade, plutôt que des effets partout.
- **Bandeau défilant** (marquee) : pour les logos clients ou des mots-clés.
- **Wiggle** : rotation 0° → 3° → -3° → 0° au survol des icônes.
- **Confettis** : dérive, rotation lente, flottement (`pg-drift`, `pg-spin`, `pg-bob`) en CSS pur, durées différentes (6 à 18 s) et décalées pour ne jamais bouger en même temps.
- **Mouvement réduit** : si `prefers-reduced-motion`, couper rebond, wiggle, confettis et marquee. Tout reste lisible et utilisable à l'arrêt.

## Icônes

Lucide (`lucide-react`) :
- `strokeWidth={2.5}`, extrémités et jonctions rondes.
- Blanches dans un rond de couleur, ou couleur encre.
- **Toujours dans une forme, jamais seules.** Une coche n'est pas qu'une coche : c'est une coche dans un rond menthe.

## Mobile

- Tout s'empile en une colonne.
- Ombres dures réduites à 2 px (Loud : 4 px).
- Les gribouillis horizontaux deviennent des séparateurs verticaux ou disparaissent.
- Boutons grands et faciles à toucher : **48 px de haut minimum**.
- Cacher les formes flottantes complexes qui risquent de passer sous le texte ; garder 2 ou 3 confettis en bordure.

## Accessibilité

- Contraste : texte slate 800 sur crème ou blanc (niveau AAA). Texte blanc seulement sur violet ou encre, jamais sur jaune, menthe, rose ou turquoise clair : là, texte en encre.
- Ne jamais compter sur la couleur seule : formes et textes en plus.
- Focus très visible : contour épais coloré + ombre dure, sur tout ce qui se clique.
- Formes décoratives en `aria-hidden="true"`.
- Respect de `prefers-reduced-motion` (voir Animation).

## Écriture

- Ton joyeux, direct, verbes simples, phrases courtes. Le bouton dit exactement ce qui se passe.
- **Pas de tiret cadratin (—)** dans les textes affichés de la variante Loud : virgule, point ou deux-points.
- Le texte du bouton et le message de confirmation utilisent le même mot (« S'inscrire » → « Inscrit ! »).

## Interdits

- Ombres floues, dégradés, verre dépoli (glassmorphism).
- Noir pur `#000` (utiliser l'encre de la variante).
- Formes décoratives par-dessus du texte ou sous une zone cliquable.
- Plus de 3 couleurs décoratives dans un même bloc.
- Icône flottante sans forme autour.
- Des cartes toutes identiques en rangée sans variation de couleur.
- Animations qui tournent quand l'utilisateur a demandé moins de mouvement.

## Checklist avant de livrer

- [ ] Une seule variante (Standard ou Loud), palette respectée.
- [ ] `accent` réservé aux actions principales.
- [ ] Contours épais et ombres dures sans flou partout où il faut.
- [ ] Au moins un motif (points, rayures, gribouillis) et des confettis derrière le contenu, jamais dessus.
- [ ] Boutons : soulèvement au survol, enfoncement à l'appui, 48 px min sur mobile.
- [ ] Focus visible au clavier sur chaque élément cliquable.
- [ ] Entrées qui poppent, une seule séquence orchestrée.
- [ ] `prefers-reduced-motion` coupe tout le mouvement décoratif.
- [ ] Vérifié en 375 px de large : rien ne déborde, rien ne passe sous le texte.
- [ ] Capture d'écran prise et relue avant de dire que c'est fini.
