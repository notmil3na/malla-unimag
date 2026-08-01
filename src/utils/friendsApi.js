import { api } from "../api";

// ── Relación canónica ─────────────────────────────────────────────────────
// Una sola fila por amistad con (user_username, friend_username) ordenados
// alfabéticamente, así ambos lados consultan con el mismo par.
export function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

export const FRIENDSHIP_TABLE_MISSING = "42P01";

// El backend (Vercel Functions) hace todo contra Supabase con service_role:
// si la tabla falta, es un error de la función, no del cliente.
function wrap(promise) {
  return promise.then(
    (res) => ({ error: null, data: res.data ?? null, missingTable: false }),
    (err) => ({ error: err, data: null, missingTable: false })
  );
}

// ── Consultas ─────────────────────────────────────────────────────────────
// Devuelve { error, data } donde data es un mapa { usuario -> { status, requestedBy } }.
export function fetchFriendships(username) {
  return wrap(api("/friendships"));
}

export function sendFriendRequest(me, other) {
  return wrap(api("/friendships", { method: "POST", body: { action: "request", other } }));
}

export function acceptFriendship(me, other) {
  return wrap(api("/friendships", { method: "POST", body: { action: "accept", other } }));
}

export function removeFriendship(me, other) {
  return wrap(api("/friendships", { method: "POST", body: { action: "remove", other } }));
}

// ── Usuarios ──────────────────────────────────────────────────────────────
// Lista breve de usuarios para buscar (sin password).
export function fetchUsersBrief() {
  return wrap(api("/users"));
}

// ── Datos del amigo (horario + malla para progreso) ───────────────────────
export function fetchFriendData(username) {
  return wrap(api(`/user_data/${encodeURIComponent(username)}`));
}
