import { api } from "../api";

export function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function fetchPushState() {
  try {
    const data = await api("/push");
    return {
      sentKeys: Array.isArray(data.sentKeys) ? data.sentKeys : [],
      subscribed: !!data.subscribed,
    };
  } catch {
    return { sentKeys: [], subscribed: false };
  }
}

export function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isMobileDevice() {
  return (
    /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export async function enablePush() {
  const fail = (error) => ({ ok: false, error });
  if (typeof Notification === "undefined") {
    return fail("Tu navegador no soporta notificaciones.");
  }
  if (Notification.permission !== "granted") {
    return fail("Aún no concediste el permiso de notificaciones.");
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return fail("Este navegador no permite push. Prueba en Chrome o Safari.");
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      return fail("Push no está disponible en este navegador.");
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const data = await api("/push");
      if (!data || !data.publicKey) {
        return fail("El servidor no tiene push configurado.");
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }
    await api("/push", {
      method: "POST",
      body: { action: "subscribe", subscription: sub.toJSON() },
    });
    return { ok: true, sub };
  } catch (e) {
    if (isIOS() && !isStandalone()) {
      return fail(
        "En iPhone/iPad añade la app a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y ábrela desde ahí para recibir push."
      );
    }
    const name = e && e.name;
    if (name === "NotAllowedError") {
      return fail("No se pudo suscribir: el navegador bloqueó la suscripción.");
    }
    if (name === "InvalidStateError") {
      return fail(
        "Ya hay una suscripción con otra clave en este navegador. Revisa los ajustes de notificaciones del sitio."
      );
    }
    return fail("Error al activar push: " + ((e && e.message) || "desconocido"));
  }
}

export async function disablePush() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      try {
        await api("/push", {
          method: "POST",
          body: { action: "unsubscribe", endpoint },
        });
      } catch {}
    }
  } catch {}
}

export async function markServerNotified(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return;
  try {
    await api("/push", {
      method: "POST",
      body: { action: "mark", keys },
    });
  } catch {}
}

export async function sendTestPush() {
  try {
    return await api("/push", {
      method: "POST",
      body: { action: "test" },
    });
  } catch {
    return { ok: false };
  }
}
