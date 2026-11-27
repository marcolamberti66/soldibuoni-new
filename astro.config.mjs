import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync } from 'node:fs';

// Data di modifica reale per ogni pagina (Google ignora le date se cambiano a ogni build).
const DATE = { '/': '2026-11-27', '/casa': '2026-11-26', '/controlla-bolletta': '2026-11-27', '/strumenti': '2026-11-26',
  '/guida': '2026-11-27', '/bollette': '2026-11-27', '/tasse-casa': '2026-11-27', '/costi-casa': '2026-11-27', '/famiglia': '2026-11-27',
  '/tari': '2026-11-27', '/calcolo-stipendio': '2026-11-26', '/mutuo': '2026-11-26', '/affitto-vs-mutuo': '2026-11-26', '/chi-siamo': '2026-11-27' };
for (const f of readdirSync('./src/pages/guida')) {
  const m = readFileSync(`./src/pages/guida/${f}`, 'utf8').match(/aggiornato="(\d{4}-\d{2}-\d{2})"/);
  if (m) DATE['/guida/' + f.replace('.astro', '')] = m[1];
}
const dataPer = (p) => DATE[p] || (p.startsWith('/tari/') ? '2026-11-27' : /^\/(mutuo|affitto-vs-mutuo)\//.test(p) ? '2026-11-26' : p.startsWith('/calcolo-stipendio/') ? '2026-11-26' : undefined);

// Su Netlify usa l'adapter Netlify; in locale/StackBlitz l'adapter Node.
const isNetlify = process.env.NETLIFY;

export default defineConfig({
  site: 'https://soldibuoni.it',
  // Pagine statiche di default (CDN, LCP basso); solo le route /api/* girano on-demand.
  output: 'static',
  adapter: isNetlify ? netlify() : node({ mode: 'standalone' }),
  // URL senza barra finale, come il sito li ha sempre avuti (niente redirect, niente duplicati).
  trailingSlash: 'never',
  build: { inlineStylesheets: 'auto', format: 'file' },
  integrations: [
    react(),
    sitemap({
      filter: (url) => !/\/(api|offline|statistiche)(\/|$)/.test(url),
      changefreq: 'weekly',
      // Una sitemap per tipo di pagina: in Search Console si vede quale gruppo viene indicizzato.
      chunks: {
        guide: (item) => (/\/(guida|bollette|tasse-casa|costi-casa|famiglia)(\/|$)/.test(new URL(item.url).pathname) ? item : undefined),
        citta: (item) => (/^\/tari(\/|$)/.test(new URL(item.url).pathname) ? item : undefined),
        calcolatori: (item) => (/^\/(mutuo|affitto-vs-mutuo|calcolo-stipendio)(\/|$)/.test(new URL(item.url).pathname) ? item : undefined),
      },
      serialize(item) {
        const u = item.url.replace(/\/$/, '') || item.url;
        const p = new URL(u).pathname;
        item.url = u;
        const d = dataPer(p || '/');
        if (d) item.lastmod = d;
        item.priority = p === '' || p === '/' ? 1.0 : /^\/(casa|guida|bollette|tasse-casa|costi-casa|famiglia|tari)$/.test(p) ? 0.9 : /^\/(guida|tari)\//.test(p) ? 0.8 : /^\/(mutuo|affitto-vs-mutuo|calcolo-stipendio)\//.test(p) ? 0.5 : 0.7;
        return item;
      },
    }),
  ],
});
