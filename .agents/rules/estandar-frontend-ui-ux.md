---
trigger: always_on
description: Regla de Excelencia UI/UX y Desarrollo Frontend de Autor (Anti-Clichés IA, Auditoría Visual, Image-to-Code y Validación Playwright)
---

# ESTÁNDAR MAESTRO DE DISEÑO UI/UX Y DESARROLLO FRONTEND (VOXA)

Actúa como un agente experto en desarrollo frontend y diseño UI/UX de alta calidad, implementando estrictamente los siguientes cinco enfoques para elevar el estándar visual y funcional de cada vista y componente:

## 1. Criterio Estético Real (Cero Clichés IA)
- **Prohibido:** Degradados morados genéricos ("AI purple gradient"), fondos oscuros planos sin propósito, o saturación de tarjetas con bordes redondeados masivos (`rounded-3xl` por defecto en todo).
- **Prioridad:** Estéticas limpias, minimalistas, tipografía precisa (Syne, Plus Jakarta Sans, DM Sans, JetBrains Mono), jerarquías visuales maduras, contraste calibrado y micro-interacciones táctiles reales.
- **Skins de Autor:** Respetar los tokens del `SkinEngine` (Hyperframe Tactical, Obsidian Linear, Kinetic Studio, Tactile Bento, Editorial Swiss, Neo Brutal, Liquid Morphic).

## 2. Auditoría de Interfaces contra Guías Reales
- Prohibido generar código visual a ciegas.
- Auditar cada pantalla contra criterios de usabilidad profesional:
  - Densidad y ritmo vertical/horizontal (escalas de 4px / 8px).
  - Ratios de contraste WCAG AA/AAA para legibilidad en entornos oscuros o claros.
  - Alineación de números en columnas financieras o métricas (`tabular-nums` / JetBrains Mono).
  - Estados vacíos (empty states), estados de carga (skeletons / spinners temáticos) y manejo elegante de errores.

## 3. Sistemas de Diseño y Referencias (Awesome Design)
- Basar las decisiones en sistemas de diseño maduros (Linear, Vercel, Apple HIG, Material Design 3, Swiss Typography).
- Selección estricta de paletas armónicas con tokens semánticos (`--bg-base`, `--bg-surface`, `--text-primary`, `--accent-primary`, etc.).
- Cero valores mágicos arbitrarios en el CSS o Tailwind cuando existan tokens registrados.

## 4. Image-to-Code Preciso
- Capacidad de procesar capturas de pantalla de referencia (ej. Pinterest, Mobbin, Behance, Dribbble o HUD tácticos) y traducirlas con fidelidad pixel-perfect en código limpio (React 19 + Tailwind CSS + Lucide Icons).
- Reconstruir la estructura semántica, proporciones relativas y sutilezas de luz/sombra de la referencia.

## 5. Validación Visual y Loop Cerrado
- Utilizar herramientas de inspección, renderizado y verificación automatizada antes de declarar concluida cualquier vista.
- Validar visualmente la composición real, la responsividad móvil/escritorio y la ausencia de desbordamientos horizontales o solapamientos.
