import { useState } from "react";
import styles from "./CursandoView.module.css";

// ── Constantes ────────────────────────────────────────────────────────────
const NOTA_MIN  = 0;
const NOTA_MAX  = 500;
const NOTA_PASS = 300;

// ── Helpers ───────────────────────────────────────────────────────────────
function calcNotaFinal(cortes) {
  // cortes: [{ nota, peso }]
  let sumProd = 0, sumPeso = 0;
  cortes.forEach(({ nota, peso }) => {
    const n = parseFloat(nota);
    const p = parseFloat(peso);
    if (!isNaN(n) && !isNaN(p) && p > 0) {
      sumProd += n * p;
      sumPeso += p;
    }
  });
  if (sumPeso === 0) return null;
  return (sumProd / sumPeso).toFixed(1);
}

function colorNota(nota) {
  if (nota === null || nota === undefined || nota === "") return "var(--text-muted)";
  return Number(nota) >= NOTA_PASS ? "#6ec88a" : "#e07070";
}

// Ponderado semestral: Σ(nota_definitiva × créditos) / Σ(créditos con nota)
function calcPonderado(materias, cursandoData) {
  let sumPond = 0, sumCred = 0;
  materias.forEach((m) => {
    const d = cursandoData[m.id];
    if (!d) return;
    const notaFinal = calcNotaFinal(d.cortes || [{ nota: "", peso: 100 }]);
    if (notaFinal !== null) {
      sumPond += Number(notaFinal) * m.creditos;
      sumCred += m.creditos;
    }
  });
  return sumCred > 0 ? { valor: (sumPond / sumCred).toFixed(1), creditos: sumCred } : null;
}

