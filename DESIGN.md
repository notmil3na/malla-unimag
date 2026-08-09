---
name: MiMalla
description: Tu plan de estudios visual — Atlas Aurora
colors:
  starlight-gold: "#c8a96e"
  antique-copper: "#8b6f3a"
  nebula-night: "#0e0a18"
  lilac-paper: "#f8f4fc"
  glass-surface: "rgba(255,255,255,0.045)"
  glass-surface-bright: "rgba(255,255,255,0.075)"
  glass-line: "rgba(255,255,255,0.10)"
  moonbeam-text: "#f4f1fb"
  hazy-lilac: "#9b93b8"
  night-ink: "#241f33"
  lavender-ink: "#756c8f"
  deep-nebula: "#1e1a2e"
typography:
  display:
    fontFamily: "'DM Serif Display', Georgia, serif"
    fontWeight: 400
    lineHeight: 1.1
    fontStyle: "italic-optional"
  body:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
    fontSize: "13px"
  label:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontWeight: 600
    fontSize: "11px"
    letterSpacing: "0.08em"
    textTransform: "uppercase"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.starlight-gold}"
    textColor: "#14101f"
    rounded: "{rounded.sm}"
    padding: "9px 20px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.moonbeam-text}"
    rounded: "{rounded.sm}"
    padding: "9px 18px"
    border: "1px solid {colors.glass-line}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.hazy-lilac}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.starlight-gold}"
    textColor: "#16121f"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.moonbeam-text}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    border: "1px solid {colors.glass-line}"
  chip:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.hazy-lilac}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
    border: "1px solid {colors.glass-line}"
  input:
    backgroundColor: "{colors.glass-surface-bright}"
    textColor: "{colors.moonbeam-text}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
    border: "1px solid {colors.glass-line}"
---

# Design System: MiMalla

## Overview

**Creative North Star: "El Atlas Aurora"**

MiMalla es un observatorio nocturno personal. Un cielo de violeta nebulosa
(`#0e0a18`) se enciende con cuatro auroras de color en los bordes — lila, melocotón,
rosa y azul — y sobre ese cielo flotan paneles de vidrio esmerilado que dejan pasar
la luz. El acento es un oro cálido de luz estelar: escaso, preciso, y siempre
significando "esto es tuyo, está activo, mira acá". La estrella ✦ — que gira sin
prisa en el logotipo — es la marca y la única pieza en movimiento perpetuo.

La actitud es serena y contemplativa, como una lámpara de escritorio encendida a
media noche. Tipografía serif itálica (DM Serif Display) para los títulos y
números grandes, una sans humanista (DM Sans) para el cuerpo, y etiquetas en
mayúsculas espaciadas. La profundidad se construye por capas — aurora abajo,
vidrio arriba — con sombras suaves y ambientales, nunca drop-shadows duras. La
densidad es media: la información respira en paneles de esquinas generosas
(14–26px) sin amontonarse.

Por convicción, este sistema no es un dashboard corporativo. Nada aquí debe
sentirse a un banco, una app de productividad gris o un tema por defecto de
plantilla: la aurora, el vidrio y el oro son la identidad, y perder cualquiera de
los tres es perder el sistema.

**Key Characteristics:**
- Cielos de Noche de Nebulosa (oscuro) y Papel Lila (claro) bajo una aurora de
  cuatro glows radiales y un grano de película al 3%.
- Paneles de vidrio esmerilado (`blur(8px) saturate(140–160%)`) que nunca se
  vuelven opacos: la aurora se lee a través de ellos.
- Una sola voz saturada — Oro Estelar — reservada para acción, estado activo,
  foco y marca.
- Serif itálica para títulos sobre sans humanista para el cuerpo; etiquetas en
  mayúsculas con tracking.
- Escalera de radios generosos 10 → 26px y sombras ambientales suaves; la estrella
  ✦ es el único movimiento infinito.

## Colors

Paleta de dos cielos (noche y papel) con una sola voz cálida y saturada: el oro
estelar, que aparece en dosis pequeñas y con propósito.

> **Nota de tema.** El acento es configurable por usuario: nueve presets
> (Rojo, Naranja, Ámbar, Verde, Turquesa, Azul, Violeta, Rosa, Gris) se inyectan
> vía `--accent` / `--accent2` / `--accent-rgb`. El token estático documentado
> aquí — Oro Estelar — es el valor base declarado en `:root` y la familia de
> presets respeta las mismas reglas de uso. Los valores de Aurora y Oro del texto
> permanecen constantes entre temas; solo cambia la voz saturada.

