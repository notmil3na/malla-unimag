import { memo } from "react";
import styles from "./MateriaCard.module.css";

const ESTADO_GLYPH = {
  faltante: "○",
  cursando: "◐",
  aprobada: "✦",
};

function MateriaCardInner({
  materia, color, isSelected, isHighlightedPrereq, isHighlightedUnlock,
  isMatriculable, isDimmed, borderRadius, fontScale, onClick
}) {
  const br = borderRadius ?? 12;
  const fs = fontScale ?? 1;

  let cardClass = styles.card;
  if (isSelected) cardClass += " " + styles.selected;
  else if (isHighlightedPrereq) cardClass += " " + styles.highlighted;
  else if (isHighlightedUnlock) cardClass += " " + styles.unlocked;
  else if (isMatriculable) cardClass += " " + styles.matriculable;
  else if (isDimmed) cardClass += " " + styles.dimmed;

  const glyph = ESTADO_GLYPH[materia.estado] || ESTADO_GLYPH.faltante;

  return (
    <div
      className={cardClass}
      style={{
        "--card-color": color,
        borderRadius: `${br}px`,
        fontSize: `calc(11px * ${fs})`,
      }}
      onClick={onClick}
    >
      <div className={styles.colorBar} style={{ background: color, borderRadius: `${br}px ${br}px 0 0` }} />
      <span className={styles.estadoGlyph} style={{ color }}>{glyph}</span>
      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.id}>{materia.id}</span>
          <span className={styles.creditos}>{materia.creditos}cr</span>
        </div>
        <p className={styles.nombre}>{materia.nombre}</p>
        {isMatriculable && (
          <div className={styles.matriculableBadge}>✦ Puedes matricular</div>
        )}
        {materia.prereqs?.length > 0 && (
          <div className={styles.prereqBadge}>
            <span>⬡</span> {materia.prereqs.length} prereq{materia.prereqs.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MateriaCardInner);