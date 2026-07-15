---
name: Electric Night
description: Dark, high-contrast catalog UI for a second-hand sneaker shop — neon orange for what you buy, electric blue for how you navigate.
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
  accentSecondaryText: #6FD3FF
  accentSecondaryBright: #5CD0FF
  surfaceDisabled: #23232D
typography:
  display:
    family: Kanit
    weights: 600 700 800
    usage: hero quote, headlines, prices, chips, buttons, badges
  body:
    family: Anuphan
    weights: 400 500
    usage: paragraphs, notes, descriptions
elevation:
  card: 0 16px 40px -18px rgba(0,0,0,0.9)
  glow: 0 0 0 1px rgba(255,94,0,0.5), 0 6px 28px -6px rgba(255,94,0,0.55)
  glowStrong: 0 0 0 1px rgba(255,94,0,0.7), 0 10px 38px -6px rgba(255,94,0,0.75)
  flight: 0 30px 60px -20px rgba(0,0,0,0.9)
---

# Electric Night

## Overview

Electric Night is the design system for a second-hand sneaker catalog browsed almost
entirely on a phone, on mobile data, often outdoors, by a young audience. Four forces
shaped it.

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

**The copy has to flex, not apologise.** Selling second-hand to a young buyer fails the
moment the writing sounds like an excuse. Nobody wants to feel like they bought *used*;
they want to feel like they got the grail for less and have taste. That is why the hero
is a quote — "Second-hand. Never second-best." — and why every condition note states the
wear plainly instead of hedging. Honesty reads as confidence; hedging reads as damage.

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

**Derived tokens** — these are part of the system, not drift. Every one exists for a
reason and none may be pasted as a raw hex at a use site.
- `--accent-2-text: #6FD3FF` — the secondary accent as **text** on a dark surface.
  `#00B2FF` is a *fill* colour; as text on `#15151D` it falls under 4.5:1, so anything
  you have to actually read (badges, status labels) uses the lightened value.