### Primary
- **Oro Estelar** (`#c8a96e`): El acento. Botón primario, nav activo, foco
  (`:focus-visible`), la estrella ✦, líneas de acento en tarjetas, badges de
  código de materia, bordes hover. Nunca campos planos grandes; su rareza es el
  punto.

### Secondary
- **Cobre Antiguo** (`#8b6f3a`): El extremo profundo del gradiente del acento
  (botón primario, avatar con iniciales). Solo aparece emparejado con el oro.

### Neutral
- **Noche de Nebulosa** (`#0e0a18`): Fondo del cielo en modo oscuro.
- **Papel Lila** (`#f8f4fc`): Fondo del cielo en modo claro.
- **Vidrio** (`rgba(255,255,255,0.045)`): Superficie de paneles y tarjetas (oscuro).
- **Vidrio Claro** (`rgba(255,255,255,0.075)`): Segundo piso: inputs, chips, nav hover.
- **Línea de Vidrio** (`rgba(255,255,255,0.10)`): Bordes de 1px de paneles.
- **Luz de Luna** (`#f4f1fb`): Texto principal sobre el cielo oscuro.
- **Lila Brumoso** (`#9b93b8`): Texto secundario y leyendas sobre oscuro.
- **Tinta Nocturna** (`#241f33`): Texto principal sobre Papel Lila.
- **Tinta Lavanda** (`#756c8f`): Texto secundario sobre claro.
- **Nebulosa Profunda** (`#1e1a2e`): Base de modales y menús en modo oscuro
  (`--modal-bg`), con `--modal-bg2` `#262238` para su segundo piso.
- **Errores y éxito** (fuera de rama): rojo `#e07070` sobre `rgba(224,112,112,0.08)`;
  verde `#6ec88a` sobre `rgba(110,200,138,0.08)`. Solo en estado, nunca decoración.

### Named Rules
**La Regla del Oro Escaso.** Oro Estelar es la única voz saturada y aparece en
≤10% de cualquier pantalla: estado activo, foco, acción primaria y marca. Si algo
pide más oro, está rompiendo el sistema.

**La Regla del Dos Pisos.** Las superficies suben dos pisos — Vidrio → Vidrio
Claro → Nebulosa Profunda (o modal) — y nunca inventan un cuarto neutral.

**La Regla del Cielo Transparente.** Todo panel es vidrio translúcido; si un panel
se vuelve opaco, la aurora desaparece y con ella la identidad.

## Typography

**Display Font:** DM Serif Display (con Georgia, serif)
**Body Font:** DM Sans (con system-ui, sans-serif) — sustituible por el usuario
(Outfit, Syne, Space Grotesk, Josefin Sans, Raleway, Lora, Playfair Display,
Fraunces).
**Label/Mono Font:** DM Sans en mayúsculas; fórmulas y código usan monospace del
sistema.

**Character:** El emparejamiento es clásico-cálido: un serif itálico con
personalidad para lo que se anuncia (títulos, marcas, cifras grandes) y una sans
limpia y legible para el trabajo diario. La voz resultante es de estudio
nocturno — un poco editorial, nunca técnica.

### Hierarchy
- **Display** (DM Serif Display, 400, 22–30px, line-height 1.1): Marca "MiMalla",
  títulos de sección (26px), fechas del widget "Hoy" (13px), cifras de ponderado
  (40px). El itálico `em` usa Oro Estelar.
- **Title** (DM Sans 600, 13–15px, line-height 1.35): Nombres de materia,
  cabeceras de tarjetas, secciones dentro de una vista.
- **Body** (DM Sans 400, 13–14px, line-height 1.5): Contenido, tablas, subtítulos.
  Ajusta a 16px en móvil para evitar zoom de iOS.
- **Label** (DM Sans 600, 11px, tracking 0.08em, MAYÚSCULAS): Etiquetas de
  formulario, títulos de bloque, avisos cortos. La jerarquía de formularios vive
  en estas etiquetas, no en textos más grandes.

### Named Rules
**La Regla del Serif en Énfasis.** El serif es para el display y el énfasis
itálico del logotipo; nunca para párrafos. El cuerpo permanece en sans.

**La Regla de la Letra Espaciada.** Si una etiqueta no está en mayúsculas con
tracking 0.08em, no es una etiqueta del sistema: es texto de contenido.

## Layout

