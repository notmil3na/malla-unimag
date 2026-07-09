import { useState, useEffect } from "react";
import { canEnrollMateria } from "../utils/gradeHelpers.js";
import styles from "./HorarioView.module.css";

// ── Edificios y salones ───────────────────────────────────────────────────
const EDIFICIOS = [
  { id:"mar_caribe", nombre:"Mar Caribe", icon:"🌊", lados:["Norte","Sur"],
    salones: Array.from({length:28},(_,i)=>`${100*(Math.floor(i/7)+1)+(i%7+1)}`), },
  { id:"cienaga_grande", nombre:"Ciénaga Grande", icon:"🐊", lados:["Norte","Sur"],
    salones: Array.from({length:18},(_,i)=>`${100*(Math.floor(i/6)+1)+(i%6+1)}`), },
  { id:"sierra_nevada", nombre:"Sierra Nevada", icon:"⛰️", lados:["Norte","Sur"],
    salones: Array.from({length:18},(_,i)=>`${100*(Math.floor(i/6)+1)+(i%6+1)}`), },
  { id:"edf_innovacion", nombre:"Edificio de Innovación y Emprendimiento", icon:"🔬", lados:null,
    salones:["Lab. de Mecánica I"], },
  { id:"bloque_3", nombre:"Bloque 3", icon:"🧱", lados:null,
    salones: Array.from({length:8},(_,i)=>`${i+1}`), },
  { id:"hangar_a", nombre:"Hangar A", icon:"🔬", lados:null,
    salones:["Lab. Modelado y Simulación"], },
];

const HORAS_FORM = [
  "06:00 a. m.","07:00 a. m.","08:00 a. m.","09:00 a. m.","10:00 a. m.","11:00 a. m.",
  "12:00 p. m.","01:00 p. m.","02:00 p. m.","03:00 p. m.","04:00 p. m.","05:00 p. m.",
  "06:00 p. m.","07:00 p. m.","08:00 p. m.","09:00 p. m.",
];
const LEGACY_HORAS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","1:00","2:00","3:00","4:00","5:00","6:00","7:00","8:00","9:00",
];
const TODOS_DIAS = [
  {id:"L",label:"Lunes"},{id:"M",label:"Martes"},{id:"X",label:"Miércoles"},
  {id:"J",label:"Jueves"},{id:"V",label:"Viernes"},{id:"S",label:"Sábado"},
];
const ACCENT_COLORS = [
  "#c8a96e","#6eb5c8","#a86ec8","#6ec8a8","#c86e6e","#c8c86e",
  "#6e8bc8","#c86eab","#8bc86e","#c8956e",
];

// ── helpers ───────────────────────────────────────────────────────────────
function buildSalonLabel(edificioId, lado, salon) {
  const ed = EDIFICIOS.find(e=>e.id===edificioId);
  if (!ed) return "";
  if (!ed.lados) return `${ed.nombre} — ${salon}`;
  return `${ed.nombre} ${lado} ${salon}`;
}
function normalizeHora(hora) {
  if (!hora) return hora;
  if (HORAS_FORM.includes(hora)) return hora;
  const idx = LEGACY_HORAS.indexOf(hora);
  return idx>=0 ? HORAS_FORM[idx] : hora;
}
function toViewHora(hora) {
  const n = normalizeHora(hora);
  const idx = HORAS_FORM.indexOf(n);
  return idx>=0 ? LEGACY_HORAS[idx] : hora;
}
function horaIdx(h) { return HORAS_FORM.indexOf(normalizeHora(h)); }

