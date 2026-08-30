import { useEffect } from "react";

/**
 * Corrige un bug conocido de WebKit/iOS: al usar interactive-widget=resizes-content,
 * a veces 100dvh queda "pegado" en el alto reducido (el que tenía con el teclado
 * abierto) incluso después de cerrar el teclado, dejando un hueco en la parte
 * inferior de TODA la app hasta que algo fuerza un recálculo.
 *
 * IMPORTANTE: no le inyectamos a la página un alto medido por nosotros
 * (window.visualViewport.height puede no incluir el área del home indicator
 * incluso sin teclado, lo que dejaría el hueco de forma permanente). En vez de
 * eso, le damos a Safari un empujoncito (un scroll de 1px que overflow:hidden
 * cancela visualmente) para que él mismo vuelva a calcular su propio valor de
 * dvh, que sí es correcto.
 */
export default function useAppHeightFix() {
  useEffect(() => {
    let raf1 = null;
    let timer = null;

    const nudge = () => {
      window.scrollTo(0, 1);
      raf1 = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    };

    // Al salir el foco de un input/textarea (teclado cerrándose), esperamos
    // a que la animación del teclado termine y recién ahí empujamos.
    const onFocusOut = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(nudge, 350);
    };
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      document.removeEventListener("focusout", onFocusOut, true);
      if (raf1) cancelAnimationFrame(raf1);
      if (timer) clearTimeout(timer);
    };
  }, []);
}
