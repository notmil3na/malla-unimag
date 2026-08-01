import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UpdatePrompt from "./components/UpdatePrompt";
import { api, saveSession, clearSession, getToken } from "./api";
import "./App.css";

// ── Theme definitions ──────────────────────────────────────────────────────
export const APP_THEMES = {
  ambar: {
    name: "Ámbar",
    accent: "#EECE7B",
    accent2: "#D0783B",
    accentRgb: "238,206,123",
  },
  oceano: {
    name: "Océano",
    accent: "#6BA3E8",
    accent2: "#3A70B0",
    accentRgb: "107,163,232",
  },
  violeta: {
    name: "Violeta",
    accent: "#B882E8",
    accent2: "#7B50B0",
    accentRgb: "184,130,232",
  },
  rosa: {
    name: "Rosa",
    accent: "#E87098",
    accent2: "#C04070",
    accentRgb: "232,112,152",
  },
  esmeralda: {
    name: "Esmeralda",
    accent: "#6EC8A8",
    accent2: "#3A8B6A",
    accentRgb: "110,200,168",
  },
  coral: {
    name: "Coral",
    accent: "#E8946B",
    accent2: "#C06840",
    accentRgb: "232,148,107",
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
  const m = mode || "dark";
  const root = document.documentElement;
  root.setAttribute("data-theme", m);
  root.style.setProperty("--accent",     t.accent);
  root.style.setProperty("--accent2",    t.accent2);
  root.style.setProperty("--accent-rgb", t.accentRgb);
  // Sin meta theme-color a propósito: en Safari iOS (pestaña normal) un
  // theme-color fuerza una banda sólida opaca en la barra de estado. El tint
  // de las barras lo da el background-color del html/body (var(--bg)).
  if (fontBody) {
    root.style.setProperty("--font-body", `'${fontBody}', system-ui, sans-serif`);
  } else {
    root.style.removeProperty("--font-body");
  }
}

// ── Backend (Vercel Functions) ─────────────────────────────────────────────
export async function saveUser(userData) {
  const body = {
    name:         userData.name,
    university:   userData.university,
    career:       userData.career,
    semester:     userData.semester,
    ingresoCorte: userData.ingresoCorte,
    photo:        userData.photo ?? null,
    appMode:      userData.appMode,
    appTheme:     userData.appTheme,
    themeColors:  userData.themeColors,
    borderRadius: userData.borderRadius,
    fontScale:    userData.fontScale,
    fontBody:     userData.fontBody,
  };
  try {
    await api("/users", { method: "POST", body });
    return { ok: true };
  } catch (error) {
    console.error("saveUser error:", error);
    return { ok: false, error };
  }
}

// El tema inicial se aplica ANTES del primer pintado desde un script inline en
// index.html (lee malla_session y fija data-theme + variables), evitando el
// flash de tema al recargar. Aquí solo se reaplica desde la sesión restaurada.

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Recuperar sesión de localStorage (fallback rápido antes de validar).
    try {
      const saved = localStorage.getItem("malla_session");
      if (saved) {
        const s = JSON.parse(saved);
        if (s && s.token && s.user) {
          setUser(s.user);
          applyTheme(s.user.appTheme || "ambar", s.user.appMode || "dark", s.user.fontBody);
        }
      }
    } catch (_) {}
    setReady(true);
  }, []);

  // auth = { token, user } devuelto por POST /api/auth/login
  const handleLogin = (auth) => {
    saveSession(auth.token, auth.user);
    setUser(auth.user);
    applyTheme(auth.user.appTheme || "ambar", auth.user.appMode || "dark", auth.user.fontBody);
  };

  const handleLogout = () => {
    const currentMode  = user?.appMode  || "dark";
    const currentTheme = user?.appTheme || "ambar";
    clearSession();
    setUser(null);
    applyTheme(currentTheme, currentMode);
  };

  const handleUpdateUser = async (updated) => {
    saveSession(getToken(), updated);
    setUser(updated);
    applyTheme(updated.appTheme || "ambar", updated.appMode || "dark", updated.fontBody);
    await saveUser(updated);
  };

  if (!ready) return null;

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <UpdatePrompt />
    </>
  );
}