El caparazón de la app es una composición de dos paneles de vidrio flotando sobre
la aurora: la barra lateral (240px) y el área principal, cada uno con borde de 1px
`--border`, radio `--radius-xl` (26px) y sombra ambiental suave, separados por un
gutter de 16px con 16px de margen exterior.

- Contenido interior: padding 28–32px en desktop, 14–18px en móvil.
- Breakpoints: a ≤900px la barra lateral se pliega a una barra superior de vidrio
  con navegación horizontal desplazable; el radio de los paneles baja 26 → 18 → 14px
  conforme el viewport se encoge. A ≤640px los widgets y formularios pasan a una
  sola columna. Hay ajustes dedicados para ≤480px y ≤360px.
- Las vistas internas usan grids de tarjetas (malla de materias) y tablas
  horizontales desplazables dentro de un contenedor de vidrio (horario).
- El ritmo de espaciado: 4 / 8 / 12 / 16 / 20 / 24 / 32px; las vistas usan
  mayormente 12–24px y los paneles 32px entre secciones.
- Los bordes y separadores usan siempre `--border` (Línea de Vidrio); nunca
  sombras para dividir.

## Elevation & Depth

Profundidad por capas, no por sombras duras. El fondo es una aurora tonal: cuatro
glows radiales posicionados en las esquinas del viewport (≤14% hacia adentro) más
un grano de película SVG al 3% con `mix-blend-mode: overlay`. Sobre esa base, los
paneles son vidrio esmerilado (`backdrop-filter: blur(8px) saturate(140–160%)`)
con borde translúcido.

Las sombras son ambientales y suaves, para acercar la superficie al ojo, nunca
para "cortar" el aire:
- **Ambiental suave** (`0 8px 32px rgba(0,0,0,0.35)`): paneles en reposo.
- **Ambiental profunda** (`0 20px 60px rgba(0,0,0,0.45)`): modales, toasts, capas
  flotantes.
- **Brillo de oro** (`0 6px 20px rgba(200,169,110,0.3)`): botón primario en hover.

El hover de tarjetas sube un escalón: `translateY(-1px)` + sombra mayor + borde
teñido al acento. En modo claro las sombras se tiñen de lila
(`rgba(120,90,160,0.14/0.18)`) y se suavizan.

### Named Rules
**La Regla del Vidrio.** Toda elevación es un vidrio más brillante o una sombra
más suave — nunca un panel opaco y nunca un drop-shadow con borde duro.

**La Regla de la Estrella.** La estrella ✦ es el único elemento en movimiento
perpetuo (10–12s de giro). Todo lo demás se mueve una vez, respondiendo a un
estado, y se detiene. El respeto a `prefers-reduced-motion` está garantizado a
nivel global.

## Shapes

El lenguaje de forma es vidrio redondeado con una escalera de cuatro radios:
10px (botones, chips, inputs, badges, toasts), 14px (tarjetas, modales,
navegación móvil), 18px (paneles en tablet), 26px (caparazón de la app, card de
login). Los radios bajan de escalón conforme encoge el viewport.

Dos siluetas recurrentes:
- **La barra de acento**: tira de 4px de color (barra de materia, borde izquierdo
  de la card "Hoy") que señala pertenencia.
- **El punto y la pastilla**: puntos de 8px para leyenda y estado; pastillas
  `border-radius: 999px` para la barra offline y el aviso de sincronización.

Los avatares son círculos con gradiente de oro y un anillo punteado exterior a
baja opacidad. Las esquinas de la tarjeta de login reciben un borde superior
dorado en gradiente que se desvanece a los lados.

## Components

Filosofía: **vidrio suave y oro cálido**. Botones táctiles con brillo, tarjetas
acogedoras que se elevan al tocarlas, inputs tranquilos con foco dorado.

### Buttons
- **Shape:** radio 10px; botones primarios en gradiente `135deg` de Oro a Cobre
  con texto oscuro `#14101f` (contraste de texto sobre oro, no al revés).
- **Primary:** gradiente oro→cobre; padding 9px 20px (13px en formularios anchos);
  weight 600; hover = `opacity 0.92`, `translateY(-1px)`, brillo de oro;
  active vuelve a y=0.
- **Ghost / Secondary:** fondo Vidrio, borde Línea de Vidrio, blur de vidrio;
  hover = borde y texto al oro, sombra de oro al 15%; padding 9px 18px.
- **Icon button (modo):** cuadrado 34px, fondo Vidrio Claro, hover rota -8° y
  escala 1.05 con borde dorado.

