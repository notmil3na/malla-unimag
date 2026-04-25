import { useState } from "react";
import { APP_THEMES } from "../App";
import styles from "./TemaView.module.css";

const MALLA_PRESETS = [
  { name: "Ámbar oscuro",    colors: { cursando: "#c8a96e", aprobada: "#6ec88a", faltante: "#3a3a52" }, borderRadius: 12 },
  { name: "Océano",          colors: { cursando: "#6eb5c8", aprobada: "#6ec8b4", faltante: "#2a3a4a" }, borderRadius: 8 },
  { name: "Rosa pastel",     colors: { cursando: "#c8154b", aprobada: "#9bc86e", faltante: "#3a2a3a" }, borderRadius: 16 },
  { name: "Noche eléctrica", colors: { cursando: "#a86ec8", aprobada: "#6e8bc8", faltante: "#1a1a2e" }, borderRadius: 4 },
  { name: "Minimalista",     colors: { cursando: "#e0e0e0", aprobada: "#ffffff", faltante: "#2a2a2a" }, borderRadius: 0 },
];

// Fuentes elegibles con muestra de texto
export const FONT_OPTIONS = [
  { value: "DM Sans",         label: "DM Sans",         sample: "Aa — moderna y limpia" },
  { value: "Outfit",          label: "Outfit",           sample: "Aa — geométrica y suave" },
  { value: "Syne",            label: "Syne",             sample: "Aa — editorial y audaz" },
  { value: "Space Grotesk",   label: "Space Grotesk",    sample: "Aa — técnica y legible" },
  { value: "Josefin Sans",    label: "Josefin Sans",     sample: "Aa — art deco minimalista" },
  { value: "Raleway",         label: "Raleway",          sample: "Aa — elegante y delgada" },
  { value: "Lora",            label: "Lora",             sample: "Aa — serif clásica" },
  { value: "Playfair Display",label: "Playfair Display", sample: "Aa — serif de lujo" },
  { value: "Fraunces",        label: "Fraunces",         sample: "Aa — serif expresiva" },
];

