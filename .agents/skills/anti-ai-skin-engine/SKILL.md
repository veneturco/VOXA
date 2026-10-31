---
name: anti-ai-skin-engine
description: Motor de diseño visual hiper-personalizado anti-plantilla-IA con soporte de ingestión de tendencias (ingest-trend) y 6 skins físicos de autor para VOXA (by VENE TURCO).
---

# Anti-AI Skin Engine - Manual y Reglas de Arquitectura Visual 2026

Este skill prohíbe de manera tajante el uso de maquetados predecibles de IA (paletas `slate/indigo` sin jerarquía, tarjetas homogéneas en filas aburridas, esquinas planas genéricas y fuentes por defecto sin calibración).

---

## 📐 1. Regla `ingest-trend` (Ingestión Dinámica de Tendencias)
Cuando se introduzca una nueva captura, identidad de marca o tendencia de diseño:
1. Extraer inmediatamente los tokens atómicos:
   - `--bg-base`: Color de fondo primario.
   - `--bg-surface`: Contenedores y módulos de tarjeta.
   - `--bg-elevated`: Paneles de superposición, modales y barras de comandos.
   - `--text-primary` & `--text-muted`: Contraste de texto.
   - `--accent-primary` & `--accent-secondary`: Luces focales y llamadas a la acción.
   - `--border-subtle`: Separación estructural de 1px.
   - `--radius-card`: Carácter geométrico de esquinas.
   - `--font-display`: Tipografía titular de impacto.
2. Incorporar el nuevo tema al registro canónico en `src/styles/themes-registry.json`.
3. Mapear las reglas de estilo en `src/styles/skin-engine.css` bajo `[data-skin="nuevo-skin"]`.

---

## 🎨 2. Catálogo Oficial de los 6 Skins (Definición Semántica)

1. **`hyperframe-tactical` (POR DEFECTO):**
   - Estética HUD / Hardware de cabina 2026.
   - Fondo: `#050811` con matriz de puntos cian (`radial-gradient`).
   - Módulos: `#0A101F` con corchetes angulares de mira técnica en esquinas (`::before` y `::after`).
   - Acentos: Ámbar Eléctrico (`#F59E0B`) y Cian Táctico (`#06B6D4`).
   - Tipografía: Titulares con `font-mono tracking-wider uppercase` y datos tabulares.

2. **`obsidian-linear`:**
   - Lujo oscuro y sobriedad para software de misión crítica (estilo Linear/Vercel).
   - Fondo: `#050507`.
   - Tarjetas: `#0C0D12` con micro-borde superior iluminado de 1px (`linear-gradient(to right, rgba(255,255,255,0.15), transparent)`).
   - Acento: Verde Esmeralda Eléctrico (`#10B981`).

3. **`kinetic-studio`:**
   - Estilo estudio de producción audiovisual y editorial urbano de alto impacto.
   - Fondo: Asfalto ultra-oscuro `#09090B`.
   - Acentos: Lima Ácido (`#CCFF00`) y Violeta Eléctrico (`#8B5CF6`).
   - Tipografía: Display pesado y condensado con `Syne` (800) y tracking negativo.

4. **`tactile-bento`:**
   - Inspirado en hardware de titanio mate y electrónica de consumo de gama alta.
   - Fondo: Titanio `#111113`.
   - Tarjetas: `#1A1A1E` con radios ultra-curvos de `24px` y bisel interior táctil.
   - Acento: Naranja Internacional (`#F97316`).

5. **`editorial-swiss`:**
   - Tipografía suiza clásica, papel marfil y alto contraste intelectual.
   - Fondo: Papel cálido `#F7F6F2`.
   - Superficie: `#FFFFFF` con líneas divisorias arquitectónicas expuestas de 1px (`#E5E4DF`).
   - Textos: Tinta carbón `#141413` con acentos en Azul Cobalto o Bermellón.

6. **`neo-brutal`:**
   - Audacia contemporánea y respuesta física tangible.
   - Fondo: Hueso / Cartón `#EFECE6`.
   - Superficie: Blanco puro con bordes negros sólidos de `2px` y sombras duras desplazadas (`4px 4px 0px #09090B`).
   - Botones con efecto de presión física real al hacer clic (`active:translate-x-[2px] active:translate-y-[2px]`).

---

## 🧱 3. Reglas de Maquetado (Bento Grid & Clases Maestras)
* **Prohibición de clases fijas:** Ningún componente puede usar `bg-slate-900`, `bg-purple-600` o `bg-zinc-900` estáticos. Se debe usar siempre `bg-[var(--bg-base)]`, `bg-[var(--bg-surface)]`, `.ui-card`, `.ui-btn-primary`, `.ui-btn-secondary`, `.ui-badge-led` y `.ui-heading`.
* **Asimetría Obligatoria:** Módulos principales destacados (`col-span-12 lg:col-span-8`) acompañados de barras de telemetría y métricas angostas (`col-span-12 lg:col-span-4`).
* **Números Estables:** Todos los contadores, tasas BCV, scores y métricas deben usar `font-mono tabular-nums` para erradicar el parpadeo de anchura en tiempo real.