### Chips
- **Style:** fondo Vidrio, borde 1px, radio 10px, blur; texto Lila Brumoso, weight 500.
- **State:** activo = borde oro, texto oro, fondo `rgba(--accent-rgb, 0.16)`;
  hover = borde dorado y texto principal. Usados para días de la semana, filtros
  y leyendas arrastrables.

### Cards / Containers
- **Corner Style:** 14px (radio `--radius-md`).
- **Background:** Vidrio (translúcido, la aurora se ve detrás); variante Vidrio
  Claro para tarjetas sobre piso ya vidrioso.
- **Shadow Strategy:** ambiental suave en reposo; hover sube un escalón con borde
  teñido al color de la tarjeta (para materias) o al oro.
- **Border:** 1px Línea de Vidrio.
- **Internal Padding:** 12px 14px (tarjetas densas), 16px+ en contenedores de
  bloque. Las tarjetas de materia usan una barra de color de 4px arriba (estado:
  cursando / aprobada / faltante).

### Inputs / Fields
- **Style:** fondo Vidrio Claro, borde 1px Línea de Vidrio, radio 10px, padding
  11px 14px; selects con caret SVG propio, flecha derecha; opciones del select
  sobre `--modal-bg`.
- **Focus:** borde al oro + anillo exterior `0 0 0 3px rgba(--accent-rgb, 0.12)`;
  placeholder en Línea de Vidrio; error/success con borde y fondo tintados
  (rojo `#e07070` / verde `#6ec88a`).

### Navigation
- **Estilo:** barra lateral de vidrio (240px) con borde y radio 26px; perfil con
  avatar de gradiente de oro y anillo punteado; marca "MiMalla" en serif con
  `em` dorado y estrella girando.
- **Item:** texto Lila Brumoso 13px; hover = fondo Vidrio Claro + `translateX(2px)`;
  **active** = pastilla de gradiente de oro con texto oscuro `#16121f`, weight 600
  y sombra de oro al 35%.
- **Móvil (≤900px):** la barra pasa a superior, la navegación a fila horizontal
  desplazable sin scrollbar; los items pierden hover `translateX` (sin espacio).

### Modales
- Fondo de bloqueo en negro translúcido; panel `--modal-bg` (Nebulosa Profunda o
  blanco en claro), radio 14–18px, sombra ambiental profunda; título en serif,
  texto secundario Lila Brumoso; los inputs del modal repiten la regla de foco
  dorado.

### Signature: Tarjeta de Materia (malla)
La unidad de la malla: tarjeta densa con barra de color superior de 4px (estado),
código en dorado (weight 700, tracking), créditos secundarios, nombre en weight
500, y badges de prerequisitos en Vidrio. Estados: `dimmed` (bloqueada, opacidad
0.3), `highlighted` (flash de borde), `selected` (borde 2px + escala 1.02),
`unlocked`/`matriculable` (borde teñido). Los badges de estado usan el oro y el
verde/azul de estado (`#6eb5c8` matriculable).

### Signature: El Aviso de Actualización
Pantalla modal a todo el viewport con la estrella giratoria como ícono, título
serif "Actualización disponible", botón primario de oro "Recargar ahora" y
secundario "Ahora no". Es el momento en que la app le habla al usuario desde el
cielo: el dorado del oro escaso se concentra aquí.

## Do's and Don'ts

### Do:
- **Do** mantener la escalera de radios 10 / 14 / 18 / 26, el mayor en el caparazón
  y el menor en controles.
- **Do** escribir etiquetas en mayúsculas de 11px con tracking 0.08em.
- **Do** dejar que la aurora se lea a través de todo panel (vidrio translúcido,
  `blur(8px) saturate(140–160%)`).
- **Do** usar sombras ambientales suaves (`0 8px 32px`) y el brillo de oro solo en
  hover del primario.
- **Do** reservar la estrella ✦ y el oro escaso para marca, activo y foco.

### Don't:
- **Don't** volver opacos los paneles: la aurora es la identidad del fondo.
- **Don't** usar el oro como campo plano grande; la Regla del Oro Escaso manda.
- **Don't** deslizar hacia el dashboard corporativo: sin aurora, sin vidrio y sin
  oro, esto se vuelve una plantilla genérica.
- **Don't** añadir más de cuatro glows a la aurora ni subirlos al centro del
  viewport.
- **Don't** romper el gutter de 16px en desktop ni el de 12px en móvil, ni los
  safe-area insets de iOS.