// ── ClaseModal (unchanged) ────────────────────────────────────────────────
function ClaseModal({ materiasDisponibles, diasActivos, onSave, onClose, editando, onDelete, onNotify }) {
  const [form, setForm] = useState(editando ? {
    ...editando,
    horaInicio: normalizeHora(editando.horaInicio),
    horaFin: normalizeHora(editando.horaFin),
    grupo: editando.grupo||"", profesor: editando.profesor||"",
    segundoDiaActivo:false, dia2:"", horaInicio2:"07:00 a. m.", horaFin2:"09:00 a. m.",
    edificio2:"", lado2:"", salon2:"",
  } : {
    materiaId: materiasDisponibles[0]?.id||"", dia: diasActivos[0]||"L",
    horaInicio:"07:00 a. m.", horaFin:"09:00 a. m.",
    edificio:"", lado:"", salon:"", grupo:"", profesor:"",
    segundoDiaActivo:false, dia2:"", horaInicio2:"07:00 a. m.", horaFin2:"09:00 a. m.",
    edificio2:"", lado2:"", salon2:"", notas:"",
  });

  const ed  = EDIFICIOS.find(e=>e.id===form.edificio);
  const ed2 = EDIFICIOS.find(e=>e.id===form.edificio2);
  const salonLabel  = form.edificio  ? buildSalonLabel(form.edificio,  form.lado,  form.salon)  : "";
  const salonLabel2 = form.edificio2 ? buildSalonLabel(form.edificio2, form.lado2, form.salon2) : "";

  const handleSave = () => {
    if (!form.materiaId||!form.dia||!form.horaInicio||!form.horaFin) return;
    const s=HORAS_FORM.indexOf(form.horaInicio), e=HORAS_FORM.indexOf(form.horaFin);
    if (s<0||e<=s){ onNotify?.("Horario inválido"); return; }
    if (form.segundoDiaActivo){
      if(!form.dia2||!form.horaInicio2||!form.horaFin2) return;
      if(form.dia2===form.dia) return;
      const s2=HORAS_FORM.indexOf(form.horaInicio2), e2=HORAS_FORM.indexOf(form.horaFin2);
      if(s2<0||e2<=s2){ onNotify?.("Horario 2 inválido"); return; }
    }
    const clases=[{ materiaId:form.materiaId, dia:form.dia,
      horaInicio:form.horaInicio, horaFin:form.horaFin,
      edificio:form.edificio, lado:form.lado, salon:form.salon, salonLabel,
      grupo:form.grupo, profesor:form.profesor, notas:form.notas }];
    if (form.segundoDiaActivo) clases.push({
      materiaId:form.materiaId, dia:form.dia2,
      horaInicio:form.horaInicio2, horaFin:form.horaFin2,
      edificio:form.edificio2, lado:form.lado2, salon:form.salon2, salonLabel:salonLabel2,
      grupo:form.grupo, profesor:form.profesor, notas:form.notas,
    });
    onSave({ clases });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editando?"Editar clase":"Nueva clase"}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label>Materia</label>
            <select className={styles.select} value={form.materiaId}
              onChange={e=>setForm(f=>({...f,materiaId:e.target.value}))}>
              <option value="">— Selecciona —</option>
              {materiasDisponibles.map(m=>(
                <option key={m.id} value={m.id}>{m.id} — {m.nombre}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Grupo</label>
              <input type="text" className={styles.input} value={form.grupo}
                placeholder="ej: G2" onChange={e=>setForm(f=>({...f,grupo:e.target.value}))} />
            </div>
            <div className={styles.formField}>
              <label>Profesor</label>
              <input type="text" className={styles.input} value={form.profesor}
                placeholder="ej: Santiago Navarro" onChange={e=>setForm(f=>({...f,profesor:e.target.value}))} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Día</label>
              <select className={styles.select} value={form.dia}
                onChange={e=>setForm(f=>({...f,dia:e.target.value}))}>
                {diasActivos.map(id=>{ const d=TODOS_DIAS.find(x=>x.id===id); return <option key={id} value={id}>{d?.label}</option>; })}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Inicio</label>
              <select className={styles.select} value={form.horaInicio}
                onChange={e=>setForm(f=>({...f,horaInicio:e.target.value}))}>
                {HORAS_FORM.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Fin</label>
              <select className={styles.select} value={form.horaFin}
                onChange={e=>setForm(f=>({...f,horaFin:e.target.value}))}>
                {HORAS_FORM.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Edificio */}
          <div className={styles.formField}>
            <label>Edificio (opcional)</label>
            <div className={styles.edificioGrid}>
              {EDIFICIOS.map(edif=>(
                <button key={edif.id}
                  className={`${styles.edificioBtn} ${form.edificio===edif.id?styles.edificioBtnActive:""}`}
                  onClick={()=>setForm(f=>({...f,edificio:edif.id,lado:"",salon:""}))}>
                  <span>{edif.icon}</span><span>{edif.nombre}</span>
                </button>
              ))}
            </div>
          </div>
          {ed?.lados && (
            <div className={styles.formField}>
              <label>Lado</label>
              <div className={styles.ladoRow}>
                {ed.lados.map(l=>(
                  <button key={l}
                    className={`${styles.ladoBtn} ${form.lado===l?styles.ladoBtnActive:""}`}
                    onClick={()=>setForm(f=>({...f,lado:l,salon:""}))}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
          {form.edificio && (
            <div className={styles.formField}>
              <label>Salón</label>
              <div className={styles.salonGrid}>
                {ed?.salones.map(s=>(
                  <button key={s}
                    className={`${styles.salonBtn} ${form.salon===s?styles.salonBtnActive:""}`}
                    onClick={()=>setForm(f=>({...f,salon:s}))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {salonLabel && <div className={styles.salonPreview}>📍 {salonLabel}</div>}

          {/* Segundo día toggle */}
          <div className={styles.formField}>
            <label>
              <input type="checkbox" checked={form.segundoDiaActivo}
                onChange={e=>setForm(f=>({...f,segundoDiaActivo:e.target.checked}))} />
              {" "}Agregar segundo día de clase
            </label>
          </div>

          {form.segundoDiaActivo && (<>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Día 2</label>
                <select className={styles.select} value={form.dia2}
                  onChange={e=>setForm(f=>({...f,dia2:e.target.value}))}>
                  <option value="">—</option>
                  {diasActivos.filter(d=>d!==form.dia).map(id=>{
                    const d=TODOS_DIAS.find(x=>x.id===id);
                    return <option key={id} value={id}>{d?.label}</option>;
                  })}
                </select>
              </div>
              <div className={styles.formField}>
                <label>Inicio</label>
                <select className={styles.select} value={form.horaInicio2}
                  onChange={e=>setForm(f=>({...f,horaInicio2:e.target.value}))}>
                  {HORAS_FORM.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label>Fin</label>
                <select className={styles.select} value={form.horaFin2}
                  onChange={e=>setForm(f=>({...f,horaFin2:e.target.value}))}>
                  {HORAS_FORM.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            {/* Edificio 2 */}
            <div className={styles.formField}>
              <label>Edificio día 2 (opcional)</label>
              <div className={styles.edificioGrid}>
                {EDIFICIOS.map(edif=>(
                  <button key={edif.id}
                    className={`${styles.edificioBtn} ${form.edificio2===edif.id?styles.edificioBtnActive:""}`}
                    onClick={()=>setForm(f=>({...f,edificio2:edif.id,lado2:"",salon2:""}))}>
                    <span>{edif.icon}</span><span>{edif.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
            {ed2?.lados && (
              <div className={styles.formField}>
                <label>Lado día 2</label>
                <div className={styles.ladoRow}>
                  {ed2.lados.map(l=>(
                    <button key={l}
                      className={`${styles.ladoBtn} ${form.lado2===l?styles.ladoBtnActive:""}`}
                      onClick={()=>setForm(f=>({...f,lado2:l,salon2:""}))}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.edificio2 && (
              <div className={styles.formField}>
                <label>Salón día 2</label>
                <div className={styles.salonGrid}>
                  {ed2?.salones.map(s=>(
                    <button key={s}
                      className={`${styles.salonBtn} ${form.salon2===s?styles.salonBtnActive:""}`}
                      onClick={()=>setForm(f=>({...f,salon2:s}))}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {salonLabel2 && <div className={styles.salonPreview}>📍 {salonLabel2}</div>}
          </>)}

          <div className={styles.formField}>
            <label>Notas (opcional)</label>
            <input type="text" className={styles.input} value={form.notas}
              placeholder="ej: Traer portátil..." onChange={e=>setForm(f=>({...f,notas:e.target.value}))} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          {editando && <button className={styles.deleteBtn} onClick={onDelete}>🗑 Eliminar</button>}
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            {editando?"Guardar cambios":"Añadir clase"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ClaseBloque (main view) ───────────────────────────────────────────────
function ClaseBloque({ clase, materia, color, horaStart, duracion, onClick }) {
  const top=horaStart*64, height=duracion*64-4;
  return (
    <div className={styles.claseBloque}
      style={{top,height,"--clase-color":color}} onClick={onClick}
      title={`${materia?.id||clase.materiaId}${clase.grupo?` - ${clase.grupo}`:""}${clase.profesor?` · ${clase.profesor}`:""} | ${toViewHora(clase.horaInicio)}–${toViewHora(clase.horaFin)} | ${clase.salonLabel||""}`}>
      <div className={styles.claseBloqueBar}/>
      <div className={styles.claseBloqueContent}>
        <span className={styles.claseId}>
          {materia?.id||clase.materiaId}{clase.grupo ? ` - ${clase.grupo}` : ""}
        </span>
        {clase.profesor && <span className={styles.claseProfesor}>{clase.profesor}</span>}
        <span className={styles.claseHora}>{toViewHora(clase.horaInicio)}–{toViewHora(clase.horaFin)}</span>
        {clase.salonLabel && <span className={styles.claseSalon}>{clase.salonLabel}</span>}
      </div>
    </div>
  );
}

// ── MiniHorario: small schedule card for planner ─────────────────────────
function MiniHorario({ opcion, colorMap, materiasActuales, diasActivos, onEdit, onDelete, onRename, isSelected, onSelect, onAddClase }) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(opcion.nombre);

  const clases = opcion.clases || [];
  const diasConClases = [...new Set(clases.map(c=>c.dia))];
  const diasMostrar = TODOS_DIAS.filter(d=>
    diasActivos.includes(d.id) || diasConClases.includes(d.id)
  );

  // Rango de horas usado
  const usedHoras = clases.flatMap(c=>{
    const s=horaIdx(c.horaInicio), e=horaIdx(c.horaFin);
    return s>=0&&e>s ? Array.from({length:e-s+1},(_,i)=>s+i) : [];
  });
  const minH = usedHoras.length ? Math.max(0, Math.min(...usedHoras)-1) : 1;
  const maxH = usedHoras.length ? Math.min(LEGACY_HORAS.length-1, Math.max(...usedHoras)+1) : 9;
  const visHoras = LEGACY_HORAS.slice(minH, maxH+1);
  const CELL_H = 40;

  const totalCred = [...new Set(clases.map(c=>c.materiaId))]
    .reduce((sum,id)=>{
      const m=materiasActuales.find(x=>x.id===id);
      return sum+(m?.creditos||0);
    },0);

  return (
    <div className={`${styles.miniCard} ${isSelected?styles.miniCardSelected:""}`}
      onClick={onSelect}>
      {/* Header */}
      <div className={styles.miniCardHeader}>
        <div className={styles.miniCardName}>
          {editingName ? (
            <input className={styles.miniCardNameInput} value={tempName} autoFocus
              onClick={e=>e.stopPropagation()}
              onChange={e=>setTempName(e.target.value)}
              onBlur={()=>{ onRename(tempName||opcion.nombre); setEditingName(false); }}
              onKeyDown={e=>{ if(e.key==="Enter"){ onRename(tempName||opcion.nombre); setEditingName(false); } }} />
          ) : (
            <span onDoubleClick={e=>{ e.stopPropagation(); setEditingName(true); }}>
              {opcion.nombre}
            </span>
          )}
          {isSelected && <span className={styles.miniCardBadge}>Activa</span>}
        </div>
        <div className={styles.miniCardActions}>
          <button className={styles.miniActionBtn} title="Renombrar"
            onClick={e=>{ e.stopPropagation(); setEditingName(true); }}>✎</button>
          <button className={`${styles.miniActionBtn} ${styles.miniActionBtnDanger}`}
            title="Eliminar opción" onClick={e=>{ e.stopPropagation(); onDelete(); }}>🗑</button>
        </div>
      </div>

      {/* Mini grid */}
      <div className={styles.miniGridWrap}>
        <div className={styles.miniGridInner} style={{"--num-dias":diasMostrar.length}}>
          {/* Hora col */}
          <div>
            <div className={styles.miniHoraColHeader}/>
            {visHoras.map(h=>(
              <div key={h} className={styles.miniHoraColCell}>{h}</div>
            ))}
          </div>
          {/* Día cols */}
          {diasMostrar.map(dia=>(
            <div key={dia.id} className={styles.miniDiaCol}>
              <div className={styles.miniDiaHeader}>{dia.id}</div>
              <div className={styles.miniDiaBody}>
                {visHoras.map(h=>( <div key={h} className={styles.miniHoraLine}/> ))}
                {clases.filter(c=>c.dia===dia.id).map((clase,i)=>{
                  const s=horaIdx(clase.horaInicio)-minH;
                  const dur=horaIdx(clase.horaFin)-horaIdx(clase.horaInicio);
                  if(s<0||dur<=0) return null;
                  const color=colorMap[clase.materiaId]||"var(--accent)";
                  const miniLabel = `${clase.materiaId}${clase.grupo?` - ${clase.grupo}`:""}`;
                  return (
                    <div key={i} className={styles.miniBloqueAbs}
                      style={{top:s*CELL_H, height:dur*CELL_H-2,"--bloque-color":color}}
                      onClick={e=>{ e.stopPropagation(); onEdit({claseIdx:opcion.clases.indexOf(clase),...clase}); }}
                      title={`${miniLabel}${clase.profesor?` · ${clase.profesor}`:""} ${toViewHora(clase.horaInicio)}–${toViewHora(clase.horaFin)}`}>
                      <span className={styles.miniBloqueAbsId}>{miniLabel}</span>
                      <span className={styles.miniBloqueAbsHora}>{toViewHora(clase.horaInicio)}</span>
                      {clase.profesor && dur*CELL_H>=44 && (
                        <span className={styles.miniBloqueAbsProf}>{clase.profesor}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats + add */}
      <div className={styles.miniStats}>
        <span className={styles.miniStat}><strong>{clases.length}</strong> clases</span>
        <span className={styles.miniStat}><strong>{totalCred}</strong> créditos</span>
        <span className={styles.miniStat}>
          <strong>{[...new Set(clases.map(c=>c.dia))].length}</strong> días
        </span>
      </div>
      <div className={styles.planClaseAddRow}>
        <button className={styles.planClaseAddBtn}
          onClick={e=>{ e.stopPropagation(); onAddClase(); }}>
          + Agregar clase a esta opción
        </button>
      </div>
    </div>
  );
}

// ── PlanificadorView ──────────────────────────────────────────────────────
function PlanificadorView({ malla, planData, onSavePlan, user, onNotify, mainDias }) {
  const allMaterias = malla.flatMap((s) => s.materias);
  const materiasActuales = allMaterias.filter((m) => m.estado === "cursando");
  const materiasDisponibles = allMaterias.filter(
    (m) => canEnrollMateria(m, allMaterias) || m.estado === "cursando"
  );
  // El colorMap debe cubrir TODAS las materias agendables aquí (no solo
  // las que están en curso), o muchas terminan compartiendo el mismo color.
  const coloreables = materiasDisponibles.length ? materiasDisponibles : materiasActuales;
  const colorMap = {};
  coloreables.forEach((m,i)=>{ colorMap[m.id]=ACCENT_COLORS[i%ACCENT_COLORS.length]; });

  const [opciones, setOpciones] = useState(planData?.opciones || []);
  const [selectedIdx, setSelectedIdx] = useState(planData?.selectedIdx ?? 0);
  const [modalState, setModalState] = useState(null); // {opcionIdx, editando?}

  useEffect(() => {
    setOpciones(planData?.opciones || []);
    setSelectedIdx(planData?.selectedIdx ?? 0);
  }, [planData]);

  const save = (newOpciones, newSelected) => {
    const d = { opciones: newOpciones, selectedIdx: newSelected??selectedIdx };
    setOpciones(newOpciones);
    onSavePlan(d);
  };

  const addOpcion = () => {
    const nombre = `Opción ${opciones.length+1}`;
    const nueva = { nombre, clases:[], dias:mainDias };
    const next = [...opciones, nueva];
    save(next, next.length-1);
    setSelectedIdx(next.length-1);
    onNotify?.("Nueva opción creada");
  };

  const deleteOpcion = (idx) => {
    const next = opciones.filter((_,i)=>i!==idx);
    const newSel = Math.min(selectedIdx, next.length-1);
    save(next, newSel>=0?newSel:0);
    setSelectedIdx(newSel>=0?newSel:0);
    onNotify?.("Opción eliminada");
  };

  const renameOpcion = (idx, nombre) => {
    const next = opciones.map((o,i)=>i===idx?{...o,nombre}:o);
    save(next);
  };

  const handleSaveClase = ({clases:nuevasClases}) => {
    if (!modalState) return;
    const {opcionIdx, editando} = modalState;
    const opcion = opciones[opcionIdx];
    let clasesList = [...(opcion.clases || [])];
    if (editando?.claseIdx !== undefined) {
      clasesList.splice(editando.claseIdx, 1, ...nuevasClases);
    } else {
      clasesList = [...clasesList, ...nuevasClases];
    }
    const next = opciones.map((o,i)=>i===opcionIdx?{...o,clases:clasesList}:o);
    save(next);
    setModalState(null);
    onNotify?.(editando?"Clase actualizada":"Clase agregada");
  };

  const handleDeleteClase = () => {
    if (!modalState?.editando) return;
    const {opcionIdx, editando} = modalState;
    const clases = opciones[opcionIdx].clases.filter((_,i)=>i!==editando.claseIdx);
    const next = opciones.map((o,i)=>i===opcionIdx?{...o,clases}:o);
    save(next);
    setModalState(null);
    onNotify?.("Clase eliminada");
  };

  const diasActivos = mainDias || ["L","M","X","J","V"];

  return (
    <div className={styles.planWrap}>
      {/* Top bar */}
      <div className={styles.planTopBar}>
        <div className={styles.planOpciones}>
          <span className={styles.planOpcionLabel}>Opciones:</span>
          {opciones.map((op,i)=>(
            <button key={i}
              className={`${styles.planOpcionBtn} ${selectedIdx===i?styles.planOpcionBtnActive:""}`}
              onClick={()=>setSelectedIdx(i)}>
              <span className={styles.planOpcionDot}
                style={{background: selectedIdx===i?"var(--accent)":"var(--border)"}}/>
              {op.nombre}
            </button>
          ))}
          <button className={styles.planAddBtn} onClick={addOpcion}>+ Nueva opción</button>
        </div>
      </div>

      {/* Opciones en grid mini */}
      {opciones.length === 0 ? (
        <div className={styles.planEmptyState}>
          <span className={styles.planEmptyIcon}>🗓️</span>
          <p style={{fontWeight:600,marginBottom:6}}>Aún no tienes opciones de horario</p>
          <p style={{fontSize:13}}>Crea varias opciones y compara cuál te acomoda mejor.</p>
          <button className={styles.planAddBtn} style={{marginTop:16}} onClick={addOpcion}>
            + Crear primera opción
          </button>
        </div>
      ) : (
        <div className={styles.planGrid}>
          {opciones.map((op,i)=>(
            <MiniHorario key={i}
              opcion={op}
              colorMap={colorMap}
              materiasActuales={materiasActuales}
              diasActivos={diasActivos}
              isSelected={selectedIdx===i}
              onSelect={()=>setSelectedIdx(i)}
              onDelete={()=>deleteOpcion(i)}
              onRename={(n)=>renameOpcion(i,n)}
              onEdit={(editando)=>setModalState({opcionIdx:i,editando})}
              onAddClase={()=>setModalState({opcionIdx:i})}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalState && (
        <ClaseModal
          materiasDisponibles={materiasDisponibles}
          diasActivos={diasActivos}
          editando={modalState.editando?.claseIdx!==undefined ? modalState.editando : null}
          onSave={handleSaveClase}
          onDelete={handleDeleteClase}
          onNotify={onNotify}
          onClose={()=>setModalState(null)}
        />
      )}
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function HorarioView({ malla, horarioData, planData, onSave, onSavePlan, user, onNotify }) {
  const [mode, setMode] = useState("horario"); // "horario" | "planificador"
  const [data, setData] = useState(horarioData || {dias:["L","M","X","J","V"],clases:[]});
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    setData(horarioData || {dias:["L","M","X","J","V"],clases:[]});
  }, [horarioData]);

  const materiasActuales = malla.flatMap(s=>s.materias).filter(m=>m.estado==="cursando");
  const colorMap = {};
  materiasActuales.forEach((m,i)=>{ colorMap[m.id]=ACCENT_COLORS[i%ACCENT_COLORS.length]; });

  const toggleDia = (id) => {
    const dias = data.dias.includes(id)
      ? data.dias.filter(d=>d!==id)
      : [...data.dias,id].sort((a,b)=>TODOS_DIAS.findIndex(x=>x.id===a)-TODOS_DIAS.findIndex(x=>x.id===b));
    const updated={...data,dias};
    setData(updated); onSave(updated);
    onNotify?.("Días actualizados");
  };

  const handleAddClase = (clase) => {
    const nuevasClases=clase?.clases||[];
    let clases;
    if (editando!==null&&editando.claseIdx!==undefined) {
      clases=data.clases.map((c,i)=>i===editando.claseIdx?nuevasClases[0]:c);
    } else {
      clases=[...data.clases,...nuevasClases];
    }
    const updated={...data,clases};
    setData(updated); onSave(updated); setShowModal(false); setEditando(null);
    onNotify?.(editando!==null&&editando.claseIdx!==undefined?"Clase actualizada":"Clase agregada");
  };

  const handleDeleteClase=(idx)=>{
    const clases=data.clases.filter((_,i)=>i!==idx);
    const updated={...data,clases};
    setData(updated); onSave(updated); setShowModal(false); setEditando(null);
    onNotify?.("Clase eliminada");
  };

  const diasActivos=TODOS_DIAS.filter(d=>data.dias.includes(d.id));

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Horario</h2>
          <p className={styles.subtitle}>Semestre actual · {materiasActuales.length} materias</p>
        </div>
        {mode==="horario" && (
          <button className={styles.addBtn} onClick={()=>{ setEditando(null); setShowModal(true); }}>
            + Añadir clase
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div className={styles.modeBar}>
        <div className={styles.modeToggleGroup}>
          {[{id:"horario",label:"🗓 Mi horario"},{id:"planificador",label:"✦ Planificar"}].map(m=>(
            <button key={m.id}
              className={`${styles.modeToggleBtn} ${mode===m.id?styles.modeToggleBtnActive:""}`}
              onClick={()=>setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MODO HORARIO ── */}
      {mode==="horario" && (<>
        <div className={styles.diasRow}>
          <span className={styles.diasLabel}>Días activos:</span>
          {TODOS_DIAS.map(d=>(
            <button key={d.id}
              className={`${styles.diaBtn} ${data.dias.includes(d.id)?styles.diaBtnActive:""}`}
              onClick={()=>toggleDia(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        {materiasActuales.length>0 && (
          <div className={styles.legendRow}>
            {materiasActuales.map(m=>(
              <div key={m.id} className={styles.legendItem}>
                <span className={styles.legendDot} style={{background:colorMap[m.id]}}/>
                <span className={styles.legendId}>{m.id}</span>
                <span className={styles.legendNombre}>{m.nombre}</span>
              </div>
            ))}
          </div>
        )}

        {materiasActuales.length===0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📅</span>
            <p>No tienes materias en estado <strong>Cursando</strong>.</p>
            <p>Ve a la <strong>Malla</strong> y cambia el estado de tus materias actuales.</p>
          </div>
        )}

        {diasActivos.length>0 && (
          <div className={styles.gridWrap}>
            <div className={styles.grid} style={{"--num-dias":diasActivos.length}}>
              <div className={styles.horaCol}>
                <div className={styles.horaColHeader}/>
                {LEGACY_HORAS.map(h=>( <div key={h} className={styles.horaCell}>{h}</div> ))}
              </div>
              {diasActivos.map(dia=>(
                <div key={dia.id} className={styles.diaCol}>
                  <div className={styles.diaHeader}>{dia.label}</div>
                  <div className={styles.diaBody}>
                    {LEGACY_HORAS.map(h=>( <div key={h} className={styles.horaLine}/> ))}
                    {data.clases.filter(c=>c.dia===dia.id).map((clase,i)=>{
                      const globalIdx=data.clases.indexOf(clase);
                      const start=horaIdx(clase.horaInicio), end=horaIdx(clase.horaFin);
                      if(start<0||end<=start) return null;
                      const materia=materiasActuales.find(m=>m.id===clase.materiaId);
                      return (
                        <ClaseBloque key={i} clase={clase} materia={materia}
                          color={colorMap[clase.materiaId]||"var(--accent)"}
                          horaStart={start} duracion={end-start}
                          onClick={()=>{ setEditando({claseIdx:globalIdx,...clase,segundoDiaActivo:false}); setShowModal(true); }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}

      {/* ── MODO PLANIFICADOR ── */}
      {mode==="planificador" && (
        <PlanificadorView
          malla={malla}
          planData={planData}
          onSavePlan={onSavePlan}
          user={user}
          onNotify={onNotify}
          mainDias={data.dias}
        />
      )}

      {/* Modal horario principal */}
      {showModal && (
        <ClaseModal
          materiasDisponibles={materiasActuales}
          diasActivos={data.dias}
          editando={editando?.claseIdx!==undefined?editando:null}
          onSave={handleAddClase}
          onDelete={()=>handleDeleteClase(editando.claseIdx)}
          onNotify={onNotify}
          onClose={()=>{ setShowModal(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
