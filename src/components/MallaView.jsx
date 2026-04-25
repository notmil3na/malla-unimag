import { useState } from "react";
import { MALLA, ESTADOS } from "../data/malla.js";
import MateriaCard from "./MateriaCard";
import styles from "./MallaView.module.css";

// Auto-approve all semesters before the current one
function applyAutoApprove(malla, currentSemester) {
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

export default function MallaView({ malla: initialMalla, onSave, user }) {
  const [malla, setMalla] = useState(() =>
    applyAutoApprove(initialMalla || MALLA, user.semester || 1)
  );
  const [selected, setSelected]       = useState(null);
  const [highlighted, setHighlighted] = useState([]);

  const colors = user.themeColors || {};
  const br     = user.borderRadius ?? 12;
  const fs     = user.fontScale ?? 1;

  const allMaterias = malla.flatMap((s) => s.materias);

  const getColor = (estado) => {
    if (estado === "aprobada") return colors.aprobada || "#6ec88a";
    if (estado === "cursando") return colors.cursando || "#c8a96e";
    return colors.faltante || "#3a3a52";
  };

  const handleSelect = (materia) => {
    if (selected?.id === materia.id) { setSelected(null); setHighlighted([]); return; }
    setSelected(materia);
    const prereqTree = [];
    const collectPrereqs = (ids) => {
      ids.forEach((id) => {
        if (!prereqTree.includes(id)) {
          prereqTree.push(id);
          const m = allMaterias.find((x) => x.id === id);
          if (m) collectPrereqs(m.prereqs);
        }
      });
    };
    collectPrereqs(materia.prereqs);
    setHighlighted(prereqTree);
  };

  const handleEstadoChange = (semIdx, matIdx, newEstado) => {
    const updated = malla.map((s, si) =>
      si !== semIdx ? s : {
        ...s,
        materias: s.materias.map((m, mi) =>
          mi !== matIdx ? m : { ...m, estado: newEstado }
        ),
      }
    );
    setMalla(updated);
    onSave(updated);
    if (selected) setSelected(updated[semIdx].materias[matIdx]);
  };

  const stats = {
    total:     allMaterias.length,
    aprobadas: allMaterias.filter((m) => m.estado === "aprobada").length,
    cursando:  allMaterias.filter((m) => m.estado === "cursando").length,
    faltantes: allMaterias.filter((m) => m.estado === "faltante").length,
  };
  const progress = Math.round((stats.aprobadas / stats.total) * 100);

  return (
    <div className={styles.wrap} style={{ "--fs": fs }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Malla Curricular</h2>
          <p className={styles.subtitle}>{user.career} · {user.university}</p>
        </div>
        <div className={styles.stats}>
          {[
            { label: "Aprobadas", val: stats.aprobadas, color: colors.aprobada || "#6ec88a" },
            { label: "Cursando",  val: stats.cursando,  color: colors.cursando  || "#c8a96e" },
            { label: "Faltantes", val: stats.faltantes, color: colors.faltante  || "#3a3a52" },
          ].map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statDot} style={{ background: s.color }} />
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressWrap}>
        <div className={styles.progressInfo}>
          <span>Progreso académico</span><span>{progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%`, background: colors.aprobada || "#6ec88a" }} />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendHint}>💡 Haz clic en una materia para ver sus prerequisitos</span>
        <div className={styles.legendItems}>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <div key={k} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: getColor(k) }} />
              <span>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {malla.map((sem, si) => (
          <div key={si} className={styles.semestre}>
            <div className={styles.semestreHeader}>
              <span className={styles.semestreNum}>S{sem.semestre}</span>
              <span className={styles.semestreLabel}>Semestre {sem.semestre}</span>
              <span className={styles.semestreCreditos}>
                {sem.materias.reduce((a, m) => a + m.creditos, 0)} cr
              </span>
            </div>
            <div className={styles.materias}>
              {sem.materias.map((mat, mi) => (
                <MateriaCard
                  key={mat.id}
                  materia={mat}
                  color={getColor(mat.estado)}
                  isSelected={selected?.id === mat.id}
                  isHighlighted={highlighted.includes(mat.id)}
                  isDimmed={selected && selected.id !== mat.id && !highlighted.includes(mat.id)}
                  borderRadius={br}
                  fontScale={fs}
                  onClick={() => handleSelect(mat)}
                  onEstadoChange={(e) => handleEstadoChange(si, mi, e)}
                  allMaterias={allMaterias}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div>
              <span className={styles.detailEstado} style={{ background: getColor(selected.estado), color: "#0e0e14" }}>
                {ESTADOS[selected.estado]?.label}
              </span>
              <h3 className={styles.detailName}>{selected.nombre}</h3>
              <p className={styles.detailId}>{selected.id} · {selected.creditos} créditos</p>
            </div>
            <button className={styles.detailClose} onClick={() => { setSelected(null); setHighlighted([]); }}>✕</button>
          </div>
          <div className={styles.detailBody}>
            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Cambiar estado:</p>
              <div className={styles.estadoBtns}>
                {Object.entries(ESTADOS).map(([k, v]) => (
                  <button
                    key={k}
                    className={`${styles.estadoBtn} ${selected.estado === k ? styles.estadoBtnActive : ""}`}
                    style={selected.estado === k ? { background: getColor(k), color: "#0e0e14" } : {}}
                    onClick={() => {
                      const si = malla.findIndex((s) => s.materias.find((m) => m.id === selected.id));
                      const mi = malla[si].materias.findIndex((m) => m.id === selected.id);
                      handleEstadoChange(si, mi, k);
                    }}
                  >
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>
            {selected.prereqs.length > 0 && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Prerequisitos:</p>
                <div className={styles.prereqList}>
                  {selected.prereqs.map((pid) => {
                    const pm = allMaterias.find((m) => m.id === pid);
                    return pm ? (
                      <div key={pid} className={styles.prereqItem} style={{ borderColor: getColor(pm.estado) }}>
                        <span className={styles.prereqDot} style={{ background: getColor(pm.estado) }} />
                        <span className={styles.prereqName}>{pm.nombre}</span>
                        <span className={styles.prereqStatus}>{ESTADOS[pm.estado]?.label}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
