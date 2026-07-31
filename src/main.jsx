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
        const notify = (sw) => {
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              window.dispatchEvent(new Event("mimalla:swupdate"));
            }
          });
        };
        if (reg.installing) notify(reg.installing);
        reg.addEventListener("updatefound", () => notify(reg.installing));
      })
      .catch((err) => console.warn("Service Worker no disponible:", err));
  });
}