export default function TemaView({ user, onUpdate }) {
  const [colors, setColors]             = useState(user.themeColors || MALLA_PRESETS[0].colors);
  const [borderRadius, setBorderRadius] = useState(user.borderRadius ?? 12);
  const [fontScale, setFontScale]       = useState(user.fontScale ?? 1);
  const [appMode, setAppMode]           = useState(user.appMode || "light");
  const [appTheme, setAppTheme]         = useState(user.appTheme || "ambar");
  const [fontBody, setFontBody]         = useState(user.fontBody || "DM Sans");
  const [saved, setSaved]               = useState(false);

  const handleSave = () => {
    onUpdate({ ...user, themeColors: colors, borderRadius, fontScale, appMode, appTheme, fontBody });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyPreset = (p) => { setColors(p.colors); setBorderRadius(p.borderRadius); };

  const colorFields = [
    { key: "cursando", label: "Cursando" },
    { key: "aprobada", label: "Aprobada" },
    { key: "faltante", label: "Faltante" },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Personalizar</h2>
        <p className={styles.subtitle}>Ajusta el aspecto visual de toda la aplicación</p>
      </div>

      {/* ── Modo oscuro / claro ─────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Modo de pantalla</h3>
        <div className={styles.modeRow}>
          {[
            { id: "dark",  icon: "🌙", label: "Oscuro" },
            { id: "light", icon: "☀️",  label: "Claro"  },
          ].map(m => (
            <button key={m.id}
              className={`${styles.modeBtn} ${appMode === m.id ? styles.modeBtnActive : ""}`}
              onClick={() => setAppMode(m.id)}>
              <span className={styles.modeIcon}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Tema de color de la app ─────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tema de la aplicación</h3>
        <div className={styles.appThemeGrid}>
          {Object.entries(APP_THEMES).map(([key, t]) => (
            <button key={key}
              className={`${styles.appThemeBtn} ${appTheme === key ? styles.appThemeBtnActive : ""}`}
              onClick={() => setAppTheme(key)}
              style={{ "--t-accent": t.accent }}>
              <span className={styles.appThemeDot} style={{ background: t.accent }} />
              <span>{t.name}</span>
              {appTheme === key && <span className={styles.appThemeCheck}>✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Fuente de texto ─────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Fuente de texto</h3>
        <div className={styles.fontGrid}>
          {FONT_OPTIONS.map(f => (
            <button key={f.value}
              className={`${styles.fontOptionBtn} ${fontBody === f.value ? styles.fontOptionActive : ""}`}
              onClick={() => setFontBody(f.value)}
              style={{ fontFamily: `'${f.value}', system-ui, sans-serif` }}>
              <span className={styles.fontOptionName}>{f.label}</span>
              <span className={styles.fontOptionSample}>{f.sample}</span>
              {fontBody === f.value && <span className={styles.fontOptionCheck}>✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Presets malla ──────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Presets de la malla</h3>
        <div className={styles.presets}>
          {MALLA_PRESETS.map(p => (
            <button key={p.name} className={styles.presetBtn} onClick={() => applyPreset(p)}>
              <div className={styles.presetSwatches}>
                {Object.values(p.colors).map((c, i) => (
                  <span key={i} className={styles.swatch} style={{ background: c, borderRadius: p.borderRadius }} />
                ))}
              </div>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Colores malla ──────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Colores de estado en la malla</h3>
        <div className={styles.colorGrid}>
          {colorFields.map(f => (
            <div key={f.key} className={styles.colorField}>
              <label>{f.label}</label>
              <div className={styles.colorInputWrap}>
                <input type="color" value={colors[f.key]}
                  onChange={e => setColors({ ...colors, [f.key]: e.target.value })}
                  className={styles.colorPicker} />
                <span className={styles.colorHex}>{colors[f.key]}</span>
                <div className={styles.colorPreviewCard} style={{ background: colors[f.key], borderRadius }}>
                  <span>Vista previa</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bordes ─────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Radio de bordes</h3>
        <div className={styles.borderPreviewRow}>
          {[0, 4, 8, 12, 16, 24].map(r => (
            <button key={r}
              className={`${styles.borderBtn} ${borderRadius === r ? styles.borderBtnActive : ""}`}
              style={{ borderRadius: `${r}px` }}
              onClick={() => setBorderRadius(r)}>
              {r}px
            </button>
          ))}
        </div>
        <input type="range" min={0} max={24} value={borderRadius}
          onChange={e => setBorderRadius(Number(e.target.value))}
          className={styles.rangeInput} />
      </section>

      {/* ── Escala de texto ─────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tamaño de texto</h3>
        <div className={styles.fontScaleRow}>
          {[{ v: 0.85, l: "Pequeño" }, { v: 1, l: "Normal" }, { v: 1.1, l: "Grande" }, { v: 1.2, l: "Extra" }].map(s => (
            <button key={s.v}
              className={`${styles.fontBtn} ${fontScale === s.v ? styles.fontBtnActive : ""}`}
              style={{ fontSize: `${11 * s.v}px` }}
              onClick={() => setFontScale(s.v)}>
              {s.l}
            </button>
          ))}
        </div>
      </section>

      {/* ── Vista previa tarjetas ─────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Vista previa de tarjetas</h3>
        <div className={styles.preview}>
          {colorFields.map(f => (
            <div key={f.key} className={styles.previewCard}
              style={{ borderRadius, "--card-color": colors[f.key], fontSize: `${11 * fontScale}px`, fontFamily: `'${fontBody}', system-ui` }}>
              <div className={styles.previewBar} style={{ background: colors[f.key], borderRadius: `${borderRadius}px ${borderRadius}px 0 0` }} />
              <div className={styles.previewContent}>
                <span style={{ color: colors[f.key], fontWeight: 700, fontSize: "0.85em" }}>MAT101</span>
                <p style={{ fontSize: "0.9em" }}>{f.label}</p>
                <span style={{ fontSize: "0.75em", color: "var(--text-muted)" }}>3cr</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button className={`${styles.btn} ${saved ? styles.btnSaved : ""}`} onClick={handleSave}>
        {saved ? "✓ Cambios aplicados" : "Aplicar y guardar"}
      </button>
    </div>
  );
}
