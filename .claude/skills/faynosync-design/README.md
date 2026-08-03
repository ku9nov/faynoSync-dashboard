# FaynoSync Design System

A design system distilled from the **faynoSync** product — a self-hosted update
server for desktop apps, and its web dashboard. This folder gives a design agent
everything needed to build on-brand interfaces, slides and mocks: brand assets,
color + type foundations, component specimens, and an interactive UI-kit recreation
of the dashboard.

> **Product in one line:** faynoSync lets developers ship over-the-air updates to
> their Windows / macOS / Linux desktop apps from infrastructure they control. The
> dashboard is where you manage applications, release channels, platforms,
> architectures, version artifacts, and view update statistics.

---

## Sources

Everything here was reverse-engineered from the project's open-source repositories.
You may not have access, but they're recorded so you (or the reader) can go deeper —
**exploring these repos directly will let you build far more accurate designs.**

| Repo | Role |
|------|------|
| [`ku9nov/faynoSync-dashboard`](https://github.com/ku9nov/faynoSync-dashboard) | **Primary source.** The web dashboard — Vite + React + TypeScript + Tailwind. All tokens, components and screens here come from it. |
| [`ku9nov/faynoSync`](https://github.com/ku9nov/faynoSync) | The Go API server the dashboard talks to (desktop update API). |
| [`ku9nov/faynoSync-site`](https://github.com/ku9nov/faynoSync-site) | Landing page + documentation. |
| [`ku9nov/faynosync-sdk-js`](https://github.com/ku9nov/faynosync-sdk-js) · [`-go`](https://github.com/ku9nov/faynosync-sdk-go) | Client SDKs. |

Notable detail from the dashboard repo: *"This frontend was built entirely with
CursorAI… I'm a DevOps engineer, not a frontend developer."* The visual language is
consistent and intentional even so — a single glassmorphic system applied everywhere.

---

## Content fundamentals

There are two distinct registers. Match the one that fits the surface.

**In-product UI copy** — plain, functional, sentence case.
- Short and literal: `Upload the app`, `Create app`, `All Channels`,
  `Publication Status`, `Reset Filters`, `View full changelog`, `Back`.
- Buttons are imperative verbs; filters are noun labels.
- Empty / fallback states are direct and lowercase-feeling:
  `No versions have been uploaded yet.`, `Changelog not provided`,
  `Not available yet`, `Single Day Snapshot`.
- Status is one or two words: `Published` / `Not published`, `Critical`,
  `Intermediate`, `Default: nginx`.
- Toasts state outcome plainly: `Application created successfully!`,
  `Processing...`, `Error: <message>`.
- **No emoji in the product UI.** Addressing is implicit — neither "I" nor "you";
  copy names the object (`Enable CDN`, `If selected, the app will be stored in a
  private bucket`).

**Docs / README / marketing** — warm, candid, emoji-friendly.
- The project README uses section emoji (📄 📦 🛠️ 🚀 ⚙️) and an informal, humble
  voice (🧠 😅 🙌). First person, conversational, invites feedback.
- Use this register for slides, READMEs and onboarding — not for buttons and labels.

Vibe overall: **engineer-practical and unpretentious.** Confident product UI, friendly
human docs. Avoid corporate fluff, exclamation-heavy hype, or jargon for its own sake.

---

## Visual foundations

The whole product is one idea executed consistently: **glassmorphism floating on a
vivid full-bleed gradient.**

**Color.** A vertical gradient *field* fills the viewport — `purple-800 (#6b21a8) →
orange-500 (#f97316)` in light mode, `gray-800 → indigo-900 → gray-900` in dark mode.
Every surface is a translucent pane on top of it. The single accent is
**violet `#8b5cf6`** (Tailwind `violet-500`, the `--card-color`): active nav, focus
rings, hover borders, soft badge fills. Purple drives light-mode buttons (`purple-600`),
indigo drives dark-mode (`indigo-600`). Status is conventional: green = published,
red = critical/destructive, yellow = intermediate, blue = reports. See
`colors_and_type.css` for the full token set.

**Type.** A single typeface — **Urbanist** (Google Fonts), a geometric sans, loaded
across weights 100–900. 400 for body, 600 for labels/eyebrows, 700 for headings and
card titles. Headers are 32px/700 with slight negative tracking; card titles 20–24px/700;
body 14–16px; uppercase eyebrows 11px/600 at `0.08em` tracking. Card titles are
sometimes given a subtle white→gray gradient text-clip.

**Backgrounds & texture.** No photography, no illustration, no repeating patterns —
the gradient field *is* the background. The only decorative motif is a pair of faint
white SVG **waves** at the bottom of the auth screen. Surfaces add depth purely through
translucency + blur, not imagery.

**Glass / cards.** The signature surface: `border-radius: 24px`, `2px` border at
`rgba(255,255,255,0.2)`, fill `linear-gradient(135deg, rgba(255,255,255,.10),
rgba(255,255,255,.05))`, `backdrop-filter: blur(16px)`, shadow
`0 4px 32px rgba(16,24,40,.18)`. Dark mode swaps the fill to `rgba(0,0,0,.30)`. Tables,
the sidebar, the header and popups all use the same recipe at different radii.

**Transparency & blur.** Used everywhere and deliberately: 16px backdrop-blur on cards,
sidebar and dropdowns; 20px on dark popups. Fills are low-alpha white (light) or black
(dark). (Note: the source disables backdrop-blur inside the scrolling content area to
avoid seam artifacts — blur is for chrome, not long lists.)

**Borders.** Always present, always soft: `2px` translucent white on cards/sidebar,
`1px` on inputs and pills. On hover, a card's border lights up to the violet accent.

**Shadows.** Cool blue-grey (`rgba(16,24,40,…)`), large and soft — `0 4px 32px` at rest,
`0 8px 40px` on hover. Accent buttons add a faint violet glow (`rgba(139,92,246,.08)`).
Dark popups use near-black shadows. No hard/short drop shadows anywhere.

**Corner radii.** Generous throughout: 24px cards/header/sidebar, 16px nav buttons &
popups, 12px buttons & icon tiles, 8px inputs/small buttons, 6px badges, full-round pills.

**Motion.** One easing — `cubic-bezier(0.4, 0, 0.2, 1)` — at `0.18s` for interactions,
`0.3s` for fades, `0.7s` for the auth banner reveal. Cards **lift and scale on hover**
(`translateY(-4px) scale(1.025)`) and their border lights to violet. Nav buttons slide
`+4px` right on hover/active with a diagonal light **shimmer** sweep across them; icon
tiles also shimmer. Settings button scales to `1.08`, action buttons to `1.04`. Danger
(unsigned-but-published) version cards **pulse** red. Entrances are simple opacity fades.
No bounces, no springy overshoot — smooth and quick.

**Hover / press states.** Hover = brighter fill + accent-colored border + slight lift/scale
(occasionally a translate). Active nav = violet gradient fill + glow + offset. Press isn't
heavily styled; focus shows a 2px violet ring. Disabled = `opacity: 0.5` + `cursor:
not-allowed`.

**Layout.** Fixed 256px glass sidebar on the left (becomes a slide-in drawer on mobile),
a glass header bar with title + search + actions, then a responsive card grid
(1 → 2 → 3 columns). Pages breathe: 32px page padding, 24px grid gaps, 24–32px card padding.

**Imagery vibe.** There essentially isn't any — it's a flat, saturated, cool-to-warm
gradient world. The only "image" is the brand logo. No grain, no photos, no 3D.

---

## Iconography

- **Primary icon set: Font Awesome 5.15.4, solid style (`fas`)**, loaded from CDN. This
  is the product's actual icon system. Core glyphs in use:
  `fa-th-large` (Applications), `fa-broadcast-tower` (Channels), `fa-desktop` (Platforms),
  `fa-microchip` (Architectures), `fa-chart-bar` (Statistics), `fa-cog` (settings),
  `fa-download`, `fa-edit`, `fa-trash`, `fa-copy`, `fa-check`, `fa-shield-alt` (TUF),
  `fa-upload`, `fa-plus`, `fa-lock`, `fa-angle-double-left` (pagination).
- **Secondary: inline stroke SVGs** in a Heroicons-like style (1.5–2px stroke, round
  caps) for a few one-off marks — the search ✕, chevrons, plus/upload glyphs, close ✕,
  back arrow. When you need an outline icon that isn't in Font Awesome, match that
  stroke style.
- **No emoji in the UI.** (Emoji appear only in the project's markdown docs.) No custom
  unicode glyphs as icons.
- To reuse: link Font Awesome 5 from CDN (already imported at the top of
  `colors_and_type.css`) and drop `<i class="fas fa-…"></i>`. Don't hand-draw these.

---

## Brand assets

Live in the dashboard repo's `public/` — use those, don't duplicate them:
- `public/banner-small.png` — primary wordmark (FAYNO in violet with an up-arrow, SYNC in
  orange with a down-arrow, an aperture/spiral pivoting the two). Use on the gradient field.
- `public/banner.png` — same wordmark, high resolution.
- `public/favicon.png` / `public/favicon.svg` — the **FS** monogram app mark on a
  pastel-spectrum disc.

The logo encodes the product: two directions of sync (push up / pull down) in the two
brand colors. Keep it on the gradient or a dark surface; give it room.

---

## Index — what's in this folder

| Path | Contents |
|------|----------|
| `README.md` | This file — context, sources, content & visual foundations, iconography. |
| `SKILL.md` | Agent-Skill manifest so this system can be used as a Claude skill. |
| `colors_and_type.css` | **Start here.** All design tokens — color ramps, semantic vars, Urbanist type scale, radii, shadows, motion. Imports Urbanist + Font Awesome. Includes a `.dark` theme block and base type utility classes. Mirrors the dashboard's `src/styles/theme.css` 1:1, with the Tailwind `theme()` calls resolved to literals. |

### How to use this system
1. Read `colors_and_type.css` and link it — it carries every token plus the fonts.
2. Keep to the glass-on-gradient recipe, the violet accent, Urbanist, and Font Awesome.
3. For throwaway mocks/slides, produce static HTML and pull assets from `public/`.

### Scope — read this before trusting anything here
This skill is a **token + voice reference**, not a spec of the shipped UI. It carries
nothing about component geometry, and what it once claimed there was wrong (one 460px
modal where the app actually has five widths from `max-w-md` to `w-[800px]`; a 6px badge
radius where the app uses 4px).

For anything that already exists in the dashboard — modal sizes, badge padding, spacing,
layout — **read the real component in `src/`**. It is the source of truth and it is more
accurate than any description of it. Use this file for work that has no existing
component to copy: new pages, slides, README graphics, marketing mocks.
