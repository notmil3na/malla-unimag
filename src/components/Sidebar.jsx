import { APP_THEMES } from "../App";
import styles from "./Sidebar.module.css";

export default function Sidebar({ user, tabs, activeTab, onTabChange, onLogout, onUpdateUser }) {
  const initial = user.name ? user.name[0].toUpperCase() : "U";
  const mode    = user.appMode || "dark";
  const theme   = APP_THEMES[user.appTheme] || APP_THEMES.ambar;

  const toggleMode = () => {
    const next = mode === "dark" ? "light" : "dark";
    onUpdateUser({ ...user, appMode: next });
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand + mode toggle */}
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>✦</span>
          <span className={styles.brandText}>MiMalla</span>
        </div>
        <button className={styles.modeToggle} onClick={toggleMode} title={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          {mode === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Theme dot indicator */}
      <div className={styles.themeIndicator}>
        <span className={styles.themeDot} style={{ background: theme.accent }} />
        <span className={styles.themeLabel}>Tema {theme.name}</span>
      </div>

      {/* Profile */}
      <div className={styles.profile}>
        <div className={styles.avatar}>
          {user.photo
            ? <img src={user.photo} alt={user.name} className={styles.avatarImg} />
            : <span>{initial}</span>
          }
          <div className={styles.avatarRing} />
        </div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{user.name}</p>
          <p className={styles.profileSub}>Semestre {user.semester}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`${styles.navBtn} ${activeTab === t.id ? styles.active : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className={styles.navIcon}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <button className={styles.logout} onClick={onLogout}>
        <span>⎋</span> Cerrar sesión
      </button>
    </aside>
  );
}
