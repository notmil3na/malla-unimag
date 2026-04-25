import { useState } from "react";
import { CORTES, saveUser, dbRowToUser } from "../App";
import { supabase } from "../supabase";
import styles from "./Login.module.css";

const DEFAULT_THEME_COLORS = {
  cursando: "#c8a96e",
  aprobada: "#6ec88a",
  faltante: "#3a3a52",
};

const UNIVERSITIES = {
  "Universidad del Magdalena": ["Ingeniería de Sistemas", "Hotelería y Turismo"],
};

export default function Login({ onLogin }) {
  const [tab, setTab]       = useState("login");
  const [form, setForm]     = useState({
    username: "", password: "", confirm: "",
    name: "", university: "", career: "",
    semester: 1, ingresoCorte: "2023-2",
  });
  const [error, setError]     = useState("");
  const [shake, setShake]     = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) return triggerError("Completa todos los campos");
    setLoading(true);
    const { data, error: err } = await supabase
      .from("users")
      .select("*")
      .eq("username", form.username)
      .single();
    setLoading(false);
    if (err || !data) return triggerError("Usuario no encontrado");
    if (data.password !== form.password) return triggerError("Contraseña incorrecta");
    onLogin(dbRowToUser(data));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password || !form.name)
      return triggerError("Nombre, usuario y contraseña son obligatorios");
    if (form.password !== form.confirm) return triggerError("Las contraseñas no coinciden");
    if (form.password.length < 6) return triggerError("La contraseña debe tener al menos 6 caracteres");

    setLoading(true);
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("users")
      .select("username")
      .eq("username", form.username)
      .single();

    if (existing) {
      setLoading(false);
      return triggerError("Ese usuario ya existe");
    }

    const newUser = {
      username:     form.username,
      password:     form.password,
      name:         form.name,
      university:   form.university   || "",
      career:       form.career       || "",
      semester:     Number(form.semester) || 1,
      ingresoCorte: form.ingresoCorte || "2023-2",
      photo:        null,
      appMode:      "light",
      appTheme:     "ambar",
      themeColors:  DEFAULT_THEME_COLORS,
      borderRadius: 12,
      fontScale:    1,
      fontBody:     "DM Sans",
    };

    await saveUser(newUser);
    setLoading(false);
    setSuccess("¡Cuenta creada! Inicia sesión.");
    setTab("login");
    setForm(f => ({ ...f, password: "", confirm: "" }));
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const availableCareers = form.university ? (UNIVERSITIES[form.university] || []) : [];

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={`${styles.card} ${shake ? styles.shake : ""}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <h1 className={styles.logoText}>Mi<em>Malla</em></h1>
        </div>
        <p className={styles.sub}>Mi plan de estudio {"<3"}.</p>

        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => { setTab("login"); setError(""); setSuccess(""); }}>
            Iniciar sesión
          </button>
          <button className={`${styles.tabBtn} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => { setTab("register"); setError(""); setSuccess(""); }}>
            Registrarse
          </button>
        </div>

        {success && <p className={styles.successMsg}>✓ {success}</p>}
        {error   && <p className={styles.error}>{error}</p>}

        {tab === "login" && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label>Usuario</label>
              <input value={form.username} onChange={set("username")} placeholder="Tu usuario" autoComplete="username" />
            </div>
            <div className={styles.field}>
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••" autoComplete="current-password" />
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Cargando..." : "Entrar →"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Nombre completo *</label>
                <input value={form.name} onChange={set("name")} placeholder="Tu nombre" />
              </div>
              <div className={styles.field}>
                <label>Usuario *</label>
                <input value={form.username} onChange={set("username")} placeholder="sin espacios" autoComplete="username" />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Contraseña *</label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="mín. 6 caracteres" autoComplete="new-password" />
              </div>
              <div className={styles.field}>
                <label>Confirmar *</label>
                <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="repite la contraseña" autoComplete="new-password" />
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label>Universidad</label>
              <select value={form.university}
                onChange={e => setForm(f => ({ ...f, university: e.target.value, career: "" }))}
                className={styles.selectInput}>
                <option value="">— Selecciona tu universidad —</option>
                {Object.keys(UNIVERSITIES).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Carrera</label>
              <select value={form.career} onChange={set("career")}
                className={styles.selectInput} disabled={!form.university}>
                <option value="">— Selecciona tu carrera —</option>
                {availableCareers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Corte de ingreso</label>
                <select value={form.ingresoCorte} onChange={set("ingresoCorte")} className={styles.selectInput}>
                  {CORTES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Semestre actual</label>
                <input type="number" min="1" max="12" value={form.semester} onChange={set("semester")} />
              </div>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
