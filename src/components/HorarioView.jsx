import { useState } from "react";
import styles from "./HorarioView.module.css";

// ── Edificios y salones ───────────────────────────────────────────────────
const EDIFICIOS = [
  {
    id: "mar_caribe",
    nombre: "Mar Caribe",
    icon: "🌊",
    lados: ["Norte", "Sur"],
    salones: Array.from({ length: 28 }, (_, i) => {
      const piso = Math.floor(i / 7) + 1;
      const num  = (i % 7) + 1;
      return `${100 * piso + num}`;
    }),
  },
  {
    id: "cienaga_grande",
    nombre: "Ciénaga Grande",
    icon: "🐊",
    lados: ["Norte", "Sur"],
    salones: Array.from({ length: 18 }, (_, i) => {
      const piso = Math.floor(i / 6) + 1;
      const num  = (i % 6) + 1;
      return `${100 * piso + num}`;
    }),
  },
  {
    id: "sierra_nevada",
    nombre: "Sierra Nevada",
    icon: "⛰️",
    lados: ["Norte", "Sur"],
    salones: Array.from({ length: 18 }, (_, i) => {
      const piso = Math.floor(i / 6) + 1;
      const num  = (i % 6) + 1;
      return `${100 * piso + num}`;
    }),
  },
    {
    id: "edf_innovacion",
    nombre: "Edificio de Innovación y Emprendimiento",
    icon: "🔬",
    lados: null,
    salones: ["Lab. de Mecánica I"],
  },
  {
    id: "bloque_3",
    nombre: "Bloque 3",
    icon: "🧱",
    lados: null,  // sin norte/sur
    salones: Array.from({ length: 8 }, (_, i) => `${i + 1}`),
  },
  {
    id: "hangar_a",
    nombre: "Hangar A",
    icon: "🔬",
    lados: null,
    salones: ["Lab. Modelado y Simulación"],
  },
];

const HORAS_FORM = [
  "06:00 a. m.", "07:00 a. m.", "08:00 a. m.", "09:00 a. m.", "10:00 a. m.", "11:00 a. m.",
  "12:00 p. m.", "01:00 p. m.", "02:00 p. m.", "03:00 p. m.", "04:00 p. m.", "05:00 p. m.",
  "06:00 p. m.", "07:00 p. m.", "08:00 p. m.", "09:00 p. m.",
];

const TODOS_DIAS = [
  { id: "L",  label: "Lunes" },
  { id: "M",  label: "Martes" },
  { id: "X",  label: "Miércoles" },
  { id: "J",  label: "Jueves" },
  { id: "V",  label: "Viernes" },
  { id: "S",  label: "Sábado" },
];

const ACCENT_COLORS = [
  "#c8a96e", "#6eb5c8", "#a86ec8", "#6ec8a8", "#c86e6e", "#c8c86e",
  "#6e8bc8", "#c86eab", "#8bc86e", "#c8956e",
];

// Construye el label completo del salón
function buildSalonLabel(edificioId, lado, salon) {
  const ed = EDIFICIOS.find(e => e.id === edificioId);
  if (!ed) return "";
  if (!ed.lados) return `${ed.nombre} — ${salon}`;
  return `${ed.nombre} ${lado} ${salon}`;
}

const LEGACY_HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "1:00", "2:00", "3:00", "4:00", "5:00",
  "6:00", "7:00", "8:00", "9:00",
];

function normalizeHora(hora) {
  if (!hora) return hora;
  if (HORAS_FORM.includes(hora)) return hora;
  const legacyIdx = LEGACY_HORAS.indexOf(hora);
  if (legacyIdx >= 0) return HORAS_FORM[legacyIdx];
  return hora;
}

function toViewHora(hora) {
  const normalized = normalizeHora(hora);
  const idx = HORAS_FORM.indexOf(normalized);
  if (idx >= 0) return LEGACY_HORAS[idx];
  return hora;
}

