import { admin, envReady, json, requireUser } from "../_lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!envReady() || !admin) return json(res, 500, { error: "Configuración del servidor incompleta" });

  const me = requireUser(req);
  if (!me) return json(res, 401, { error: "Sesión inválida" });

  const username = decodeURIComponent((req.query && req.query.username) || "");
  if (!username) return json(res, 400, { error: "Falta el usuario" });

  const { data, error } = await admin
    .from("user_data")
    .select("horario,malla")
    .eq("username", username)
    .maybeSingle();
  if (error) return json(res, 500, { error: "No se pudo cargar los datos del amigo" });

  return json(res, 200, {
    data: data ? { horario: data.horario, malla: data.malla } : { horario: null, malla: null },
  });
}
