import { useState } from "react";
import styles from "./NotasView.module.css";
import {
  MAX_GRADE,
  PASS_GRADE,
  isEnglishLetterGrade,
  isGradePassed,
  isGradeFailed,
  isValidNumericGrade,
  sanitizeNumericGrade,
} from "../utils/gradeHelpers.js";
import { projectDesiredAverage } from "../utils/careerProgress.js";

// ── helpers ──────────────────────────────────────────────────────────────────
function calcPonderado(materias, notasMap, semestreById) {
  let sumPond = 0, sumCred = 0;
  materias.forEach((m) => {
    const n = notasMap[m.id];
    const sem = semestreById.get(m.id);
    if (isEnglishLetterGrade(m, sem)) return;
    const nota = n?.nota !== undefined ? Number(n.nota) : null;
    if (nota !== null && !isNaN(nota)) {
      sumPond += nota * m.creditos;
      sumCred += m.creditos;
    }
  });
  if (sumCred === 0) return null;
  return { valor: sumPond / sumCred, creditos: sumCred, sumPond };
}

function calcGlobal(allMaterias, notasMap, semestreById) {
  let sumPond = 0, sumCred = 0;
  allMaterias.forEach((m) => {
    const n = notasMap[m.id];
    if (!n) return;
    const sem = semestreById.get(m.id);
    if (isEnglishLetterGrade(m, sem)) return;

    if (isValidNumericGrade(n.nota)) {
      sumPond += Number(n.nota) * m.creditos;
      sumCred += m.creditos;
    }

    (n.intentos || []).forEach((it) => {
      if (isValidNumericGrade(it.nota)) {
        sumPond += Number(it.nota) * m.creditos;
        sumCred += m.creditos;
      }
    });
  });
  if (sumCred === 0) return null;
  return { valor: sumPond / sumCred, creditos: sumCred };
}

function buildSemestreMap(malla) {
  const map = new Map();
  malla.forEach((sem) => {
    if (typeof sem.semestre !== "number") return;
    sem.materias.forEach((m) => map.set(m.id, sem.semestre));
  });
  return map;
}

// ── sub-components ────────────────────────────────────────────────────────────

function GradeInput({ value, onChange, placeholder = "0 – 500" }) {
  return (
    <input
      className={styles.gradeInput}
      type="number" min="0" max={MAX_GRADE}
      value={value ?? ""}
      onChange={(e) => onChange(sanitizeNumericGrade(e.target.value))}
      placeholder={placeholder}
    />
  );
}

function LetterGradeSelect({ value, onChange }) {
  return (
    <select
      className={styles.letterSelect}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">—</option>
      <option value="A">A — Aprobado</option>
      <option value="I">I — Insuficiente</option>
    </select>
  );
}

function GradeBadge({ mat, semestre, nota }) {
  if (nota === undefined || nota === null || nota === "") return null;
  const passed = isGradePassed(mat, semestre, nota);
  const failed = isGradeFailed(mat, semestre, nota);
  if (!passed && !failed) return null;

  const label = isEnglishLetterGrade(mat, semestre)
    ? (passed ? "✓ Aprobado" : "✗ Insuficiente")
    : (passed ? "✓ Aprobó" : "✗ Asignatura perdida");

  return (
    <span className={`${styles.gradeBadge} ${passed ? styles.gradeBadgePass : styles.gradeBadgeFail}`}>
      {label}
    </span>
  );
}

