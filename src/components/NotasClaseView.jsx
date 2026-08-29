import { useState, useMemo } from "react";
import { uuid, toISODate, DESTINO_LABEL, formatFecha } from "../utils/notasClase";
import { IconSparkle, IconTrash, IconCheck, IconCalendar, IconClipboard, IconSemester, IconEdit } from "./Icons";
import styles from "./NotasClaseView.module.css";

export default function NotasClaseView({
  materiasAll, cursandoIds,
  notasClaseData, onSaveNotasClase,
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [materiaId, setMateriaId] = useState(() => {
    const primero = (materiasAll || []).find(m => cursandoIds.has(m.id));
    return primero ? primero.id : "general";
  });
  const [filter, setFilter] = useState("todas");

  const materiasCursando = useMemo(
    () => (materiasAll || []).filter(m => cursandoIds.has(m.id)),
    [materiasAll, cursandoIds]
  );

  const hoy = new Date();

  const guardar = () => {
    if (!draft.trim()) return;
    const key = materiaId || "general";
    const listaPrev = notasClaseData?.[key] || [];

    if (editingId) {
      const listaEditada = listaPrev.map(n =>
        n.id === editingId
          ? { ...n, texto: draft.trim(), fecha: toISODate(hoy) }
          : n
      );
      onSaveNotasClase({ ...(notasClaseData || {}), [key]: listaEditada });
      setEditingId(null);
    } else {
      const entry = { id: uuid(), texto: draft.trim(), fecha: toISODate(hoy) };
      onSaveNotasClase({ ...(notasClaseData || {}), [key]: [...listaPrev, entry] });
    }
    setDraft("");
  };

  const empezarEdicion = (key, n) => {
    setEditingId(n.id);
    setDraft(n.texto || "");
    setMateriaId(key);
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setDraft("");
  };

  const eliminarNota = (key, id) => {
    const lista = notasClaseData?.[key] || [];
    onSaveNotasClase({ ...(notasClaseData || {}), [key]: lista.filter(n => n.id !== id) });
  };

  const agrupadas = useMemo(() => {
    const map = {};
    for (const [key, lista] of Object.entries(notasClaseData || {})) {
      if (filter !== "todas" && key !== filter) continue;
      if (lista && lista.length > 0) {
        map[key] = [...lista].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
      }
    }
    return map;
  }, [notasClaseData, filter]);

  const materiaNombre = (id) => {
    const m = (materiasAll || []).find(x => x.id === id);
    return m ? `${m.id} — ${m.nombre}` : (id === "general" ? "General" : id);
  };

  const totalRegistros = Object.values(notasClaseData || {}).reduce((a, l) => a + (l?.length || 0), 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Notas de clase</h2>
          <p className={styles.subtitle}>
            Apunta lo que veas en clase y quédalo guardado en la materia que elijas.
          </p>
        </div>
      </div>

      <div className={styles.composer}>
        <div className={styles.composerTop}>
          <label className={styles.composerLabel}>
            <IconSparkle size={13} /> {editingId ? "Editando apunte" : "Nueva nota"}
          </label>
          <select
            className={styles.materiaSelect}
            value={materiaId}
            onChange={e => setMateriaId(e.target.value)}
          >
            {(materiasCursando.length > 0 ? materiasCursando : [{ id: "general" }]).map(m => (
              <option key={m.id} value={m.id}>
                {m.id === "general" ? "General" : `${m.id} — ${m.nombre}`}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className={styles.composerTextarea}
          value={draft}
          rows={3}
          placeholder="Escribe tu apunte de clase…"
          onChange={e => setDraft(e.target.value)}
        />
        <div className={styles.composerFooter}>
          <span className={styles.charHint}>{draft.length} caracteres</span>
          <div className={styles.composerActions}>
            {editingId && (
              <button className={styles.cancelBtn} onClick={cancelarEdicion}>
                Cancelar
              </button>
            )}
            <button
              className={styles.saveBtn}
              onClick={guardar}
              disabled={!draft.trim()}
            >
              <IconCheck size={13} /> {editingId ? "Guardar cambios" : "Guardar apunte"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.registrosHeader}>
        <div>
          <h3 className={styles.registrosTitle}>Registros por materia</h3>
          <p className={styles.registrosSub}>{totalRegistros} registro{totalRegistros !== 1 ? "s" : ""} en total</p>
        </div>
        <select className={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="todas">Todas las materias</option>
          {(materiasCursando.length > 0 ? materiasCursando : [{ id: "general" }]).map(m => (
            <option key={m.id} value={m.id}>{m.id}</option>
          ))}
        </select>
      </div>

      {Object.keys(agrupadas).length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><IconSparkle size={30} /></span>
          <p>Todavía no hay notas de clase.</p>
          <p>Escribe algo arriba y guárdalo en la materia que quieras.</p>
        </div>
      )}

      <div className={styles.materiasList}>
        {Object.entries(agrupadas).map(([key, lista]) => (
          <div key={key} className={styles.materiaGroup}>
            <div className={styles.materiaHeader}>
              <span className={styles.materiaName}>{materiaNombre(key)}</span>
              <span className={styles.materiaCount}>{lista.length}</span>
            </div>
            <div className={styles.notasList}>
              {lista.map(n => (
                <div key={n.id} className={styles.notaRow}>
                  <div className={styles.notaDestino} data-destino={n.destino || "apuntes"}>
                    {n.destino === "calendario" ? <IconCalendar size={11} />
                      : n.destino === "asignaciones" ? <IconClipboard size={11} />
                      : n.destino === "cursando" ? <IconSemester size={11} />
                      : <IconSparkle size={11} />}
                    <span>{DESTINO_LABEL[n.destino] || "Apuntes"}</span>
                  </div>
                  <div className={styles.notaBody}>
                    <p className={styles.notaTexto}>{n.texto}</p>
                    <span className={styles.notaMeta}>
                      {formatFecha(n.fecha)}{n.fechaEvento ? ` · ${formatFecha(n.fechaEvento)}` : ""}
                      {n.titulo ? ` · ${n.titulo}` : ""}
                    </span>
                  </div>
                  <div className={styles.notaActions}>
                    <button className={styles.editBtn} onClick={() => empezarEdicion(key, n)} title="Editar registro">
                      <IconEdit size={13} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => eliminarNota(key, n.id)} title="Eliminar registro">
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
