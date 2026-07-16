import { useState, useMemo } from "react";
import styles from "./AsignacionesView.module.css";

const NOTA_MAX = 500;
const NOTA_PASS = 300;

const TIPO_INFO = {
  examen:   { label: "Examen",   icon: "📝", color: "#E87098" },
  quiz:     { label: "Quiz",     icon: "❓", color: "#B882E8" },
  tarea:    { label: "Tarea",    icon: "📌", color: "#6BA3E8" },
  proyecto: { label: "Proyecto", icon: "📁", color: "#E8946B" },
};

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function calcCorteNota(items) {
  if (!items || items.length === 0) return null;
  let sumProd = 0, sumPeso = 0;
  items.forEach(({ nota, peso }) => {
    const n = parseFloat(nota), p = parseFloat(peso);
    if (!isNaN(n) && !isNaN(p) && p > 0) { sumProd += n * p; sumPeso += p; }
  });
  return sumPeso > 0 ? Number((sumProd / sumPeso).toFixed(1)) : null;
}

function calcNotaFinal(cortes) {
  let sumProd = 0, sumPeso = 0;
  cortes.forEach((c) => {
    const nc = calcCorteNota(c.items);
    const p = parseFloat(c.peso);
    if (nc !== null && !isNaN(p) && p > 0) { sumProd += nc * p; sumPeso += p; }
  });
  return sumPeso > 0 ? (sumProd / sumPeso).toFixed(1) : null;
}

function migrateCortes(cortes) {
  if (!cortes || cortes.length === 0) {
    return [{ nombre: "Corte 1", peso: 33, items: [] }, { nombre: "Corte 2", peso: 33, items: [] }, { nombre: "Corte 3", peso: 34, items: [] }];
  }
  return cortes.map((c, i) => {
    if (c.items) return c;
    return { nombre: c.nombre || `Corte ${i + 1}`, peso: c.peso || 33, items: c.nota !== "" && c.nota !== undefined ? [{ nombre: "Evaluación", nota: c.nota, peso: 100 }] : [] };
  });
}

