import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UpdatePrompt from "./components/UpdatePrompt";
import { api, saveSession, clearSession, getToken } from "./api";
import "./App.css";

// ── Theme definitions ──────────────────────────────────────────────────────
export const APP_THEMES = {
  rojo: {
    name: "Rojo",
    accent: "#FF3B4D",
    accent2: "#D1212F",
    accentRgb: "255,59,77",
  },
  naranja: {
    name: "Naranja",
    accent: "#FF7A1A",
    accent2: "#E35E00",
    accentRgb: "255,122,26",
  },
  ambar: {
    name: "Ámbar",
    accent: "#FFC94D",
    accent2: "#F2A900",
    accentRgb: "255,201,77",
  },
  verde: {
    name: "Verde",
    accent: "#2BD06E",
    accent2: "#0FA84F",
    accentRgb: "43,208,110",
  },
  turquesa: {
    name: "Turquesa",
    accent: "#00D1B2",
    accent2: "#00A28A",
    accentRgb: "0,209,178",
  },
  azul: {
    name: "Azul",
    accent: "#3B82F6",
    accent2: "#1D4ED8",
    accentRgb: "59,130,246",
  },
  violeta: {
    name: "Violeta",
    accent: "#8B5CF6",
    accent2: "#6D28D9",
    accentRgb: "139,92,246",
  },
  rosa: {
    name: "Rosa",
    accent: "#FF4D8D",
    accent2: "#E02A6D",
    accentRgb: "255,77,141",
  },
  gris: {
    name: "Gris",
    accent: "#9AA5B8",
    accent2: "#5F6B82",
    accentRgb: "154,165,184",
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
    birthdate:    userData.birthdate,
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

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
