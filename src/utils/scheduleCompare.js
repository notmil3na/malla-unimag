import { HORAS_FORM, horaIdx, toViewHora } from "./horarioHelpers.js";

// ── Ventana académica ─────────────────────────────────────────────────────
// La comparación se hace sobre franjas de 06:00 a 22:00 (índices de HORAS_FORM).
export const WINDOW_START = 0;
export const WINDOW_END   = HORAS_FORM.length; // exclusivo (22:00)

export const DAY_ORDER = ["L", "M", "X", "J", "V", "S"];
export const DAY_LABELS = { L: "Lunes", M: "Martes", X: "Miércoles", J: "Jueves", V: "Viernes", S: "Sábado" };

// Formato corto de una hora por índice (0 → 6:00, 16 → 22:00).
export function formatHourIdx(idx) {
  const h = idx + 6;
  return `${h}:00`;
}

// Formato "9:00" a partir de una hora en formato de la app.
export function compactHour(hora) {
  const idx = horaIdx(hora);
  if (idx < 0) return toViewHora(hora) || "";
  const h = idx + 6;
  return `${h}:00`;
}

// ── Intervalos ocupados por día (fusionados) ──────────────────────────────
export function buildBusyByDay(clases) {
  const byDay = {};
  for (const c of clases || []) {
    if (!c || !c.dia) continue;
    const s = horaIdx(c.horaInicio);
    const e = horaIdx(c.horaFin);
    if (s < WINDOW_START || e > WINDOW_END || s >= e) continue;
    (byDay[c.dia] = byDay[c.dia] || []).push([s, e]);
  }
  for (const d in byDay) {
    byDay[d].sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [s, e] of byDay[d]) {
      const last = merged[merged.length - 1];
      if (last && s <= last[1]) last[1] = Math.max(last[1], e);
      else merged.push([s, e]);
    }
    byDay[d] = merged;
  }
  return byDay;
}

// ── Franjas libres por día (complemento de la ventana) ────────────────────
export function freeSlotsPerDay(busy) {
  const out = {};
  for (const d of DAY_ORDER) {
    const ints = busy[d] || [];
    const slots = [];
    let cursor = WINDOW_START;
    for (const [s, e] of ints) {
      if (s > cursor) slots.push([cursor, s]);
      cursor = Math.max(cursor, e);
    }
    if (cursor < WINDOW_END) slots.push([cursor, WINDOW_END]);
    out[d] = slots;
  }
  return out;
}

// ── Huecos en común ───────────────────────────────────────────────────────
// Intersección de las franjas libres de ambos usuarios. `minDuracion` en
// horas (1 = al menos una franja de 60 min). Devuelve [{dia, inicio, fin, duracion}]
// ordenado por duración descendente.
export function commonFreeSlots(myBusy, friendBusy, minDuracion = 1) {
  const aFree = freeSlotsPerDay(myBusy || {});
  const bFree = freeSlotsPerDay(friendBusy || {});
  const result = [];
  for (const d of DAY_ORDER) {
    const a = aFree[d] || [];
    const b = bFree[d] || [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      const s = Math.max(a[i][0], b[j][0]);
      const e = Math.min(a[i][1], b[j][1]);
      if (s < e && e - s >= minDuracion) {
        result.push({ dia: d, inicio: s, fin: e, duracion: e - s });
      }
      if (a[i][1] < b[j][1]) i++;
      else j++;
    }
  }
  result.sort(
    (x, y) =>
      y.duracion - x.duracion ||
      DAY_ORDER.indexOf(x.dia) - DAY_ORDER.indexOf(y.dia) ||
      x.inicio - y.inicio
  );
  return result;
}

// ── Matriz para la cuadrícula visual ──────────────────────────────────────
// day -> array (WINDOW_END - WINDOW_START) con 'libre'|'yo'|'amigo'|'ambos'.
export function cellStatuses(myBusy, friendBusy) {
  const toSet = (intervals) => {
    const set = new Set();
    for (const [s, e] of intervals || []) {
      for (let h = s; h < e; h++) set.add(h);
    }
    return set;
  };
  const out = {};
  for (const d of DAY_ORDER) {
    const mine = toSet((myBusy || {})[d]);
    const theirs = toSet((friendBusy || {})[d]);
    const row = [];
    for (let h = WINDOW_START; h < WINDOW_END; h++) {
      const m = mine.has(h);
      const t = theirs.has(h);
      row.push(m && t ? "ambos" : m ? "yo" : t ? "amigo" : "libre");
    }
    out[d] = row;
  }
  return out;
}

// ── Días a mostrar (unión de días activos + días con clases) ──────────────
export function unionDias(horarioA, horarioB) {
  const set = new Set();
  for (const h of [horarioA, horarioB]) {
    for (const d of h?.dias || []) set.add(d);
    for (const c of h?.clases || []) if (c?.dia) set.add(c.dia);
  }
  return DAY_ORDER.filter((d) => set.has(d));
}

// ── Materias compartidas / cursando del amigo ─────────────────────────────
export function cursandoMaterias(malla) {
  return (malla || []).flatMap((s) => s.materias || []).filter((m) => m.estado === "cursando");
}

export function commonSubjects(myMalla, friendMalla) {
  const mine = new Set(cursandoMaterias(myMalla).map((m) => m.id));
  return cursandoMaterias(friendMalla).filter((m) => mine.has(m.id));
}

// ── Progreso de carrera a partir de la malla guardada ─────────────────────
export function progressFromMalla(malla) {
  const materias = (malla || []).flatMap((s) => s.materias || []);
  const aprobadas = materias.filter((m) => m.estado === "aprobada");
  const totalCred = materias.reduce((a, m) => a + (m.creditos || 0), 0);
  const aprobCred = aprobadas.reduce((a, m) => a + (m.creditos || 0), 0);
  return {
    total: materias.length,
    aprobadas: aprobadas.length,
    totalCred,
    aprobCred,
    pct: totalCred ? Math.round((aprobCred / totalCred) * 100) : 0,
  };
}
