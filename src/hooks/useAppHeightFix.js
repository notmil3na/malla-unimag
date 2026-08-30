import { useEffect } from "react";

/**
 * Corrige un bug conocido de WebKit/iOS: al usar interactive-widget=resizes-content,
 * a veces 100dvh queda "pegado" en el alto reducido (el que tenía con el teclado
 * abierto) incluso después de cerrar el teclado, dejando un hueco en la parte
 * inferior de TODA la app (no solo donde se usó el teclado), hasta que algo fuerza
 * un recálculo (rotar el teléfono, refrescar, etc).
 *
 * Este hook mantiene la variable --app-height sincronizada con el alto real del
 * viewport, con reintentos después de que el foco sale de un campo de texto
 * (momento típico en que WebKit no dispara el evento final a tiempo).
 * Vive en la raíz de la app y siempre está activo: normalmente es un no-op
 * (el valor ya es correcto), y solo corrige algo cuando WebKit se equivocó.
 */
export default function useAppHeightFix() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    const setHeight = () => {
      const h = Math.round((vv && vv.height) || window.innerHeight);
      if (h > 0) root.style.setProperty("--app-height", `${h}px`);
    };

    setHeight();

    if (vv) {
      vv.addEventListener("resize", setHeight);
      vv.addEventListener("scroll", setHeight);
    }
    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);

    // Al cerrar el teclado (foco sale de un input/textarea), WebKit a veces
    // no recalcula dvh a tiempo. Reintentamos un par de veces con pequeños
    // retrasos para agarrar el valor correcto una vez que el sistema asienta.
    const onFocusOut = () => {
      setTimeout(setHeight, 50);
      setTimeout(setHeight, 250);
      setTimeout(setHeight, 500);
    };
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", setHeight);
        vv.removeEventListener("scroll", setHeight);
      }
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      document.removeEventListener("focusout", onFocusOut, true);
    };
  }, []);
}
