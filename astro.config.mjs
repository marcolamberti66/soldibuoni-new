import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';

// Se siamo sui server di Netlify, questa variabile sarà vera.
// Altrimenti (es. su StackBlitz), useremo l'ambiente Node locale che non dà errori di rete.
const isNetlify = process.env.NETLIFY;

export default defineConfig({
  output: 'server',
  adapter: isNetlify ? netlify() : node({ mode: 'standalone' }),
  integrations: [react()],
});