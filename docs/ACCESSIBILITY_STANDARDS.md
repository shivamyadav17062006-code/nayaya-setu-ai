# NyayaSaathi (न्यायसाथी) Accessibility Standards & WCAG 2.2 AA Conformance

## 1. Compliance Mandate & Philosophy

Public legal aid platforms are constitutional touchpoints for citizens. Under India's **Rights of Persons with Disabilities Act, 2016 (RPwD Act)** and international **WCAG 2.2 Level AA** standards, NyayaSaathi must be completely operable by persons with diverse physical, sensory, and cognitive abilities.

This document records the architectural standards, technical implementations, and verification criteria enforced in Phase 15.

---

## 2. Accessibility Controls Architecture (`AccessibilityToolbar.jsx`)

An accessible toolbar is mounted directly into the persistent global navigation header:

```
[ A- (Decrease) ]  [ A (Normal) ]  [ A+ (Increase) ]  [ ◑ High Contrast ]
```

### 2.1 Dynamic Font Size Scaling
Font sizing is applied dynamically across the root document via scoped CSS utility classes:
- **Small (`font-size-sm`)**: Base root 14px (`87.5%`).
- **Normal (`font-size-md`)**: Base root 16px (`100%`) [Default].
- **Large (`font-size-lg`)**: Base root 18px (`112.5%`).
- **Extra Large (`font-size-xl`)**: Base root 20px (`125%`).

All relative units (`rem`, `em`) in Tailwind CSS adapt proportionally, allowing citizens with low vision or presbyopia to enlarge all legal text without breaking layout flows.

### 2.2 High Contrast Mode
- Activated via the `◑ High Contrast` button in the toolbar.
- Adds `.high-contrast` class to `document.documentElement`.
- High contrast CSS rules:
  - Background forced to pure black (`#000000`).
  - Text rendered in pure white (`#ffffff`).
  - Card borders rendered in sharp solid white (`1px solid #ffffff`).
  - Interactive buttons and badges highlighted with high-luminance gold/yellow accents (`#fde047` / `#eab308`).
  - Color contrast ratios exceed **7:1**, surpassing the WCAG Level AAA threshold (4.5:1 required for AA).

---

## 3. Keyboard Navigation & Focus Management

### 3.1 Skip-to-Content Anchor Link
A dedicated bypass block is rendered as the very first child of `<body>` / `<Navbar>`:
```html
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  Skip to main content / मुख्य सामग्रीवर जा / मुख्य सामग्री पर जाएं
</a>
```
- Completely hidden from view during mouse navigation (`sr-only`).
- Becomes prominent, focused, and elevated upon the first `Tab` keypress.
- Jumps keyboard focus directly past navigation links to `<main id="main-content" tabIndex="-1">`.

### 3.2 Visible Focus Rings
Default browser outline suppression (`outline: none`) without replacement is strictly prohibited.
- Global CSS rule in `frontend/src/index.css`:
```css
:focus-visible {
  outline: 2px solid #2563eb !important;
  outline-offset: 2px !important;
}
```
In High Contrast mode, focus rings automatically shift to `2px solid #fde047` with `3px offset` for maximum visibility.

---

## 4. Screen Reader Compatibility & ARIA Landmarks

### 4.1 ARIA Landmarks
- `<header role="banner">`: Navigation bar and branding.
- `<main id="main-content" role="main">`: Primary content viewport.
- `<footer role="contentinfo">`: Statutory disclaimers, NALSA helpline, and institutional links.
- `<aside role="complementary">`: Contextual help and legal aid directory filters.

### 4.2 ARIA Live Regions (`aria-live`)
- **`aria-live="polite"`**: Employed in `AccessibilityToolbar` to announce font-size adjustments and contrast mode toggles without interrupting the user's active reading flow.
- **`aria-live="assertive"`**: Used in error notifications, invalid form submission warnings, and active speech recognition status alerts.

### 4.3 Accessible Buttons & Icon Labels
Every icon-only button (Microphone, Read Aloud, Play/Pause/Stop, Font Scaling, High Contrast) carries an explicit `aria-label` localized or self-descriptive to screen-reader technologies:
- `aria-label="Read Aloud"`
- `aria-label="Pause Speech"`
- `aria-label="Stop Speech"`
- `aria-label="Increase text size"`
- `aria-label="Decrease text size"`
- `aria-label="Toggle high contrast mode"`

---

## 5. Reduced Motion & Motor Accessibility

### 5.1 Prefers-Reduced-Motion
For users with vestibular disorders or motion sensitivities, animations are suppressed globally via CSS media queries:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 5.2 Touch Targets & Spacing
All interactive controls, button pills, and checklist inputs adhere to a minimum touch target size of **44x44 CSS pixels** (`min-h-[44px] min-w-[44px]`), ensuring accessibility on mobile screens for users with tremors or motor limitations.