// ── Modal para añadir/editar clase ───────────────────────────────────────
function ClaseModal({ materiasActuales, diasActivos, onSave, onClose, editando, onDelete, onNotify }) {
  const [form, setForm] = useState(editando ? {
    ...editando,
    horaInicio: normalizeHora(editando.horaInicio),
    horaFin: normalizeHora(editando.horaFin),
    segundoDiaActivo: false,
    dia2: "",
    horaInicio2: "07:00 a. m.",
    horaFin2: "09:00 a. m.",
    edificio2: "",
    lado2: "",
    salon2: "",
  } : {
    materiaId: materiasActuales[0]?.id || "",
    dia:       diasActivos[0] || "L",
    horaInicio: "07:00 a. m.",
    horaFin:    "09:00 a. m.",
    edificio:  "",
    lado:      "",
    salon:     "",
    segundoDiaActivo: false,
    dia2: "",
    horaInicio2: "07:00 a. m.",
    horaFin2: "09:00 a. m.",
    edificio2: "",
    lado2: "",
    salon2: "",
    notas:     "",
  });

  const ed = EDIFICIOS.find(e => e.id === form.edificio);
  const ed2 = EDIFICIOS.find(e => e.id === form.edificio2);

  const salonLabel = form.edificio
    ? buildSalonLabel(form.edificio, form.lado, form.salon)
    : "";
  const salonLabel2 = form.edificio2
    ? buildSalonLabel(form.edificio2, form.lado2, form.salon2)
    : "";

  const handleSave = () => {
    if (!form.materiaId || !form.dia || !form.horaInicio || !form.horaFin) return;
    if (form.segundoDiaActivo && (!form.dia2 || !form.horaInicio2 || !form.horaFin2)) return;
    if (form.segundoDiaActivo && form.dia2 === form.dia) return;

    const startIdx = HORAS_FORM.indexOf(form.horaInicio);
    const endIdx = HORAS_FORM.indexOf(form.horaFin);
    if (startIdx < 0 || endIdx <= startIdx) {
      onNotify?.("Horario inválido: la hora de fin debe ser posterior al inicio");
      return;
    }
    if (form.segundoDiaActivo) {
      const startIdx2 = HORAS_FORM.indexOf(form.horaInicio2);
      const endIdx2 = HORAS_FORM.indexOf(form.horaFin2);
      if (startIdx2 < 0 || endIdx2 <= startIdx2) {
        onNotify?.("Horario 2 inválido: la hora de fin debe ser posterior al inicio");
        return;
      }
    }

    const clases = [{
      materiaId: form.materiaId,
      dia: form.dia,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      edificio: form.edificio,
      lado: form.lado,
      salon: form.salon,
      salonLabel,
      notas: form.notas,
    }];

    if (form.segundoDiaActivo) {
      clases.push({
        materiaId: form.materiaId,
        dia: form.dia2,
        horaInicio: form.horaInicio2,
        horaFin: form.horaFin2,
        edificio: form.edificio2,
        lado: form.lado2,
        salon: form.salon2,
        salonLabel: salonLabel2,
        notas: form.notas,
      });
    }

    onSave({ clases });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editando ? "Editar clase" : "Nueva clase"}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Materia */}
          <div className={styles.formField}>
            <label>Materia</label>
            <select className={styles.select} value={form.materiaId}
              onChange={e => setForm(f => ({ ...f, materiaId: e.target.value }))}>
              <option value="">— Selecciona —</option>
              {materiasActuales.map(m => (
                <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
              ))}
            </select>
          </div>

          {/* Día y horas */}
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Día</label>
              <select className={styles.select} value={form.dia}
                onChange={e => setForm(f => ({ ...f, dia: e.target.value }))}>
                {diasActivos.map(id => {
                  const d = TODOS_DIAS.find(x => x.id === id);
                  return <option key={id} value={id}>{d?.label}</option>;
                })}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Inicio</label>
              <select className={styles.select} value={form.horaInicio}
                onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}>
                {HORAS_FORM.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Fin</label>
              <select className={styles.select} value={form.horaFin}
                onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))}>
                {HORAS_FORM.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {!editando && (
            <div className={styles.formField}>
              <label>Segundo día (opcional)</label>
              <button
                className={styles.btnSecondary}
                type="button"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    segundoDiaActivo: !f.segundoDiaActivo,
                    dia2: !f.segundoDiaActivo
                      ? (diasActivos.find(id => id !== f.dia) || "")
                      : "",
                    edificio2: "",
                    lado2: "",
                    salon2: "",
                  }))
                }
              >
                {form.segundoDiaActivo ? "Quitar segundo día" : "Añadir segundo día"}
              </button>
            </div>
          )}

          {form.segundoDiaActivo && !editando && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Día 2</label>
                  <select className={styles.select} value={form.dia2}
                    onChange={e => setForm(f => ({ ...f, dia2: e.target.value }))}>
                    {diasActivos.filter(id => id !== form.dia).map(id => {
                      const d = TODOS_DIAS.find(x => x.id === id);
                      return <option key={id} value={id}>{d?.label}</option>;
                    })}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Inicio 2</label>
                  <select className={styles.select} value={form.horaInicio2}
                    onChange={e => setForm(f => ({ ...f, horaInicio2: e.target.value }))}>
                    {HORAS_FORM.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Fin 2</label>
                  <select className={styles.select} value={form.horaFin2}
                    onChange={e => setForm(f => ({ ...f, horaFin2: e.target.value }))}>
                    {HORAS_FORM.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formField}>
                <label>Edificio 2</label>
                <div className={styles.edificioGrid}>
                  {EDIFICIOS.map(e => (
                    <button
                      key={e.id}
                      className={`${styles.edificioBtn} ${form.edificio2 === e.id ? styles.edificioBtnActive : ""}`}
                      onClick={() => setForm(f => ({ ...f, edificio2: e.id, lado2: "", salon2: "" }))}
                    >
                      <span>{e.icon}</span>
                      <span>{e.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              {ed2 && ed2.lados && (
                <div className={styles.formField}>
                  <label>Lado 2</label>
                  <div className={styles.ladoRow}>
                    {ed2.lados.map(l => (
                      <button
                        key={l}
                        className={`${styles.ladoBtn} ${form.lado2 === l ? styles.ladoBtnActive : ""}`}
                        onClick={() => setForm(f => ({ ...f, lado2: l, salon2: "" }))}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ed2 && (
                <div className={styles.formField}>
                  <label>Salón 2</label>
                  <div className={styles.salonGrid}>
                    {ed2.salones.map(s => (
                      <button
                        key={s}
                        className={`${styles.salonBtn} ${form.salon2 === s ? styles.salonBtnActive : ""}`}
                        onClick={() => setForm(f => ({ ...f, salon2: s }))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {salonLabel2 && (
                <div className={styles.salonPreview}>
                  📍 {salonLabel2}
                </div>
              )}
            </>
          )}

          {/* Ubicación */}
          <div className={styles.formField}>
            <label>Edificio</label>
            <div className={styles.edificioGrid}>
              {EDIFICIOS.map(e => (
                <button
                  key={e.id}
                  className={`${styles.edificioBtn} ${form.edificio === e.id ? styles.edificioBtnActive : ""}`}
                  onClick={() => setForm(f => ({ ...f, edificio: e.id, lado: "", salon: "" }))}
                >
                  <span>{e.icon}</span>
                  <span>{e.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {ed && ed.lados && (
            <div className={styles.formField}>
              <label>Lado</label>
              <div className={styles.ladoRow}>
                {ed.lados.map(l => (
                  <button
                    key={l}
                    className={`${styles.ladoBtn} ${form.lado === l ? styles.ladoBtnActive : ""}`}
                    onClick={() => setForm(f => ({ ...f, lado: l, salon: "" }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ed && (
            <div className={styles.formField}>
              <label>Salón</label>
              <div className={styles.salonGrid}>
                {ed.salones.map(s => (
                  <button
                    key={s}
                    className={`${styles.salonBtn} ${form.salon === s ? styles.salonBtnActive : ""}`}
                    onClick={() => setForm(f => ({ ...f, salon: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {salonLabel && (
            <div className={styles.salonPreview}>
              📍 {salonLabel}
            </div>
          )}

          {/* Notas */}
          <div className={styles.formField}>
            <label>Notas (opcional)</label>
            <input type="text" className={styles.input} value={form.notas}
              placeholder="ej: Traer portátil, examen parcial..."
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>
        </div>

        <div className={styles.modalFooter}>
          {editando && (
            <button className={styles.deleteBtn} onClick={onDelete}>
              🗑 Eliminar esta clase
            </button>
          )}
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            {editando ? "Guardar cambios" : "Añadir clase"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bloque de clase en la cuadrícula ─────────────────────────────────────
function ClaseBloque({ clase, materia, color, horaStart, duracion, onClick }) {
  const top    = horaStart * 64;
  const height = duracion * 64 - 4;
  const horaInicio = toViewHora(clase.horaInicio);
  const horaFin = toViewHora(clase.horaFin);

  return (
    <div
      className={styles.claseBloque}
      style={{ top, height, "--clase-color": color }}
      onClick={onClick}
      title={`${horaInicio}–${horaFin} | ${clase.salonLabel || ""}`}
    >
      <div className={styles.claseBloqueBar} />
      <div className={styles.claseBloqueContent}>
        <span className={styles.claseId}>{materia?.id || clase.materiaId}</span>
        <span className={styles.claseHora}>{horaInicio}–{horaFin}</span>
        {clase.salonLabel && (
          <span className={styles.claseSalon}>{clase.salonLabel}</span>
        )}
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function HorarioView({ malla, horarioData, onSave, user, onNotify }) {
  const [data, setData]             = useState(horarioData || { dias: ["L","M","X","J","V"], clases: [] });
  const [showModal, setShowModal]   = useState(false);
  const [editando, setEditando]     = useState(null);  // { claseIdx, clase }

  const materiasActuales = malla.flatMap(s => s.materias).filter(m => m.estado === "cursando");

  // Colores por materia
  const colorMap = {};
  materiasActuales.forEach((m, i) => {
    colorMap[m.id] = ACCENT_COLORS[i % ACCENT_COLORS.length];
  });

  const toggleDia = (id) => {
    const dias = data.dias.includes(id)
      ? data.dias.filter(d => d !== id)
      : [...data.dias, id].sort((a, b) =>
          TODOS_DIAS.findIndex(x => x.id === a) - TODOS_DIAS.findIndex(x => x.id === b)
        );
    const updated = { ...data, dias };
    setData(updated);
    onSave(updated);
    onNotify?.("Días del horario actualizados");
  };

  const handleAddClase = (clase) => {
    let clases;
    const nuevasClases = clase?.clases || [];
    if (editando !== null && editando.claseIdx !== undefined) {
      clases = data.clases.map((c, i) => i === editando.claseIdx ? nuevasClases[0] : c);
    } else {
      clases = [...data.clases, ...nuevasClases];
    }
    const updated = { ...data, clases };
    setData(updated);
    onSave(updated);
    setShowModal(false);
    setEditando(null);
    onNotify?.(editando !== null && editando.claseIdx !== undefined ? "Clase actualizada" : "Clase agregada");
  };

  const handleDeleteClase = (idx) => {
    const clases = data.clases.filter((_, i) => i !== idx);
    const updated = { ...data, clases };
    setData(updated);
    onSave(updated);
    setShowModal(false);
    setEditando(null);
    onNotify?.("Clase eliminada");
  };

  // Calcular posición de bloque
  const horaIdx = (h) => HORAS_FORM.indexOf(normalizeHora(h));

  const diasActivos = TODOS_DIAS.filter(d => data.dias.includes(d.id));

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Horario</h2>
          <p className={styles.subtitle}>Semestre actual · {materiasActuales.length} materias</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditando(null); setShowModal(true); }}>
          + Añadir clase
        </button>
      </div>

      {/* Selector de días */}
      <div className={styles.diasRow}>
        <span className={styles.diasLabel}>Días activos:</span>
        {TODOS_DIAS.map(d => (
          <button
            key={d.id}
            className={`${styles.diaBtn} ${data.dias.includes(d.id) ? styles.diaBtnActive : ""}`}
            onClick={() => toggleDia(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Leyenda de materias */}
      {materiasActuales.length > 0 && (
        <div className={styles.legendRow}>
          {materiasActuales.map(m => (
            <div key={m.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: colorMap[m.id] }} />
              <span className={styles.legendId}>{m.id}</span>
              <span className={styles.legendNombre}>{m.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sin materias */}
      {materiasActuales.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📅</span>
          <p>No tienes materias en estado <strong>Cursando</strong>.</p>
          <p>Ve a la <strong>Malla</strong> y cambia el estado de tus materias actuales.</p>
        </div>
      )}

      {/* Cuadrícula */}
      {diasActivos.length > 0 && (
        <div className={styles.gridWrap}>
          <div className={styles.grid} style={{ "--num-dias": diasActivos.length }}>
            {/* Columna de horas */}
            <div className={styles.horaCol}>
              <div className={styles.horaColHeader} />
              {LEGACY_HORAS.map(h => (
                <div key={h} className={styles.horaCell}>{h}</div>
              ))}
            </div>

            {/* Columnas por día */}
            {diasActivos.map(dia => (
              <div key={dia.id} className={styles.diaCol}>
                <div className={styles.diaHeader}>{dia.label}</div>
                <div className={styles.diaBody}>
                  {/* Líneas guía */}
                  {LEGACY_HORAS.map(h => (
                    <div key={h} className={styles.horaLine} />
                  ))}
                  {/* Clases */}
                  {data.clases
                    .filter(c => c.dia === dia.id)
                    .map((clase, i) => {
                      const globalIdx = data.clases.indexOf(clase);
                      const start = horaIdx(clase.horaInicio);
                      const end   = horaIdx(clase.horaFin);
                      if (start < 0 || end <= start) return null;
                      const materia = materiasActuales.find(m => m.id === clase.materiaId);
                      return (
                        <ClaseBloque
                          key={i}
                          clase={clase}
                          materia={materia}
                          color={colorMap[clase.materiaId] || "var(--accent)"}
                          horaStart={start}
                          duracion={end - start}
                          onClick={() => {
                            setEditando({ claseIdx: globalIdx, ...clase, segundoDiaActivo: false });
                            setShowModal(true);
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ClaseModal
          materiasActuales={materiasActuales}
          diasActivos={data.dias}
          editando={editando?.claseIdx !== undefined ? editando : null}
          onSave={handleAddClase}
          onDelete={() => handleDeleteClase(editando.claseIdx)}
          onNotify={onNotify}
          onClose={() => { setShowModal(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
