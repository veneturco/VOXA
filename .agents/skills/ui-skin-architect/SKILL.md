---
name: ui-skin-architect
description: Reglas y directrices de diseño visual, tipografía, Bento Grids y sistema de temas de autor para VOXA (by VENE TURCO).
---

# UI Skin Architect - Directrices de Diseño Visual de Autor

Este documento rige todas las decisiones de diseño frontend e interfaces en **VOXA**. Su cumplimiento garantiza una experiencia de usuario distinguida, profesional y memorable, erradicando por completo el aspecto genérico de plantillas IA estándar.

---

## 🚫 1. Prohibición Absoluta del "Look Genérico IA"
* Queda terminantemente prohibido utilizar combinaciones predeterminadas no elaboradas como `bg-slate-900` plano con `bg-indigo-600` sin jerarquía o bordes estándar sin pulir.
* Toda pantalla debe transmitir diseño editorial o de consola de alta tecnología, combinando profundidad real, micro-iluminación y contraste calibrado.

---

## ✍️ 2. Tipografía con Personalidad y Carácter
Se definen tres familias tipográficas específicas mediante Google Fonts:
1. **Títulos y Encabezados (Display):** `'Syne'` y `'Outfit'`.
   - Uso obligatorio de `tracking-tight` o `tracking-tighter` para un porte ejecutivo y moderno.
2. **Cuerpo e Interfaz (UI/Body):** `'Plus Jakarta Sans'` o `'Geist'`.
   - Jerarquía clara con interletrado óptimo y excelente legibilidad en pantallas táctiles y escritorios.
3. **Métricas, Precios, Moneda, Logs y Teléfonos:** `'JetBrains Mono'`.
   - Uso obligatorio de `font-mono tabular-nums`. Evita que los números, tasas de cambio (Bs./USD) y contadores salten o tiemblen al actualizarse en vivo.

---

## 🍱 3. Arquitectura Bento Grid Asimétrica
* Sustituir las filas homogéneas de tarjetas por composiciones **Bento Grid** dinámicas.
* Usar anchos asimétricos (`col-span-12 lg:col-span-8` para módulos de acción principal combinados con `lg:col-span-4` para métricas secundarias o telemetría).
* Paneles con bordes sutiles iluminados superiormente (`border-white/10` en modo oscuro, `border-black/5` en modo claro).
* Micro-interacciones suaves con `transition-all duration-200 hover:-translate-y-0.5`.

---

## 🎨 4. Motor de Skins Semántico (`data-skin`)
El diseño se basa en variables CSS semánticas en el elemento `<html>`:
* `--bg-base`: Fondo general de la aplicación.
* `--bg-surface`: Superficie de contenedores y paneles.
* `--bg-elevated`: Elementos elevados (modales, menús, popovers).
* `--text-primary`: Color de texto principal.
* `--text-muted`: Metadatos y etiquetas secundarias.
* `--accent-primary`: Tono de acción primaria y éxito.
* `--accent-glow`: Color de resplandor para sombras y luces difusas.
* `--border-color`: Bordes de paneles y divisores de 1px.
* `--radius-ui`: Radio de curvatura característico del tema.
* `--shadow-ui`: Sombra de elevación específica.

### Catálogo de Skins:
1. **`obsidian` (Por Defecto):** Luxury Tech Dark. Negro carbón profundo (`#070709`), verde esmeralda eléctrico (`#10B981`) y blanco platino.
2. **`cyber-telemetry`:** Tactical Command Center. Azul medianoche abisal (`#040814`), malla técnica de fondo, bordes cian/ámbar e indicadores LED con pulso.
3. **`editorial-light`:** Swiss Paper & Executive. Fondo marfil cálido (`#F7F6F2`), tarjetas blancas puras, texto carbón y acentos en naranja internacional (`#FF4F00`).
4. **`neo-brutal`:** High Impact. Fondo crema (`#EFECE6`), bordes negros sólidos de 2px, sombras duras desplazadas (`4px 4px 0px #111`) y botones con respuesta de presión física táctil.
