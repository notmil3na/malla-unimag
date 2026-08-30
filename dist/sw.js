/* MiMalla – Service Worker */
const CACHE = "mimalla-v1788050050551";
const CORE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];
// PRECACHE se llena en cada build (vite.config.js) con todos los .js/.css con
// hash de este release. Así el SW nuevo descarga la versión completa en segundo
// plano y, al pulsar "Recargar ahora", la app abre al instante desde el caché.
const PRECACHE = ["/assets/AsignacionesView-c7a462f7.js","/assets/AsignacionesView-eae2c64e.css","/assets/CalendarioView-ba797205.css","/assets/CalendarioView-c580ed05.js","/assets/ChatView-16229953.css","/assets/ChatView-65caab46.js","/assets/ColaboracionView-21e9c4cb.css","/assets/ColaboracionView-f7d79bb2.js","/assets/CursandoView-32b5748e.css","/assets/CursandoView-cee63e45.js","/assets/CustomCursor-90bf99bb.css","/assets/CustomCursor-ac6a8e3c.js","/assets/Dashboard-7cf091f4.css","/assets/Dashboard-fe7c2daa.js","/assets/HorarioExport-c424b9ab.css","/assets/HorarioExport-cf56c1db.js","/assets/HorarioView-413e2a8a.css","/assets/HorarioView-b2b84809.js","/assets/HorarioWallpaper-3f461ed1.js","/assets/HorarioWallpaper-9442894b.css","/assets/Login-53288559.js","/assets/Login-aa3f8f79.css","/assets/MallaView-d43b257d.css","/assets/MallaView-e3e310eb.js","/assets/NotasView-8db4b29a.js","/assets/NotasView-ce7e8ec4.css","/assets/SettingsView-a16686a6.css","/assets/SettingsView-e10bbfbf.js","/assets/UpdatePrompt-53502737.css","/assets/UpdatePrompt-fc3e81a4.js","/assets/careerProgress-502b45e9.js","/assets/friendsApi-633b7994.js","/assets/horarioHelpers-52dd78e7.js","/assets/html2canvas.esm-f16e60ff.js","/assets/index-1b1ae201.js","/assets/index-34a177c6.js","/assets/index-78d07bdb.css","/assets/index-a7cba66d.js","/assets/index.es-13b70091.js","/assets/notasClase-10c4ec8c.js","/assets/purify.es-541be1bb.js","/assets/semesterCountdown-a51eb9e3.js","/assets/useBodyScrollLock-fa413708.js","/assets/vendor-27d6d7f2.js","/icons/apple-touch-icon.png","/icons/icon-192.png","/icons/icon-512-maskable.png","/icons/icon-512.png","/manifest.webmanifest"];

const isSwVersion = (key) => key.startsWith("mimalla-v");
const toNumber = (key) => Number(key.replace(/^mimalla-v/, "")) || 0;

// Busca primero en el caché actual; si falta, en versiones anteriores (aún válidas).
function findInCaches(req) {
  return caches
    .keys()
    .then((keys) =>
      keys
        .filter(isSwVersion)
        .sort((a, b) => toNumber(b) - toNumber(a))
        .reduce(
          (chain, name) =>
            chain.then((hit) => (hit ? hit : caches.open(name).then((c) => c.match(req)))),
          Promise.resolve()
        )
    );
}

function cacheFirst(req) {
  return findInCaches(req).then((cached) => cached || networkFirst(req));
}

function networkFirst(req) {
  return fetch(req).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  });
}

// HTML stale-while-revalidate: sirve la copia en caché al instante y la
// refresca en segundo plano. Solo el recargo post-actualización (?_sw=) va
// primero a la red. La versión nueva se aplica con el aviso de recarga.
const HTML_NETWORK_TIMEOUT = 1500;

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    fetch(req)
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

function htmlKey(url) {
  return new Request(url.origin + url.pathname, { method: "GET" });
}

function putHtml(key, res) {
  if (!res || !res.ok) return;
  const copy = res.clone();
  caches.open(CACHE).then((cache) => cache.put(key, copy));
}

function offlineResponse() {
  return new Response("Sin conexión", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });
}

async function serveHtml(req, url) {
  const key = htmlKey(url);
  const cached = await findInCaches(key).catch(() => undefined);

  if (url.searchParams.has("_sw")) {
    // Recargo tras la actualización: siempre a la red primero.
    let res;
    try { res = await fetch(req); } catch (_) {}
    putHtml(key, res);
    if (res && res.ok) return res;
    return cached || offlineResponse();
  }

  if (cached) {
    // Pintar al instante y refrescar el caché en segundo plano.
    fetch(req).then((res) => putHtml(key, res)).catch(() => {});
    return cached;
  }

  let res;
  try { res = await fetchWithTimeout(req, HTML_NETWORK_TIMEOUT); } catch (_) {}
  putHtml(key, res);
  if (res && res.ok) return res;
  const root = await findInCaches(htmlKey(new URL(url.origin + "/"))).catch(() => undefined);
  return root || res || offlineResponse();
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(async (c) => {
        // En la primera visita precachea solo lo esencial (sin duplicar las
        // descargas de la página). Al actualizar (ya hay SW activo) precachea
        // la versión completa → el recargo tras el aviso es instantáneo.
        const list = self.registration.active ? [...CORE, ...PRECACHE] : CORE;
        const jobs = [...new Set(list)].map(async (url) => {
          try {
            const req = new Request(url, { cache: "no-store" });
            const res = await fetch(req);
            if (res && res.ok) await c.put(url, res);
          } catch (_) {}
        });
        await Promise.all(jobs);
      })
      .then(() => {
        if (self.registration.active) {
          return self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((list) => list.forEach((client) => client.postMessage({ type: "SW_WAITING" })));
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (!req.url.startsWith(self.location.origin)) return;

  if (req.url.includes("/api/")) return;

  const url = new URL(req.url);
  if (url.pathname === "/sw.js") return;

  // HTML (navegación) y raíz: caché al instante, refresco en segundo plano.
  if (req.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(serveHtml(req, url));
    return;
  }

  // JS/CSS con hash (inmutables), iconos, fuentes y manifest: caché primero.
  e.respondWith(cacheFirst(req));
});