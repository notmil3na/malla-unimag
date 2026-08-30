import { useState, useEffect } from "react";

/** Área visible real (teclado virtual, barra del navegador, notch). */
export default function useVisualViewportRect(active = true) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const update = () => {
      setRect({
        top: Math.max(0, Math.round(vv.offsetTop)),
        height: Math.max(0, Math.round(vv.height)),
        width: Math.max(0, Math.round(vv.width)),
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [active]);

  return rect;
}
