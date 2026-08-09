---
version: 1
slug: "src-pages-login-jsx"
primary_target: "src/pages/Login.jsx"
related_targets: []
---

# Surface brief — Login (src/pages/Login.jsx)

**Scope:** Pantalla de autenticación completa (login / registro / recuperación de
contraseña en 3 pasos) dentro del mundo visual Atlas Aurora.
**Modo:** Operate — el visitante completa una tarea (entrar, crear cuenta, recuperar
acceso) y pasa a la app. Nada aquí puede estar por encima de la tarea.

**Audiencia / trabajo:** Estudiante de la Universidad del Magdalena, PWA de uso
diario, mayormente móvil. Trabajo = iniciar sesión en ~10s, registrar cuenta,
recuperar acceso con pregunta de seguridad.

**Contenido / prueba:** Marca "MiMalla" + tagline "Mi plan de estudio <3"; tabs
Iniciar sesión / Registrarse; campos usuario, contraseña, nombre, carrera y corte;
hint del semestre calculado; mensajes de error/éxito; enlace de recuperación.

**Restricciones:** Mantener el 100% de la lógica y arquitectura (handlers, estado,
flujos, mensajes, autocomplete). Mantener la identidad Atlas Aurora: cielo aurora,
vidrio esmerilado, oro escaso (foco/activo/marca), radios 10/14/18/26, DM Serif
Display itálico + DM Sans, etiquetas en mayúsculas con tracking, estrella ✦ como
único movimiento perpetuo.

**Dirección elegida — "La Malla en el Cielo":** el login deja de ser una tarjeta
centrada. El cielo aurora a pantalla completa es el escenario; una constelación de
cinco materias reales de primer semestre (ALG1, CAL1, MAD1, IIS1, PLE1, de
`src/data/malla.js`) dibuja la malla en trazos de oro; la marca es una placa serif
con la estrella giratoria; el formulario es una consola de vidrio tipo dock que
aterriza en el borde inferior en móvil y flota centrado en desktop.

**Momento memorable:** al enfocar un campo, su estrella se enciende en oro y un
subrayado dorado barre el input — cada campo que llenas une una estrella a tu malla.
La estrella permanece encendida mientras el campo guarda contenido (no solo en
foco), también en selects (carrera/corte) mediante `:has(select option:checked)`.

**Placa de marca:** vidrio esmerilado honesto (gradiente surface→surface2, borde,
blur+saturate, radio 18, sombra soft) — nunca imitación de grabado.

**Etiquetas de la constelación:** 9px (micro-etiqueta decorativa por debajo del
ramp de 11px, intencional por escala de la constelación).

**Revisión final (verdict pass):** fix 1 guarda de altura de la constelación
`min(540px, 92vw, max(220px, calc(1.25 * 100dvh - 620px)))` — resuelto en
1440x900 / 390x844 / 768x700 / 375x667; piso 220px evita colapso en viewports
cortos (700x450). fix 2 placa de vidrio real — resuelto. fix 3 estrella con
contenido, inputs y selects — resuelto. fix 4 radios 8px→10px en chips de
error/éxito/secureBadge — resuelto. fix 5 halo del dock con offset positivo —
resuelto. fix 6 overrides light-mode eliminados (código muerto: sin sesión el
login siempre renderiza oscuro por defecto de `index.html`; sin afirmación
verificable). placeholder ahora `var(--text-muted)` (≥4.5:1 en ambos temas).
`@media (max-height: 780px)` eleva la placa a 4vh para despejar el nodo superior.

**Pendiente / decisiones abiertas:** comportamiento visual en el paso 0 de
recuperación (usuario sin pregunta configurada) usa la tarjeta de error existente.
