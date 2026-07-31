import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          const isUpdate = !!reg.active;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && isUpdate) {
              window.dispatchEvent(new CustomEvent("mimalla:swupdate"));
            }
          });
        });
      })
      .catch((err) => console.warn("Service Worker no disponible:", err));
  });
}
