import { useEffect, useState } from "react";
import styles from "./UpdatePrompt.module.css";

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onUpdate = () => setShow(true);
    window.addEventListener("mimalla:swupdate", onUpdate);
    return () => window.removeEventListener("mimalla:swupdate", onUpdate);
  }, []);

  const reload = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch (_) {}
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Actualización disponible">
      <div className={styles.card}>
        <span className={styles.icon}>✦</span>
        <h2 className={styles.title}>Actualización disponible</h2>
        <p className={styles.text}>
          Se descargó una nueva versión de MiMalla. Recarga la página para ver los últimos cambios.
        </p>
        <button className={styles.btn} onClick={reload}>Recargar ahora</button>
      </div>
    </div>
  );
}
