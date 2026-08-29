import { PASS_GRADE } from "./gradeHelpers.js";

// Generadores de "resúmenes" para compartir en el chat. Cada función recibe
// los datos del usuario y devuelve un objeto `payload` (jsonb) que se envía
// y se renderiza como una tarjeta en la conversación. También generan una
// versión en texto plano para poder descargarla.

function materiaNombre(malla, id) {
  const m = (malla || []).flatMap((s) => s.materias).find((x) => x.id === id);
  return m ? `${id} · ${m.nombre}` : id;
}

function estadosMaterias(malla) {
  const map = {};
  (malla || []).flatMap((s) => s.materias).forEach((m) => {
    map[m.id] = m.estado || "faltante";
  });
  return map;
}

function formatFecha(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}/${String(m).padStart(2, "0")}/${y}`;
}

// ── Apuntes por materia ────────────────────────────────────────────────────
export function buildApuntesPayload(malla, notasClaseData) {
  const entries = [];
  for (const [key, lista] of Object.entries(notasClaseData || {})) {
    const arr = Array.isArray(lista) ? lista : [];
    if (arr.length === 0) continue;
    const etiqueta = key === "general" ? "General" : materiaNombre(malla, key);
    entries.push({
      materia: etiqueta,
      apuntes: arr
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((n) => ({ texto: n.texto || "", fecha: n.fecha || "" })),
    });
  }
  return {
    kind: "apuntes",
    titulo: "Apuntes de clase",
    total: entries.reduce((a, e) => a + e.apuntes.length, 0),
    materias: entries,
    fecha: new Date().toISOString(),
  };
}

export function apuntesToText(payload) {
  const lines = [`MiMalla · ${payload.titulo}`, `Compartido el ${formatFecha(payload.fecha)}`, ""];
  for (const e of payload.materias || []) {
    lines.push(`── ${e.materia} (${e.apuntes.length}) ──`);
    for (const a of e.apuntes) {
      lines.push(`[${formatFecha(a.fecha) || "sin fecha"}] ${a.texto}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ── Notas del semestre ─────────────────────────────────────────────────────
export function buildNotasPayload({ malla, notas, semestre }) {
  const rows = [];
  let sumPond = 0, sumCred = 0, aprob = 0, reprob = 0, cursando = 0;
  for (const sem of malla || []) {
    for (const m of sem.materias || []) {
      if (m.estado !== "aprobada" && m.estado !== "cursando") continue;
      const n = notas && notas[m.id] ? notas[m.id] : {};
      if (m.estado === "cursando") cursando++;
      if (m.estado === "aprobada") aprob++;
      const numerica = Number(n.nota);
      if (m.estado === "aprobada" && !isNaN(numerica)) {
        sumPond += numerica * m.creditos;
        sumCred += m.creditos;
      }
      if (m.estado === "reprobada") reprob++;
      rows.push({
        id: m.id,
        nombre: m.nombre,
        creditos: m.creditos,
        estado: m.estado,
        nota: n.nota != null ? String(n.nota) : "—",
      });
    }
  }
  const pond = sumCred > 0 ? Math.round((sumPond / sumCred) * 10) / 10 : null;
  return {
    kind: "notas",
    titulo: "Resumen de notas",
    semestre: semestre ? `Semestre ${semestre}` : "",
    ponderado: pond != null ? pond : null,
    estadisticas: { aprob, reprob, cursando },
    materias: rows,
    fecha: new Date().toISOString(),
  };
}

export function notasToText(payload) {
  const lines = [
    `MiMalla · ${payload.titulo}${payload.semestre ? ` · ${payload.semestre}` : ""}`,
    `Compartido el ${formatFecha(payload.fecha)}`,
    "",
  ];
  if (payload.ponderado != null) lines.push(`Ponderado: ${payload.ponderado}`);
  lines.push(`Aprobadas: ${payload.estadisticas.aprob} · En curso: ${payload.estadisticas.cursando} · Reprobadas: ${payload.estadisticas.reprob}`);
  lines.push("");
  for (const m of payload.materias || []) {
    lines.push(`${m.id} [${m.estado}] ${m.nota} ${m.creditos}cr · ${m.nombre}`);
  }
  return lines.join("\n");
}

// ── Asignaciones ───────────────────────────────────────────────────────────
const TIPO_ORDEN = {
  examen: 1, quiz: 2, proyecto: 3, laboratorio: 4, tarea: 5,
  informe: 6, taller: 7, foro: 8,
};

export function buildAsignacionesPayload({ malla, asignacionesData }) {
  const items = Array.isArray(asignacionesData?.items) ? asignacionesData.items : [];
  const pendientes = items
    .filter((it) => !it.completada)
    .map((it) => ({
      id: it.id,
      tipo: it.tipo || "tarea",
      titulo: it.titulo || "",
      materiaId: it.materiaId || "",
      materia: materiaNombre(malla, it.materiaId || ""),
      fecha: it.fechaExamen || it.fechaEntrega || it.fechaFin || "",
      nota: it.nota,
    }))
    .sort((a, b) => (TIPO_ORDEN[a.tipo] || 9) - (TIPO_ORDEN[b.tipo] || 9));
  const completadas = items.filter((it) => it.completada).length;
  return {
    kind: "asignaciones",
    titulo: "Mis asignaciones",
    pendientes: pendientes.length,
    completadas,
    items: pendientes,
    fecha: new Date().toISOString(),
  };
}

export function asignacionesToText(payload) {
  const lines = [
    `MiMalla · ${payload.titulo}`,
    `Compartido el ${formatFecha(payload.fecha)}`,
    `Pendientes: ${payload.pendientes} · Completadas: ${payload.completadas}`,
    "",
  ];
  for (const it of payload.items || []) {
    lines.push(`▸ ${it.tipo.toUpperCase()} · ${it.titulo || it.tipo}`);
    lines.push(`  ${it.materia}`);
    if (it.fecha) lines.push(`  Fecha: ${formatFecha(it.fecha)}`);
  }
  return lines.join("\n");
}

// ── Adjuntar imagen (comprime a JPEG data URL para guardarla en el chat) ──
export async function compressImageForChat(dataUrl, maxSize = 1400, quality = 0.82) {
  if (typeof document === "undefined" || !dataUrl) return dataUrl;
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale === 1 && dataUrl.startsWith("data:image/jpeg")) return dataUrl;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", quality);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch (_) {
    return dataUrl;
  }
}

// ── Descarga en texto plano (client-side) ──────────────────────────────────
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { PASS_GRADE };
