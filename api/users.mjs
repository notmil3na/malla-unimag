import { admin, envReady, json, readBody, requireUser, toUserRow } from "./_lib.mjs";

// GET  → lista breve de usuarios para buscar amigos (sin password).
// POST → actualiza el perfil del usuario autenticado (nunca la contraseña).
export default async function handler(req, res) {
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });
  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });

  if (req.method === "GET") {
    const { data, error } = await admin
      .from("users")
      .select("username,name,university,career,semester,ingreso_corte,photo")
      .order("name");
    if (error) return json(res, 500, { error: "No se pudo listar a los usuarios" });
    return json(res, 200, { data: data || [] });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const patch = toUserRow(body);
    if (Object.keys(patch).length === 0) return json(res, 400, { error: "Sin cambios" });
    const { error } = await admin.from("users").update(patch).eq("username", me.username);
    if (error) return json(res, 500, { error: "No se pudo guardar el perfil" });
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: "method" });
}
