import { useState } from "react";
import { getSemesterCountdown, SEMESTER_CORTE } from "../utils/semesterCountdown.js";
import styles from "./SemesterCountdownWidget.module.css";

export default function SemesterCountdownWidget() {
  const [collapsed, setCollapsed] = useState(false);
  const semester = getSemesterCountdown();

  return (
    <aside
      className={`${styles.widget} ${collapsed ? styles.widgetCollapsed : ""}`}
      aria-label="Cuenta regresiva del semestre"
    >
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className={styles.toggleLabel}>Corte {SEMESTER_CORTE}</span>
        <span className={styles.toggleDays}>{semester.days}</span>
        <span className={styles.toggleIcon}>{collapsed ? "▴" : "▾"}</span>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          <div className={styles.top}>
            <div>
              <p className={styles.label}>Cuenta regresiva · Corte {SEMESTER_CORTE}</p>
              <p className={styles.range}>3 ago 2026 – 28 nov 2026</p>
            </div>
            <span className={styles.status}>{semester.status}</span>
          </div>

          <div className={styles.main}>
            <span className={styles.days}>{semester.days}</span>
            <span className={styles.daysText}>{semester.daysText}</span>
          </div>

          {semester.showProgress && (
            <>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${semester.progress}%` }}
                />
              </div>
              {semester.progressInfo && (
                <div className={styles.progressInfo}>
                  <span>{semester.progressInfo.left}</span>
                  <span>{semester.progressInfo.right}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
