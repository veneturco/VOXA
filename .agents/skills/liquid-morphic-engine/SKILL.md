---
name: liquid-morphic-engine
description: Motor de diseño visual ultra-moderno Liquid Morphic (Glassmorphism de refracción líquida + Neumorfismo orgánico + bordes luminosos y fluidos iridiscentes) para VOXA (by VENE TURCO) y futuros proyectos.
---

# LIQUID MORPHIC DESIGN ENGINE (VENE TURCO AESTHETIC V6.0)

## 1. Filosofía y Reglas Fundamentales
El estilo **Liquid Morphic** es la convergencia entre el *Glassmorphism de refracción óptica* y el *morfismo orgánico fluido*:
1. **Superficie de Vidrio Líquido (Liquid Glass):** 
   - Prohibido el uso de tarjetas planas opacas o grises sin vida.
   - Todo panel utiliza `backdrop-filter: blur(28px) saturate(180%)`.
   - Borde superior iluminado (`box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)`).
2. **Aurora Iridiscente Fluida de Fondo:**
   - Fondo base oscuro abisal (`#030712`).
   - Mallas de gradientes fluidos en constante vibración (Cyan `#06B6D4`, Violeta Eléctrico `#8B5CF6`, Esmeralda Neón `#10B981`).
3. **Cápsulas y Radios Curvos Orgánicos:**
   - Esquinas suaves y curvaturas fluidas (`border-radius: 20px` a `28px`).
   - Botones táctiles estilo píldora con brillo perimetral y transición suave (`cubic-bezier(0.4, 0, 0.2, 1)`).
4. **Tipografía Cristalina:**
   - Display: `'Plus Jakarta Sans'` o `'Syne'` con tracking ajustado.
   - Números y Telemetría: `'JetBrains Mono'` con `tabular-nums` obligatorio para que los números nunca salten.

## 2. Tokens del Skin `liquid-morphic`
```css
[data-skin="liquid-morphic"] {
  --bg-base: #030712;
  --bg-surface: rgba(15, 23, 42, 0.55);
  --bg-elevated: rgba(30, 41, 59, 0.65);
  --text-primary: #F8FAFC;
  --text-muted: #94A3B8;
  --accent-primary: #06B6D4;
  --accent-secondary: #8B5CF6;
  --accent-glow: rgba(6, 182, 212, 0.35);
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-highlight: rgba(255, 255, 255, 0.28);
  --radius-card: 24px;
  --radius-btn: 16px;
  --shadow-surface: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3);
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## 3. Clases de Utilidad y Efectos Especiales
- `.liquid-glass-card`: Tarjeta con refracción, borde luminiscente y sombra difusa.
- `.liquid-aurora-bg`: Fondo de degradados fluidos flotantes.
- `.liquid-pill-badge`: Indicador translúcido de telemetría y conexión en vivo.
