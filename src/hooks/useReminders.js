import { useEffect, useRef, useState, useCallback } from "react";
import { computeDueNotifications, formatDue } from "../utils/reminders.js";
import { enablePush, disablePush, fetchPushState, markServerNotified, sendTestPush, isStandalone } from "../utils/push.js";

const LS_NOTIFIED = "malla_notified_v1";
const LS_DISMISSED = "malla_dismissed_v1";

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

export default function useReminders({ items, eventos }) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState(null);
  const [due, setDue] = useState([]);
  const notifiedRef = useRef(loadSet(LS_NOTIFIED));
  const dismissedRef = useRef(loadSet(LS_DISMISSED));
  const lastKeyRef = useRef("");

  const activatePush = useCallback(async () => {
    setPushError(null);
    const r = await enablePush();
    setPushEnabled(r.ok);
    if (!r.ok) setPushError(r.error);
    return r.ok;
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") await activatePush();
  }, [activatePush]);

  const disablePushCb = useCallback(async () => {
    await disablePush();
    setPushEnabled(false);
    setPushError(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const state = await fetchPushState();
      if (!mounted) return;
      if (state.sentKeys.length > 0) {
        state.sentKeys.forEach((k) => notifiedRef.current.add(k));
        saveSet(LS_NOTIFIED, notifiedRef.current);
      }
      setPushEnabled(state.subscribed && isStandalone());
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        !state.subscribed &&
        isStandalone()
      ) {
        const r = await enablePush();
        if (mounted) setPushEnabled(r.ok);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const scan = () => {
      const now = new Date();
      const found = computeDueNotifications({ items, eventos }, now);
      const fresh = found.filter(
        (n) => !notifiedRef.current.has(n.key) && !dismissedRef.current.has(n.key)
      );
      if (fresh.length > 0) {
        const first = fresh[0];
        if (lastKeyRef.current !== first.key) {
          lastKeyRef.current = first.key;
          if (permission === "granted" && typeof Notification !== "undefined") {
            try {
              new Notification("MiMalla · Recordatorio", {
                body: `${first.titulo} · ${formatDue(first)}`,
                tag: first.key,
              });
            } catch (_) {}
          }
        }
        const keys = fresh.map((n) => n.key);
        keys.forEach((k) => notifiedRef.current.add(k));
        saveSet(LS_NOTIFIED, notifiedRef.current);
        markServerNotified(keys);
      }
      setDue(found.filter((n) => !dismissedRef.current.has(n.key)));
    };
    scan();
    const id = setInterval(scan, 60000);
    return () => clearInterval(id);
  }, [items, eventos, permission]);

  const dismiss = useCallback((key) => {
    dismissedRef.current.add(key);
    saveSet(LS_DISMISSED, dismissedRef.current);
    setDue((prev) => prev.filter((n) => n.key !== key));
  }, []);

  const sendTest = useCallback(async () => {
    if (permission !== "granted" || typeof Notification === "undefined") return;
    if (pushEnabled) {
      const r = await sendTestPush();
      if (r && r.ok) return;
    }
    try {
      new Notification("MiMalla · Prueba", {
        body: "¡Las notificaciones funcionan! Esta es una prueba.",
        tag: "malla-test-" + Date.now(),
      });
    } catch (_) {}
  }, [permission, pushEnabled]);

  return { due, permission, requestPermission, dismiss, sendTest, pushEnabled, pushError, activatePush, disablePush: disablePushCb };
}
