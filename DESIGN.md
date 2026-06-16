---
name: Gold Tracker
description: Personal portfolio tracker for physical gold coins and bars
colors:
  primary: "#d4a843"
  primary-deep: "#b8922e"
  secondary: "#2a6b4a"
  background: "#fafaf8"
  surface: "#ffffff"
  surface-hover: "#f5f5f3"
  border: "#e5e5e0"
  muted: "#73726d"
  ink: "#1a1a18"
  ink-secondary: "#403f3a"
  destructive: "#c0392b"
  destructive-bg: "#fef2f2"
  success: "#16a34a"
  success-bg: "#f0fdf4"
  warning: "#d97706"
  warning-bg: "#fffbeb"
  dark-primary: "#e8c55a"
  dark-surface: "#1e1e1c"
  dark-background: "#141412"
  dark-border: "#2e2e2c"
  dark-muted: "#8a8a85"
  dark-ink: "#ecece8"
  dark-ink-secondary: "#a0a09a"
  dark-destructive: "#ef4444"
  dark-success: "#22c55e"
  dark-warning: "#f59e0b"
typography:
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  heading:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "8px 12px"
---

# Design System: Gold Tracker

## 1. Overview

**Creative North Star: "The Precision Journal"**

Gold Tracker is a personal portfolio journal — not a trading terminal, not a SaaS dashboard. It presents hard financial data with the calm authority of a well-kept ledger. Every screen should feel like a page from a serious collector's notebook: sparse, legible, and purposeful.

The system rejects SaaS decoration. No gradient cards, no hero metrics with supporting stats, no identical card grids. Instead, data earns its visual weight through typography, spacing, and restrained color. Gold appears sparingly — as an accent that rewards attention, not as a background.

Both light and dark modes are first-class citizens. Light mode is warm-white with gold accents; dark mode is near-black with luminous gold. Neither is an afterthought inversion.

**Key Characteristics:**
- Data-dense but visually sparse — more information through less decoration
- Gold as a deliberate accent, not a theme
- System fonts for speed and neutrality — no font loading delays
- Tonal layering over shadows for depth
- Spanish-language typography throughout

## 2. Colors

The palette is restrained: one primary accent (gold) + a secondary (forest green for portfolio growth) + a well-calibrated neutral ramp. The primary accent carries ≤15% of any given screen.

### Primary

