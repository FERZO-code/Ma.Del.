# Ma.Del. srl — sito web

Sito statico (HTML, CSS, JS senza framework). Nessun build necessario per pubblicarlo.

## Struttura
- `index.html` — pagina principale (intro, hero, termostato servizi, lavori, chi siamo, FAQ, contatti)
- `privacy.html` — informativa (da far verificare a un consulente)
- `services/`, `about/`, `contact/` — reindirizzano i vecchi indirizzi WordPress alle nuove sezioni
- `assets/` — CSS, JS, font e immagini ottimizzate
- `src/orig/` — foto originali (non vanno pubblicate)
- `.htaccess` — redirect 301, compressione e cache (server Apache)

## Lavorare in locale
```
npm install
npm run dev        # http://localhost:4321
npm run images     # rigenera le immagini da src/orig
```
`?nointro` nell'URL salta l'animazione iniziale (utile per link nelle campagne).

## Pubblicare
Carica tutto **tranne** `node_modules/`, `src/`, `scripts/`, `package*.json`, `README.md`, `.claude/`.

## Tracciare le conversioni
Ogni clic su chiamata, WhatsApp, email, Maps e invio modulo invia un evento a `window.dataLayer`
(`event: 'contatto'` / `'richiesta_inviata'`). Basta aggiungere Google Tag Manager per vederli in GA4 o Google Ads.
