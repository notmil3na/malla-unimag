import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MallaView from "../components/MallaView";
import PerfilView from "../components/PerfilView";
import TemaView from "../components/TemaView";
import NotasView from "../components/NotasView";
import CursandoView from "../components/CursandoView";
import HorarioView from "../components/HorarioView";
import SocialView from "../components/SocialView";
import { getMallaByCareer } from "../data/malla.js";
import { supabase } from "../supabase";
import styles from "./Dashboard.module.css";

function autoApply(malla, currentSemester) {
  return malla.map((sem) => ({
    ...sem,
    materias: sem.materias.map((m) => {
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

// ── Supabase helpers ───────────────────────────────
async function loadUserData(username) {
  const { data } = await supabase
    .from("user_data")
    .select("*")
    .eq("username", username)
    .single();
  return data || null;
}

async function saveUserData(username, patch) {
  const { data: existing } = await supabase
    .from("user_data")
    .select("username")
    .eq("username", username)
    .single();

  if (existing) {
    await supabase.from("user_data").update(patch).eq("username", username);
  } else {
    await supabase.from("user_data").insert({ username, ...patch });
  }
}

export default function Dashboard({ user, onLogout, onUpdateUser }) {
  const [tab, setTab]   = useState("malla");
  const [loaded, setLoaded] = useState(false);

  const baseMalla = getMallaByCareer(user.career);
  const defaultMalla = autoApply(baseMalla, user.semester || 1);

  const [malla,        setMalla]        = useState(defaultMalla);
  const [notas,        setNotas]        = useState({});
  const [cursandoData, setCursandoData] = useState({});
  const [horarioData,  setHorarioData]  = useState({ dias: ["L","M","X","J","V"], clases: [] });

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    async function load() {
      const data = await loadUserData(user.username);
      if (data) {
        if (data.malla)    setMalla(mergeMallaWithBase(defaultMalla, data.malla));
        if (data.notas)    setNotas(data.notas);
        if (data.cursando) setCursandoData(data.cursando);
        if (data.horario)  setHorarioData(data.horario);
      }
      setLoaded(true);
    }
    load();
  }, [user.username]);

  const saveMalla = async (data) => {
    setMalla(data);
    await saveUserData(user.username, { malla: data });
  };

  const saveNotas = async (data) => {
    setNotas(data);
    await saveUserData(user.username, { notas: data });
  };

  const saveCursando = async (data) => {
    setCursandoData(data);
    await saveUserData(user.username, { cursando: data });
  };

  const saveHorario = async (data) => {
    setHorarioData(data);
    await saveUserData(user.username, { horario: data });
  };

  const handleMallaReset = (newSemester) => {
    const reset = autoApply(baseMalla, newSemester);
    saveMalla(reset);
  };

  const tabs = [
    { id: "malla",    label: "Malla",       icon: "⬡" },
    { id: "cursando", label: "Semestre",     icon: "◉" },
    { id: "horario",  label: "Horario",      icon: "📅" },
    { id: "notas",    label: "Notas",        icon: "◑" },
    { id: "social",   label: "Amigos",       icon: "👥" },
    { id: "perfil",   label: "Mi Perfil",    icon: "◎" },
    { id: "tema",     label: "Personalizar", icon: "◈" },
  ];

  if (!loaded) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", color: "var(--text-muted)", fontFamily: "var(--font-body)",
        flexDirection: "column", gap: "12px"
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
          <MallaView malla={malla} onSave={saveMalla} user={user} />
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
            onSave={saveHorario}
            user={user}
          />
        )}
        {tab === "notas" && (
          <NotasView malla={malla} notas={notas} onSave={saveNotas} user={user} />
        )}
        {tab === "social" && (
          <SocialView user={user} />
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
    </div>
  );
}
