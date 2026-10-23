// Genera le immagini ottimizzate (WebP, più larghezze) a partire da src/orig.
// Uso: npm run images
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'src/orig/';
const OUT = 'assets/img/';
mkdirSync(OUT, { recursive: true });

// nome di uscita -> [file sorgente, larghezze]
const photos = {
  'hero-pavimento':   ['IMG-20241217-WA0021-960x1280.jpg', [480, 720, 960]],
  'clima':            ['Foto-Ma.Del-14-scaled.jpg', [640, 900, 1200]],
  'idrici':           ['Foto-Ma.Del-Cantiere-14-scaled.jpg', [640, 900]],
  'pavimento':        ['IMG-20241217-WA0024.jpg', [640, 900, 1200]],
  'caldaie':          ['IMG-20241217-WA0028.jpg', [640, 900, 1200]],
  'lavoro-collettore':['IMG-20241217-WA0022.jpg', [640, 1200]],
  'lavoro-pex':       ['Foto-Ma.Del-Cantiere-11-scaled.jpg', [640, 1000]],
  'lavoro-scarichi':  ['Foto-Ma.Del-Cantiere-13-scaled.jpg', [640, 1000]],
  'lavoro-colonne':   ['Foto-Ma.Del-Cantiere-2-scaled.jpg', [640, 1000]],
  'lavoro-bagno':     ['Foto-Ma.Del-Cantiere-8-scaled.jpg', [640, 1200]],
  'lavoro-radiante':  ['IMG-20241217-WA0013-1.jpg', [640, 1000]],
  'lavoro-solare':    ['IMG-20241217-WA0026.jpg', [640, 1000]],
  'lavoro-serpentina':['Progetto-senza-titolo-1.png', [640, 1200]],
  'sede':             ['migliora-immagine.png', [640, 1100]],
  'insegna':          ['Foto-Ma.Del-8-scaled.jpg', [640, 1200]],
};

for (const [name, [file, widths]] of Object.entries(photos)) {
  for (const w of widths) {
    await sharp(SRC + file).rotate().resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 }).toFile(`${OUT}${name}-${w}.webp`);
  }
}

// Ritagli con trasparenza
await sharp(SRC + '2-3.png').resize({ width: 520 }).webp({ quality: 80, alphaQuality: 90 }).toFile(OUT + 'pietro.webp');
await sharp(SRC + 'Piero-Maggiorano-Firma.png').negate({ alpha: false }).webp({ quality: 90 }).toFile(OUT + 'firma.webp');

// Goccia del logo (icona) per header e intro
const trimmed = await sharp(SRC + 'Logo-Madel-Senza-Sfondo-1.png').trim().toBuffer({ resolveWithObject: true });
const drop = sharp(trimmed.data).extract({ left: 0, top: 0, width: 260, height: trimmed.info.height });
await drop.clone().resize({ height: 96 }).webp({ quality: 90 }).toFile(OUT + 'goccia.webp');
await drop.clone().resize({ height: 96 }).png().toFile(OUT + 'goccia.png');

// Favicon e immagine social
await sharp(SRC + 'Favicon-Madel-320x320.png').resize(180).png().toFile('apple-touch-icon.png');
await sharp(SRC + 'Favicon-Madel-320x320.png').resize(48).png().toFile('favicon.png');
await sharp(SRC + 'IMG-20241217-WA0024.jpg').resize(1200, 630, { fit: 'cover' })
  .composite([{ input: Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#0B1B2E" fill-opacity=".62"/><text x="72" y="300" font-family="Arial Black,Arial" font-weight="900" font-size="88" fill="#fff">Ma.Del. srl</text><text x="72" y="370" font-family="Arial" font-size="34" fill="#EEF2F5">Impianti termoidraulici · Rutigliano (BA)</text><text x="72" y="430" font-family="Arial" font-weight="700" font-size="34" fill="#fff">☎ 080 975 9262</text></svg>`) }])
  .jpeg({ quality: 78 }).toFile(OUT + 'og.jpg');

console.log('Immagini generate in', OUT);
