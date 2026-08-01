import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        const notify = (sw) => {
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event("mimalla:swupdate"));
            }
          });
        };
        if (reg.installing) notify(reg.installing);
        reg.addEventListener("updatefound", () => notify(reg.installing));

        // Busca versiones nuevas mientras la app está abierta: cada 15 min y
        // cada vez que el usuario vuelve a la app (foco/visibilidad). Sin esto
        // el navegador solo revisa al recargar y la pantalla nunca salía sola.
        const check = () => reg.update().catch(() => {});
        setInterval(check, 15 * 60 * 1000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        window.addEventListener("focus", check);
      })
      .catch((err) => console.warn("Service Worker no disponible:", err));
  });
}
