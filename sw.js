/* Service worker minimal — rend "Cloth Config" installable (PWA) + offline du shell.
   Copié à la racine du build (dist/sw.js) ; scope = dossier de déploiement. */
const CACHE = "clothconfig-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Ne pas intercepter les requêtes externes (API météo Open-Meteo, etc.)
  if (url.origin !== self.location.origin) return;

  // Navigations : réseau d'abord (pour avoir les mises à jour), fallback cache/index.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((r) => r || caches.match("index.html")),
      ),
    );
    return;
  }

  // Assets statiques (hashés) : cache d'abord, sinon réseau puis mise en cache.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }),
    ),
  );
});
