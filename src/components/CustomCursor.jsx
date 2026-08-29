import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";

const TWINKLE_INTERVAL = 300;
const MAX_TWINKLES = 8;

export default function CustomCursor() {
  const dotRef = useRef(null);
  const [twinkles, setTwinkles] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const idRef = useRef(0);
  const mouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;
    setIsDesktop(true);

    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    document.addEventListener("mousemove", onMove);

    const twinkleTimer = setInterval(() => {
      const id = idRef.current++;
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 22;
      const rot = Math.random() * 360;
      const size = 6 + Math.random() * 6;
      const x = mouseRef.current.x + Math.cos(angle) * dist;
      const y = mouseRef.current.y + Math.sin(angle) * dist;
      setTwinkles((prev) => {
        const next = [...prev, { id, x, y, rot, size }];
        return next.length > MAX_TWINKLES ? next.slice(-MAX_TWINKLES) : next;
      });
      setTimeout(() => {
        setTwinkles((prev) => prev.filter((t) => t.id !== id));
      }, 800);
    }, TWINKLE_INTERVAL);

    return () => {
      document.removeEventListener("mousemove", onMove);
      clearInterval(twinkleTimer);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <div ref={dotRef} className={styles.cursor} />
      {twinkles.map((t) => (
        <div
          key={t.id}
          className={styles.twinkle}
          style={{
            left: t.x,
            top: t.y,
            width: t.size,
            height: t.size,
            "--rot": `${t.rot}deg`,
          }}
        />
      ))}
    </>
  );
}
