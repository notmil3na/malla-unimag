import { useEffect, useState } from "react";
import { MALLA, ESTADOS } from "../data/malla.js";
import { getSemesterCountdown, SEMESTER_CORTE } from "../utils/semesterCountdown.js";
import { canEnrollMateria } from "../utils/gradeHelpers.js";
import MateriaCard from "./MateriaCard";
import styles from "./MallaView.module.css";

// Auto-approve all semesters before the current one
function applyAutoApprove(malla, currentSemester) {
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

export default function MallaView({ malla: initialMalla, onSave, user }) {
  const [malla, setMalla] = useState(() =>
    applyAutoApprove(initialMalla || MALLA, user.semester || 1)
  );
  const [selected, setSelected]               = useState(null);
  const [highlightedPrereqs, setHighlightedPrereqs] = useState([]);
  const [highlightedUnlocks, setHighlightedUnlocks] = useState([]);
  const [showMatriculables, setShowMatriculables] = useState(false);

  useEffect(() => {
    if (initialMalla) setMalla(initialMalla);
  }, [initialMalla]);

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
    if (selected?.id === materia.id) {
      setSelected(null);
      setHighlightedPrereqs([]);
      setHighlightedUnlocks([]);
      return;
    }
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
    setHighlightedPrereqs(prereqTree);

    const unlockTree = [];
    const collectUnlocks = (materiaId) => {
      allMaterias.forEach((m) => {
        if (m.prereqs.includes(materiaId) && !unlockTree.includes(m.id)) {
          unlockTree.push(m.id);
          collectUnlocks(m.id);
        }
      });
    };
    collectUnlocks(materia.id);
    setHighlightedUnlocks(unlockTree);
  };

  const handleEstadoChange = (materiaId, newEstado) => {
    const updated = malla.map((s) => ({
      ...s,
      materias: s.materias.map((m) =>
        m.id === materiaId ? { ...m, estado: newEstado } : m
      ),
    }));
    setMalla(updated);
    onSave(updated);
    if (selected) {
      const updatedSelected = updated.flatMap((s) => s.materias).find((m) => m.id === selected.id);
      if (updatedSelected) setSelected(updatedSelected);
    }
  };

  const stats = {
    total:     allMaterias.length,
    aprobadas: allMaterias.filter((m) => m.estado === "aprobada").length,
    cursando:  allMaterias.filter((m) => m.estado === "cursando").length,
    faltantes: allMaterias.filter((m) => m.estado === "faltante").length,
  };
  const progress = Math.round((stats.aprobadas / stats.total) * 100);
  const semester = getSemesterCountdown();
  const matriculables = allMaterias.filter((m) => canEnrollMateria(m, allMaterias));
  const matriculableIds = new Set(matriculables.map((m) => m.id));

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

      <div className={styles.semesterWidget}>
        <div className={styles.semesterWidgetTop}>
          <div>
            <p className={styles.semesterWidgetLabel}>
              Cuenta regresiva · Corte {SEMESTER_CORTE}
            </p>
            <p className={styles.semesterWidgetRange}>3 ago 2026 – 28 nov 2026</p>
          </div>
          <span className={styles.semesterWidgetStatus}>{semester.status}</span>
        </div>
        <div className={styles.semesterWidgetMain}>
          <span className={styles.semesterWidgetDays}>{semester.days}</span>
          <span className={styles.semesterWidgetText}>{semester.daysText}</span>
        </div>
        {semester.showProgress && (
          <>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${semester.progress}%`, background: "var(--accent)" }}
              />
            </div>
            {semester.progressInfo && (
              <div className={styles.progressInfo}>
                <span>{semester.progressInfo.left}</span>
                <span>{semester.progressInfo.right}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendHint}>💡 Haz clic en una materia para ver prerequisitos</span>
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
        {malla.map((sem, si) => {
          const isOptativas = sem.semestre === "opt";
          const optColumns = isOptativas
            ? [sem.materias.slice(0, 6), sem.materias.slice(6, 12), sem.materias.slice(12, 15)]
            : null;

          const renderCard = (mat) => (
            <MateriaCard
              key={mat.id}
              materia={mat}
              color={getColor(mat.estado)}
              isSelected={selected?.id === mat.id}
              isHighlightedPrereq={highlightedPrereqs.includes(mat.id)}
              isHighlightedUnlock={highlightedUnlocks.includes(mat.id)}
              isMatriculable={showMatriculables && matriculableIds.has(mat.id)}
              isDimmed={
                (selected
                  && selected.id !== mat.id
                  && !highlightedPrereqs.includes(mat.id)
                  && !highlightedUnlocks.includes(mat.id))
                || (showMatriculables
                  && !selected
                  && !matriculableIds.has(mat.id)
                  && mat.estado === "faltante")
              }
              borderRadius={br}
              fontScale={fs}
              onClick={() => handleSelect(mat)}
              onEstadoChange={(e) => handleEstadoChange(mat.id, e)}
              allMaterias={allMaterias}
            />
          );

          return (
            <div key={si} className={`${styles.semestre} ${isOptativas ? styles.semestreOpt : ""}`}>
              <div className={styles.semestreHeader}>
                <span className={styles.semestreNum}>
                  {typeof sem.semestre === "number" ? `S${sem.semestre}` : "OPT"}
                </span>
                <span className={styles.semestreLabel}>
                  {sem.label || `Semestre ${sem.semestre}`}
                </span>
                <span className={styles.semestreCreditos}>
                  {sem.materias.reduce((a, m) => a + m.creditos, 0)} cr
                </span>
              </div>
              {isOptativas ? (
                <div className={styles.materiasOptColumns}>
                  {optColumns.map((col, ci) => (
                    <div key={ci} className={styles.materiasOptCol}>
                      {col.map((mat) => renderCard(mat))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.materias}>
                  {sem.materias.map((mat) => renderCard(mat))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.matriculablesBar}>
        <label className={styles.matriculablesToggle}>
          <input
            type="checkbox"
            checked={showMatriculables}
            onChange={(e) => setShowMatriculables(e.target.checked)}
          />
          <span>Ver materias que puedo matricular este semestre</span>
          {showMatriculables && (
            <span className={styles.matriculablesCount}>{matriculables.length} disponibles</span>
          )}
        </label>
      </div>

      {showMatriculables && (
        <div className={styles.matriculablesPanel}>
          <div className={styles.matriculablesPanelHeader}>
            <h3 className={styles.matriculablesTitle}>Puedes matricular este semestre</h3>
            <p className={styles.matriculablesSub}>
              Materias faltantes con todos los prerequisitos aprobados
            </p>
          </div>
          {matriculables.length > 0 ? (
            <div className={styles.matriculablesList}>
              {matriculables.map((mat) => (
                <button
                  key={mat.id}
                  type="button"
                  className={styles.matriculableItem}
                  onClick={() => handleSelect(mat)}
                >
                  <span className={styles.matriculableId}>{mat.id}</span>
                  <span className={styles.matriculableNombre}>{mat.nombre}</span>
                  <span className={styles.matriculableCred}>{mat.creditos} cr</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.matriculablesEmpty}>
              No hay materias disponibles por ahora. Aprueba los prerequisitos pendientes.
            </p>
          )}
        </div>
      )}

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
            <button className={styles.detailClose} onClick={() => {
              setSelected(null);
              setHighlightedPrereqs([]);
              setHighlightedUnlocks([]);
            }}>✕</button>
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
                      handleEstadoChange(selected.id, k);
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
            {highlightedUnlocks.length > 0 && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Desbloquea:</p>
                <div className={styles.prereqList}>
                  {highlightedUnlocks.map((uid) => {
                    const um = allMaterias.find((m) => m.id === uid);
                    return um ? (
                      <div key={uid} className={`${styles.prereqItem} ${styles.unlockItem}`} style={{ borderColor: getColor(um.estado) }}>
                        <span className={styles.prereqDot} style={{ background: getColor(um.estado) }} />
                        <span className={styles.prereqName}>{um.nombre}</span>
                        <span className={styles.prereqStatus}>{ESTADOS[um.estado]?.label}</span>
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
