import { useState } from "react";
import styles from "./NotasView.module.css";

const PASS_GRADE = 300;

// ── helpers ──────────────────────────────────────────────────────────────────
function calcPonderado(materias, notasMap) {
  let sumPond = 0, sumCred = 0;
  materias.forEach((m) => {
    const n = notasMap[m.id];
    const nota = n?.nota !== undefined ? Number(n.nota) : null;
    if (nota !== null && !isNaN(nota)) {
      sumPond += nota * m.creditos;
      sumCred += m.creditos;
    }
  });
  if (sumCred === 0) return null;
  return { valor: sumPond / sumCred, creditos: sumCred, sumPond };
}

function calcGlobal(allMaterias, notasMap) {
  // Use best (approved) attempt per materia
  let sumPond = 0, sumCred = 0;
  allMaterias.forEach((m) => {
    const n = notasMap[m.id];
    if (!n) return;
    // Pick best passing attempt, or last attempt if none passed
    const intentos = n.intentos || [];
    const passing  = intentos.filter((i) => Number(i.nota) >= PASS_GRADE);
    const best     = passing.length ? passing[passing.length - 1] : intentos[intentos.length - 1];
    const main     = n.nota !== undefined ? n : null;
    let nota = null;
    if (best) nota = Number(best.nota);
    else if (main?.nota !== undefined) nota = Number(main.nota);
    if (nota !== null && !isNaN(nota)) {
      sumPond += nota * m.creditos;
      sumCred += m.creditos;
    }
  });
  if (sumCred === 0) return null;
  return { valor: sumPond / sumCred, creditos: sumCred };
}

// ── sub-components ────────────────────────────────────────────────────────────

function GradeInput({ value, onChange, placeholder = "0 – 500" }) {
  return (
    <input
      className={styles.gradeInput}
      type="number" min="0" max="500"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      placeholder={placeholder}
    />
  );
}

