import { api } from "../api";

// Cliente del chat entre amigos. Sin caché a propósito: los mensajes son
// "en vivo" y siempre se piden frescos en cada polling.

export async function fetchConversations() {
  try {
    const res = await api("/friendships?view=chat", { soft401: true });
    if (res && res.needsMigration) return { needsMigration: true, data: [] };
    return { needsMigration: false, data: res?.data || [] };
  } catch (err) {
    if (err && err.needsMigration) return { needsMigration: true, data: [] };
    return { needsMigration: false, data: [] };
  }
}

export async function fetchThread(other) {
  try {
    const res = await api(`/friendships?view=chat&other=${encodeURIComponent(other)}`, { soft401: true });
    if (res && res.needsMigration) return { needsMigration: true, data: [] };
    return { needsMigration: false, data: res?.data || [] };
  } catch (err) {
    if (err && err.needsMigration) return { needsMigration: true, data: [] };
    return { needsMigration: false, data: [] };
  }
}

export async function sendMessage(other, payload) {
  try {
    const res = await api("/friendships", { method: "POST", body: { action: "chatSend", other, payload } });
    return { ok: true, needsMigration: !!(res && res.needsMigration), error: null };
  } catch (err) {
    if (err && err.needsMigration) return { ok: false, needsMigration: true, error: "Chat no disponible" };
    return { ok: false, needsMigration: false, error: (err && err.message) || "No se pudo enviar el mensaje" };
  }
}

export async function markRead(from) {
  try {
    await api("/friendships", { method: "POST", body: { action: "chatRead", from }, soft401: true });
    return true;
  } catch (_) {
    return false;
  }
}
