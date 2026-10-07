# Chiffres A18 — licence

Les fichiers `A18-Elan-Bold.woff2` (variante retenue, « Élan gras »), `A18-Maillot.woff2`, `A18-Secteur.woff2` et `A18-Elan.woff2` sont dérivés de **Roboto Slab** (Copyright 2018 The Roboto Slab Project Authors), distribuée sous **Apache License 2.0** : http://www.apache.org/licenses/LICENSE-2.0

Modifications pour Arena18 : chiffres seuls, chasse fixe (scores alignés), resserrement horizontal, entaille à 18° (Secteur) ou inclinaison de 18° (Élan), épaississement des traits et capitales assorties (Élan gras).

Le script `make_digits.py` régénère les fichiers à partir de `RobotoSlab` Black (graisse 900) :

```
pip install fonttools shapely brotli
python3 make_digits.py RobotoSlab-Black.ttf .
```
