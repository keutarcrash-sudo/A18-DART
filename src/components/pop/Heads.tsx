/**
 * Les 8 têtes déjantées (dessins des symboles `h-*` de docs/refonte-pop/maquettes.html).
 * SVG sans identifiants (plusieurs têtes peuvent être à l'écran).
 * Les animations sont des classes `head-*` de globals.css, figées si
 * `prefers-reduced-motion: reduce`.
 */
export type HeadKind =
  | "explosee"
  | "frimeur"
  | "coeurs"
  | "mdr"
  | "langue"
  | "tournis"
  | "fondue"
  | "crispe";

const SPIRALE_G =
  "M43 54 m-1 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -6 0 a5 5 0 0 1 10 0 a7 7 0 0 1 -14 0 a9 9 0 0 1 18 0";
const SPIRALE_D =
  "M77 54 m-1 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -6 0 a5 5 0 0 1 10 0 a7 7 0 0 1 -14 0 a9 9 0 0 1 18 0";
const FONDUE_CONTOUR =
  "M14 62 a46 46 0 0 1 92 0 v14 q0 8 -7 8 q-6 0 -6 10 q0 12 -8 12 q-8 0 -8 -16 q0 -6 -7 -6 q-8 0 -8 18 q0 10 -9 10 q-9 0 -9 -14 q0 -10 -8 -10 q-6 0 -6 -8 q0 -6 -8 -6 q-8 0 -8 -10 z";

