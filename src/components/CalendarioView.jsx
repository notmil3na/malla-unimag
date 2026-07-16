import { useState, useMemo, useCallback } from "react";
import styles from "./CalendarioView.module.css";
import { SEMESTER_START, SEMESTER_END } from "../utils/semesterCountdown.js";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_CORTOS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TIPO_EVENTO = [
  { id: "examen",      label: "Examen",       icon: "📝", color: "#E87098" },
  { id: "quiz",        label: "Quiz",          icon: "❓", color: "#B882E8" },
  { id: "tarea",       label: "Tarea",         icon: "📌", color: "#6BA3E8" },
  { id: "proyecto",    label: "Proyecto",      icon: "📁", color: "#E8946B" },
  { id: "evento",      label: "Evento",        icon: "🎯", color: "#6EC8A8" },
  { id: "inicio_semestre", label: "Inicio semestre", icon: "🟢", color: "#6EC88A" },
  { id: "fin_semestre", label: "Fin semestre",  icon: "🔴", color: "#e07070" },
];

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function toISODate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDiasEnMes(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getPrimerDiaLunes(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function EventoBadge({ evento, materias }) {
  const tipo = TIPO_EVENTO.find(t => t.id === evento.tipo) || TIPO_EVENTO[4];
  const mat = materias.find(m => m.id === evento.materiaId);
  return (
    <div className={styles.eventoBadge} style={{ "--ev-color": tipo.color }}>
      <span className={styles.eventoIcon}>{tipo.icon}</span>
      <div className={styles.eventoBadgeInfo}>
        <span className={styles.eventoBadgeTitle}>{evento.titulo || tipo.label}</span>
        {mat && <span className={styles.eventoBadgeMateria}>{mat.id} - {mat.nombre}</span>}
        {evento.horaInicio && <span className={styles.eventoBadgeHora}>{evento.horaInicio}{evento.horaFin ? ` – ${evento.horaFin}` : ""}</span>}
        {evento.lugar && <span className={styles.eventoBadgeLugar}>{evento.lugar}</span>}
      </div>
    </div>
  );
}

function EventoModal({ onClose, onSave, evento, materias, cortes }) {
  const [form, setForm] = useState(evento || {
    id: uuid(), tipo: "examen", titulo: "", fecha: toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    horaInicio: "", horaFin: "", materiaId: "", lugar: "", descripcion: "",
    valoracion: "", esBinas: false, corteIdx: 0, temas: [],
  });

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const tipoInfo = TIPO_EVENTO.find(t => t.id === form.tipo);
  const isExamenQuiz = form.tipo === "examen" || form.tipo === "quiz";

  const addTema = () => {
    update("temas", [...(form.temas || []), { id: uuid(), nombre: "", estudiado: false }]);
  };
  const updateTema = (i, field, val) => {
    const t = [...form.temas];
    t[i] = { ...t[i], [field]: val };
    update("temas", t);
  };
  const removeTema = (i) => {
    update("temas", form.temas.filter((_, idx) => idx !== i));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{evento?.id ? "Editar" : "Nuevo"} evento</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Tipo</label>
              <div className={styles.tipoGrid}>
                {TIPO_EVENTO.filter(t => !["inicio_semestre","fin_semestre"].includes(t.id)).map(t => (
                  <button key={t.id}
                    className={`${styles.tipoBtn} ${form.tipo === t.id ? styles.tipoBtnActive : ""}`}
                    style={{ "--t-color": t.color }}
                    onClick={() => update("tipo", t.id)}
                  >
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formRow2}>
            <div className={styles.formField}>
              <label>Título</label>
              <input type="text" className={styles.textInput} value={form.titulo}
                placeholder={tipoInfo?.label || "Nombre del evento"}
                onChange={e => update("titulo", e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>Materia</label>
              <select className={styles.select} value={form.materiaId}
                onChange={e => update("materiaId", e.target.value)}>
                <option value="">Sin materia</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.id} - {m.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formRow2}>
            <div className={styles.formField}>
              <label>Fecha</label>
              <input type="date" className={styles.textInput} value={form.fecha}
                onChange={e => update("fecha", e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>Hora inicio</label>
              <input type="time" className={styles.textInput} value={form.horaInicio}
                onChange={e => update("horaInicio", e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>Hora fin</label>
              <input type="time" className={styles.textInput} value={form.horaFin}
                onChange={e => update("horaFin", e.target.value)} />
            </div>
          </div>

          <div className={styles.formRow2}>
            <div className={styles.formField}>
              <label>Lugar</label>
              <input type="text" className={styles.textInput} value={form.lugar}
                placeholder="Salón, edificio..." onChange={e => update("lugar", e.target.value)} />
            </div>
          </div>

          {isExamenQuiz && (
            <>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>Valoración % del corte</label>
                  <input type="number" min={1} max={100} className={styles.textInput}
                    value={form.valoracion} placeholder="30"
                    onChange={e => update("valoracion", e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>Corte</label>
                  <select className={styles.select} value={form.corteIdx ?? 0}
                    onChange={e => update("corteIdx", Number(e.target.value))}>
                    {cortes.map((c, i) => <option key={i} value={i}>{c.nombre || `Corte ${i + 1}`}</option>)}
                  </select>
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
                  {(form.temas || []).map((tema, i) => (
                    <div key={tema.id} className={styles.temaRow}>
                      <input type="text" className={styles.textInput} value={tema.nombre}
                        placeholder="Tema..." onChange={e => updateTema(i, "nombre", e.target.value)} />
                      <button className={styles.removeBtn} onClick={() => removeTema(i)}>✕</button>
                    </div>
                  ))}
                  <button className={styles.addItemBtn} onClick={addTema}>+ Tema</button>
                </div>
              </div>
            </>
          )}

          {(form.tipo === "evento" || form.tipo === "tarea" || form.tipo === "proyecto") && (
            <div className={styles.formField}>
              <label>Descripción</label>
              <textarea className={styles.textarea} value={form.descripcion}
                placeholder="Detalles del evento..." rows={3}
                onChange={e => update("descripcion", e.target.value)} />
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarioView({ malla, calendarioData, onSave, user, horarioData }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalEvent, setModalEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const eventos = calendarioData?.eventos || [];
  const allMaterias = malla.flatMap(s => s.materias);
  const cortesMaterias = malla.flatMap(s => s.materias).filter(m => m.estado === "cursando");

  const ensureSemesterEvents = useCallback(() => {
    const evts = [...eventos];
    const hasInicio = evts.some(e => e.tipo === "inicio_semestre" && e.fecha === toISODate(SEMESTER_START.getFullYear(), SEMESTER_START.getMonth(), SEMESTER_START.getDate()));
    const hasFin = evts.some(e => e.tipo === "fin_semestre" && e.fecha === toISODate(SEMESTER_END.getFullYear(), SEMESTER_END.getMonth(), SEMESTER_END.getDate()));
    if (!hasInicio) {
      evts.push({
        id: uuid(), tipo: "inicio_semestre", titulo: "Inicio de semestre",
        fecha: toISODate(SEMESTER_START.getFullYear(), SEMESTER_START.getMonth(), SEMESTER_START.getDate()),
      });
    }
    if (!hasFin) {
      evts.push({
        id: uuid(), tipo: "fin_semestre", titulo: "Fin de semestre",
        fecha: toISODate(SEMESTER_END.getFullYear(), SEMESTER_END.getMonth(), SEMESTER_END.getDate()),
      });
    }
    if (!hasInicio || !hasFin) onSave({ eventos: evts });
  }, [eventos, onSave]);

  useMemo(() => { ensureSemesterEvents(); }, []);

  const eventosPorFecha = useMemo(() => {
    const map = {};
    eventos.forEach(ev => {
      if (!map[ev.fecha]) map[ev.fecha] = [];
      map[ev.fecha].push(ev);
    });
    return map;
  }, [eventos]);

  const diasEnMes = getDiasEnMes(year, month);
  const primerLunes = getPrimerDiaLunes(year, month);
  const celdas = [];
  for (let i = 0; i < primerLunes; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const eventosSeleccionados = selectedDay ? (eventosPorFecha[toISODate(year, month, selectedDay)] || []) : [];

  const proximosEventos = useMemo(() => {
    const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
    return eventos
      .filter(ev => ev.fecha >= todayISO)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 12);
  }, [eventos]);

  const handleSaveEvento = (ev) => {
    const exists = eventos.findIndex(e => e.id === ev.id);
    const updated = exists >= 0 ? eventos.map((e, i) => i === exists ? ev : e) : [...eventos, ev];
    onSave({ eventos: updated });
    setShowModal(false);
    setModalEvent(null);
  };

  const handleDeleteEvento = (id) => {
    onSave({ eventos: eventos.filter(e => e.id !== id) });
    setShowModal(false);
    setModalEvent(null);
    setSelectedDay(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Calendario</h2>
          <p className={styles.subtitle}>{MESES[month]} {year}</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setModalEvent(null); setShowModal(true); }}>
          + Evento
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.calendarPanel}>
          <div className={styles.calNav}>
            <button className={styles.navBtn} onClick={prevMonth}>◀</button>
            <span className={styles.navTitle}>{MESES[month]} {year}</span>
            <button className={styles.navBtn} onClick={nextMonth}>▶</button>
          </div>

          <div className={styles.calGrid}>
            {DIAS_CORTOS.map(d => (
              <div key={d} className={styles.calDayHeader}>{d}</div>
            ))}
            {celdas.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className={styles.calCellEmpty} />;
              const fecha = toISODate(year, month, day);
              const evs = eventosPorFecha[fecha] || [];
              const isToday = isCurrentMonth && today.getDate() === day;
              const isSelected = selectedDay === day;
              return (
                <div
                  key={day}
                  className={`${styles.calCell} ${isToday ? styles.calCellToday : ""} ${isSelected ? styles.calCellSelected : ""}`}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                >
                  <span className={styles.calDayNum}>{day}</span>
                  <div className={styles.calDots}>
                    {evs.slice(0, 3).map((ev, j) => {
                      const tipo = TIPO_EVENTO.find(t => t.id === ev.tipo) || TIPO_EVENTO[4];
                      return <span key={j} className={styles.calDot} style={{ background: tipo.color }} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDay && (
            <div className={styles.selectedDayPanel}>
              <div className={styles.selectedDayHeader}>
                <h3 className={styles.selectedDayTitle}>
                  {selectedDay} de {MESES[month]}
                </h3>
                <button className={styles.addSmallBtn} onClick={() => {
                  setModalEvent({ id: uuid(), tipo: "examen", titulo: "", fecha: toISODate(year, month, selectedDay), horaInicio: "", horaFin: "", materiaId: "", lugar: "", descripcion: "", valoracion: "", esBinas: false, corteIdx: 0, temas: [] });
                  setShowModal(true);
                }}>+ Agregar</button>
              </div>
              {eventosSeleccionados.length === 0 && (
                <p className={styles.noEvents}>Sin eventos este día</p>
              )}
              {eventosSeleccionados.map(ev => (
                <div key={ev.id} className={styles.selectedEvento}>
                  <EventoBadge evento={ev} materias={allMaterias} />
                  <div className={styles.selectedEventoActions}>
                    <button className={styles.editBtn} onClick={() => { setModalEvent(ev); setShowModal(true); }}>✏️</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteEvento(ev.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Próximos eventos</h3>
          {proximosEventos.length === 0 && (
            <p className={styles.sidebarEmpty}>No hay eventos próximos</p>
          )}
          <div className={styles.sidebarList}>
            {proximosEventos.map(ev => {
              const tipo = TIPO_EVENTO.find(t => t.id === ev.tipo) || TIPO_EVENTO[4];
              const mat = allMaterias.find(m => m.id === ev.materiaId);
              const fecha = parseISODate(ev.fecha);
              return (
                <div key={ev.id} className={styles.sidebarItem} onClick={() => { setModalEvent(ev); setShowModal(true); }}>
                  <div className={styles.sidebarItemDot} style={{ background: tipo.color }} />
                  <div className={styles.sidebarItemInfo}>
                    <span className={styles.sidebarItemTitle}>{ev.titulo || tipo.label}</span>
                    {mat && <span className={styles.sidebarItemMateria}>{mat.id}</span>}
                    <span className={styles.sidebarItemDate}>
                      {fecha.getDate()} {MESES[fecha.getMonth()].slice(0, 3)}
                      {ev.horaInicio ? ` · ${ev.horaInicio}` : ""}
                    </span>
                  </div>
                  <span className={styles.sidebarItemIcon}>{tipo.icon}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <EventoModal
          onClose={() => { setShowModal(false); setModalEvent(null); }}
          onSave={handleSaveEvento}
          evento={modalEvent?.id && eventos.find(e => e.id === modalEvent.id) ? modalEvent : modalEvent}
          materias={cortesMaterias}
          cortes={cortesMaterias.length > 0 ? [{ nombre: "Corte 1", peso: 33 }, { nombre: "Corte 2", peso: 33 }, { nombre: "Corte 3", peso: 34 }] : []}
        />
      )}
    </div>
  );
}
