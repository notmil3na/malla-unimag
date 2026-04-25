import { useState } from "react";
import { CORTES, corteForSemester } from "../App";
import styles from "./PerfilView.module.css";

const UNIVERSITIES = {
  "Universidad del Magdalena": ["Ingeniería de Sistemas"],
};

export default function PerfilView({ user, onUpdate, onMallaReset, malla }) {
  const [form, setForm] = useState({
    name:         user.name         || "",
    university:   user.university   || "",
    career:       user.career       || "",
    semester:     user.semester     || 1,
    ingresoCorte: user.ingresoCorte || "2023-2",
    photo:        user.photo        || null,
  });
  const [saved, setSaved] = useState(false);

  // Materias cursando actualmente
  const materiasActuales = (malla || [])
    .flatMap(s => s.materias)
    .filter(m => m.estado === "cursando");

  const totalCreditosCursando = materiasActuales.reduce((a, m) => a + m.creditos, 0);

  const corteActual = corteForSemester(form.ingresoCorte, Number(form.semester));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newSem = Number(form.semester);
    if (newSem < 1 || newSem > 12) return;
    if (newSem !== user.semester) {
      onMallaReset(newSem);
    }
    onUpdate({ ...user, ...form, semester: newSem });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initial = form.name ? form.name[0].toUpperCase() : "?";
  const availableCareers = form.university ? (UNIVERSITIES[form.university] || []) : [];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mi Perfil</h2>
        <p className={styles.subtitle}>Personaliza tu información universitaria</p>
      </div>

      <div className={styles.twoCol}>
        {/* ── Columna izquierda: datos personales ── */}
        <div className={styles.card}>
          {/* Avatar */}
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {form.photo
                ? <img src={form.photo} alt="foto" className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{initial}</span>
              }
              <label className={styles.avatarEdit} title="Cambiar foto">
                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                📷
              </label>
            </div>
            <div>
              <p className={styles.avatarName}>{form.name || "Sin nombre"}</p>
              <p className={styles.avatarSub}>{form.career || "—"}</p>
              {corteActual && (
                <p className={styles.avatarCorte}>Corte {corteActual}</p>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre completo</label>
              <input value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre" />
            </div>

            <div className={styles.field}>
              <label>Universidad</label>
              <select
                value={form.university}
                onChange={e => setForm({ ...form, university: e.target.value, career: "" })}
                className={styles.selectInput}
              >
                <option value="">— Selecciona —</option>
                {Object.keys(UNIVERSITIES).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Carrera</label>
              <select
                value={form.career}
                onChange={e => setForm({ ...form, career: e.target.value })}
                className={styles.selectInput}
                disabled={!form.university}
              >
                <option value="">— Selecciona —</option>
                {availableCareers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Corte de ingreso</label>
              <select
                value={form.ingresoCorte}
                onChange={e => setForm({ ...form, ingresoCorte: e.target.value })}
                className={styles.selectInput}
              >
                {CORTES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Semestre actual</label>
              <input
                type="number" min="1" max="12"
                value={form.semester}
                onChange={e => setForm({ ...form, semester: e.target.value })}
              />
              {Number(form.semester) !== user.semester && Number(form.semester) >= 1 && Number(form.semester) <= 12 && (
                <p className={styles.semesterHint}>
                  ⚠️ Al guardar, los semestres anteriores al {form.semester} se marcarán como aprobados automáticamente.
                </p>
              )}
            </div>
          </div>

          <button className={`${styles.btn} ${saved ? styles.btnSaved : ""}`} onClick={handleSave}>
            {saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>

        {/* ── Columna derecha: materias cursando ── */}
        <div className={styles.cursandoCol}>
          <div className={styles.cursandoHeader}>
            <span className={styles.cursandoTitle}>Materias cursando</span>
            <span className={styles.cursandoBadge}>
              {materiasActuales.length} materia{materiasActuales.length !== 1 ? "s" : ""}
              · {totalCreditosCursando} cr
            </span>
          </div>

          {corteActual && (
            <div className={styles.corteChip}>
              📅 Corte actual: <strong>{corteActual}</strong>
            </div>
          )}

          {materiasActuales.length === 0 ? (
            <div className={styles.cursandoEmpty}>
              <p>No tienes materias marcadas como <strong>Cursando</strong>.</p>
              <p>Ve a la <strong>Malla</strong> para actualizar los estados.</p>
            </div>
          ) : (
            <div className={styles.cursandoList}>
              {materiasActuales.map(m => (
                <div key={m.id} className={styles.cursandoItem}>
                  <div className={styles.cursandoItemBar} style={{ background: "var(--accent)" }} />
                  <div className={styles.cursandoItemBody}>
                    <span className={styles.cursandoItemId}>{m.id}</span>
                    <span className={styles.cursandoItemNombre}>{m.nombre}</span>
                  </div>
                  <span className={styles.cursandoItemCred}>{m.creditos} cr</span>
                </div>
              ))}
              {/* Total */}
              <div className={styles.cursandoTotal}>
                <span>Total créditos</span>
                <span className={styles.cursandoTotalVal}>{totalCreditosCursando}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
