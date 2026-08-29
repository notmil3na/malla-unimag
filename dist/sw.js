/* MiMalla – Service Worker */
const CACHE = "mimalla-v1788039790378";
const CORE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => {
      if (self.registration.active) {
        return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
          list.forEach((client) => client.postMessage({ type: "SW_WAITING" }));
        });
      }
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Push (notificaciones con la app cerrada) ────────────────────────────────
self.addEventListener("push", (e) => {
  let payload = {};
  try {
    payload = e.data ? e.data.json() : {};
  } catch (_) {}
  const title = payload.title || "MiMalla · Recordatorio";
  const opts = {
    body: payload.body || "Tienes un recordatorio pendiente.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "mimalla-" + Date.now(),
    data: { url: payload.url || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url
    ? e.notification.data.url
    : "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const target = list.find((c) => c.url && c.url.startsWith(self.location.origin));
      if (target) {
        target.focus();
        return target.navigate(url).catch(() => {});
      }
      return self.clients.openWindow(url);
    })
  );
});

function networkFirst(req, fallback) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() => fallback);
}

function cacheFirst(req) {
  return caches.match(req).then((cached) => {
    if (cached) return cached;
    return networkFirst(req);
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (!req.url.startsWith(self.location.origin)) return;

  if (req.url.includes("/api/")) return;

  const url = new URL(req.url);
  if (url.pathname === "/sw.js") return;

  // HTML (navegación) y raíz: red primero para recibir actualizaciones.
  if (req.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(
      networkFirst(req, caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // JS/CSS con hash (inmutables), iconos y manifest: caché primero.
  // La recarga y el cambio de pestaña son instantáneos tras la primera visita.
  e.respondWith(cacheFirst(req));
});