function MateriaRow({ mat, notaData, onChange, colorAprobada, colorCursando, colorFaltante }) {
  const estado = mat.estado;
  const nota   = notaData?.nota;
  const passed = nota !== undefined && Number(nota) >= PASS_GRADE;
  const failed  = nota !== undefined && Number(nota) < PASS_GRADE;
  const intentos = notaData?.intentos || [];

  const color = estado === "aprobada" ? colorAprobada : estado === "cursando" ? colorCursando : colorFaltante;

  const updateField = (field, val) => onChange({ ...notaData, [field]: val });
  const updateIntento = (idx, field, val) => {
    const newIntentos = intentos.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    onChange({ ...notaData, intentos: newIntentos });
  };
  const addIntento = () => onChange({ ...notaData, intentos: [...intentos, { nota: undefined, semestre: "" }] });
  const removeIntento = (idx) => onChange({ ...notaData, intentos: intentos.filter((_, i) => i !== idx) });

  return (
    <div className={`${styles.materiaRow} ${failed && estado !== "cursando" ? styles.materiaFailed : ""}`}>
      {/* Color bar */}
      <div className={styles.materiaBar} style={{ background: color }} />

      <div className={styles.materiaBody}>
        {/* Top row: name + credits */}
        <div className={styles.materiaTop}>
          <div>
            <span className={styles.materiaId}>{mat.id}</span>
            <span className={styles.materiaNombre}>{mat.nombre}</span>
          </div>
          <span className={styles.materiaCreditos}>{mat.creditos} cr</span>
        </div>

        {/* Cursando: profesor, grupo, nota parcial */}
        {estado === "cursando" && (
          <div className={styles.cursandoFields}>
            <div className={styles.fieldGroup}>
              <label>Profesor</label>
              <input
                className={styles.textInput}
                value={notaData?.profesor || ""}
                onChange={(e) => updateField("profesor", e.target.value)}
                placeholder="Nombre del profesor"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Grupo</label>
              <input
                className={styles.textInput}
                value={notaData?.grupo || ""}
                onChange={(e) => updateField("grupo", e.target.value)}
                placeholder="Ej: G01"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Nota actual</label>
              <GradeInput value={notaData?.nota} onChange={(v) => updateField("nota", v)} placeholder="Nota parcial" />
            </div>
          </div>
        )}

        {/* Aprobada: nota definitiva */}
        {estado === "aprobada" && (
          <div className={styles.aprobadaFields}>
            <div className={styles.fieldGroup}>
              <label>Nota definitiva</label>
              <div className={styles.gradeWrap}>
                <GradeInput value={notaData?.nota} onChange={(v) => updateField("nota", v)} />
                {nota !== undefined && (
                  <span className={`${styles.gradeBadge} ${passed ? styles.gradeBadgePass : styles.gradeBadgeFail}`}>
                    {passed ? "✓ Aprobó" : "✗ Perdió"}
                  </span>
                )}
              </div>
            </div>

            {/* Repeticiones */}
            {failed && (
              <div className={styles.repeticionSection}>
                <div className={styles.repeticionHeader}>
                  <span className={styles.repeticionLabel}>Materia perdida — Intentos adicionales</span>
                  <button className={styles.addBtn} onClick={addIntento}>+ Agregar intento</button>
                </div>
                {intentos.map((it, idx) => (
                  <div key={idx} className={styles.intentoRow}>
                    <div className={styles.fieldGroup}>
                      <label>Semestre cursado</label>
                      <input
                        className={styles.textInput}
                        value={it.semestre || ""}
                        onChange={(e) => updateIntento(idx, "semestre", e.target.value)}
                        placeholder="Ej: 2024-2"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Nota</label>
                      <div className={styles.gradeWrap}>
                        <GradeInput
                          value={it.nota}
                          onChange={(v) => updateIntento(idx, "nota", v)}
                        />
                        {it.nota !== undefined && (
                          <span className={`${styles.gradeBadge} ${Number(it.nota) >= PASS_GRADE ? styles.gradeBadgePass : styles.gradeBadgeFail}`}>
                            {Number(it.nota) >= PASS_GRADE ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeIntento(idx)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotasView({ malla, notas, onSave, user }) {
  const [localNotas, setLocalNotas] = useState(notas || {});
  const [savedMsg, setSavedMsg]     = useState(false);
  const [view, setView]             = useState("semestres"); // "semestres" | "resumen"

  const colors = user.themeColors || {};
  const colorA = colors.aprobada || "#6ec88a";
  const colorC = colors.cursando || "#c8a96e";
  const colorF = colors.faltante || "#3a3a52";

  const updateNota = (id, data) => {
    setLocalNotas((prev) => ({ ...prev, [id]: data }));
  };

  const handleSave = () => {
    onSave(localNotas);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  // Only show semesters with at least cursando or aprobada materias
  const activeSemesters = malla.filter((sem) =>
    sem.materias.some((m) => m.estado === "cursando" || m.estado === "aprobada")
  );

  const allMaterias = malla.flatMap((s) => s.materias);
  const globalPond  = calcGlobal(allMaterias, localNotas);

  // Créditos aprobados: materia aprobada con nota >= 300, o con al menos un intento aprobado
  const totalCreditos = allMaterias.reduce((a, m) => a + m.creditos, 0);
  const creditosAprobados = allMaterias.reduce((acc, m) => {
    const n = localNotas[m.id];
    if (!n) return acc;
    const notaMain = n.nota !== undefined ? Number(n.nota) : null;
    const intentos = n.intentos || [];
    const tieneIntentoAprobado = intentos.some((i) => Number(i.nota) >= PASS_GRADE);
    if ((notaMain !== null && notaMain >= PASS_GRADE) || tieneIntentoAprobado)
      return acc + m.creditos;
    return acc;
  }, 0);
  const pctAprobados = totalCreditos > 0 ? Math.round((creditosAprobados / totalCreditos) * 100) : 0;

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Notas y Promedios</h2>
          <p className={styles.subtitle}>{user.career} · {user.university}</p>
        </div>
        <div className={styles.headerActions}>
          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button className={`${styles.toggleBtn} ${view === "semestres" ? styles.toggleActive : ""}`} onClick={() => setView("semestres")}>
              Por semestre
            </button>
            <button className={`${styles.toggleBtn} ${view === "resumen" ? styles.toggleActive : ""}`} onClick={() => setView("resumen")}>
              Resumen global
            </button>
          </div>
          <button className={`${styles.saveBtn} ${savedMsg ? styles.saveBtnDone : ""}`} onClick={handleSave}>
            {savedMsg ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Global average banner */}
      <div className={styles.globalBanner} style={{ borderColor: colorA }}>
        <div>
          <p className={styles.globalLabel}>Promedio ponderado global acumulado</p>
          <p className={styles.globalSub}>
            {globalPond ? `${globalPond.creditos} créditos con nota registrada` : "Sin notas registradas aún"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Créditos aprobados</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: colorA, lineHeight: 1 }}>
              {creditosAprobados}
              <span style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "4px" }}>/ {totalCreditos}</span>
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{pctAprobados}% del total</p>
          </div>
          {globalPond && (
            <span className={styles.globalVal} style={{ color: colorA }}>
              {globalPond.valor.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* ── Semestres view ─────────────────────────── */}
      {view === "semestres" && activeSemesters.map((sem) => {
        const activas = sem.materias.filter((m) => m.estado === "cursando" || m.estado === "aprobada");
        const pond = calcPonderado(activas, localNotas);

        return (
          <div key={sem.semestre} className={styles.semCard}>
            <div className={styles.semHeader}>
              <div className={styles.semTitle}>
                <span className={styles.semNum}>Semestre {sem.semestre}</span>
                <span className={styles.semCreditos}>{activas.reduce((a, m) => a + m.creditos, 0)} créditos</span>
              </div>
              {pond && (
                <div className={styles.semPond}>
                  <span className={styles.semPondLabel}>Ponderado semestral</span>
                  <span className={styles.semPondVal} style={{ color: colorA }}>{pond.valor.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className={styles.materiasList}>
              {activas.map((mat) => (
                <MateriaRow
                  key={mat.id}
                  mat={mat}
                  notaData={localNotas[mat.id]}
                  onChange={(data) => updateNota(mat.id, data)}
                  colorAprobada={colorA}
                  colorCursando={colorC}
                  colorFaltante={colorF}
                />
              ))}
            </div>

            {pond && (
              <div className={styles.semFooter}>
                <span>Suma ponderaciones: <strong>{pond.sumPond.toFixed(1)}</strong></span>
                <span>÷</span>
                <span>Créditos: <strong>{pond.creditos}</strong></span>
                <span>=</span>
                <span className={styles.semFooterResult} style={{ color: colorA }}>
                  <strong>{pond.valor.toFixed(1)}</strong>
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Resumen global view ────────────────────── */}
      {view === "resumen" && (
        <div className={styles.resumenWrap}>
          {activeSemesters.map((sem) => {
            const activas = sem.materias.filter((m) => m.estado === "cursando" || m.estado === "aprobada");
            const pond    = calcPonderado(activas, localNotas);
            return (
              <div key={sem.semestre} className={styles.resumenRow}>
                <div className={styles.resumenLeft}>
                  <span className={styles.resumenSem}>Semestre {sem.semestre}</span>
                  <div className={styles.resumenMaterias}>
                    {activas.map((m) => {
                      const n    = localNotas[m.id];
                      const nota = n?.nota;
                      const passed = nota !== undefined && Number(nota) >= PASS_GRADE;
                      const failed = nota !== undefined && Number(nota) < PASS_GRADE;
                      const intentos = n?.intentos || [];
                      const lastApproved = intentos.filter((i) => Number(i.nota) >= PASS_GRADE).slice(-1)[0];
                      return (
                        <div key={m.id} className={styles.resumenMateria}>
                          <span className={styles.resumenDot}
                            style={{ background: m.estado === "cursando" ? colorC : colorA }} />
                          <span className={styles.resumenNombre}>{m.nombre}</span>
                          <span className={styles.resumenCred}>{m.creditos}cr</span>
                          {nota !== undefined ? (
                            <span className={`${styles.resumenNota} ${passed ? styles.resumenPass : styles.resumenFail}`}>
                              {nota}
                              {failed && lastApproved && (
                                <span className={styles.resumenRetake}> → {lastApproved.nota} ✓</span>
                              )}
                            </span>
                          ) : (
                            <span className={styles.resumenSinNota}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.resumenRight}>
                  {pond ? (
                    <>
                      <span className={styles.resumenPondLabel}>Ponderado</span>
                      <span className={styles.resumenPondVal} style={{ color: colorA }}>{pond.valor.toFixed(1)}</span>
                      <span className={styles.resumenPondCred}>{pond.creditos} cr</span>
                    </>
                  ) : (
                    <span className={styles.resumenSinNota}>Sin notas</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Global total */}
          {globalPond && (
            <div className={styles.resumenTotal} style={{ borderColor: colorA }}>
              <span>Promedio ponderado acumulado total</span>
              <span className={styles.resumenTotalVal} style={{ color: colorA }}>
                {globalPond.valor.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      )}

      {activeSemesters.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tienes materias aprobadas o en curso todavía.</p>
          <p>Ve a <strong>Mi Perfil</strong> y configura tu semestre actual.</p>
        </div>
      )}
    </div>
  );
}
