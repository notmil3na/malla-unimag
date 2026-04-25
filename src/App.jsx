import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { supabase } from "./supabase";
import "./App.css";

// ── Theme definitions ──────────────────────────────────────────────────────
export const APP_THEMES = {
  ambar: {
    name: "Ámbar",
    accent: "#c8a96e",
    accent2: "#8b6f3a",
    accentRgb: "200,169,110",
  },
  oceano: {
    name: "Océano",
    accent: "#6eb5c8",
    accent2: "#3a7a8b",
    accentRgb: "110,181,200",
  },
  violeta: {
    name: "Violeta",
    accent: "#a86ec8",
    accent2: "#6a3a8b",
    accentRgb: "168,110,200",
  },
  rosa: {
    name: "Rosa",
    accent: "#c8154b",
    accent2: "#8b1035",
    accentRgb: "200,21,75",
  },
  esmeralda: {
    name: "Esmeralda",
    accent: "#6ec8a8",
    accent2: "#3a8b6a",
    accentRgb: "110,200,168",
  },
  rojo: {
    name: "Rojo",
    accent: "#c86e6e",
    accent2: "#8b3a3a",
    accentRgb: "200,110,110",
  },
};

// ── Cortes disponibles ─────────────────────────────────────────────────────
export function generateCortes(from = "2023-2", to = "2028-1") {
  const cortes = [];
  let [year, sem] = from.split("-").map(Number);
  const [toYear, toSem] = to.split("-").map(Number);
  while (year < toYear || (year === toYear && sem <= toSem)) {
    cortes.push(`${year}-${sem}`);
    if (sem === 1) sem = 2;
    else { sem = 1; year++; }
  }
  return cortes;
}

export const CORTES = generateCortes("2022-1", "2028-1");

export function corteForSemester(ingresoCorte, semNum) {
  const idx = CORTES.indexOf(ingresoCorte);
  if (idx === -1) return null;
  const target = idx + (semNum - 1);
  return CORTES[target] || null;
}

// ── CSS variable injection ─────────────────────────────────────────────────
export function applyTheme(themeKey, mode, fontBody) {
  const t = APP_THEMES[themeKey] || APP_THEMES.ambar;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode || "light");
  root.style.setProperty("--accent",     t.accent);
  root.style.setProperty("--accent2",    t.accent2);
  root.style.setProperty("--accent-rgb", t.accentRgb);
  if (fontBody) {
    root.style.setProperty("--font-body", `'${fontBody}', system-ui, sans-serif`);
  } else {
    root.style.removeProperty("--font-body");
  }
}

// ── Supabase auth helpers ──────────────────────────────────────────────────
export async function getUsers() {
  const { data } = await supabase.from("users").select("*");
  if (!data) return {};
  return Object.fromEntries(data.map((u) => [u.username, u]));
}

export async function saveUser(userData) {
  const row = {
    username:      userData.username,
    password:      userData.password,
    name:          userData.name          || "",
    university:    userData.university    || "",
    career:        userData.career        || "",
    semester:      userData.semester      || 1,
    ingreso_corte: userData.ingresoCorte  || "2023-2",
    photo:         userData.photo         || null,
    app_mode:      userData.appMode       || "light",
    app_theme:     userData.appTheme      || "ambar",
    theme_colors:  userData.themeColors   || null,
    border_radius: userData.borderRadius  ?? 12,
    font_scale:    userData.fontScale     ?? 1,
    font_body:     userData.fontBody      || "DM Sans",
  };
  const { error } = await supabase.from("users").upsert(row, { onConflict: "username" });
  if (error) console.error("saveUser error:", error);
}

export function dbRowToUser(row) {
  return {
    username:     row.username,
    password:     row.password,
    name:         row.name,
    university:   row.university,
    career:       row.career,
    semester:     row.semester,
    ingresoCorte: row.ingreso_corte,
    photo:        row.photo,
    appMode:      row.app_mode,
    appTheme:     row.app_theme,
    themeColors:  row.theme_colors,
    borderRadius: row.border_radius,
    fontScale:    row.font_scale,
    fontBody:     row.font_body,
  };
}

// Aplicar tema inicial
applyTheme("ambar", "light");

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Intentar recuperar sesión de localStorage como fallback rápido
    try {
      const savedUser = localStorage.getItem("malla_session");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        applyTheme(u.appTheme || "ambar", u.appMode || "light", u.fontBody);
      }
    } catch (_) {}
    setReady(true);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem("malla_session", JSON.stringify(userData));
    setUser(userData);
    applyTheme(userData.appTheme || "ambar", userData.appMode || "light", userData.fontBody);
  };

  const handleLogout = () => {
    const currentMode  = user?.appMode  || "light";
    const currentTheme = user?.appTheme || "ambar";
    localStorage.removeItem("malla_session");
    setUser(null);
    applyTheme(currentTheme, currentMode);
  };

  const handleUpdateUser = async (updated) => {
    localStorage.setItem("malla_session", JSON.stringify(updated));
    setUser(updated);
    applyTheme(updated.appTheme || "ambar", updated.appMode || "light", updated.fontBody);
    await saveUser(updated);
  };

  if (!ready) return null;

  if (!user) return <Login onLogin={handleLogin} />;
  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
  );
}
