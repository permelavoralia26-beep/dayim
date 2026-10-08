# Lo Style E L'extro — sito web

Sito statico (HTML, CSS, JavaScript), nessuna installazione necessaria: basta pubblicare la cartella (Netlify, GitHub Pages, qualsiasi hosting).

## Foto animata dell'hero

L'hero anima la foto `assets/hero.jpg` mentre si scorre (e al contrario tornando su):
zoom sul tagliacapelli, la mano, la lama sul lato della testa con i capelli che cadono, poi la foto intera.

**Per cambiare foto** sostituisci `assets/hero.jpg` con una tua (meglio se almeno 1600 px di lato, scattata in negozio).
Se la nuova foto ha un'inquadratura diversa, in `js/hero.js` vanno aggiornati i punti dello zoom (`shots`),
la sagoma del tagliacapelli (`body`) e il bordo della lama (`bladeA`, `bladeB`).

> La foto attuale arriva da una pagina di vendita e mostra il marchio di un altro produttore:
> usala solo come prova e sostituiscila con una foto tua prima di pubblicare il sito.

## Prezzi

Nel listino (`index.html`, sezione "SERVIZI") sostituisci ogni `in arrivo` con il prezzo.
