"""Génère des variantes de chiffres A18 (et, pour Élan Gras, les capitales assorties) à partir de Roboto Slab Black (licence Apache 2.0).

Chaque variante : chiffres 0-9 à chasse fixe (scores alignés), plus espace,
signes + − × / . : pour les scores. Sortie : .woff2 dans le dossier donné.
"""
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools import subset
from shapely.geometry import Polygon, MultiPolygon, box
from shapely import affinity
from shapely.ops import unary_union

SRC = sys.argv[1]
OUT = sys.argv[2]
T18 = math.tan(math.radians(18))


class FlatPen(BasePen):
    """Aplatit les courbes en polylignes."""
    def __init__(self, gs, steps=14):
        super().__init__(gs); self.contours = []; self.cur = []; self.steps = steps
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; mt = 1 - t
            self.cur.append((mt**3*p0[0]+3*mt*mt*t*p1[0]+3*mt*t*t*p2[0]+t**3*p3[0],
                             mt**3*p0[1]+3*mt*mt*t*p1[1]+3*mt*t*t*p2[1]+t**3*p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; mt = 1 - t
            self.cur.append((mt*mt*p0[0]+2*mt*t*p1[0]+t*t*p2[0], mt*mt*p0[1]+2*mt*t*p1[1]+t*t*p2[1]))
    def _closePath(self):
        if len(self.cur) > 2: self.contours.append(self.cur)
        self.cur = []
    _endPath = _closePath


def glyph_geom(font, name):
    gs = font.getGlyphSet(); pen = FlatPen(gs); gs[name].draw(pen)
    geom = None
    for c in pen.contours:  # règle pair-impair : les contours internes creusent
        p = Polygon(c).buffer(0)
        geom = p if geom is None else geom.symmetric_difference(p)
    return geom


def draw(geom, pen):
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    for poly in polys:
        rings = [list(poly.exterior.coords)[:-1]]
        if poly.exterior.is_ccw: rings[0].reverse()          # TrueType : extérieur horaire
        for hole in poly.interiors:
            r = list(hole.coords)[:-1]
            if not hole.is_ccw: r.reverse()                  # trous antihoraires
            rings.append(r)
        for r in rings:
            pen.moveTo((round(r[0][0]), round(r[0][1])))
            for pt in r[1:]: pen.lineTo((round(pt[0]), round(pt[1])))
            pen.closePath()


def build(variant, family):
    font = TTFont(SRC)
    upm = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    names = [cmap[ord(c)] for c in '0123456789']
    caps = [cmap[ord(c)] for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] if variant.get('caps') else []
    extra = {c: cmap.get(ord(c)) for c in ' +-./:×−'}
    geoms = {n: glyph_geom(font, n) for n in names + caps}

    cap = max(g.bounds[3] for g in geoms.values())
    out = {}; upright = {}
    for n, g in geoms.items():
        g = affinity.scale(g, xfact=variant['sx'], yfact=1.0, origin=(0, 0))
        if variant.get('bold'):
            # Épaissit chaque trait en gardant des angles vifs, puis ramène la hauteur d'origine.
            h0 = g.bounds[3] - g.bounds[1]
            g = g.buffer(variant['bold'], join_style=2, mitre_limit=1.6).buffer(0)
            minx, miny, maxx, maxy = g.bounds
            g = affinity.scale(g, xfact=1.0, yfact=h0 / (maxy - miny), origin=(0, miny))
            g = affinity.translate(g, yoff=-(miny - geoms[n].bounds[1]))
        if variant.get('cut'):
            # Signature : le coin haut-droit de chaque chiffre est tranché à 18°,
            # comme le bord d'un secteur de cible.
            minx, miny, maxx, maxy = g.bounds
            d = (maxy - miny) * variant['cut']  # largeur tranchée en haut
            # ligne de coupe inclinée de 18° par rapport à la verticale
            cutter = Polygon([(maxx - d, maxy + 10), (maxx + 600, maxy + 10),
                              (maxx + 600, maxy - (d + 600) / T18)])
            g = g.difference(cutter).buffer(0)
        upright[n] = g.bounds[2] - g.bounds[0]
        out[n] = g

    # Chasse fixe : tous les chiffres ont la même largeur, centrés.
    # (la chasse se calcule sur le chiffre droit : un chiffre penché déborde comme une italique)
    width = max(upright[n] for n in names)
    adv = int(width + upm * variant.get('track', 0.06))
    glyf, hmtx = font['glyf'], font['hmtx']
    for n, g in out.items():
        minx = g.bounds[0]; w = g.bounds[2] - minx
        a = adv if n in names else int(w + upm * 0.12)
        g = affinity.translate(g, xoff=(a - w) / 2 - minx)
        if variant.get('skew'):
            # On penche après avoir centré le chiffre droit, autour de la ligne de base :
            # tous les chiffres glissent de la même façon, l'espacement reste régulier.
            g = affinity.skew(g, xs=variant['skew'], origin=(0, 0))
        pen = TTGlyphPen(None); draw(g, pen)
        glyf[n] = pen.glyph(); glyf[n].recalcBounds(glyf)
        hmtx[n] = (a, glyf[n].xMin)

    # Ne garder que les chiffres et quelques signes.
    keep = names + caps + [v for v in extra.values() if v] + ['.notdef']
    opts = subset.Options(); opts.name_IDs = []; opts.layout_features = []; opts.notdef_outline = True
    sub = subset.Subsetter(opts); sub.populate(glyphs=keep); sub.subset(font)

    nt = font['name']
    for rec in list(nt.names):
        if rec.nameID in (1, 4, 6, 16): nt.removeNames(nameID=rec.nameID)
    nt.setName(family, 1, 3, 1, 0x409); nt.setName(family, 4, 3, 1, 0x409)
    nt.setName(family.replace(' ', ''), 6, 3, 1, 0x409)
    nt.setName('Dérivé de Roboto Slab (Apache License 2.0), modifié pour Arena18.', 0, 3, 1, 0x409)
    base = f"{OUT}/{family.replace(' ', '-')}"
    font.save(base + '.ttf')
    font.flavor = 'woff2'
    font.save(base + '.woff2')
    print(family, 'ok, chasse', adv)


VARIANTS = {
    'A18 Maillot':   {'sx': 0.93},
    'A18 Secteur':   {'sx': 0.93, 'cut': 0.15},
    'A18 Elan':      {'sx': 0.93, 'skew': 18},
    'A18 Elan Bold':  {'sx': 0.93, 'skew': 18, 'bold': 50, 'track': 0.08, 'caps': True},
}
for fam, v in VARIANTS.items():
    build(v, fam)