function AsignacionCard({ item, allMaterias, onUpdate, onDelete, onSyncCalendar, cortesData }) {
  const [expanded, setExpanded] = useState(false);
  const info = TIPO_INFO[item.tipo] || TIPO_INFO.tarea;
  const mat = allMaterias.find(m => m.id === item.materiaId);
  const isExamenQuiz = item.tipo === "examen" || item.tipo === "quiz";

  const toggleTema = (i) => {
    const temas = [...item.temas];
    temas[i] = { ...temas[i], estudiado: !temas[i].estudiado };
    onUpdate({ ...item, temas });
  };
  const addTema = () => {
    onUpdate({ ...item, temas: [...(item.temas || []), { id: uuid(), nombre: "", estudiado: false }] });
  };
  const updateTema = (i, val) => {
    const temas = [...item.temas];
    temas[i] = { ...temas[i], nombre: val };
    onUpdate({ ...item, temas });
  };
  const removeTema = (i) => {
    onUpdate({ ...item, temas: item.temas.filter((_, idx) => idx !== i) });
  };

  const handleGrade = (nota) => {
    const updated = { ...item, nota: nota === "" ? undefined : Number(nota) };
    onUpdate(updated);
    if (isExamenQuiz && nota !== "" && item.corteIdx !== undefined && item.materiaId) {
      const corteIdx = item.corteIdx;
      const cursando = cortesData[item.materiaId];
      if (cursando) {
        const cortes = migrateCortes(cursando.cortes);
        if (cortes[corteIdx]) {
          const existingItemIdx = cortes[corteIdx].items.findIndex(
            it => it.nombre === `${info.label}: ${item.titulo || item.materiaId}`
          );
          const newItem = { nombre: `${info.label}: ${item.titulo || item.materiaId}`, nota: Number(nota), peso: Number(item.valoracion) || 30 };
          if (existingItemIdx >= 0) {
            cortes[corteIdx].items[existingItemIdx] = newItem;
          } else {
            cortes[corteIdx].items.push(newItem);
          }
          onSyncCalendar(item.materiaId, { ...cursando, cortes });
        }
      }
    }
  };

  const temasSorted = [...(item.temas || [])].sort((a, b) => a.estudiado - b.estudiado);
  const temasDone = (item.temas || []).filter(t => t.estudiado).length;
  const temasTotal = (item.temas || []).length;

  return (
    <div className={`${styles.card} ${item.nota ? styles.cardGraded : ""}`} style={{ "--card-color": info.color }}>
      <div className={styles.cardHeader} onClick={() => setExpanded(v => !v)}>
        <div className={styles.cardAccent} style={{ background: info.color }} />
        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <span className={styles.cardTipo} style={{ color: info.color }}>{info.icon} {info.label}</span>
            {item.fechaExamen && <span className={styles.cardFecha}>📅 {item.fechaExamen}</span>}
            {item.fechaEntrega && <span className={styles.cardFecha}>📅 Entrega: {item.fechaEntrega}</span>}
          </div>
          <p className={styles.cardTitle}>{item.titulo || info.label}</p>
          {mat && <p className={styles.cardMateria}>{mat.id} — {mat.nombre}</p>}
          <div className={styles.cardMeta}>
            {isExamenQuiz && item.valoracion && <span className={styles.cardMetaItem}>⚖️ {item.valoracion}%</span>}
            {isExamenQuiz && item.esBinas && <span className={styles.cardMetaItem}>👥 Binas</span>}
            {item.lugar && <span className={styles.cardMetaItem}>📍 {item.lugar}</span>}
            {item.temas?.length > 0 && (
              <span className={styles.cardMetaItem}>📋 {temasDone}/{temasTotal} temas</span>
            )}
          </div>
        </div>
        <div className={styles.cardRight}>
          {item.nota !== undefined && item.nota !== null ? (
            <span className={styles.cardNota} style={{ color: item.nota >= NOTA_PASS ? "#6ec88a" : "#e07070" }}>
              {item.nota}
              <span className={styles.cardNotaMax}>/{NOTA_MAX}</span>
            </span>
          ) : (
            <span className={styles.cardPendiente}>Pendiente</span>
          )}
          <span className={styles.expandIcon}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.cardExpanded}>
          {item.descripcion && (
            <p className={styles.cardDesc}>{item.descripcion}</p>
          )}

          {isExamenQuiz && (
            <div className={styles.gradeRow}>
              <div className={styles.formField}>
                <label>Nota obtenida /{NOTA_MAX}</label>
                <input type="number" min={0} max={NOTA_MAX} step="0.1"
                  className={styles.gradeInput} value={item.nota ?? ""}
                  placeholder="—" onChange={e => handleGrade(e.target.value)} />
              </div>
              {item.nota !== undefined && item.nota !== null && (
                <span className={styles.gradeBadge}
                  style={{ color: item.nota >= NOTA_PASS ? "#6ec88a" : "#e07070",
                    background: item.nota >= NOTA_PASS ? "rgba(110,200,138,0.15)" : "rgba(224,112,112,0.15)" }}>
                  = {(item.nota / 100).toFixed(2)} /5.0
                </span>
              )}
            </div>
          )}

          {isExamenQuiz && (
            <div className={styles.temasSection}>
              <div className={styles.temasHeader}>
                <span className={styles.temasLabel}>Temas evaluados</span>
                <span className={styles.temasCount}>{temasDone}/{temasTotal}</span>
              </div>
              <div className={styles.temasList}>
                {temasSorted.map((tema, i) => (
                  <div key={tema.id} className={`${styles.temaRow} ${tema.estudiado ? styles.temaRowDone : ""}`}
                    onClick={() => toggleTema(item.temas.indexOf(tema))}>
                    <span className={styles.temaCheck}>{tema.estudiado ? "☑" : "☐"}</span>
                    <input type="text" className={styles.temaInput} value={tema.nombre}
                      placeholder="Tema..."
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateTema(item.temas.indexOf(tema), e.target.value)} />
                    <button className={styles.removeBtn} onClick={e => { e.stopPropagation(); removeTema(item.temas.indexOf(tema)); }}>✕</button>
                  </div>
                ))}
                <button className={styles.addItemBtn} onClick={addTema}>+ Tema</button>
              </div>
            </div>
          )}

          <div className={styles.cardActions}>
            <button className={styles.deleteBtn} onClick={() => onDelete(item.id)}>🗑️ Eliminar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AsignacionesView({ malla, asignacionesData, onSave, user, cursandoData, onSaveCursando, calendarioData, onSaveCalendario }) {
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterMateria, setFilterMateria] = useState("todas");
  const [showModal, setShowModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const items = asignacionesData?.items || [];
  const allMaterias = malla.flatMap(s => s.materias);
  const cursandoMaterias = allMaterias.filter(m => m.estado === "cursando");

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterTipo !== "todos") result = result.filter(it => it.tipo === filterTipo);
    if (filterMateria !== "todas") result = result.filter(it => it.materiaId === filterMateria);
    if (!showCompleted) result = result.filter(it => !it.completada);
    return result;
  }, [items, filterTipo, filterMateria, showCompleted]);

  const pendingCount = items.filter(it => !it.completada).length;
  const completedCount = items.filter(it => it.completada).length;

  const handleAdd = (newItem) => {
    const updated = [...items, { ...newItem, id: uuid(), temas: newItem.temas || [], completada: false }];
    onSave({ items: updated });
    if ((newItem.tipo === "examen" || newItem.tipo === "quiz") && newItem.fechaExamen && newItem.materiaId) {
      const evts = calendarioData?.eventos || [];
      const calEvent = {
        id: uuid(), tipo: newItem.tipo, titulo: newItem.titulo || newItem.tipo,
        fecha: newItem.fechaExamen, horaInicio: newItem.horaExamen || "",
        materiaId: newItem.materiaId, lugar: newItem.lugar || "",
        assignmentId: newItem.id,
      };
      onSaveCalendario({ eventos: [...evts, calEvent] });
    }
    setShowModal(false);
  };

  const handleUpdate = (updated) => {
    onSave({ items: items.map(it => it.id === updated.id ? updated : it) });
    if ((updated.tipo === "examen" || updated.tipo === "quiz") && updated.calendarId) {
      const evts = calendarioData?.eventos || [];
      onSaveCalendario({ eventos: evts.map(ev => ev.id === updated.calendarId ? { ...ev, fecha: updated.fechaExamen, horaInicio: updated.horaExamen, titulo: updated.titulo, lugar: updated.lugar } : ev) });
    }
  };

  const handleDelete = (id) => {
    const item = items.find(it => it.id === id);
    onSave({ items: items.filter(it => it.id !== id) });
    if (item?.calendarId) {
      const evts = calendarioData?.eventos || [];
      onSaveCalendario({ eventos: evts.filter(ev => ev.id !== item.calendarId) });
    }
  };

  const handleToggleComplete = (id) => {
    const item = items.find(it => it.id === id);
    if (item) onSave({ items: items.map(it => it.id === id ? { ...it, completada: !it.completada } : it) });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Asignaciones</h2>
          <p className={styles.subtitle}>{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} · {completedCount} completada{completedCount !== 1 ? "s" : ""}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.showCompletedBtn} onClick={() => setShowCompleted(v => !v)}>
            {showCompleted ? "Ocultar completadas" : `Ver completadas (${completedCount})`}
          </button>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Asignación</button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tipo:</span>
          <div className={styles.filterBtns}>
            <button className={`${styles.filterBtn} ${filterTipo === "todos" ? styles.filterBtnActive : ""}`}
              onClick={() => setFilterTipo("todos")}>Todos</button>
            {Object.entries(TIPO_INFO).map(([key, val]) => (
              <button key={key} className={`${styles.filterBtn} ${filterTipo === key ? styles.filterBtnActive : ""}`}
                style={{ "--f-color": val.color }}
                onClick={() => setFilterTipo(key)}>
                {val.icon} {val.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Materia:</span>
          <select className={styles.filterSelect} value={filterMateria} onChange={e => setFilterMateria(e.target.value)}>
            <option value="todas">Todas</option>
            {cursandoMaterias.map(m => <option key={m.id} value={m.id}>{m.id} - {m.nombre}</option>)}
          </select>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <p>No hay asignaciones {filterTipo !== "todos" || filterMateria !== "todas" ? "con estos filtros" : "registradas"}</p>
          <p>Haz clic en <strong>+ Asignación</strong> para agregar una.</p>
        </div>
      )}

      <div className={styles.cardsList}>
        {filteredItems.map(item => (
          <AsignacionCard
            key={item.id}
            item={item}
            allMaterias={allMaterias}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onSyncCalendar={(materiaId, data) => onSaveCursando({ ...cursandoData, [materiaId]: data })}
            cortesData={cursandoData}
          />
        ))}
      </div>

      {showModal && (
        <AddModal onClose={() => setShowModal(false)} onSave={handleAdd} materias={cursandoMaterias} />
      )}
    </div>
  );
}

