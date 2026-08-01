// Cliente HTTP del backend propio (/api). La sesión se guarda como
// { token, user } en localStorage (malla_session). La contraseña NUNCA
// viaja al cliente: el servidor la valida y devuelve el perfil + JWT.
const BASE = "/api";

function readSession() {
  try {
    const raw = localStorage.getItem("malla_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  return readSession();
}

export function saveSession(token, user) {
  localStorage.setItem("malla_session", JSON.stringify({ token, user }));
}

export function clearSession() {
  localStorage.removeItem("malla_session");
}

export function getToken() {
  const s = readSession();
  return s && s.token ? s.token : null;
}

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta no JSON */
  }

  if (res.status === 401) {
    clearSession();
    window.location.reload();
    throw new Error((data && data.error) || "Sesión expirada");
  }
  if (!res.ok) {
    throw new Error((data && data.error) || "Error de red");
  }
  return data;
}
