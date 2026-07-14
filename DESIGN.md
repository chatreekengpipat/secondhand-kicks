---
name: Electric Night
description: Dark, high-contrast catalog UI for a Thai secondhand sneaker shop — neon orange for what you buy, electric blue for how you navigate.
colors:
  background: #0B0B10
  surface: #15151D
  border: rgba(255,255,255,0.07)
  text: #F4F4F6
  textMuted: #9A9AA6
  accentPrimary: #FF5E00
  accentSecondary: #00B2FF
  warning: #FFB020
  photoPlate: #F2F2F2
typography:
  display:
    family: Kanit
    weights: 600 700 800
    usage: headlines, prices, chips, buttons, badges
  body:
    family: Anuphan
    weights: 400 500
    usage: paragraphs, notes, descriptions
elevation:
  card: 0 16px 40px -18px rgba(0,0,0,0.9)
  glow: 0 0 0 1px rgba(255,94,0,0.5), 0 6px 28px -6px rgba(255,94,0,0.55)
  glowStrong: 0 0 0 1px rgba(255,94,0,0.7), 0 10px 38px -6px rgba(255,94,0,0.75)
---

# Electric Night

## Overview

Electric Night is the design system for a Thai secondhand sneaker catalog browsed
almost entirely on a phone, on mobile data, often outdoors. Three forces shaped it.

**The photos are the problem.** Secondhand stock is photographed on whatever
surface was nearby — a bedroom floor, a shop counter, a car seat. Dropped straight
onto a page they look like a scrapbook, not a shop. So every photo sits on a fixed
light neutral plate (`#F2F2F2`) inside a dark card. The plate is doing the work a
lightbox does in a studio: it normalizes a mixed set into one catalog, and it makes
the shoe pop off the dark page.

**Two accents, two jobs, never mixed.** Orange (`#FF5E00`) means *this is the
thing you buy*: prices, the LINE button, the active filter. Blue (`#00B2FF`) means
*this is how you move around and what you should know*: links, size badges, focus
rings, the status of a listing. A buyer scanning the grid can find the price and
the buy button without reading a word. The rule that keeps this legible is that no
single element ever wears both accents — the moment a button is orange *and*
blue-ringed, both colours stop meaning anything.

**Dark, but not a nightclub.** The reference that inspired this system leaned on
particles, scanlines, animated grids and floating shapes. All of that was rejected:
it costs frames on the mid-range Android phones this shop's buyers actually carry.
What survives is one static radial wash behind the hero and a neon box-shadow glow
on the primary CTA — atmosphere that costs a single paint and never animates.

## Colors

**Surfaces**
- `#0B0B10` — page background. Near-black with a blue cast, so the blue accent reads as
  part of the same world rather than as a sticker.
- `#101017` — raised background, for the "how to order" band that separates catalog from footer.
- `#15151D` — card and control surface. One step up from the page, never more.
- `rgba(255,255,255,0.07)` — the only default border. Hairline, so structure is felt, not seen.
- `#F2F2F2` — photo plate. The one light surface in the system, and it exists solely to
  make inconsistent secondhand photography look consistent.

**Text**
- `#F4F4F6` — primary text.
- `#9A9AA6` — muted text: labels, notes, secondary info.

**Accent — PRIMARY, electric orange `#FF5E00`**
Commerce. Prices, the LINE order CTA, the active filter chip, the shop mark, glow.
Text on orange is `#0B0B10` (dark ink), never white — orange is too bright to carry
white text at accessible contrast.

**Accent — SECONDARY, electric blue `#00B2FF`**
System and information. Links, size badges, the `available` status badge, focus rings,
informational hover states.

**Status**
- `available` → blue-tinted badge. Informational, not a call to action.
- `reserved` → outlined amber `#FFB020`. Deliberately outside both accents: it means
  "wait", which is neither "buy" nor "navigate".
- `sold` → photo goes `grayscale(1)` at 55% opacity with a dark `SOLD` ribbon. The card
  stays in the grid, sorted after everything buyable.

## Typography

