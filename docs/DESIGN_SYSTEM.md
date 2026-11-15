# NyayaSaathi (न्यायसाथी) Design System Specification

## 1. Design Philosophy & Sovereign Values

NyayaSaathi is a citizen-first Know Your Rights (KYR) and Legal Aid platform designed for India's diverse demographic spectrum. The design system translates the dignity of the Indian Constitution into a modern, accessible, and intuitive digital service interface.

### Core Visual Principles
1. **Government-Service Credibility with Modern Elegance**: Combines Indian sovereign colors (Saffron, Navy, Emerald) with contemporary typography and calm whitespace to convey statutory authority without intimidating bureaucratic friction.
2. **Universal Accessibility (WCAG 2.2 Level AA Standard)**: Minimum contrast ratios of 4.5:1 for normal text (7:1 in High Contrast mode), 44x44px minimum interactive touch targets, visible focus rings (`:focus-visible`), and screen-reader accessibility landmarks.
3. **Cognitive Clarity & Plain Language Hierarchy**: Separation of official statutory quotes (indented, bordered, verified citation tags) from simplified vernacular explanations.

---

## 2. Color System & Design Tokens

### 2.1 Brand Palette (Ashoka & Tri-Color Inspired)
| Token Name | Hex Code | Tailwind Class | Semantic Usage |
|---|---|---|---|
| **Saffron / Primary** | `#FF9933` / `#D97706` | `amber-500` / `amber-600` | Primary brand CTAs, active highlights, badges, AI assistant indicators |
| **Sovereign Navy** | `#0F172A` / `#1E293B` | `slate-900` / `slate-800` | Navigation bars, primary buttons, headers, footer, high-contrast anchors |
| **Constitutional Emerald** | `#138808` / `#059669` | `emerald-600` / `emerald-700` | Human-reviewed verifications, legal aid qualification tags, success confirmations |
| **Judicial Purple** | `#7C3AED` / `#6D28D9` | `purple-600` / `purple-700` | Case law precedents, court committee hierarchies (NALSA, SCLSC, HCLSC, DLSA) |

### 2.2 Status & Feedback Palette
| Intent | Background | Border | Text | Purpose |
|---|---|---|---|---|
| **Verified / In Force** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` | Gazette-verified statutes, active laws, eligible aid |
| **Under Review / Machine NMT** | `bg-amber-50` | `border-amber-200` | `text-amber-800` | Bhashini automated translations, draft amendments |
| **High Alert / Emergency** | `bg-rose-50` | `border-rose-200` | `text-rose-800` | Emergency police PCR, domestic abuse helplines, errors |
| **Statutory Information** | `bg-blue-50` | `border-blue-200` | `text-blue-800` | Court procedural rules, filing deadlines, document requirements |

### 2.3 Neutral Palette
Based on Tailwind's Slate spectrum:
- **`slate-50`** (`#f8fafc`): Page canvas and input field backgrounds.
- **`slate-100`** (`#f1f5f9`): Subtle card backgrounds and chips.
- **`slate-200`** (`#e2e8f0`): Structural dividers, input borders, card outlines.
- **`slate-500`** (`#64748b`): Secondary labels, helper text, and timestamps.
- **`slate-900`** (`#0f172a`): Primary headings and high-emphasis body text.

---

## 3. Typography Hierarchy

The typography system pairs `Noto Sans` for clean Latin reading with `Noto Sans Devanagari` for native Indian script legibility:

```css
font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif;
```

### Scale & Tokens
| Level | Font Size | Line Height | Weight | Tailwind Class |
|---|---|---|---|---|
| **Display / Hero H1** | 2.5rem - 3.75rem (40px - 60px) | 1.15 | 800 (Extrabold) | `text-4xl sm:text-6xl font-extrabold tracking-tight` |
| **Page Header H1** | 1.875rem - 2.25rem (30px - 36px) | 1.25 | 800 (Extrabold) | `text-2xl sm:text-3xl font-extrabold` |
| **Section Header H2** | 1.25rem - 1.5rem (20px - 24px) | 1.35 | 700 (Bold) | `text-lg sm:text-xl font-bold` |
| **Card Header H3** | 0.9375rem - 1rem (15px - 16px) | 1.4 | 700 (Bold) | `text-sm sm:text-base font-bold` |
| **Body Regular** | 0.875rem (14px) | 1.6 | 400 (Regular) | `text-xs sm:text-sm leading-relaxed` |
| **Micro Caption / Tags**| 0.6875rem - 0.75rem (11px - 12px)| 1.4 | 600 (Semibold) | `text-[10px] sm:text-xs font-semibold` |

---

## 4. Spacing, Radii & Elevation

### 4.1 Spacing Grid
Built upon an 8-point spatial system:
- `gap-2` (8px) / `gap-3` (12px): Chip arrays, button internals, breadcrumbs.
- `gap-4` (16px) / `gap-6` (24px): Standard card layouts, grid columns.
- `gap-8` (32px) / `gap-12` (48px): Page-level module separations.

### 4.2 Border Radii
- **`rounded-lg`** (8px): Dropdown menu items, inline badges.
- **`rounded-xl`** (12px): Standard form inputs, buttons, pills.
- **`rounded-2xl`** (16px): Interactive cards, chat bubbles, document preview panes.
- **`rounded-3xl`** (24px): Hero banners, high-emphasis citizen callout cards.

### 4.3 Elevation & Shadows
- **Card Base**: `shadow-sm border border-slate-200/80`
- **Card Interactive Hover**: `hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5`
- **Dropdowns & Modals**: `shadow-xl border border-slate-200`
- **High-Contrast Override**: All box-shadows suppressed; high-contrast borders rendered in solid `#ffffff`.

---

## 5. Component Inventory & Patterns

### 5.1 Buttons (`Button.jsx`)
- **Primary**: `bg-slate-900 text-white hover:bg-slate-800 shadow-sm rounded-xl`
- **Accent / Saffron**: `bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl`
- **Secondary / Outline**: `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-xl`
- **Ghost**: `text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl`
- **Emergency Call**: `bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold rounded-xl`

### 5.2 Form Inputs
- Single text input: `w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500`
- Dropdown select: Styled native select element maintaining accessible keyboard accessibility.

### 5.3 Statutory Citation Badge
- Compact section tag: `bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-bold font-mono`

### 5.4 Multilingual Tabs
- Segmented pill container: `flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium`
- Active pill: `bg-white text-slate-900 font-bold shadow-2xs rounded-lg`
