---
name: faynosync-design
description: Brand reference for faynoSync (a self-hosted desktop-app update server and its web dashboard) — design tokens, colors, type, fonts, iconography and UI copy voice. Use when designing something that does not exist yet: a new page, slide, mock, or marketing asset. For UI that already ships, read the real component in src/ instead.
user-invocable: true
---

Read `README.md` in this skill, then `colors_and_type.css` (all design tokens + fonts).

faynoSync's look is **glassmorphism on a full-bleed gradient field** (purple→orange in
light, slate→indigo in dark), a single **violet `#8b5cf6`** accent, the **Urbanist**
typeface, and **Font Awesome 5 (solid)** icons. Stay inside that system.

`colors_and_type.css` mirrors the dashboard's `src/styles/theme.css` — it is accurate and
safe to lift. This skill deliberately carries **no component geometry**: for modal widths,
badge padding, spacing or layout of anything already in the product, read the actual
component under `src/`. Never invent those numbers from this skill.

Brand assets live in the dashboard repo's `public/` (`banner.png`, `banner-small.png`,
`favicon.png`, `favicon.svg`) — reference those rather than making copies.

For slides/mocks/prototypes, output static HTML linking `colors_and_type.css`. For
production code, match the surrounding components first and use these tokens for anything
they don't already answer.

If invoked with no other guidance, ask what the user wants to build, ask a few clarifying
questions, then act as an expert designer producing HTML or production code as needed.
