import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import Sidebar from "../components/Sidebar";
import { getMallaByCareer } from "../data/malla.js";
import { supabase } from "../supabase";
import { getPendingSaves, hasPendingSaves, queueSave, clearPendingSave } from "../utils/offlineQueue.js";
import styles from "./Dashboard.module.css";
import {
  IconSchedule, IconCalendar, IconClipboard, IconSemester,
  IconGrades, IconMalla, IconUser, IconPaint
} from "../components/Icons";

const MallaView        = lazy(() => import("../components/MallaView"));
const CursandoView     = lazy(() => import("../components/CursandoView"));
const HorarioView      = lazy(() => import("../components/HorarioView"));
const NotasView        = lazy(() => import("../components/NotasView"));
const PerfilView       = lazy(() => import("../components/PerfilView"));
const TemaView         = lazy(() => import("../components/TemaView"));
const CalendarioView   = lazy(() => import("../components/CalendarioView"));
const AsignacionesView = lazy(() => import("../components/AsignacionesView"));

const DIA_MAP = { 0:"D", 1:"L", 2:"M", 3:"X", 4:"J", 5:"V", 6:"S" };
const DIA_NAMES = { L:"Lunes", M:"Martes", X:"Miércoles", J:"Jueves", V:"Viernes", S:"Sábado" };
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function parseHora(h) {
  if (!h) return 0;
  if (h.includes(":")) {
    const [time, period] = h.split(" ");
    let [hh, mm] = time.split(":").map(Number);
    if (period && period.includes("p") && hh !== 12) hh += 12;
    if (period && period.includes("a") && hh === 12) hh = 0;
    return hh + mm / 60;
  }
  const [hh, mm] = h.split(":").map(Number);
  return hh + (mm || 0) / 60;
}

