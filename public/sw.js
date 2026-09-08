/*
 * Offline shell for Kheti.
 *
 * The app already survives losing signal *while open* — the plan's inputs sit
 * in localStorage and the rules re-run locally. What it could not do was start
 * with no signal, which is the case that actually matters: a grower opens the
 * app under canopy at 6am with one bar and nothing loads.
 *
 * Strategy by request type:
 *   navigations  - network first, fall back to the cached page, then to "/"
 *   /_next/static - cache first; these filenames contain a content hash, so a
 *                   cached one can never be stale
 *   GET /api/*   - network first, fall back to the last good response, so an
 *                   offline start still gets yesterday's weather and prices
 *   everything else (POST /api/ask included) - straight to network
 */

const VERSION = "kheti-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const DATA = `${VERSION}-data`;

const CORE = ["/", "/market", "/profit", "/ask", "/settings", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // One failed URL must not abort the whole install, so add them individually.
    caches.open(SHELL).then((cache) =>
      Promise.all(CORE.map((url) => cache.add(url).catch(() => undefined))),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(cacheName).then((c) => c.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline and nothing cached");
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(cacheName).then((c) => c.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL).catch(async () => {
        // Any cached page beats the browser's offline error, and every route
        // renders its own content from localStorage once it boots.
        return (await caches.match(request)) || (await caches.match("/")) || Response.error();
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icon")) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      networkFirst(request, DATA).catch(
        () =>
          new Response(JSON.stringify({ offline: true }), {
            status: 503,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
  }
});
