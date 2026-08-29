import { admin, envReady, json, readBody, requireUser } from "./_lib.mjs";

function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// Chat de amigos (misma función serverless que el sistema de amistades para
// no superar el límite de funciones del plan Hobby de Vercel).

function isChatTableMissing(err) {
  if (!err) return false;
  const msg = String(err.message || err.hint);
  const code = String(err.code || "");
  return (
    code === "PGRST204" ||
    code === "42P01" ||
    code === "42703" ||
    msg.includes("relation") ||
    msg.includes("does not exist") ||
    msg.includes("no existe la relación")
  );
}

async function sonAmigos(a, b) {
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  const { data, error } = await admin
    .from("friendships")
    .select("status")
    .eq("user_username", lo)
    .eq("friend_username", hi)
    .maybeSingle();
  if (error) return false;
  return !!(data && data.status === "aceptado");
}

const CHAT_MAX_PAYLOAD = 4 * 1024 * 1024;

export default async function handler(req, res) {
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });
  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });
  const username = me.username;

  const url = new URL(req.url, `http://${req.headers.host}`);

  // ── GET ────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const view = url.searchParams.get("view");

    // Ruta de chat
    if (view === "chat") {
      const other = (url.searchParams.get("other") || "").trim();

      // Lista de conversaciones con no leídos.
      if (!other) {
        const { data, error } = await admin
          .from("chat_messages")
          .select("*")
          .or(`sender.eq.${username},recipient.eq.${username}`);
        if (isChatTableMissing(error)) return json(res, 503, { error: "Chat no disponible", needsMigration: true });
        if (error) return json(res, 500, { error: "No se pudo cargar el chat" });

        const threads = new Map();
        for (const row of data || []) {
          const partner = row.sender === username ? row.recipient : row.sender;
          if (!threads.has(partner)) threads.set(partner, { last: null, unread: 0 });
          const t = threads.get(partner);
          if (!t.last || row.created_at > t.last.created_at) t.last = row;
          if (row.recipient === username && !row.read) t.unread++;
        }

        const list = [];
        for (const [partner, t] of threads.entries()) {
          list.push({
            partner,
            last: t.last
              ? { sender: t.last.sender, kind: t.last.payload?.kind || "texto", created_at: t.last.created_at }
              : null,
            unread: t.unread,
          });
        }
        list.sort((a, b) => (a.last && b.last ? (a.last.created_at < b.last.created_at ? 1 : -1) : 0));
        return json(res, 200, { data: list });
      }

      // Historial de una conversación.
      const { data, error } = await admin
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender.eq.${username},recipient.eq.${other}),and(sender.eq.${other},recipient.eq.${username})`
        )
        .order("created_at", { ascending: true });
      if (isChatTableMissing(error)) return json(res, 503, { error: "Chat no disponible", needsMigration: true });
      if (error) return json(res, 500, { error: "No se pudo cargar la conversación" });
      return json(res, 200, {
        data: (data || []).map((r) => ({
          id: r.id,
          sender: r.sender,
          payload: r.payload,
          read: r.read,
          created_at: r.created_at,
        })),
      });
    }

    // Lista de amistades (comportamiento original).
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

    // Acciones de chat: marcar leído.
    if (action === "chatRead") {
      const { from } = body;
      if (!from || typeof from !== "string") return json(res, 400, { error: "Faltan datos" });
      const { error } = await admin
        .from("chat_messages")
        .update({ read: true })
        .eq("sender", from)
        .eq("recipient", username)
        .eq("read", false);
      if (error) return json(res, 500, { error: "No se pudo actualizar el chat" });
      return json(res, 200, { ok: true });
    }

    // Acciones de chat: enviar mensaje.
    if (action === "chatSend") {
      const { other: to, payload } = body;
      if (!to || typeof to !== "string") return json(res, 400, { error: "Falta el destinatario" });
      if (!payload || typeof payload !== "object") return json(res, 400, { error: "Falta el mensaje" });
      if (to === username) return json(res, 400, { error: "No puedes enviarte un mensaje a ti mismo" });

      const amigo = await sonAmigos(username, to);
      if (!amigo) return json(res, 403, { error: "Solo puedes chatear con amigos" });

      const size = JSON.stringify(payload).length;
      if (size > CHAT_MAX_PAYLOAD) return json(res, 413, { error: "El adjunto es demasiado grande" });

      const { error } = await admin.from("chat_messages").insert({
        sender: username,
        recipient: to,
        payload,
      });
      if (error) return json(res, 500, { error: "No se pudo enviar el mensaje" });
      return json(res, 200, { ok: true });
    }

    // Amistades (comportamiento original).
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
