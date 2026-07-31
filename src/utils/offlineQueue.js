// Cola de guardado offline basada en localStorage.
//
// Cada "columna" de datos tiene su propia clave. NOTA (bug del plan column):
// `plan` y `horario` comparten la misma forma { dias, clases }; por eso se
// usan claves separadas ("plan" y "horario") para que nunca se pisen entre sí.

const STORAGE_KEY = "mimalla_pending_saves";

export function getPendingSaves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function hasPendingSaves() {
  return Object.keys(getPendingSaves()).length > 0;
}

export function queueSave(column, patch) {
  const pending = getPendingSaves();
  pending[column] = patch;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

export function clearPendingSave(column) {
  const pending = getPendingSaves();
  delete pending[column];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    /* sin espacio: no crítico */
  }
}

export function clearAllPendingSaves() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no crítico */
  }
}
