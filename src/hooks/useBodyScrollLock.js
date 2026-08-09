import { useEffect } from "react";

let lockCount = 0;
let prevOverflow = "";
let prevPaddingRight = "";

export default function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      prevOverflow = document.body.style.overflow;
      prevPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPaddingRight;
      }
    };
  }, [active]);
}