function HoyWidget({ horarioData, malla }) {
  const today = new Date();
  const diaKey = DIA_MAP[today.getDay()];
  if (diaKey === "D" || diaKey === "S") return null;
  const claseHoy = (horarioData?.clases || [])
    .filter(c => c.dia === diaKey)
    .sort((a, b) => parseHora(a.horaInicio) - parseHora(b.horaInicio));
  if (claseHoy.length === 0) return null;
  const allMaterias = malla.flatMap(s => s.materias);
  const materiaMap = Object.fromEntries(allMaterias.map(m => [m.id, m]));
  const fechaStr = `${DIA_NAMES[diaKey]}, ${today.getDate()} de ${MESES[today.getMonth()]} ${today.getFullYear()}`;
  return (
    <div className={styles.hoyWidget}>
      <p className={styles.hoyDate}>{fechaStr}</p>
      <div className={styles.hoyCards}>
        {claseHoy.map((clase, i) => {
          const mat = materiaMap[clase.materiaId];
          return (
            <div key={i} className={styles.hoyCard}>
              <div className={styles.hoyCardAccent} />
              <div className={styles.hoyCardBody}>
                <p className={styles.hoyCardTitle}>
                  <span className={styles.hoyCardId}>{clase.materiaId}</span>
                  {mat?.nombre || clase.materiaId}
                </p>
                <p className={styles.hoyCardLocation}>{clase.salonLabel || "Sin salón"}</p>
                <p className={styles.hoyCardTime}>{clase.horaInicio} – {clase.horaFin}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const [tab, setTab]       = useState("horario");
  const [loaded, setLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [pendingCount, setPendingCount] = useState(() =>
    typeof localStorage !== "undefined" && hasPendingSaves()
      ? Object.keys(getPendingSaves()).length
      : 0
  );
  const toastTimerRef = useRef(null);

  const notify = useCallback((msg) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(""), 2200);
  }, []);

  const baseMalla = useMemo(() => getMallaByCareer(user.career), [user.career]);
  const defaultMalla = useMemo(() => autoApply(baseMalla, user.semester || 1), [baseMalla, user.semester]);

  const [malla,        setMalla]        = useState(defaultMalla);
  const [notas,        setNotas]        = useState({});
  const [cursandoData, setCursandoData] = useState({});
  const [horarioData,  setHorarioData]  = useState({ dias: ["L","M","X","J","V"], clases: [] });
  const [planData,     setPlanData]     = useState(null);
  const [calendarioData, setCalendarioData] = useState({ eventos: [] });
  const [asignacionesData, setAsignacionesData] = useState({ items: [] });

  // Persistencia con tolerancia offline: si no hay red (o Supabase falla),
  // la columna se encola en localStorage y se sincroniza al reconectar.
  const persistColumn = useCallback(async (column, data, applyLocal) => {
    applyLocal(data);
    if (!navigator.onLine) {
      queueSave(column, data);
      setPendingCount(Object.keys(getPendingSaves()).length);
      notify("Sin conexión: cambios guardados localmente. Se sincronizarán al reconectar.");
      return;
    }
    const res = await saveUserData(user.username, { [column]: data });
    if (!res.ok) {
      queueSave(column, data);
      setPendingCount(Object.keys(getPendingSaves()).length);
      notify("Sin conexión: cambios guardados localmente. Se sincronizarán al reconectar.");
    } else {
      notify("Guardado correctamente");
    }
  }, [user.username, notify]);

  // Sincronizar la cola pendiente al volver la conexión.
  useEffect(() => {
    const flush = async () => {
      const pending = getPendingSaves();
      const cols = Object.keys(pending);
      if (cols.length === 0) return;
      let okCount = 0;
      for (const col of cols) {
        const res = await saveUserData(user.username, { [col]: pending[col] });
        if (res.ok) {
          clearPendingSave(col);
          okCount++;
        }
      }
      setPendingCount(Object.keys(getPendingSaves()).length);
      if (okCount > 0) notify(`${okCount} cambio(s) sincronizado(s) con la nube`);
    };

    const onOnline = () => { setIsOffline(false); flush(); };
    const onOffline = () => { setIsOffline(true); };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine && hasPendingSaves()) flush();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [user.username, notify]);

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
        if (data.calendario) setCalendarioData(data.calendario);
        if (data.asignaciones) setAsignacionesData(data.asignaciones);
      }
      setLoaded(true);
    }
    load();
  }, [user.username]);

  const saveMalla = useCallback(async (data) => {
    await persistColumn("malla", data, setMalla);
  }, [persistColumn]);

  const saveNotas = useCallback(async (data) => {
    await persistColumn("notas", data, setNotas);
  }, [persistColumn]);

  const saveCursando = useCallback(async (data) => {
    await persistColumn("cursando", data, setCursandoData);
  }, [persistColumn]);

  const saveHorario = useCallback(async (data) => {
    await persistColumn("horario", data, setHorarioData);
  }, [persistColumn]);

  const savePlan = useCallback(async (data) => {
    await persistColumn("plan", data, setPlanData);
  }, [persistColumn]);

  const saveCalendario = useCallback(async (data) => {
    await persistColumn("calendario", data, setCalendarioData);
  }, [persistColumn]);

  const saveAsignaciones = useCallback(async (data) => {
    await persistColumn("asignaciones", data, setAsignacionesData);
  }, [persistColumn]);

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
    { id: "horario",      label: "Horario",       icon: IconSchedule },
    { id: "calendario",   label: "Calendario",     icon: IconCalendar },
    { id: "asignaciones", label: "Asignaciones",   icon: IconClipboard },
    { id: "cursando",     label: "Semestre",       icon: IconSemester },
    { id: "notas",        label: "Notas",          icon: IconGrades },
    { id: "malla",        label: "Malla",          icon: IconMalla },
    { id: "perfil",       label: "Mi Perfil",      icon: IconUser },
    { id: "tema",         label: "Personalizar",   icon: IconPaint },
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
        {tab === "horario" && (
          <>
            <HoyWidget horarioData={horarioData} malla={malla} />
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
          </>
        )}
        {tab === "calendario" && (
          <CalendarioView
            malla={malla}
            calendarioData={calendarioData}
            onSave={saveCalendario}
            user={user}
            horarioData={horarioData}
          />
        )}
        {tab === "asignaciones" && (
          <AsignacionesView
            malla={malla}
            asignacionesData={asignacionesData}
            onSave={saveAsignaciones}
            user={user}
            cursandoData={cursandoData}
            onSaveCursando={saveCursando}
            calendarioData={calendarioData}
            onSaveCalendario={saveCalendario}
          />
        )}
        {tab === "cursando" && (
          <CursandoView
            malla={malla}
            cursandoData={cursandoData}
            onSave={saveCursando}
            user={user}
            horarioData={horarioData}
          />
        )}
        {tab === "malla" && (
          <MallaView
            malla={malla}
            notas={notas}
            onSave={saveMalla}
            user={user}
            onNotify={notify}
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
      {(isOffline || pendingCount > 0) && (
        <div className={styles.offlineBar}>
          <span className={styles.offlineDot} />
          {isOffline
            ? "Sin conexión · los cambios se guardan localmente"
            : `${pendingCount} cambio(s) pendiente(s) por sincronizar`}
        </div>
      )}
    </div>
  );
}
