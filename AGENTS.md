# AGENTS.md — MiMalla (malla-universitaria)

Reglas obligatorias para cualquier tarea de desarrollo en este proyecto.

## Despliegues: SIEMPRE avisar al usuario con el mensaje de recargar

Todo despliegue o actualización de código DEBE llegar al usuario con el aviso
de recarga ("Actualización disponible → Recargar ahora"). Esto es obligatorio.

Cómo funciona la cadena:
- `public/sw.js` → Service Worker. Su `CACHE` se renombra automáticamente en
  cada `npm run build` gracias al plugin `swCacheVersion` de `vite.config.js`.
- `src/main.jsx` → registra el SW y, cuando detecta una versión nueva mientras
  el SW anterior ya controla la app, dispara el evento `mimalla:swupdate`.
- `src/components/UpdatePrompt.jsx` → escucha ese evento y muestra el modal de
  "Actualización disponible" con el botón "Recargar ahora".

Reglas concretas:
1. NUNCA editar a mano la línea `const CACHE = "mimalla-v..."` de `sw.js`; el
   plugin de Vite la renombra solo. Si la cambias a mano, rompes el mecanismo.
2. NUNCA quitar ni renombrar el evento `mimalla:swupdate`, el registro del SW
   en `main.jsx` ni el componente `UpdatePrompt`.
3. Después de cualquier cambio de código, ejecutar SIEMPRE `npm run build` y
   verificar que `dist/sw.js` tenga un nombre de caché distinto al anterior.
4. Todo despliegue de producción se hace con `vercel --prod --yes`. El build
   regenera `sw.js`, de modo que el aviso de recarga llegue a los usuarios.
5. Si el despliegue falla o no se completa, decirlo al usuario y NO dar el
   trabajo por terminado.
