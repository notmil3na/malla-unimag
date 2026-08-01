// MiMalla · Librería compartida de las funciones serverless (Vercel).
// La clave service_role y el secreto de sesión viven SOLO aquí (env vars),
// nunca en el bundle del cliente.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

export const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export function envReady() {
  return !!(SUPABASE_URL && SERVICE_KEY && SESSION_SECRET);
}

// ── Respuestas JSON ─────────────────────────────────────────────────────────
export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

// req.body ya viene parseado por Vercel cuando hay JSON; fallback por si no.
export function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// ── Hashing de contraseñas (scrypt nativo, sin dependencias) ───────────────
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function scryptAsync(password, salt, keylen) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, SCRYPT_OPTS, (err, key) =>
      err ? reject(err) : resolve(key.toString("hex"))
    );
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${hash}`;
}

// Acepta hashes `scrypt:salt:hash`. Las contraseñas legacy (texto plano)
// se aceptan UNA vez para permitir la migración en el login.
export async function verifyPassword(password, stored) {
  try {
    if (!password || typeof stored !== "string") return false;
    if (!stored.startsWith("scrypt:")) return password === stored;
    const [, salt, hash] = stored.split(":");
    const key = await scryptAsync(password, salt, 64);
    const a = Buffer.from(key, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── JWT HS256 (sin dependencias) ───────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str).toString("base64url");
}

export function signToken(payload, expiresInSec = 60 * 60 * 24 * 30) {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET no configurado");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const data = `${header}.${body}`;
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !SESSION_SECRET) return null;
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const data = `${h}.${b}`;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest();
  let provided;
  try {
    provided = Buffer.from(s, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(b, "base64url").toString("utf8"));
    if (!payload || !payload.username || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getToken(req) {
  const header = req.headers["authorization"] || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Devuelve { username } si el token es válido, o null.
export function requireUser(req) {
  return verifyToken(getToken(req));
}

// ── Perfil público (nunca password) ─────────────────────────────────────────
// Devuelve camelCase para que el cliente lo use directo en la sesión.
export function publicUser(row) {
  if (!row) return null;
  return {
    username: row.username,
    name: row.name ?? "",
    university: row.university ?? "",
    career: row.career ?? "",
    semester: row.semester ?? 1,
    ingresoCorte: row.ingreso_corte ?? "2023-2",
    photo: row.photo ?? null,
    appMode: row.app_mode ?? "dark",
    appTheme: row.app_theme ?? "ambar",
    themeColors: row.theme_colors ?? null,
    borderRadius: row.border_radius ?? 12,
    fontScale: row.font_scale ?? 1,
    fontBody: row.font_body ?? "DM Sans",
  };
}

// Convierte un objeto camelCase del cliente a columnas de la tabla users.
export function toUserRow(obj) {
  const row = {};
  if (obj.name !== undefined) row.name = String(obj.name);
  if (obj.university !== undefined) row.university = String(obj.university);
  if (obj.career !== undefined) row.career = String(obj.career);
  if (obj.semester !== undefined) row.semester = Number(obj.semester) || 1;
  if (obj.ingresoCorte !== undefined) row.ingreso_corte = String(obj.ingresoCorte);
  if (obj.photo !== undefined) row.photo = obj.photo || null;
  if (obj.appMode !== undefined) row.app_mode = String(obj.appMode);
  if (obj.appTheme !== undefined) row.app_theme = String(obj.appTheme);
  if (obj.themeColors !== undefined) row.theme_colors = obj.themeColors || null;
  if (obj.borderRadius !== undefined) row.border_radius = Number(obj.borderRadius);
  if (obj.fontScale !== undefined) row.font_scale = Number(obj.fontScale);
  if (obj.fontBody !== undefined) row.font_body = String(obj.fontBody);
  return row;
}
