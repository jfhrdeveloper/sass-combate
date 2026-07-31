/**
 * Service worker de la plataforma.
 *
 * El objetivo es que la mesa de control y el pesaje abran aunque el coliseo no
 * tenga señal, incluso si es la primera vez que se abren ese día.
 *
 * Estrategias:
 *  - estáticos de Next: cache primero, son inmutables por su hash
 *  - páginas: red primero con copia en cache, para no servir programas viejos
 *  - API: solo red, nunca se cachea un resultado
 */
const VERSION = "v1";
const CACHE_APP = `app-${VERSION}`;
const CACHE_PAGINAS = `paginas-${VERSION}`;

const ESENCIALES = ["/app", "/offline", "/manifest.json"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_APP).then((c) => c.addAll(ESENCIALES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((k) => !k.endsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cachear datos: un resultado viejo es peor que un error visible.
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copia = res.clone();
            caches.open(CACHE_APP).then((c) => c.put(req, copia));
            return res;
          })
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE_PAGINAS).then((c) => c.put(req, copia));
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          return hit || (await caches.match("/offline")) || Response.error();
        })
    );
  }
});

/** Aviso a las pestañas abiertas de que hay una versión nueva. */
self.addEventListener("message", (evento) => {
  if (evento.data === "actualizar") self.skipWaiting();
});

/** Aviso de que la pelea del peleador está por empezar (ver src/lib/notificaciones/). */
self.addEventListener("push", (evento) => {
  let datos = { titulo: "sass-combate", cuerpo: "Tienes una notificación nueva.", url: "/" };
  try {
    if (evento.data) datos = { ...datos, ...evento.data.json() };
  } catch {
    datos.cuerpo = evento.data ? evento.data.text() : datos.cuerpo;
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      data: { url: datos.url },
    })
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil(self.clients.openWindow(evento.notification.data?.url ?? "/"));
});