function MateriaRow({ mat, semestre, notaData, onChange, colorAprobada, colorCursando, colorFaltante }) {
  const estado = mat.estado;
  const nota   = notaData?.nota;
  const letterGrade = isEnglishLetterGrade(mat, semestre);
  const passed = isGradePassed(mat, semestre, nota);
  const failed = isGradeFailed(mat, semestre, nota);
  const intentos = notaData?.intentos || [];

  const color = estado === "aprobada" ? colorAprobada : estado === "cursando" ? colorCursando : colorFaltante;

  const updateField = (field, val) => onChange({ ...notaData, [field]: val });
  const updateIntento = (idx, field, val) => {
    const newIntentos = intentos.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    onChange({ ...notaData, intentos: newIntentos });
  };
  const addIntento = () => onChange({ ...notaData, intentos: [...intentos, { nota: undefined, semestre: "" }] });
  const removeIntento = (idx) => onChange({ ...notaData, intentos: intentos.filter((_, i) => i !== idx) });

  const showGradeFields = estado === "cursando" || estado === "aprobada";

  return (
    <div className={`${styles.materiaRow} ${failed ? styles.materiaFailed : ""}`}>
      <div className={styles.materiaBar} style={{ background: color }} />

      <div className={styles.materiaBody}>
        <div className={styles.materiaTop}>
          <div>
            <span className={styles.materiaId}>{mat.id}</span>
            <span className={styles.materiaNombre}>{mat.nombre}</span>
            {estado === "cursando" && (
              <span className={styles.cursandoTag}>Cursando actualmente</span>
            )}
          </div>
          <span className={styles.materiaCreditos}>{mat.creditos} cr</span>
        </div>

        {showGradeFields && (
          <div className={styles.aprobadaFields}>
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
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label>Nota definitiva</label>
              <div className={styles.gradeWrap}>
                {letterGrade ? (
                  <LetterGradeSelect value={notaData?.nota} onChange={(v) => updateField("nota", v)} />
                ) : (
                  <GradeInput value={notaData?.nota} onChange={(v) => updateField("nota", v)} />
                )}
                <GradeBadge mat={mat} semestre={semestre} nota={nota} />
              </div>
            </div>

            {failed && (
              <div className={styles.repeticionSection}>
                <div className={styles.repeticionHeader}>
                  <span className={styles.repeticionLabel}>Intentos adicionales</span>
                  <button type="button" className={styles.addBtn} onClick={addIntento}>+ Agregar intento</button>
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
                        {letterGrade ? (
                          <LetterGradeSelect
                            value={it.nota}
                            onChange={(v) => updateIntento(idx, "nota", v)}
                          />
                        ) : (
                          <GradeInput
                            value={it.nota}
                            onChange={(v) => updateIntento(idx, "nota", v)}
                          />
                        )}
                        <GradeBadge mat={mat} semestre={semestre} nota={it.nota} />
                      </div>
                    </div>
                    <button type="button" className={styles.removeBtn} onClick={() => removeIntento(idx)}>✕</button>
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
  const [view, setView]             = useState("semestres");
  const [showDesiredMode, setShowDesiredMode] = useState(false);
  const [desiredAvg, setDesiredAvg]           = useState("");

  const colors = user.themeColors || {};
  const colorA = colors.aprobada || "#6ec88a";
  const colorC = colors.cursando || "#c8a96e";
  const colorF = colors.faltante || "#3a3a52";

  const semestreById = buildSemestreMap(malla);

  const updateNota = (id, data) => {
    setLocalNotas((prev) => ({ ...prev, [id]: data }));
  };

  const handleSave = () => {
    onSave(localNotas);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const activeSemesters = malla.filter((sem) =>
    typeof sem.semestre === "number"
    && sem.materias.some((m) => m.estado === "cursando" || m.estado === "aprobada")
  );

  const allMaterias = malla.flatMap((s) => s.materias);
  const globalPond  = calcGlobal(allMaterias, localNotas, semestreById);

  const totalCreditos = allMaterias.reduce((a, m) => a + m.creditos, 0);
  const creditosAprobados = allMaterias.reduce((acc, m) => {
    const n = localNotas[m.id];
    if (!n) return acc;
    const sem = semestreById.get(m.id);
    const notaMain = n.nota;
    const intentos = n.intentos || [];
    const aprobadoMain = isGradePassed(m, sem, notaMain);
    const tieneIntentoAprobado = intentos.some((i) => isGradePassed(m, sem, i.nota));
    if (aprobadoMain || tieneIntentoAprobado) return acc + m.creditos;
    return acc;
  }, 0);
  const pctAprobados = totalCreditos > 0 ? Math.round((creditosAprobados / totalCreditos) * 100) : 0;

  const formatNotaResumen = (m, nota) => {
    if (nota === undefined || nota === null || nota === "") return "—";
    const sem = semestreById.get(m.id);
    if (isEnglishLetterGrade(m, sem)) return nota;
    return nota;
  };

  const projection = showDesiredMode && desiredAvg !== ""
    ? projectDesiredAverage(malla, localNotas, desiredAvg)
    : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Notas y Promedios</h2>
          <p className={styles.subtitle}>{user.career} · {user.university}</p>
        </div>
        <div className={styles.headerActions}>
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

      <div className={styles.desiredBar}>
        <label className={styles.desiredToggle}>
          <input
            type="checkbox"
            checked={showDesiredMode}
            onChange={(e) => setShowDesiredMode(e.target.checked)}
          />
          <span>Modo promedio deseado</span>
        </label>
        {showDesiredMode && (
          <div className={styles.desiredInputWrap}>
            <label className={styles.desiredInputLabel}>Promedio meta</label>
            <input
              className={styles.desiredInput}
              type="number"
              min="0"
              max={MAX_GRADE}
              step="0.1"
              value={desiredAvg}
              onChange={(e) => setDesiredAvg(e.target.value)}
              placeholder="Ej: 380"
            />
          </div>
        )}
      </div>

      {showDesiredMode && projection && (
        <div className={`${styles.projectionPanel} ${!projection.feasible ? styles.projectionWarn : ""}`}>
          <div className={styles.projectionHeader}>
            <h3 className={styles.projectionTitle}>Proyección hacia tu meta</h3>
            {projection.currentAvg !== null && (
              <span className={styles.projectionCurrent}>
                Promedio actual: <strong>{projection.currentAvg.toFixed(1)}</strong>
              </span>
            )}
          </div>
          {projection.message && (
            <p className={styles.projectionMessage}>{projection.message}</p>
          )}
          {projection.feasible && projection.requiredUniform !== null && (
            <>
              <p className={styles.projectionSummary}>
                Necesitas un promedio de <strong>{projection.requiredUniform.toFixed(1)}</strong> en las
                {" "}<strong>{projection.pendingCred}</strong> créditos pendientes sin nota numérica
                {projection.requiredUniform >= PASS_GRADE ? " (aprobatorio)" : " (por debajo del mínimo 300)"}.
              </p>
              {[...projection.pendingBySem.entries()]
                .sort(([a], [b]) => a - b)
                .map(([semNum, mats]) => (
                  <div key={semNum} className={styles.projectionSem}>
                    <p className={styles.projectionSemTitle}>Semestre {semNum}</p>
                    <div className={styles.projectionList}>
                      {mats.map((m) => (
                        <div key={m.id} className={styles.projectionRow}>
                          <span className={styles.projectionNombre}>{m.nombre}</span>
                          <span className={styles.projectionCred}>{m.creditos} cr</span>
                          <span className={styles.projectionNota}>
                            {projection.requiredUniform.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {view === "semestres" && activeSemesters.map((sem) => {
        const activas = sem.materias.filter((m) => m.estado === "cursando" || m.estado === "aprobada");
        const pond = calcPonderado(activas, localNotas, semestreById);

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
                  semestre={sem.semestre}
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

      {view === "resumen" && (
        <div className={styles.resumenWrap}>
          {activeSemesters.map((sem) => {
            const activas = sem.materias.filter((m) => m.estado === "cursando" || m.estado === "aprobada");
            const pond    = calcPonderado(activas, localNotas, semestreById);
            return (
              <div key={sem.semestre} className={styles.resumenRow}>
                <div className={styles.resumenLeft}>
                  <span className={styles.resumenSem}>Semestre {sem.semestre}</span>
                  <div className={styles.resumenMaterias}>
                    {activas.map((m) => {
                      const n    = localNotas[m.id];
                      const nota = n?.nota;
                      const passed = isGradePassed(m, sem.semestre, nota);
                      const failed = isGradeFailed(m, sem.semestre, nota);
                      const intentos = n?.intentos || [];
                      const lastApproved = intentos.filter((i) => isGradePassed(m, sem.semestre, i.nota)).slice(-1)[0];
                      return (
                        <div key={m.id} className={styles.resumenMateria}>
                          <span className={styles.resumenDot}
                            style={{ background: m.estado === "cursando" ? colorC : colorA }} />
                          <span className={styles.resumenNombre}>{m.nombre}</span>
                          <span className={styles.resumenCred}>{m.creditos}cr</span>
                          {nota !== undefined && nota !== "" ? (
                            <span className={`${styles.resumenNota} ${passed ? styles.resumenPass : styles.resumenFail}`}>
                              {formatNotaResumen(m, nota)}
                              {failed && lastApproved && (
                                <span className={styles.resumenRetake}> → {formatNotaResumen(m, lastApproved.nota)} ✓</span>
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
