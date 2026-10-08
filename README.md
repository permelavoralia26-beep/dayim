# Lo Style E L'extro — sito web

Sito statico (HTML, CSS, JavaScript), nessuna installazione necessaria: basta pubblicare la cartella (Netlify, GitHub Pages, qualsiasi hosting).

## Video dell'hero (animazione allo scorrimento)

L'hero mostra un video realistico che avanza e torna indietro mentre si scorre la pagina.
Finché il video non c'è, l'hero resta statico con il titolo.

Metti il video in:

- `assets/hero.mp4` — orizzontale (16:9), per computer
- `assets/hero-mobile.mp4` — verticale (9:16), per telefono (facoltativo: se manca si usa quello orizzontale)

Durata consigliata: 6–10 secondi, sfondo chiaro, nessun audio. La sequenza deve seguire i testi:

| Momento | Scena | Testo in sovrimpressione |
|---|---|---|
| 0–20% | tagliacapelli nero e oro che ruota lentamente al centro | La barberia per eccellenza |
| 28–50% | una mano lo prende con un gesto elegante | Precisione al millimetro. |
| 58–80% | appare di lato il cliente con la mantellina bianca, la mano passa il tagliacapelli dal basso verso l'alto, i capelli cadono | Passata dopo passata. |
| 87–100% | sfumatura finita | Il tuo taglio, perfetto. |

Lascia la parte sinistra dell'inquadratura più libera: lì compaiono le scritte.

### Preparare il file (importante per uno scorrimento fluido)

Ogni fotogramma deve essere un fotogramma chiave, altrimenti scorrendo il video va a scatti:

```bash
ffmpeg -i originale.mp4 -vf "scale=1920:-2" -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -an -movflags +faststart assets/hero.mp4
ffmpeg -i originale-verticale.mp4 -vf "scale=1080:-2" -c:v libx264 -g 1 -crf 25 -pix_fmt yuv420p -an -movflags +faststart assets/hero-mobile.mp4
```

Tieni ogni file sotto i 15 MB circa, così si carica in fretta anche da telefono.

## Prezzi

Nel listino (`index.html`, sezione "SERVIZI") sostituisci ogni `in arrivo` con il prezzo.
