# Composants Playful Geometric

Classes Tailwind pour la variante Standard. Pour Loud : contours `border-[3px]`, ombres `8px`, encre `#17140D`, action en corail `#FF5B57`. Les classes `pg-*` viennent de [`tokens.css`](tokens.css).

## Bouton principal « bonbon »

```tsx
<button className="group inline-flex min-h-12 items-center gap-3 rounded-full border-2 border-[#1E293B] bg-[#8B5CF6] py-2 pl-6 pr-2 font-bold text-white shadow-[4px_4px_0_0_#1E293B] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#1E293B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_#1E293B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/40 motion-reduce:transition-none">
  Commencer
  <span className="grid size-8 place-items-center rounded-full bg-white text-[#1E293B]">
    <ArrowRight size={18} strokeWidth={2.5} />
  </span>
</button>
```

## Bouton secondaire

```tsx
<button className="inline-flex min-h-12 items-center rounded-full border-2 border-[#1E293B] bg-transparent px-6 font-bold text-[#1E293B] transition-colors duration-200 hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/40">
  Voir la démo
</button>
```

## Carte « sticker »

```tsx
<article className="relative rounded-xl border-2 border-[#1E293B] bg-white p-6 pt-10 shadow-[8px_8px_0_0_#E2E8F0] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-1 hover:scale-[1.02] motion-reduce:transition-none">
  {/* Icône à cheval sur le bord du haut */}
  <div className="absolute -top-6 left-6 grid size-12 place-items-center rounded-full border-2 border-[#1E293B] bg-[#F472B6] text-white">
    <Sparkles size={22} strokeWidth={2.5} />
  </div>
  <h3 className="font-[Outfit] text-xl font-bold">Titre</h3>
  <p className="mt-2 text-[#64748B]">Une ligne qui dit ce que ça fait.</p>
</article>
```

Carte vedette : ombre `shadow-[8px_8px_0_0_#F472B6]`. En rangée, faire tourner les couleurs d'icône : rose, ambre, menthe (puis violet).

## Champ de saisie

```tsx
<label className="block">
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#1E293B]">Ton e-mail</span>
  <input className="h-12 w-full rounded-lg border-2 border-[#CBD5E1] bg-white px-4 text-[#1E293B] shadow-[4px_4px_0_0_transparent] outline-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:border-[#8B5CF6] focus:shadow-[4px_4px_0_0_#8B5CF6]" />
</label>
```

Erreur : contour et ombre en rose `#F472B6` + message en texte (jamais la couleur seule).

## Pastille « eyebrow »

```tsx
<span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1E293B] bg-[#8B5CF6] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
  <span className="size-2 rounded-full bg-[#FBBF24]" /> Nouveau
</span>
```

## Icône dans une forme

```tsx
<span className="grid size-10 place-items-center rounded-full border-2 border-[#1E293B] bg-[#34D399] text-[#1E293B]">
  <Check size={20} strokeWidth={2.5} />
</span>
```

Formes possibles : rond, carré `rounded-md`, bulle, arche. Ajouter `pg-wiggle` pour le petit tremblement au survol.

## Badge étoile (tarifs)

```tsx
<div className="absolute -right-6 -top-8 rotate-[15deg]">
  <svg viewBox="0 0 100 100" className="size-28" aria-hidden>
    <polygon points="50,4 61,36 96,36 68,57 78,92 50,71 22,92 32,57 4,36 39,36" fill="#FBBF24" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
  </svg>
  <span className="absolute inset-0 grid place-items-center text-center text-[11px] font-extrabold uppercase leading-tight">Le plus<br />choisi</span>
</div>
```

## Séparateur gribouillis

```tsx
<svg viewBox="0 0 240 24" className="h-6 w-60" aria-hidden>
  <path d="M2 12 Q 17 0 32 12 T 62 12 T 92 12 T 122 12 T 152 12 T 182 12 T 212 12 T 238 12" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
</svg>
```

## Ligne pointillée entre cartes

SVG en `absolute inset-0 -z-10` derrière la grille : `stroke-dasharray="8 10"`, `strokeWidth=3`, couleur `#CBD5E1`. Cachée sur mobile (`hidden md:block`).

## Bandeau défilant (marquee)

```tsx
<div className="overflow-hidden border-y-2 border-[#1E293B] bg-[#1E293B] py-4 text-[#FFFDF5]">
  <div className="pg-marquee gap-12 font-[Outfit] text-2xl font-bold">
    {[...mots, ...mots].map((m, i) => <span key={i}>{m}</span>)}
  </div>
</div>
```

Le contenu est doublé pour que la boucle soit invisible (l'animation va jusqu'à -50 %).

## Avec Motion (`motion/react`)

Entrée qui poppe, en cascade :

```tsx
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 420, damping: 14, delay: i * 0.08 }}
/>
```

Utiliser `useReducedMotion()` pour passer directement à l'état final.
