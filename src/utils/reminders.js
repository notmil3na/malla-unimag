export const REMINDER_OPTIONS = [
  { value: 0, label: "El mismo día" },
  { value: 1, label: "1 día antes" },
  { value: 2, label: "2 días antes" },
  { value: 3, label: "3 días antes" },
  { value: 7, label: "1 semana antes" },
];

export const DEFAULT_REMINDER = 1;

const MS_DAY = 86400000;

export function parseISODate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function reminderTrigger(fecha, offsetDays) {
  const d = parseISODate(fecha);
  if (!d) return null;
  return dayStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (offsetDays || 0)));
}

function daysBetween(a, b) {
  return Math.round((dayStart(b) - dayStart(a)) / MS_DAY);
}

export function labelFromTipo(tipo) {
  const map = {
    examen: "Examen", quiz: "Quiz", tarea: "Tarea",
    proyecto: "Proyecto", foro: "Foro", laboratorio: "Laboratorio",
    informe: "Informe", inicio_semestre: "Inicio de semestre",
    fin_semestre: "Fin de semestre",
  };
  return map[tipo] || "Evento";
}

export function dueFrom(item, fecha, now) {
  if (item.notificar === false) return null;
  const offset = item.recordatorio ?? DEFAULT_REMINDER;
  const trigger = reminderTrigger(fecha, offset);
  const eventDate = parseISODate(fecha);
  if (!trigger || !eventDate) return null;
  const today = dayStart(now);
  if (today > eventDate) return null;
  if (today < trigger) return null;
  return {
    key: item.key,
    tipo: item.tipo,
    titulo: item.titulo || labelFromTipo(item.tipo),
    fecha,
    diasRestantes: daysBetween(today, eventDate),
    atrasado: today > trigger,
  };
}

export function computeDueNotifications({ items, eventos }, now = new Date()) {
  const out = [];
  const seen = new Set();
  const syncedIds = new Set((eventos || []).map(ev => ev.assignmentId).filter(Boolean));
  for (const it of items || []) {
    if (it.completada || it.calendarId || syncedIds.has(it.id)) continue;
    const fecha = it.tipo === "examen" || it.tipo === "quiz" ? it.fechaExamen : it.fechaEntrega;
    const d = dueFrom({ ...it, key: `asig:${it.id}` }, fecha, now);
    if (d && !seen.has(d.key)) { seen.add(d.key); out.push(d); }
  }
  for (const ev of eventos || []) {
    const d = dueFrom({ ...ev, key: `ev:${ev.id}` }, ev.fecha, now);
    if (d && !seen.has(d.key)) { seen.add(d.key); out.push(d); }
  }
  out.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  return out;
}

export function formatDue(n) {
  if (n.diasRestantes === 0) return "hoy";
  if (n.diasRestantes === 1) return "mañana";
  return `en ${n.diasRestantes} días`;
}