- `--accent-2-bright: #5CD0FF` — link hover.
- `--surface-disabled: #23232D` — a control that exists but cannot be used (a sold
  shoe's order button). Deliberately not an accent: a disabled CTA must not look
  clickable.
- `--photo-plate-raised: #FFFFFF` — gallery thumbnails, which sit *on* the `#F2F2F2`
  plate and so must be one step brighter or they vanish into their own background.
- `--code-bg: #000000` — inline `<code>` in the error state.

**Status**
- `available` → blue-tinted badge. Informational, not a call to action.
- `reserved` → outlined amber `#FFB020`. Deliberately outside both accents: it means
  "wait", which is neither "buy" nor "navigate".
- `sold` → photo goes `grayscale(1)` at 55% opacity with a dark `SOLD` ribbon. The card
  stays in the grid, sorted after everything buyable.

## Typography

- **Display — Kanit, 600/700/800.** The hero quote, headlines, prices, chips, buttons,
  badges, step numbers. Kanit's heavy weights are geometric and slightly condensed,
  which is exactly what lets a four-word quote fill a phone screen at 2.1rem without
  wrapping into mush. Its numerals are wide enough to read a price at a glance.
- **Body — Anuphan, 400/500.** Paragraphs, condition notes, descriptions. Taller
  x-height than Kanit at 16px, which is what makes the longer notes comfortable.

Both load from Google Fonts with `display=swap` and an explicit fallback stack. The
site's copy is English; both faces nonetheless keep their full Thai coverage, so
re-adding Thai copy later costs a font change of exactly zero.

**Line-height on body copy stays at 1.65.** It was originally set for Thai tone marks;
it stays because it is simply comfortable, and because it is what the Thai fallback
would need the day any Thai returns.

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

- **Hero quote.** The centrepiece and the largest type in the system
  (`clamp(2.1rem, 8.5vw, 4.75rem)`, Kanit 800).

  > **"Second-hand. Never second-best."**

  The copy is doing a specific job. Selling second-hand to a young audience fails the
  moment the writing *apologises* for the goods being used — "cheap", "still fine" all
  read as compromise. This line takes the objection (*second*) and turns it into a
  flex in four words. The first line is white and states the fact; the payoff line is
  orange, glowing, and underlined, and is the only sentiment on the page.

  **Entrance:** each word is a two-layer span — the outer clips, the inner slides up
  out of it — staggered 90ms apart, followed by an underline that draws itself in
  under the payoff line (`scaleX`, `transform-origin: left`).

  **Only `transform` and `opacity` animate.** Both composite on the GPU and never
  trigger layout, which is what makes a large animated headline free on a mid-range
  phone. An underline animated by `width` instead of `scaleX` would relayout the line
  on every frame.

  **It runs once.** Nothing in this system loops. See Motion, below.

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
- **Photo lift — the signature transition.** Opening and closing a shoe is the site's one
  big move. On tap, the tapped card's photo detaches, lifts, and expands into the detail
  view's photo; on close it flies back to its card on the shelf. It is a FLIP (First,
  Last, Invert, Play): a single `position: fixed` clone is placed at its destination box,
  inverted back onto the origin box, and released — so **one composited `transform`**
  carries a full-screen photo across the page without ever touching layout, which is what
  lets it stay smooth on a mid-range Android.

  The move chose the *photo* on purpose. The `#F2F2F2` plate is the star of this system,
  so the thing that travels is the plate. Three guards keep it honest: the flying clone is
  `pointer-events: none` (it must **never** swallow a tap — the exact trap the modal fell
  into, see Don'ts); the real detail image is held invisible until the clone lands, then
  cross-fades in so the card's 6% photo padding never snaps against the detail photo; and
  focus, scroll-lock and keyboard wiring happen immediately, independent of the flight, so
  the modal is fully usable the instant it opens. Skipped entirely under reduced motion —
  the modal just opens.

- **Catalog entrance (grid ignition).** Cards mask-rise in a capped stagger on the **first**
  populated render only. Filtering re-renders the grid but never replays the entrance: a
  fresh animation on every chip tap is fatigue, not delight. Because the un-animated state
  is the final state, a reduced-motion or headless render simply shows the cards.
- **States.** Loading, error, and empty are three mutually exclusive blocks. The empty
  state tells the buyer what to do next ("Try widening your search"), and the `file://`
  error state explains the browser restriction and gives the exact command to fix it.

## Motion

One rule: **motion arrives, then it is done.** Every animation in this system is a
one-shot entrance or a hover response. Nothing loops, because a continuous animation
keeps the compositor awake for as long as the tab is open and spends battery to
decorate a page whose job is to show shoes.

Four moments spend that budget, and no more: the **hero quote** entrance, the **grid
ignition**, the **card hover** lift, and the **photo lift**. The first two are one-shot
entrances (the grid ignition fires once, on the first render — see Components). The photo
lift is a one-shot *response* to a tap — a FLIP transition, not a loop — so it obeys the
rule exactly: it arrives when the buyer acts, then it is gone. It gets the system's one
bespoke easing, `--ease-flight` (`cubic-bezier(0.16, 1, 0.3, 1)`), a confident
deceleration reserved for that single move so the photo lands decisively rather than
drifting to a stop.

Only `transform` and `opacity` are animated. Both are composited; anything else
(`width`, `top`, `filter`, `box-shadow` on a loop) forces layout or paint every frame.
The photo lift holds to this too: it moves a clone with `transform` alone and cross-fades
it with `opacity`, never animating the size of a real, laid-out element.

**`prefers-reduced-motion: reduce` collapses all of it** — and note that zeroing the
*duration* is not enough on its own. The hero words use `animation-fill-mode:
backwards`, which holds the hidden from-state for the whole `animation-delay`; leave
an 800ms delay in place with a zeroed duration and the quote sits **invisible** and
then pops, which is precisely the jolt reduced-motion exists to prevent. The delay is
zeroed too.

The grid ignition survives the same way — its cards' un-animated state *is* their final
state (`backwards` fill again), so a reduced-motion or headless render shows them, never
blank. The photo lift is handled in JS, not CSS: under reduced motion it is skipped
outright, and the modal simply opens and closes.

## Do's and Don'ts

**Do**
- Do use orange for exactly one thing per view: the action that makes money.
- Do put every product photo on the `#F2F2F2` plate, without exception.
- Do keep `sold` items in the grid. A shelf with sold-out items is proof the shop ships.
- Do size every tappable control to at least 44–48px.
- Do keep body line-height at 1.65 or above. It reads better, and it is what the Thai
  fallback needs the day any Thai copy returns.

- Do keep `[hidden] { display: none !important; }` in the reset. It looks redundant and
  is not — see Don'ts.
- Do keep any full-viewport or floating overlay `pointer-events: none` unless it is meant
  to be clicked. The photo-lift clone follows this rule; a fixed overlay that eats taps is
  the same class of bug as the un-hidden modal below.

**Don't**
- Don't mix the two accents in one element. An orange button with a blue border is a
  bug, not a variant.
- Don't put white text on orange. Use the dark ink `#0B0B10`.
- Don't add particles, scanlines, animated grids, floating shapes or auto-rotating hero
  text. They were considered and rejected — they cost frames on mid-range Android and
  buy nothing a buyer wants.
- Don't animate anything on a loop. Entrances, hovers, and one-shot tap responses only.
- Don't replay the grid ignition on filter. It fires once, on the first render; a fresh
  stagger on every chip tap is motion fatigue.
- Don't signal status with colour alone. `sold` also gets grayscale and a text ribbon.
- Don't introduce a third accent. If something needs to stand out and is neither
  commerce nor navigation, it is probably status — and status is amber.
- Don't paste a raw hex at a use site. If a colour is worth using it is worth naming in
  the token block and recording here.
- **Don't assume the `hidden` attribute hides anything you have given a `display` to.**
  `[hidden] { display: none }` comes from the browser's UA stylesheet, and *any* author
  rule beats a UA rule regardless of specificity. `.modal { display: flex }` silently
  defeats it — and a `position: fixed; inset: 0` modal that never hides will dim the
  whole page with its backdrop and swallow every click on the site. This shipped once.
  The global `[hidden]` reset is what prevents it.
