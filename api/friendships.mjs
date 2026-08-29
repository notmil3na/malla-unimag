import { admin, envReady, json, readBody, requireUser } from "./_lib.mjs";

function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

export default async function handler(req, res) {
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });
  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });
  const username = me.username;

  const url = new URL(req.url, `http://${req.headers.host}`);

  // ── GET ────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    // Lista de amistades.
    const { data, error } = await admin
      .from("friendships")
      .select("*")
      .or(`user_username.eq.${username},friend_username.eq.${username}`);
    if (error) return json(res, 500, { error: "No se pudieron cargar las amistades" });

    const map = {};
    for (const row of data || []) {
      const otherUser = row.user_username === username ? row.friend_username : row.user_username;
      map[otherUser] = { status: row.status, requestedBy: row.requested_by };
    }
    return json(res, 200, { data: map });
  }

  // ── POST ───────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = await readBody(req);
    const { action, other } = body;

    // Amistades.
    if (!other || typeof other !== "string") return json(res, 400, { error: "Falta el usuario" });
    if (other === username) return json(res, 400, { error: "No puedes ser tu propio amigo" });

    const [a, b] = canonicalPair(username, other);

    if (action === "request") {
      const { error } = await admin
        .from("friendships")
        .upsert(
          { user_username: a, friend_username: b, status: "pendiente", requested_by: username },
          { onConflict: "user_username,friend_username" }
        );
      if (error) return json(res, 500, { error: "No se pudo enviar la solicitud" });
      return json(res, 200, { ok: true });
    }

    if (action === "accept") {
      const { error } = await admin
        .from("friendships")
        .update({ status: "aceptado", updated_at: new Date().toISOString() })
        .eq("user_username", a)
        .eq("friend_username", b);
      if (error) return json(res, 500, { error: "No se pudo aceptar la solicitud" });
      return json(res, 200, { ok: true });
    }

    if (action === "remove") {
      const { error } = await admin
        .from("friendships")
        .delete()
        .eq("user_username", a)
        .eq("friend_username", b);
      if (error) return json(res, 500, { error: "No se pudo completar la acción" });
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: "Acción inválida" });
  }

  return json(res, 405, { error: "method" });
}
