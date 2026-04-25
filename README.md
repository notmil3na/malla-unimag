# 🎓 MiMalla — Tu Plan de Estudios Visual

Aplicación web para visualizar tu malla curricular universitaria con soporte para estados de materias, prerequisitos, perfil de usuario y personalización visual completa.

---

## 🚀 Instalación paso a paso

### 1. Instala Node.js
Descárgalo desde https://nodejs.org (versión LTS recomendada)

### 2. Copia los archivos del proyecto
Coloca toda esta carpeta `malla-universitaria/` donde quieras en tu PC.

### 3. Instala dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

### 4. Inicia la aplicación

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:5173**

---

## 🔐 Credenciales de prueba

| Campo    | Valor        |
|----------|--------------|
| Usuario  | `estudiante` |
| Contraseña | `123456`   |

---

## ✨ Funcionalidades

- **Malla curricular** por semestres con scroll horizontal
- **3 estados** por materia: Aprobada ✓ / Cursando ◉ / Faltante ○
- **Prerequisitos** resaltados al hacer clic en una materia (se iluminan en cadena)
- **Cambio de estado** desde el panel de detalle (clic en cualquier tarjeta)
- **Perfil** con foto, nombre, universidad, carrera y semestre
- **Personalización** de colores, radio de bordes y escala de texto
- **5 presets** de color listos para aplicar
- **Persistencia** automática en localStorage (sin base de datos)

---

## 📁 Estructura del proyecto

```
malla-universitaria/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── data/
    │   └── malla.js          ← EDITA AQUÍ TU MALLA
    ├── pages/
    │   ├── Login.jsx / .module.css
    │   └── Dashboard.jsx / .module.css
    └── components/
        ├── Sidebar.jsx / .module.css
        ├── MallaView.jsx / .module.css
        ├── MateriaCard.jsx / .module.css
        ├── PerfilView.jsx / .module.css
        └── TemaView.jsx / .module.css
```

---

## ✏️ Personalizar la malla con tus materias

Edita el archivo `src/data/malla.js`.

Cada materia tiene esta forma:

```js
{
  id: "MAT101",           // Código único
  nombre: "Cálculo I",   // Nombre de la materia
  creditos: 4,            // Número de créditos
  estado: "aprobada",     // "aprobada" | "cursando" | "faltante"
  prereqs: []             // Array de IDs de prerequisitos
}
```

### Ejemplo con prerequisito:
```js
{
  id: "CAL2",
  nombre: "Cálculo II",
  creditos: 4,
  estado: "aprobada",
  prereqs: ["CAL1"]       // Requiere Cálculo I
}
```

---

## 🔧 Cambiar usuario/contraseña

En `src/pages/Login.jsx`, edita el objeto `DEMO_USER`:

```js
const DEMO_USER = {
  username: "tu_usuario",
  password: "tu_contraseña",
  name: "Tu Nombre",
  university: "Tu Universidad",
  career: "Tu Carrera",
  semester: 3,
  ...
};
```

---

## 📦 Compilar para producción

```bash
npm run build
```

Genera una carpeta `dist/` que puedes abrir directamente con cualquier navegador.

---

Hecho con React + Vite 💛
