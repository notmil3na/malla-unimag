import { useEffect, useState } from "react";
import styles from "./UpdatePrompt.module.css";
import { IconStar } from "./Icons";

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
      <div className={styles.logo}><IconStar size={30} /></div>
      <h2 className={styles.title}>Actualización disponible</h2>
      <p className={styles.text}>
        Se descargó una versión nueva de MiMalla con mejoras y correcciones.
        Recarga la página para ver los últimos cambios.
      </p>
      <button className={styles.btn} onClick={reload}>Recargar ahora</button>
      <button className={styles.btnGhost} onClick={() => setShow(false)}>Ahora no</button>
      <p className={styles.note}>Tus datos están a salvo: solo se actualiza la interfaz.</p>
    </div>
  );
}
