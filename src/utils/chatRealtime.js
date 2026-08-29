// ── Realtime del chat (broadcast) ──────────────────────────────────────────
// Usa Supabase Realtime con la clave anónima en el cliente; la suscripción al
// canal `chat:{channel_token}` solo es viable si el backend dispensa el token
// (el token es parte del canal, así que no se puede espiar sin tenerlo).
// No se usa Supabase Auth: la identidad real la valida el JWT propio.

let clientPromise = null;

function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = import("@supabase/supabase-js").then(({ createClient }) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });
  return clientPromise;
}

// Crea un flujo por conversación: escucha broadcasts y permite emitirlos.
export function createConversationStream(token, onMessage) {
  let client = null;
  let channel = null;
  let closed = false;

  const ready = getClient().then((c) => {
    if (!c || !token || closed) return "NO_CLIENT";
    client = c;
    channel = c.channel(`chat:${token}`);
    channel.on("broadcast", { event: "message" }, (payload) => {
      if (onMessage && !closed) {
        try {
          onMessage(payload && payload.payload ? payload.payload : {});
        } catch (_) {}
      }
    });
    return new Promise((resolve) => {
      channel.subscribe((status) => resolve(status));
    });
  });

  return {
    send(payload) {
      ready.then(async (status) => {
        if (!channel || closed || status !== "SUBSCRIBED") return;
        try {
          await channel.send({ type: "broadcast", event: "message", payload });
        } catch (_) {}
      });
    },
    close() {
      closed = true;
      ready.then(() => {
        if (channel && client) client.removeChannel(channel);
        channel = null;
      });
    },
  };
}

export function resetClient() {
  if (clientPromise) {
    clientPromise.then((c) => {
      if (c) c.removeAllChannels();
    });
  }
  clientPromise = null;
}