- **Gold** (#d4a843 / oklch(70% 0.14 88)): The domain anchor. Used for the primary button, active states, the logo wordmark, and P&L indicators when positive. In dark mode, shifts to a brighter #e8c55a for luminance against near-black.

### Secondary

- **Forest** (#2a6b4a / oklch(55% 0.12 145)): Portfolio growth and positive indicators. Used alongside gold as a complementary accent for green P&L states.

### Neutral

- **Ink** (#1a1a18 / oklch(11% 0.005 85)): Body text and primary headings. Near-black with a barely-warm undertone.
- **Ink Secondary** (#403f3a / oklch(27% 0.01 85): Secondary text, labels, placeholders.
- **Surface** (#ffffff / oklch(100% 0 0)): Card backgrounds and elevated surfaces. Pure white — no cream, no beige.
- **Background** (#fafaf8 / oklch(98% 0.002 85): Page background. A true neutral with near-zero chroma — not cream, not warm by default.
- **Border** (#e5e5e0 / oklch(90% 0.005 85): Dividers, input borders, card outlines.
- **Muted** (#73726d / oklch(48% 0.01 85): Disabled states, timestamps, supporting metadata.

### Dark Mode

- **Dark Background** (#141412 / oklch(9% 0.003 85)): Page background. Near-black with a barely-warm undertone.
- **Dark Surface** (#1e1e1c / oklch(13% 0.004 85)): Card backgrounds.
- **Dark Border** (#2e2e2c / oklch(19% 0.005 85): Dividers.
- **Dark Ink** (#ecece8 / oklch(93% 0.003 85): Body text.
- **Dark Primary** (#e8c55a / oklch(78% 0.15 88)): Brighter gold for dark mode luminance.

### Named Rules

**The Gold Rule.** Gold is the accent — never the surface. It appears on ≤15% of any given screen. Its rarity is what makes it meaningful.

**The No-Cream Rule.** The page background is a true neutral (near-zero chroma), not cream, sand, or parchment. Warmth lives in the accent, not the canvas.

## 3. Typography

**Body Font:** system-ui stack (San Francisco on macOS, Segoe UI on Windows, Roboto on Android)
**Character:** One font family, multiple weights. No font pairing needed — the system stack is fast, familiar, and neutral enough to let the data speak.

### Hierarchy

- **Display** (700, clamp(1.75rem, 3vw, 2rem), 1.2): App title and page headings. Bold, tight letter-spacing (-0.02em).
- **Headline** (600, 1.25rem, 1.3): Section titles, card titles. Used for dashboard metric labels.
- **Body** (400, 0.875rem, 1.6): Table cells, form labels, dialog text. Max line length 65–75ch.
- **Label** (500, 0.75rem, 1.4, 0.02em tracking): Form labels, button text, chip text. Small-caps feel without using actual small-caps.
- **Mono** (400, 0.8125rem, 1.5): Numeric data in tables — currency values, weights, percentages. Monospace ensures numbers align in columns.

### Named Rules

**The Monospace-For-Numbers Rule.** All numeric data in tables uses a monospace font. This ensures decimal alignment and makes scanning P&L values effortless.

## 4. Elevation

Flat by default. Depth is conveyed through tonal layering (surface vs. background) and subtle borders, not shadows. Cards use a 1px border at the border color — no box-shadows except for the focus ring on interactive elements.

This keeps the interface crisp at any zoom level, avoids the "floating card" SaaS aesthetic, and eliminates shadow inconsistency across browsers.

## 5. Components

### Buttons

- **Shape:** Gently rounded edges (4px radius). Not pill-shaped, not sharp.
- **Primary:** Gold background (#d4a843) with near-black text. 40px height, 20px horizontal padding. Hover: darken to #b8922e. Focus: 2px ring in gold.
- **Outline:** Transparent background, border at border-color, ink text. Same dimensions as primary. Hover: subtle background tint.
- **Ghost:** No border, no background until hover. Ink text. Used for secondary actions (edit, cancel). Hover: background tint.
- **Destructive:** Red background (#c0392b) with white text. Used for delete actions.

### Cards

- **Corner Style:** 12px radius.
- **Background:** White (light) or #1e1e1c (dark).
- **Border:** 1px at border color. No shadow.
- **Internal Padding:** 24px.
- **Purpose:** Dashboard metrics (4-column grid). Nothing else — cards are not used for every container.

### Inputs

- **Style:** 8px radius, 1px border at border-color, background at background color.
- **Height:** 40px.
- **Focus:** 2px ring at primary color, 2px offset.
- **Placeholder:** Ink secondary color (never muted gray — must hit 4.5:1 contrast).

### Dialogs

- **Shape:** Centered modal, max-width 480px.
- **Background:** Surface color, 1px border.
- **Header:** Title (headline weight) + description (body, muted).
- **Footer:** Action buttons right-aligned, 8px gap.

### Tables

- **Header:** Muted background, medium weight labels, 12px vertical padding.
- **Rows:** 1px bottom border, 12px horizontal padding, alternating tone on hover.
- **Numeric columns:** Right-aligned, monospace font.
- **Empty state:** Centered text with muted color, 32px padding.

### P&L Indicators

- **Positive:** Forest green text (#2a6b4a) with a "+" prefix for percentages.
- **Negative:** Red text (#c0392b) with no prefix (negative sign is implicit).
- **Never color-only:** Always paired with +/− symbol or explicit text.

## 6. Do's and Don'ts

### Do:
- **Do** use gold sparingly — as an accent on buttons, active states, and the logo.
- **Do** let monospace fonts handle numeric alignment in tables.
- **Do** use tonal layering (background vs. surface) for depth, not shadows.
- **Do** keep the page background a true neutral — no cream, no beige, no parchment.
- **Do** use system fonts for instant rendering and zero font-loading jank.
- **Do** pair P&L color indicators with +/− symbols for color-blind accessibility.
- **Do** use `text-wrap: balance` on headings for even line lengths.

### Don't:
- **Don't** use gradient backgrounds on cards, buttons, or text.
- **Don't** use cream, sand, beige, parchment, or any warm near-white as a page background.
- **Don't** use identical card grids — cards are for dashboard metrics only.
- **Don't** use box-shadows on cards or containers (except focus rings).
- **Don't** use color alone to convey P&L — always include a +/− symbol.
- **Don't** use more than one accent color per screen (gold OR green, not both).
- **Don't** use pill-shaped buttons (100% border-radius) except for tags and chips.
- **Don't** use tracked uppercase eyebrow text above section headings.
