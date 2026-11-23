# The gallery's seed pictures

`gallery.json` names five demo pieces; `api/scripts/seed_gallery.py` stores them. Three are
portraits the paper already carries, each in the public domain by age; two are the site's own
drawings. Each piece's description in the gallery carries its credit.

| file | subject | the work | source | licence |
|---|---|---|---|---|
| `pictures/joseph-fourier.png` | Joseph Fourier (1768-1830) | Engraving by Amédée Félix Barthélemy Geille after Julien-Léopold Boilly, about 1823 | Wikimedia Commons, [File:Joseph Fourier.jpg](https://commons.wikimedia.org/wiki/File:Joseph_Fourier.jpg); the background cut away (the paper's own copy, `assets/portraits/joseph-fourier.png`) | Public domain |
| `pictures/leonhard-euler.jpg` | Leonhard Euler (1707-1783) | Pastel by Jakob Emanuel Handmann, 1753, Kunstmuseum Basel (inv. 276) | Wikimedia Commons, [File:Leonhard Euler.jpg](https://commons.wikimedia.org/wiki/File:Leonhard_Euler.jpg), the 1280 px rendition, re-encoded | Public domain |
| `pictures/augustin-louis-cauchy.png` | Augustin-Louis Cauchy (1789-1857) | Lithograph by Grégoire et Deneux, Paris, about 1840 (a copy is in the Dibner Library: [File:Cauchy Augustin Louis dibner coll SIL14-C2-03a.jpg](https://commons.wikimedia.org/wiki/File:Cauchy_Augustin_Louis_dibner_coll_SIL14-C2-03a.jpg)) | the reproduction at Wikimedia Commons, [File:Augustin-Louis Cauchy 1901.jpg](https://commons.wikimedia.org/wiki/File:Augustin-Louis_Cauchy_1901.jpg) (Library of Congress, from *Das neunzehnte Jahrhundert in Bildnissen*), the background cut away (the paper's own copy, `assets/portraits/cauchy.png`) | Public domain |
| (drawn by the script) | The sun | The theme seat's drawing, `web/src/assets/fourier-paths/sun.json` | this repository | the site's own |
| (drawn by the script) | The moon | The theme seat's drawing, `web/src/assets/fourier-paths/moon.json` | this repository | the site's own |

Each work's artist and date were read from its Commons record on 23 Nov 2026. The Euler file
replaces, for the gallery, the paper's 220 x 286 copy (`assets/portraits/euler.jpg`), which is too
small to trace. `assets/portraits/` stays out of the API image (`.dockerignore`), so the seed
pictures live here.

Not seeded: anything else under `assets/portraits/` and `assets/animals/` (their provenance or
licence is unknown, or they are not ours to show).
