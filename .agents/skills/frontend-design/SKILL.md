---
name: gateway-frontend-design
description: Design principles, styling guidelines, and UI implementation patterns for Central Gateway. Enforces the 'Cosmic Violet & Starry Night Frosted Glass' aesthetic, dynamic starfield canvas, mountain/pine silhouettes, tactile micro-interactions, and Next.js 15 App Router best practices.
---

# Gateway Frontend Design Standards ("Cosmic Violet & Frosted Glass")

This skill guides the design and implementation of Central Gateway's user interface, ensuring a cohesive, editorial, and atmospheric experience across all screens.

---

## 1. Visual Language & Emotional Tone

- **Atmosphere**: Cosmic twilight, starry midnight, deep contemplation, serene high-tech hub.
- **Inspiration**: Editorial glassmorphism with silhouette depth (pine forests, distant mountains, twinkling stars).
- **Core Aesthetic Principles**:
  1. **Full-Bleed Cosmic Canvas**: Deep purple gradient sky with subtle dynamic elements (twinkling stars, occasional gentle shooting stars).
  2. **Layered Natural Depth**: Silhouette layers of distant mountain ranges and evergreen pine trees at the bottom of the viewport.
  3. **Ultra-Crisp Frosted Glass**: True frosted glass surfaces with high blur (`backdrop-blur-2xl`), subtle semi-transparency (`bg-white/[0.08]`), and razor-thin luminous borders (`border border-white/20`).
  4. **Luminous Accents**: Soft ambient glow shadows (`shadow-[0_8px_32px_0_rgba(140,56,201,0.25)]`) and solid glowing white buttons.

---

## 2. Color Palette & Design Tokens

```css
/* Background Gradient */
--sky-top: #130624;
--sky-mid-1: #250d42;
--sky-mid-2: #43146b;
--sky-bottom: #631f8f;

/* Silhouette Colors */
--silhouette-mountain: #220d3f;
--silhouette-pine: #150626;

/* Glass Surfaces */
--glass-bg: rgba(255, 255, 255, 0.08);
--glass-bg-hover: rgba(255, 255, 255, 0.14);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-border-focus: rgba(255, 255, 255, 0.45);
--glass-glow: rgba(140, 56, 201, 0.25);
```

---

## 3. UI Primitives & Component Patterns

### A. Frosted Glass Card (`<GlassCard />`)

```tsx
<div className="relative rounded-3xl border border-white/20 bg-white/[0.08] p-8 shadow-[0_8px_32px_0_rgba(140,56,201,0.25)] backdrop-blur-2xl">
  {children}
</div>
```

### B. Capsule Pill Input (`<GlassInput />`)

```tsx
<div className="relative flex items-center">
  <input
    className="w-full rounded-full border border-white/25 bg-white/[0.12] px-5 py-3 text-sm text-white placeholder-white/60 transition-all focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/20"
    {...props}
  />
  {icon && <span className="absolute right-4 text-white/60">{icon}</span>}
</div>
```

### C. Glowing Action Button (`<GlassButton />`)

```tsx
<button
  className="w-full rounded-full bg-white py-3.5 text-sm font-bold text-[#2a0e4e] shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:bg-white/95 hover:shadow-[0_0_28px_rgba(255,255,255,0.6)] active:scale-[0.98]"
  {...props}
>
  {children}
</button>
```

---

## 4. Starfield & Animation Standards

1. **Canvas Starfield**:
   - Render 150–200 stars with individual twinkle periods using `Math.sin(tick * speed)`.
   - Implement shooting stars subtly with randomized delays (every 8–15 seconds).
   - Use `requestAnimationFrame` with frame throttling if tab is backgrounded.
   - Respect `prefers-reduced-motion` by reducing animation speed or rendering static stars.
2. **Tactile Micro-Interactions**:
   - Interactive elements must provide visual feedback on hover (`hover:bg-white/[0.15]`) and press (`active:scale-[0.98]`).
3. **Responsive Breakpoints**:
   - Ensure the glass login card and bento dashboard adapt seamlessly between mobile (`w-full px-4`), tablet, and widescreen viewports.