function Tournis() {
  return (
    <g className="head-shake">
      <circle cx="65" cy="65" r="46" fill="#1E293B" />
      <circle cx="60" cy="60" r="46" fill="#34D399" stroke="#1E293B" strokeWidth="5" />
      <path className="head-eyespin" d={SPIRALE_G} fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
      <path className="head-eyespin" d={SPIRALE_D} fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 82 q6 -7 12 0 t12 0 t12 0 t6 -2" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Langue() {
  return (
    <g className="head-wig">
      <circle cx="65" cy="65" r="46" fill="#1E293B" />
      <circle cx="60" cy="60" r="46" fill="#FBBF24" stroke="#1E293B" strokeWidth="5" />
      <path d="M33 54 q9 -9 18 0" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="79" cy="50" r="12" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <circle cx="82" cy="52" r="5" fill="#1E293B" />
      <path d="M36 72 q24 26 48 0 z" fill="#1E293B" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
      <g className="head-tongue">
        <path d="M52 80 v12 q0 12 11 12 q11 0 11 -12 v-12 z" fill="#F472B6" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
        <path d="M63 84 v10" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Fondue() {
  return (
    <g className="head-melt">
      <path transform="translate(5 5)" d={FONDUE_CONTOUR} fill="#1E293B" />
      <path d={FONDUE_CONTOUR} fill="#F472B6" stroke="#1E293B" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="42" cy="52" rx="10" ry="12" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <circle cx="42" cy="58" r="4.5" fill="#1E293B" />
      <path d="M32 50 h20" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="78" cy="54" rx="10" ry="12" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <circle cx="78" cy="60" r="4.5" fill="#1E293B" />
      <path d="M68 52 h20" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 78 q7 -5 14 0 q7 5 14 0" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Explosee() {
  return (
    <>
      <polygon
        className="head-burstspin"
        points="60,0 69,22 90,8 86,32 112,30 96,50 120,62 96,72 110,94 86,90 88,116 68,100 58,120 50,98 28,112 32,88 6,92 22,72 0,60 22,48 8,28 32,32 30,8 52,22"
        fill="#FBBF24"
        stroke="#1E293B"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g className="head-laugh">
        <circle cx="63" cy="63" r="36" fill="#1E293B" />
        <circle cx="60" cy="60" r="36" fill="#8B5CF6" stroke="#1E293B" strokeWidth="5" />
        <circle cx="46" cy="52" r="13" fill="#fff" stroke="#1E293B" strokeWidth="4" />
        <circle className="head-pulse" cx="46" cy="52" r="4" fill="#1E293B" />
        <circle cx="75" cy="52" r="13" fill="#fff" stroke="#1E293B" strokeWidth="4" />
        <circle className="head-pulse" cx="75" cy="52" r="4" fill="#1E293B" />
        <ellipse cx="60" cy="80" rx="11" ry="9" fill="#1E293B" />
        <ellipse cx="60" cy="84" rx="6" ry="3.5" fill="#F472B6" />
      </g>
    </>
  );
}

function Frimeur() {
  return (
    <g className="head-wig">
      <circle cx="65" cy="65" r="46" fill="#1E293B" />
      <circle cx="60" cy="60" r="46" fill="#FBBF24" stroke="#1E293B" strokeWidth="5" />
      <path d="M26 48 h30 v8 q0 14 -15 14 q-15 0 -15 -14 z" fill="#1E293B" />
      <path d="M64 48 h30 v8 q0 14 -15 14 q-15 0 -15 -14 z" fill="#1E293B" />
      <path d="M54 52 h12 M20 50 h8 M92 50 h8" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <path d="M33 54 l7 -4 M71 54 l7 -4" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 84 q16 10 32 -8" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <path d="M74 72 l4 6" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function Coeurs() {
  return (
    <g className="head-wig">
      <circle cx="65" cy="65" r="46" fill="#1E293B" />
      <circle cx="60" cy="60" r="46" fill="#FBBF24" stroke="#1E293B" strokeWidth="5" />
      <path className="head-pulse" d="M42 55 l-11 -11 a6.5 6.5 0 0 1 11 -9 a6.5 6.5 0 0 1 11 9 z" fill="#F472B6" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
      <path className="head-pulse" d="M78 55 l-11 -11 a6.5 6.5 0 0 1 11 -9 a6.5 6.5 0 0 1 11 9 z" fill="#F472B6" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M36 72 q24 28 48 0 z" fill="#1E293B" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="28" cy="72" r="6" fill="#F472B6" opacity=".7" />
      <circle cx="92" cy="72" r="6" fill="#F472B6" opacity=".7" />
    </g>
  );
}

function Mdr() {
  return (
    <g className="head-laugh">
      <g transform="rotate(-14 60 60)">
        <circle cx="65" cy="65" r="46" fill="#1E293B" />
        <circle cx="60" cy="60" r="46" fill="#FBBF24" stroke="#1E293B" strokeWidth="5" />
        <path d="M30 40 l14 8 l-14 8 M90 40 l-14 8 l14 8" fill="none" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 64 h64 q0 34 -32 34 q-32 0 -32 -34 z" fill="#1E293B" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
        <path d="M38 66 h44 v6 h-44 z" fill="#fff" />
        <path d="M44 90 q16 -12 32 0 q-6 7 -16 7 q-10 0 -16 -7 z" fill="#F472B6" />
        <g className="head-pulse">
          <path d="M30 54 q-14 -2 -22 14 q-4 10 4 12 q8 0 10 -10 q2 -10 8 -16 z" fill="#7DD3FC" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
        </g>
        <g className="head-pulse" style={{ animationDelay: "-.45s" }}>
          <path d="M90 54 q14 -2 22 14 q4 10 -4 12 q-8 0 -10 -10 q-2 -10 -8 -16 z" fill="#7DD3FC" stroke="#1E293B" strokeWidth="4" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
}

function Crispe() {
  return (
    <g className="head-shake" style={{ animationDuration: ".25s" }}>
      <circle cx="65" cy="65" r="46" fill="#1E293B" />
      <circle cx="60" cy="60" r="46" fill="#8B5CF6" stroke="#1E293B" strokeWidth="5" />
      <circle cx="42" cy="50" r="13" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <circle cx="44" cy="52" r="4" fill="#1E293B" />
      <circle cx="79" cy="52" r="7" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <circle cx="80" cy="53" r="2.5" fill="#1E293B" />
      <path d="M28 34 l16 6 M92 38 l-14 5" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
      <rect x="34" y="70" width="52" height="20" rx="5" fill="#fff" stroke="#1E293B" strokeWidth="4" />
      <path d="M34 80 h52 M47 70 v20 M60 70 v20 M73 70 v20" stroke="#1E293B" strokeWidth="3" />
      <path className="head-sweat" d="M96 30 q-7 11 0 16 q7 -5 0 -16 z" fill="#fff" stroke="#1E293B" strokeWidth="3.5" strokeLinejoin="round" />
    </g>
  );
}

const DESSINS: Record<HeadKind, () => React.JSX.Element> = {
  explosee: Explosee,
  frimeur: Frimeur,
  coeurs: Coeurs,
  mdr: Mdr,
  langue: Langue,
  tournis: Tournis,
  fondue: Fondue,
  crispe: Crispe,
};

export function Head({ kind, size, className }: { kind: HeadKind; size: number; className?: string }) {
  const Dessin = DESSINS[kind];
  return (
    <svg
      className={className ? `head-svg ${className}` : "head-svg"}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <Dessin />
    </svg>
  );
}
