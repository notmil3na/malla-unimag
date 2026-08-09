// Utilidades compartidas de "Notas de clase".

export function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function toISODate(d) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const DESTINO_LABEL = {
  calendario: "Calendario",
  asignaciones: "Asignaciones",
  cursando: "Semestre",
  apuntes: "Apuntes",
};

export function formatFecha(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${String(m).padStart(2, "0")}/${y}`;
}
