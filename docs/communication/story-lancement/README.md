# Story de lancement (octobre 2026)

`a18-story.mp4` : 18 s, 1080×1920, sans son (la musique s'ajoute dans Instagram). Validée par le client.

Pour la refaire après une modification de `story.html` :

```
mkdir frames
PW=$(npm root -g)/playwright node render.js . full
ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart a18-story.mp4
```

Les textes restent entre 250 px du haut et 340 px du bas (zones couvertes par Instagram).
