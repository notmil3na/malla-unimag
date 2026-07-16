import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import Sidebar from "../components/Sidebar";
import { getMallaByCareer } from "../data/malla.js";
import { supabase } from "../supabase";
import styles from "./Dashboard.module.css";

const MallaView    = lazy(() => import("../components/MallaView"));
const CursandoView = lazy(() => import("../components/CursandoView"));
const HorarioView  = lazy(() => import("../components/HorarioView"));
const NotasView    = lazy(() => import("../components/NotasView"));
const PerfilView   = lazy(() => import("../components/PerfilView"));
const TemaView     = lazy(() => import("../components/TemaView"));

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

  const baseMalla = useMemo(() => getMallaByCareer(user.career), [user.career]);
  const defaultMalla = useMemo(() => autoApply(baseMalla, user.semester || 1), [baseMalla, user.semester]);

  const [malla,        setMalla]        = useState(defaultMalla);
  const [notas,        setNotas]        = useState({});
  const [cursandoData, setCursandoData] = useState({});
  const [horarioData,  setHorarioData]  = useState({ dias: ["L","M","X","J","V"], clases: [] });
  const [planData,     setPlanData]     = useState(null);

  const notify = useCallback((msg) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(""), 2200);
  }, []);

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

  const saveMalla = useCallback(async (data) => {
    setMalla(data);
    const res = await saveUserData(user.username, { malla: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  }, [user.username, notify]);

  const saveNotas = useCallback(async (data) => {
    setNotas(data);
    const res = await saveUserData(user.username, { notas: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  }, [user.username, notify]);

  const saveCursando = useCallback(async (data) => {
    setCursandoData(data);
    const res = await saveUserData(user.username, { cursando: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  }, [user.username, notify]);

  const saveHorario = useCallback(async (data) => {
    setHorarioData(data);
    const res = await saveUserData(user.username, { horario: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  }, [user.username, notify]);

  const savePlan = useCallback(async (data) => {
    setPlanData(data);
    const res = await saveUserData(user.username, { plan: data });
    notify(res.ok ? "Guardado correctamente" : "Error al guardar. Intenta de nuevo.");
  }, [user.username, notify]);

  const handleMallaReset = useCallback((newSemester) => {
    const reset = autoApply(baseMalla, newSemester);
    setMalla(reset);
    saveUserData(user.username, { malla: reset });
    notify("Semestre reiniciado");
  }, [baseMalla, user.username, notify]);

  const enrollMateriasFromPlan = useCallback((materiaIds) => {
    const idSet = new Set(materiaIds);
    setMalla(prev => {
      const updated = prev.map((sem) => ({
        ...sem,
        materias: sem.materias.map((m) => {
          if (idSet.has(m.id)) return { ...m, estado: "cursando" };
          if (m.estado === "cursando") return { ...m, estado: "faltante" };
          return m;
        }),
      }));
      saveUserData(user.username, { malla: updated });
      return updated;
    });
  }, [user.username]);

  const tabs = useMemo(() => [
    { id: "malla",    label: "Malla",        icon: "⬡" },
    { id: "cursando", label: "Semestre",      icon: "◉" },
    { id: "horario",  label: "Horario",       icon: "▦" },
    { id: "notas",    label: "Notas",         icon: "◑" },
    { id: "perfil",   label: "Mi Perfil",     icon: "◎" },
    { id: "tema",     label: "Personalizar",  icon: "◈" },
  ], []);

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
        <Suspense fallback={
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--text-muted)",fontFamily:"var(--font-body)",gap:"8px"}}>
            <span style={{fontSize:"20px",color:"var(--accent)"}}>✦</span>
            <span>Cargando...</span>
          </div>
        }>
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
        </Suspense>
      </main>

      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}
    </div>
  );
}