function AddModal({ onClose, onSave, materias }) {
  const [form, setForm] = useState({
    tipo: "examen", titulo: "", materiaId: "", fechaExamen: "", horaExamen: "",
    fechaEntrega: "", lugar: "", descripcion: "", valoracion: "", esBinas: false,
    corteIdx: 0, temas: [],
  });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const isExamenQuiz = form.tipo === "examen" || form.tipo === "quiz";

  const addTema = () => update("temas", [...form.temas, { id: uuid(), nombre: "", estudiado: false }]);
  const updateTema = (i, val) => { const t = [...form.temas]; t[i] = { ...t[i], nombre: val }; update("temas", t); };
  const removeTema = (i) => update("temas", form.temas.filter((_, idx) => idx !== i));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nueva asignación</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label>Tipo</label>
            <div className={styles.tipoGrid}>
              {Object.entries(TIPO_INFO).map(([key, val]) => (
                <button key={key} className={`${styles.tipoBtn} ${form.tipo === key ? styles.tipoBtnActive : ""}`}
                  style={{ "--t-color": val.color }} onClick={() => update("tipo", key)}>
                  <span>{val.icon}</span> {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formRow2}>
            <div className={styles.formField}>
              <label>Título</label>
              <input type="text" className={styles.textInput} value={form.titulo}
                placeholder="Nombre de la asignación" onChange={e => update("titulo", e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>Materia</label>
              <select className={styles.select} value={form.materiaId} onChange={e => update("materiaId", e.target.value)}>
                <option value="">Seleccionar...</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.id} - {m.nombre}</option>)}
              </select>
            </div>
          </div>

          {isExamenQuiz && (
            <>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Fecha de evaluación</label>
                  <input type="date" className={styles.textInput} value={form.fechaExamen}
                    onChange={e => update("fechaExamen", e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>Hora</label>
                  <input type="time" className={styles.textInput} value={form.horaExamen}
                    onChange={e => update("horaExamen", e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Valoración %</label>
                  <input type="number" min={1} max={100} className={styles.textInput}
                    value={form.valoracion} placeholder="30" onChange={e => update("valoracion", e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>En binas</label>
                  <button className={`${styles.toggleBtn} ${form.esBinas ? styles.toggleBtnOn : ""}`}
                    onClick={() => update("esBinas", !form.esBinas)}>
                    {form.esBinas ? "Sí" : "No"}
                  </button>
                </div>
              </div>
              <div className={styles.formField}>
                <label>Temas evaluados</label>
                <div className={styles.temasList}>
                  {form.temas.map((tema, i) => (
                    <div key={tema.id} className={styles.temaRow}>
                      <input type="text" className={styles.textInput} value={tema.nombre}
                        placeholder="Tema..." onChange={e => updateTema(i, e.target.value)} />
                      <button className={styles.removeBtn} onClick={() => removeTema(i)}>✕</button>
                    </div>
                  ))}
                  <button className={styles.addItemBtn} onClick={addTema}>+ Tema</button>
                </div>
              </div>
            </>
          )}

          {(form.tipo === "tarea" || form.tipo === "proyecto") && (
            <>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Fecha de entrega</label>
                  <input type="date" className={styles.textInput} value={form.fechaEntrega}
                    onChange={e => update("fechaEntrega", e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>Lugar</label>
                  <input type="text" className={styles.textInput} value={form.lugar}
                    placeholder="Salón, plataforma..." onChange={e => update("lugar", e.target.value)} />
                </div>
              </div>
              <div className={styles.formField}>
                <label>Descripción</label>
                <textarea className={styles.textarea} value={form.descripcion}
                  placeholder="Detalles..." rows={3}
                  onChange={e => update("descripcion", e.target.value)} />
              </div>
            </>
          )}

          <div className={styles.formField}>
            <label>Lugar (opcional)</label>
            <input type="text" className={styles.textInput} value={form.lugar}
              placeholder="Salón, edificio..." onChange={e => update("lugar", e.target.value)} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={() => onSave(form)}>Crear</button>
        </div>
      </div>
    </div>
  );
}