Both faces must render Thai perfectly; that was the first filter, not an afterthought.
Thai has tall ascenders, descenders and stacked tone marks, so body line-height never
drops below 1.65 or the marks clip.

- **Display — Kanit, 600/700/800.** Headlines, prices, chips, buttons, badges, step
  numbers. Kanit's heavy weights hold their shape at large sizes in both scripts, and
  its Latin numerals are wide enough to read a price at a glance.
- **Body — Anuphan, 400/500.** Paragraphs, notes, condition descriptions. Taller
  x-height than Kanit at 16px, which is what makes long Thai notes comfortable.

Both load from Google Fonts with `display=swap` and an explicit fallback stack
(`Noto Sans Thai`, `Leelawadee UI`, `Segoe UI`, Tahoma). If Google Fonts is blocked
or slow, Thai still renders in a Thai-capable fallback — never in a Latin-only face
that would drop the script to boxes.

## Elevation

Elevation is carried by border and shadow, never by a lighter surface tint.

- **Resting card** — `#15151D` on a hairline border. No shadow.
- **Hovered / focused card** — lifts 4px, border turns orange, and takes
  `0 16px 40px -18px rgba(0,0,0,0.9)`. The lift is what makes the grid feel like
  physical stock you can pick up.
- **Primary CTA glow** — `0 0 0 1px rgba(255,94,0,0.5), 0 6px 28px -6px rgba(255,94,0,0.55)`,
  intensifying on hover. This is the system's signature. It is a box-shadow, not a
  filter or an animation, so it composites on the GPU and costs nothing to hold.
- **Sticky nav** — no shadow; a translucent background with `backdrop-filter: blur(12px)`
  and a hairline bottom border.

Everything above is suppressed under `prefers-reduced-motion: reduce`: transforms
resolve to none, transitions collapse, and smooth scrolling is turned off.

## Components

- **Button — primary.** Orange fill, dark ink, pill, permanent glow, 48px min height
  (a thumb target). Lifts 2px on hover. Used for exactly one thing per screen: ordering.
- **Button — ghost.** Transparent with a `--border-strong` outline; hover borrows the
  *secondary* accent. Never competes with the primary CTA.
- **Chip (filter).** Pill, `--surface` fill, muted text. Active state flips to the
  orange fill with the glow and sets `aria-pressed="true"`. Chips scroll horizontally
  on phones instead of wrapping into a wall that pushes the grid below the fold.
- **Card.** Photo plate on top (square, `object-fit: contain`), status badge floated
  over it, then brand / model / size + grade badges / price. Price is orange and is the
  largest thing in the card body. One tab stop per card.
- **Badge.** Size and `available` use the blue tint; `reserved` uses the amber outline;
  condition grade uses a neutral surface.
- **Modal.** A bottom sheet on phones (thumb-reachable), a centred dialog from 768px up.
  `aria-modal`, focus moves in on open, Tab is trapped, Escape closes, focus returns to
  the card that opened it.
- **States.** Loading, error, and empty are three mutually exclusive blocks; the empty
  state speaks Thai and tells the buyer what to do next.

## Do's and Don'ts

**Do**
- Do use orange for exactly one thing per view: the action that makes money.
- Do put every product photo on the `#F2F2F2` plate, without exception.
- Do keep `sold` items in the grid. A shelf with sold-out items is proof the shop ships.
- Do size every tappable control to at least 44–48px.
- Do let Thai breathe: line-height ≥ 1.65 on body copy.

**Don't**
- Don't mix the two accents in one element. An orange button with a blue border is a
  bug, not a variant.
- Don't put white text on orange. Use the dark ink `#0B0B10`.
- Don't add particles, scanlines, animated grids, floating shapes or auto-rotating hero
  text. They were considered and rejected — they cost frames on mid-range Android and
  buy nothing a buyer wants.
- Don't signal status with colour alone. `sold` also gets grayscale and a text ribbon.
- Don't introduce a third accent. If something needs to stand out and is neither
  commerce nor navigation, it is probably status — and status is amber.
