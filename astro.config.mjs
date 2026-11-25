import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';

// Su Netlify usa l'adapter Netlify; in locale/StackBlitz l'adapter Node.
const isNetlify = process.env.NETLIFY;

export default defineConfig({
  site: 'https://soldibuoni.it',
  // Pagine statiche di default (CDN, LCP basso); solo le route /api/* girano on-demand.
  output: 'static',
  adapter: isNetlify ? netlify() : node({ mode: 'standalone' }),
  integrations: [react()],
  build: { inlineStylesheets: 'auto' },
});
