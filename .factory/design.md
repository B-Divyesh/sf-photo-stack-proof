# Photo Stack Proof — visual thesis

## Direction: generative evidence geometry

Photo libraries feel like stacks of near-identical rectangles; proof feels like
finding the one continuous thread that really passes through them. The visual
system turns that idea into offset photo planes, registration marks, and thin
identifier paths. Geometry explains the job instead of decorating it: aligned
paths mean a strong identifier agrees, broken paths mean evidence needs review.
The product is intentionally calm and forensic rather than “AI magical.”

## Palette

The default light treatment recalls a daylight contact sheet; dark mode recalls
a film-inspection bench. All functional states pair color with an icon and word.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| paper | `#F4F0E6` | `#101714` | page background |
| surface | `#FFFDF7` | `#18221D` | raised working surface |
| ink | `#17231E` | `#F5F1E7` | primary text |
| muted | `#52645B` | `#B7C6BD` | secondary text |
| line | `#C5CEC4` | `#3C5046` | dividers and geometry |
| proof | `#006A55` | `#5ED6AF` | verified / primary action |
| cobalt | `#3159C9` | `#8BA6FF` | focus and active evidence |
| amber | `#915D00` | `#F6C15F` | ambiguous / review |
| vermilion | `#B43B2C` | `#FF8D7E` | conflict |

Contrast targets are WCAG AA (4.5:1 for text, 3:1 for large/UI). Surfaces are
flat rather than translucent so evidence stays legible outdoors and in dark
editing rooms.

## Typography

- Display and interface: `Avenir Next`, `Segoe UI`, system sans-serif. The
  slightly geometric forms echo file and camera notation without adding a font
  download.
- Evidence values: `SFMono-Regular`, `Cascadia Code`, `Roboto Mono`, monospace.
  Tabular numbers let capture times and counts scan vertically.
- Scale: 14 / 16 / 20 / 28 / 44 / 64 px. Body is never below 16 px; labels at
  14 px are supplementary only. Reading measure is capped at 68 characters.

## Spacing and shape

An 8 px base rhythm with 4 px for tight evidence pairs. Main widths are 720 px
for prose and 1180 px for the workbench. Corners use 2, 10, and 18 px rather
than framework-default pills. Photo-plane corners are clipped with CSS to evoke
film frames. Touch targets are at least 44 px with 8 px separation.

## Interaction grammar

The primary journey is linear: choose files → inspect evidence → filter review
states → export CSV. File selection is a large workbench, never an invisible
drop target. Status shapes remain consistent: solid diamond = verified; split
square = ambiguous; crossed circle = conflict. Details disclose inline so the
user never loses the group they were reviewing. Keyboard focus uses a 3 px
cobalt outer ring.

## Motion

UI transitions last 180–240 ms. Candidate planes settle from a small vertical
offset; evidence paths draw once when results arrive. Nothing loops. With
`prefers-reduced-motion: reduce`, all transforms and drawn-path effects become
instant opacity/state changes. Analysis progress is textual and determinate by
file count where possible.

## Responsive intent

On phones the decorative hero art crops to a compact evidence strip, statistics
become a 2×2 grid, and group rows become vertical evidence sheets. No evidence
fields disappear. The filter rail scrolls horizontally; actions remain in flow
so browser and installed-app safe areas are respected.

## Asset plan and provenance

- `public/media/proof-geometry.webp`: an original generated still-life of
  abstract translucent photo planes and one continuous green identifier thread,
  used as the explanatory hero image (not a capability screenshot).
- `public/media/social-card.jpg`: a 1200×630 centre crop of the same generated
  still-life for Open Graph and Twitter sharing. It contains no required text.
- App icons and status symbols are hand-authored SVG/geometric CSS, because
  precise simple interface marks should remain code-native.

### Generation prompt sheet

Use case: stylized-concept. Asset: wide landing-page hero. Subject: four offset
archival photo plates with punched registration corners, crossed by one precise
continuous identifier filament, plus one visibly misaligned plate. World:
forensic photo contact-sheet table. Materials: matte paper, smoked glass,
brushed dark metal. Light: soft raking studio daylight with crisp restrained
shadows. Lens: orthographic/isometric macro, generous negative space. Palette:
warm bone, deep botanical black, oxidized green, cobalt pin marks, one muted
vermilion conflict mark. Style: editorial generative geometry, tactile, quiet,
high fidelity. Negative list: people, cameras, UI screenshots, gradients,
glowing neon, logos, letters, readable text, watermark, brands.

Generated on 2026-08-27 with the factory Azure image deployment via
`/opt/fleet/lib/gen-image.sh`. Original project asset; no third-party source
material. The footer discloses that the abstract illustration was generated.
