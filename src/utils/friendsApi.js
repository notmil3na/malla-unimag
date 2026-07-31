import { supabase } from "../supabase";

// ── Relación canónica ─────────────────────────────────────────────────────
// Una sola fila por amistad con (user_username, friend_username) ordenados
// alfabéticamente, así ambos lados consultan con el mismo par.
export function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

export const FRIENDSHIP_TABLE_MISSING = "42P01";

function isTableMissing(error) {
  if (!error) return false;
  return error.code === FRIENDSHIP_TABLE_MISSING || /friendships/.test(error.message || "");
}

// ── Consultas ─────────────────────────────────────────────────────────────
// Devuelve { error, data } donde data es un mapa { usuario -> { status, requestedBy } }.
export async function fetchFriendships(username) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_username.eq.${username},friend_username.eq.${username}`);
  if (error) {
    return { error, data: null, missingTable: isTableMissing(error) };
  }
  const map = {};
  for (const row of data) {
    const other = row.user_username === username ? row.friend_username : row.user_username;
    map[other] = { status: row.status, requestedBy: row.requested_by };
  }
  return { error: null, data: map, missingTable: false };
}

export async function sendFriendRequest(me, other) {
  const [a, b] = canonicalPair(me, other);
  const { error } = await supabase
    .from("friendships")
    .upsert(
      { user_username: a, friend_username: b, status: "pendiente", requested_by: me },
      { onConflict: "user_username,friend_username" }
    );
  return { error, missingTable: isTableMissing(error) };
}

export async function acceptFriendship(me, other) {
  const [a, b] = canonicalPair(me, other);
  const { error } = await supabase
    .from("friendships")
    .update({ status: "aceptado", updated_at: new Date().toISOString() })
    .eq("user_username", a)
    .eq("friend_username", b);
  return { error, missingTable: isTableMissing(error) };
}

// Rechazar una solicitud recibida o eliminar una amistad: misma operación.
export async function removeFriendship(me, other) {
  const [a, b] = canonicalPair(me, other);
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_username", a)
    .eq("friend_username", b);
  return { error, missingTable: isTableMissing(error) };
}

// ── Usuarios ──────────────────────────────────────────────────────────────
// Lista breve de usuarios para buscar (sin password).
export async function fetchUsersBrief() {
  const { data, error } = await supabase
    .from("users")
    .select("username,name,university,career,semester,ingreso_corte,photo")
    .order("name");
  return { data: data || [], error };
}

// ── Datos del amigo (horario + malla para progreso) ───────────────────────
export async function fetchFriendData(username) {
  const { data, error } = await supabase
    .from("user_data")
    .select("horario,malla")
    .eq("username", username)
    .single();
  if (error && error.code === "PGRST116") {
    // No tiene datos guardados todavía: horario y malla vacíos.
    return { data: { horario: null, malla: null }, error: null };
  }
  return { data, error };
}
