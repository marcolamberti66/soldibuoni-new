// ─────────────────────────────────────────────────────────────
// Service worker di SoldiBuoni, generato a ogni build (la versione
// cambia da sola, così ogni deploy aggiorna la cache).
// · /casa e le pagine: rete prima, cache se offline;
// · /_astro/* (file con hash, immutabili): cache prima;
// · /api/* e chiamate ad altri domini: mai in cache;
// · notifiche push e "Condividi con SoldiBuoni" (share target).
// ─────────────────────────────────────────────────────────────
export const prerender = true;

const VERSIONE = 'sb-' + Date.now().toString(36);

const codice = `
const VERSIONE = ${JSON.stringify(VERSIONE)};
const PAGINE = 'pagine-' + VERSIONE;
const RISORSE = 'risorse-v1';
const CONDIVISI = 'sb-condivisi';
const GUSCIO = ['/casa', '/', '/offline', '/manifest.webmanifest', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const pagine = await caches.open(PAGINE);
    const risorse = await caches.open(RISORSE);
    for (const url of GUSCIO) {
      try {
        let r = await fetch(url, { cache: 'reload' });
        if (!r.ok && url !== '/' && !url.includes('.')) r = await fetch(url + '.html', { cache: 'reload' });
        if (!r.ok) continue;
        await pagine.put(url, r.clone());
        // Le risorse con hash usate dalla pagina (JS, CSS, font) vanno in cache subito,
        // così l'app si apre anche senza rete fin dalla prima installazione.
        if ((r.headers.get('content-type') || '').includes('text/html')) {
          const html = await r.text();
          const usate = [...new Set([...html.matchAll(/(?:src|href)="(\\/_astro\\/[^"]+)"/g)].map((m) => m[1]))];
          await Promise.all(usate.map((u) => risorse.add(u).catch(() => {})));
        }
      } catch (_) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('pagine-') && k !== PAGINE) await caches.delete(k);
    }
    // Le risorse con hash si accumulano a ogni deploy: teniamo solo le più recenti.
    const r = await caches.open(RISORSE);
    const voci = await r.keys();
    for (const k of voci.slice(0, Math.max(0, voci.length - 150))) await r.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

function chiave(url) {
  // /casa.html, /casa/ e /casa?x=y sono la stessa pagina
  let p = url.pathname.replace(/\\.html$/, '').replace(/\\/index$/, '/');
  if (p.length > 1) p = p.replace(/\\/$/, '');
  return p;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method === 'POST' && url.origin === location.origin && url.pathname === '/casa-condividi') {
    e.respondWith(riceviCondivisi(req));
    return;
  }
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;

  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith((async () => {
      const c = await caches.open(RISORSE);
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) c.put(req, r.clone());
      return r;
    })());
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(PAGINE);
      try {
        const pre = await e.preloadResponse;
        const r = pre || await fetch(req);
        if (r.ok && r.type === 'basic') c.put(chiave(url), r.clone());
        return r;
      } catch (_) {
        return (await c.match(chiave(url))) || (await c.match('/offline')) || Response.error();
      }
    })());
    return;
  }

  // Icone, manifest, immagini: dalla cache se ci sono, aggiornate in background.
  if (/\\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(RISORSE);
      const hit = await c.match(req);
      const rete = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || rete;
    })());
  }
});

async function riceviCondivisi(req) {
  try {
    const dati = await req.formData();
    const file = dati.getAll('file').filter((f) => f && typeof f !== 'string').slice(0, 10);
    const c = await caches.open(CONDIVISI);
    for (const k of await c.keys()) await c.delete(k);
    let i = 0;
    for (const f of file) {
      await c.put('/condiviso/' + (i++), new Response(f, {
        headers: { 'content-type': f.type || 'application/octet-stream', 'x-nome': encodeURIComponent(f.name || 'documento') },
      }));
    }
  } catch (_) {}
  return Response.redirect('/casa?origine=condividi#/aggiungi?condivisi=1', 303);
}

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { corpo: e.data && e.data.text() }; }
  const titolo = d.titolo || 'SoldiBuoni';
  e.waitUntil(self.registration.showNotification(titolo, {
    body: d.corpo || '',
    icon: '/icon-192.png',
    badge: '/favicon-64.png',
    tag: d.tag || 'sb',
    renotify: !!d.tag,
    lang: 'it',
    data: { url: d.url || '/casa' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const dest = new URL((e.notification.data && e.notification.data.url) || '/casa', location.origin).href;
  e.waitUntil((async () => {
    const aperte = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of aperte) {
      if (new URL(w.url).pathname.replace(/\\.html$/, '') === '/casa') {
        await w.focus();
        if ('navigate' in w) return w.navigate(dest);
        return;
      }
    }
    return self.clients.openWindow(dest);
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'aggiorna') self.skipWaiting(); });
`;

export function GET() {
  return new Response(codice, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
