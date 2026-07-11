import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import MallaView from "../components/MallaView";
import PerfilView from "../components/PerfilView";
import TemaView from "../components/TemaView";
import NotasView from "../components/NotasView";
import CursandoView from "../components/CursandoView";
import HorarioView from "../components/HorarioView";
import { getMallaByCareer } from "../data/malla.js";
import { supabase } from "../supabase";
import styles from "./Dashboard.module.css";

function autoApply(malla, currentSemester) {
  return malla.map((sem) => ({
    ...sem,
    materias: sem.materias.map((m) => {
      if (typeof sem.semestre !== "number") return m;
      if (sem.semestre < currentSemester && m.estado === "faltante")
        return { ...m, estado: "aprobada" };
      if (sem.semestre === currentSemester && m.estado === "faltante")
        return { ...m, estado: "cursando" };
      return m;
    }),
  }));
}

function mergeMallaWithBase(baseMalla, savedMalla) {
  if (!savedMalla) return baseMalla;
  const savedById = new Map(
    savedMalla.flatMap((sem) => sem.materias).map((m) => [m.id, m])
  );
  return baseMalla.map((sem) => ({
    ...sem,
    materias: sem.materias.map((baseMat) => {
      const savedMat = savedById.get(baseMat.id);
      return savedMat
        ? { ...baseMat, estado: savedMat.estado ?? baseMat.estado }
        : baseMat;
    }),
  }));
}

// Supabase helpers
async function loadUserData(username) {
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("username", username)
    .single();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = "no rows found", que es normal para un usuario nuevo.
    console.error("Error cargando datos de usuario:", error);
  }
  return data || null;
}

async function saveUserData(username, patch) {
  const { data: existing } = await supabase
    .from("user_data")
    .select("username")
    .eq("username", username)
    .single();

  const { error } = existing
    ? await supabase.from("user_data").update(patch).eq("username", username)
    : await supabase.from("user_data").insert({ username, ...patch });

  if (error) {
    console.error("Error guardando en Supabase:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

export default function Dashboard({ user, onLogout, onUpdateUser }) {
  const [tab, setTab]       = useState("malla");
  const [loaded, setLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef(null);

  const baseMalla    = getMallaByCareer(user.career);
  const defaultMalla = autoApply(baseMalla, user.semester || 1);

  const [malla,        setMalla]        = useState(defaultMalla);
  const [notas,        setNotas]        = useState({});
  const [cursandoData, setCursandoData] = useState({});
  const [horarioData,  setHorarioData]  = useState({ dias: ["L","M","X","J","V"], clases: [] });
  const [planData,     setPlanData]     = useState(null);

  const notify = (msg) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(""), 2200);
  };

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    async function load() {
      const data = await loadUserData(user.username);
      if (data) {
        if (data.malla)    setMalla(mergeMallaWithBase(defaultMalla, data.malla));
        if (data.notas)    setNotas(data.notas);
        if (data.cursando) setCursandoData(data.cursando);
        if (data.horario)  setHorarioData(data.horario);
        if (data.plan)     setPlanData(data.plan);
      }
      setLoaded(true);
    }
    load();
  }, [user.username]);

  const saveMalla = async (data) => {
    setMalla(data);
    const res = await saveUserData(user.username, { malla: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  };

  const saveNotas = async (data) => {
    setNotas(data);
    const res = await saveUserData(user.username, { notas: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  };

  const saveCursando = async (data) => {
    setCursandoData(data);
    const res = await saveUserData(user.username, { cursando: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  };

  const saveHorario = async (data) => {
    setHorarioData(data);
    const res = await saveUserData(user.username, { horario: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  };

  const savePlan = async (data) => {
    setPlanData(data);
    const res = await saveUserData(user.username, { plan: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  };

  const handleMallaReset = (newSemester) => {
    const reset = autoApply(baseMalla, newSemester);
    saveMalla(reset);
  };

  // Al transferir una opción del planificador a "Mi horario": las materias de
  // esa opción pasan a "cursando"; las que estaban "cursando" y ya no están
  // en la opción elegida vuelven a "faltante" (no se tocan las "aprobada").
  const enrollMateriasFromPlan = (materiaIds) => {
    const idSet = new Set(materiaIds);
    const updated = malla.map((sem) => ({
      ...sem,
      materias: sem.materias.map((m) => {
        if (idSet.has(m.id)) return { ...m, estado: "cursando" };
        if (m.estado === "cursando") return { ...m, estado: "faltante" };
        return m;
      }),
    }));
    saveMalla(updated);
  };

  const tabs = [
    { id: "malla",    label: "Malla",        icon: "⬡" },
    { id: "cursando", label: "Semestre",      icon: "◉" },
    { id: "horario",  label: "Horario",       icon: "📅" },
    { id: "notas",    label: "Notas",         icon: "◑" },
    { id: "perfil",   label: "Mi Perfil",     icon: "◎" },
    { id: "tema",     label: "Personalizar",  icon: "◈" },
  ];

  if (!loaded) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", color: "var(--text-muted)", fontFamily: "var(--font-body)",
        flexDirection: "column", gap: "12px",
      }}>
        <span style={{ fontSize: "28px", color: "var(--accent)" }}>✦</span>
        <span>Cargando tu información...</span>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        user={user}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
      />
      <main className={styles.main}>
        {tab === "malla" && (
          <MallaView
            malla={malla}
            notas={notas}
            onSave={saveMalla}
            user={user}
            onNotify={notify}
          />
        )}
        {tab === "cursando" && (
          <CursandoView
            malla={malla}
            cursandoData={cursandoData}
            onSave={saveCursando}
            user={user}
          />
        )}
        {tab === "horario" && (
          <HorarioView
            malla={malla}
            horarioData={horarioData}
            planData={planData}
            onSave={saveHorario}
            onSavePlan={savePlan}
            onNotify={notify}
            user={user}
            onEnrollMaterias={enrollMateriasFromPlan}
          />
        )}
        {tab === "notas" && (
          <NotasView malla={malla} notas={notas} onSave={saveNotas} user={user} />
        )}
        {tab === "perfil" && (
          <PerfilView
            user={user}
            onUpdate={onUpdateUser}
            onMallaReset={handleMallaReset}
            malla={malla}
          />
        )}
        {tab === "tema" && (
          <TemaView user={user} onUpdate={onUpdateUser} />
        )}
      </main>

      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}
    </div>
  );
}