// ── Componente corte ──────────────────────────────────────────────────────
function CorteRow({ corte, idx, onChange, onRemove, canRemove }) {
  return (
    <div className={styles.corteRow}>
      <span className={styles.corteLabel}>Corte {idx + 1}</span>
      <div className={styles.corteInputs}>
        <div className={styles.inputGroup}>
          <label>Nota (/{NOTA_MAX})</label>
          <input
            type="number" min={NOTA_MIN} max={NOTA_MAX} step="0.1"
            className={styles.notaInput}
            value={corte.nota}
            placeholder="—"
            onChange={e => onChange({ ...corte, nota: e.target.value })}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Peso %</label>
          <input
            type="number" min={1} max={100}
            className={styles.pesoInput}
            value={corte.peso}
            onChange={e => onChange({ ...corte, peso: e.target.value })}
          />
        </div>
        {corte.nota !== "" && (
          <div className={styles.inputGroup}>
            <label>Equiv.</label>
            <span className={styles.equivBadge} style={{ color: colorNota(corte.nota) }}>
              {Number(corte.nota) >= NOTA_PASS ? "✓" : "✗"} {(Number(corte.nota) / 100).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      {canRemove && (
        <button className={styles.removeBtn} onClick={onRemove} title="Eliminar corte">✕</button>
      )}
    </div>
  );
}

// ── Componente materia card ───────────────────────────────────────────────
function MateriaCard({ materia, data, onChange, colors, borderRadius }) {
  const [expanded, setExpanded] = useState(false);

  const d = data || {
    profesor: "",
    grupo: "",
    salon: "",
    cortes: [{ nota: "", peso: 33 }, { nota: "", peso: 33 }, { nota: "", peso: 34 }],
    repeticiones: [],
  };

  const notaFinal = calcNotaFinal(d.cortes);
  const perdio = notaFinal !== null && Number(notaFinal) < NOTA_PASS;
  const paso   = notaFinal !== null && Number(notaFinal) >= NOTA_PASS;

  const updateCorte = (i, val) => {
    const c = [...d.cortes];
    c[i] = val;
    onChange({ ...d, cortes: c });
  };

  const addCorte = () => {
    if (d.cortes.length >= 5) return;
    onChange({ ...d, cortes: [...d.cortes, { nota: "", peso: 20 }] });
  };

  const removeCorte = (i) => {
    onChange({ ...d, cortes: d.cortes.filter((_, idx) => idx !== i) });
  };

  const addRepeticion = () => {
    onChange({
      ...d,
      repeticiones: [...(d.repeticiones || []), { notaAnterior: notaFinal || "", notaNueva: "", periodo: "" }],
    });
  };

  const updateRep = (i, field, val) => {
    const reps = [...(d.repeticiones || [])];
    reps[i] = { ...reps[i], [field]: val };
    onChange({ ...d, repeticiones: reps });
  };

  const removeRep = (i) => {
    onChange({ ...d, repeticiones: (d.repeticiones || []).filter((_, idx) => idx !== i) });
  };

  const cardColor = paso ? (colors?.aprobada || "#6ec88a")
    : perdio ? "#e07070"
    : (colors?.cursando || "#c8a96e");

  return (
    <div
      className={`${styles.card} ${perdio ? styles.cardFailed : ""}`}
      style={{ "--card-color": cardColor, borderRadius: `${borderRadius ?? 12}px` }}
    >
      {/* Header */}
      <div className={styles.cardHeader} onClick={() => setExpanded(v => !v)}>
        <div className={styles.cardColorBar} style={{ background: cardColor }} />
        <div className={styles.cardMeta}>
          <div className={styles.cardTop}>
            <span className={styles.cardId}>{materia.id}</span>
            <span className={styles.cardCreditos}>{materia.creditos} cr</span>
          </div>
          <p className={styles.cardNombre}>{materia.nombre}</p>
          {(d.profesor || d.grupo) && (
            <p className={styles.cardSub}>
              {d.profesor && <span>👤 {d.profesor}</span>}
              {d.grupo && <span>· Grupo {d.grupo}</span>}
            </p>
          )}
        </div>
        <div className={styles.cardRight}>
          {notaFinal !== null ? (
            <div className={styles.notaDisplay}>
              <span className={styles.notaNum} style={{ color: cardColor }}>{notaFinal}</span>
              <span className={styles.notaMax}>/{NOTA_MAX}</span>
              <span className={styles.notaStatus}>
                {paso ? "Aprueba" : "Pierde"}
              </span>
            </div>
          ) : (
            <span className={styles.notaEmpty}>Sin notas</span>
          )}
          <span className={styles.expandIcon}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className={styles.cardBody}>
          {/* Info básica */}
          <div className={styles.infoRow}>
            <div className={styles.inputGroup}>
              <label>Profesor</label>
              <input
                type="text" className={styles.textInput}
                value={d.profesor} placeholder="Nombre del profesor"
                onChange={e => onChange({ ...d, profesor: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Grupo</label>
              <input
                type="text" className={styles.textInput}
                value={d.grupo} placeholder="01, A, ..."
                onChange={e => onChange({ ...d, grupo: e.target.value })}
              />
            </div>
          </div>

          {/* Cortes */}
          <div className={styles.cortesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Notas por corte</span>
              {d.cortes.length < 5 && (
                <button className={styles.addBtn} onClick={addCorte}>+ Corte</button>
              )}
            </div>
            {d.cortes.map((c, i) => (
              <CorteRow
                key={i} idx={i} corte={c}
                onChange={val => updateCorte(i, val)}
                onRemove={() => removeCorte(i)}
                canRemove={d.cortes.length > 1}
              />
            ))}
            {notaFinal !== null && (
              <div className={styles.notaFinalRow}>
                <span className={styles.notaFinalLabel}>Nota definitiva</span>
                <span className={styles.notaFinalVal} style={{ color: cardColor }}>
                  {notaFinal}
                  <span className={styles.notaFinalSub}>/{NOTA_MAX}</span>
                </span>
                <span className={styles.notaFinalEquiv}>
                  = {(Number(notaFinal) / 100).toFixed(2)} /5.0
                </span>
                <span
                  className={styles.notaFinalBadge}
                  style={{
                    background: paso ? "rgba(110,200,138,0.15)" : "rgba(224,112,112,0.15)",
                    color: cardColor,
                  }}
                >
                  {paso ? "✓ Aprueba" : "✗ Pierde"}
                </span>
              </div>
            )}
          </div>

          {/* Repetición */}
          {perdio && (
            <div className={styles.repSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabelRed}>↺ Materia perdida — Repeticiones</span>
                <button className={styles.addBtn} onClick={addRepeticion}>+ Repetición</button>
              </div>
              {(d.repeticiones || []).length === 0 && (
                <p className={styles.repEmpty}>Si repetiste esta materia, añade los resultados aquí.</p>
              )}
              {(d.repeticiones || []).map((rep, i) => (
                <div key={i} className={styles.repRow}>
                  <div className={styles.inputGroup}>
                    <label>Período</label>
                    <input type="text" className={styles.textInput} value={rep.periodo}
                      placeholder="2024-1" onChange={e => updateRep(i, "periodo", e.target.value)} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Nota perdida</label>
                    <input type="number" min={0} max={NOTA_MAX} className={styles.notaInput}
                      value={rep.notaAnterior} placeholder="—" readOnly
                      style={{ opacity: 0.6 }} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Nota nueva /{NOTA_MAX}</label>
                    <input type="number" min={0} max={NOTA_MAX} step="0.1" className={styles.notaInput}
                      value={rep.notaNueva} placeholder="—"
                      onChange={e => updateRep(i, "notaNueva", e.target.value)} />
                  </div>
                  {rep.notaNueva !== "" && (
                    <div className={styles.inputGroup}>
                      <label>Resultado</label>
                      <span className={styles.repBadge}
                        style={{ color: colorNota(rep.notaNueva) }}>
                        {Number(rep.notaNueva) >= NOTA_PASS ? "✓ Aprobó" : "✗ Perdió"}
                      </span>
                    </div>
                  )}
                  <button className={styles.removeBtn} onClick={() => removeRep(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function CursandoView({ malla, cursandoData, onSave, user }) {
  const [data, setData]   = useState(cursandoData || {});
  const [saved, setSaved] = useState(false);

  // Solo materias en estado "cursando"
  const materiasActuales = malla.flatMap(s => s.materias).filter(m => m.estado === "cursando");

  const handleChange = (id, val) => {
    setData(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    onSave(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ponderado = calcPonderado(materiasActuales, data);

  const colors       = user?.themeColors || {};
  const borderRadius = user?.borderRadius ?? 12;

  const totalCreditosCursando = materiasActuales.reduce((a, m) => a + m.creditos, 0);

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Semestre actual</h2>
          <p className={styles.subtitle}>
            {materiasActuales.length} materia{materiasActuales.length !== 1 ? "s" : ""} cursando
            · {totalCreditosCursando} créditos
          </p>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
          onClick={handleSave}
        >
          {saved ? "✓ Guardado" : "Guardar"}
        </button>
      </div>

      {/* Banner ponderado */}
      {ponderado && (
        <div
          className={styles.ponderadoBanner}
          style={{ borderColor: colorNota(ponderado.valor) }}
        >
          <div>
            <p className={styles.ponderadoLabel}>Ponderado semestral</p>
            <p className={styles.ponderadoFormula}>
              Σ(nota × créditos) ÷ {ponderado.creditos} cr cursados con nota
            </p>
          </div>
          <div className={styles.ponderadoRight}>
            <span className={styles.ponderadoVal} style={{ color: colorNota(ponderado.valor) }}>
              {ponderado.valor}
            </span>
            <span className={styles.ponderadoMax}>/{NOTA_MAX}</span>
            <span className={styles.ponderadoEquiv}>
              = {(Number(ponderado.valor) / 100).toFixed(2)} /5.0
            </span>
          </div>
        </div>
      )}

      {/* Sin materias cursando */}
      {materiasActuales.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>◉</span>
          <p>No tienes materias en estado <strong>Cursando</strong>.</p>
          <p>Ve a la <strong>Malla</strong> y cambia el estado de tus materias actuales.</p>
        </div>
      )}

      {/* Cards */}
      <div className={styles.cardsList}>
        {materiasActuales.map(mat => (
          <MateriaCard
            key={mat.id}
            materia={mat}
            data={data[mat.id]}
            onChange={val => handleChange(mat.id, val)}
            colors={colors}
            borderRadius={borderRadius}
          />
        ))}
      </div>

      {/* Resumen tabla */}
      {materiasActuales.length > 0 && (
        <div className={styles.resumenTable}>
          <h3 className={styles.resumenTitle}>Resumen ponderado</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Cr</th>
                  <th>Nota /{NOTA_MAX}</th>
                  <th>Pond (nota×cr)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {materiasActuales.map(m => {
                  const notaFinal = calcNotaFinal(data[m.id]?.cortes || []);
                  const pond = notaFinal !== null ? (Number(notaFinal) * m.creditos).toFixed(1) : null;
                  const paso = notaFinal !== null && Number(notaFinal) >= NOTA_PASS;
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className={styles.tableId}>{m.id}</span>
                        <span className={styles.tableNombre}>{m.nombre}</span>
                      </td>
                      <td className={styles.tableCenter}>{m.creditos}</td>
                      <td className={styles.tableCenter} style={{ color: notaFinal ? colorNota(notaFinal) : "var(--text-muted)" }}>
                        {notaFinal ?? "—"}
                      </td>
                      <td className={styles.tableCenter} style={{ color: "var(--accent)" }}>
                        {pond ?? "—"}
                      </td>
                      <td className={styles.tableCenter}>
                        {notaFinal !== null
                          ? <span className={styles.tableBadge} style={{ color: paso ? "#6ec88a" : "#e07070", background: paso ? "rgba(110,200,138,0.1)" : "rgba(224,112,112,0.1)" }}>
                              {paso ? "Aprueba" : "Pierde"}
                            </span>
                          : <span className={styles.tableNone}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {ponderado && (
                <tfoot>
                  <tr className={styles.tableTotal}>
                    <td>Total</td>
                    <td className={styles.tableCenter}>{ponderado.creditos}</td>
                    <td className={styles.tableCenter} style={{ color: colorNota(ponderado.valor) }}>
                      {ponderado.valor}
                    </td>
                    <td className={styles.tableCenter} style={{ color: "var(--accent)", fontWeight: 700 }}>
                      {(Number(ponderado.valor) * ponderado.creditos).toFixed(1)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
