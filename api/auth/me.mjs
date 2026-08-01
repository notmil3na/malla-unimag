import { admin, envReady, json, requireUser, publicUser } from "../_lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });

  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });

  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("username", me.username)
    .maybeSingle();
  if (error) return json(res, 500, { error: "No se pudo recuperar el perfil" });
  if (!data) return json(res, 401, { error: "Sesión inválida" });

  return json(res, 200, { user: publicUser(data) });
}
