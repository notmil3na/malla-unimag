import styles from "./MateriaCard.module.css";

export default function MateriaCard({
  materia, color, isSelected, isHighlighted, isDimmed,
  borderRadius, fontScale, onClick, onEstadoChange
}) {
  const br = borderRadius ?? 12;
  const fs = fontScale ?? 1;

  let cardClass = styles.card;
  if (isSelected) cardClass += " " + styles.selected;
  else if (isHighlighted) cardClass += " " + styles.highlighted;
  else if (isDimmed) cardClass += " " + styles.dimmed;

  const hasPrereqs = materia.prereqs?.length > 0;

  return (
    <div
      className={cardClass}
      style={{
        "--card-color": color,
        borderRadius: `${br}px`,
        fontSize: `calc(11px * ${fs})`,
      }}
      onClick={onClick}
      title={hasPrereqs ? `Prerequisitos: ${materia.prereqs.join(", ")}` : "Sin prerequisitos"}
    >
      <div className={styles.colorBar} style={{ background: color, borderRadius: `${br}px ${br}px 0 0` }} />
      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.id}>{materia.id}</span>
          <span className={styles.creditos}>{materia.creditos}cr</span>
        </div>
        <p className={styles.nombre}>{materia.nombre}</p>
        {hasPrereqs && (
          <div className={styles.prereqBadge}>
            <span>⬡</span> {materia.prereqs.length} prereq{materia.prereqs.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
