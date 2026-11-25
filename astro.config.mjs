import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

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
      filter: (url) => !/\/(api|report-risparmio)(\/|$)/.test(url),
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        const u = item.url.replace(/\/$/, '') || item.url;
        const p = new URL(u).pathname;
        item.url = u;
        item.priority = p === '' || p === '/' ? 1.0 : /^\/(casa|guida)/.test(p) ? 0.9 : /^\/(mutuo|affitto-vs-mutuo|calcolo-stipendio)\//.test(p) ? 0.5 : 0.7;
        return item;
      },
    }),
  ],
});
