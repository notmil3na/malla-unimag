import { admin, envReady, json, requireUser } from "../_lib.mjs";

export default async function handler(req, res) {
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });
  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });
  if (req.method !== "GET") return json(res, 405, { error: "method" });

  const username = req.query.username ? String(req.query.username) : "";
  if (!username) return json(res, 400, { error: "Falta el usuario" });

  const { data, error } = await admin
    .from("users")
    .select("photo")
    .eq("username", username)
    .maybeSingle();
  if (error) return json(res, 500, { error: "No se pudo recuperar la foto" });

  res.setHeader("Cache-Control", "private, max-age=86400");
  return json(res, 200, { photo: (data && data.photo) || null });
}
