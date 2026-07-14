# CLAUDE.md — working context for AI agents

This file is the shared contract for any agent working in this repo.
`AGENTS.md` is a verbatim copy of it, for Codex and other tools.

---

## What this is

A static catalog site for a Thai secondhand sneaker shop (casual + running).
Deployed on **GitHub Pages at a subpath**, so **every path must be relative**.
A leading `/` resolves to the user root and 404s in production.

The buyer's whole journey is: browse → filter → open a shoe → tap through to LINE.
Three taps, on a phone, on mobile data.

---

## Working mode: senior dev, mentoring the owner

The repo owner is a tech consultant learning web development. Delivering working code
is half the job; the other half is leaving behind something they can reason about.

- **Production quality.** Errors and edge cases handled, accessible, performant.
- **Readable over clever.** If it needs a trick, it needs a comment explaining why the
  obvious thing didn't work.
- **Comments explain WHY, never WHAT.** `// min-width:0 or the grid track refuses to
  shrink and the page scrolls sideways` — not `// set min-width to 0`.
- **Every PR explains the WHY** behind non-obvious decisions.
- **Every feature adds a "What to study" note**: 2–3 concepts, one line each.
- **Where two approaches exist, state the trade-off and the choice.** Don't silently pick.

---

## Hard rules

1. **Vanilla HTML/CSS/JS only.** No frameworks, no build step, no `npm install`,
   no bundler. The site must run by opening the repo on a static host, as-is.
2. **`data/shoes.json` is the only source of truth.** ZERO hardcoded listings in HTML.
   Adding a shoe to the JSON must produce a card, a brand chip and a size chip with
   **no other file edited**. This is a tested guarantee — do not break it.
3. **All paths relative.** `./css/style.css`, `photos/<id>/1.svg`. Never `/css/...`.
4. **Never commit to `main`. Never force-push.** Branch → conventional commits → PR.
5. **Owner-fill values are written exactly as** `[CONFIRM: description]`.
6. **Out of scope — do not build, even if it seems helpful:** cart, checkout, payments,
   accounts, backend, database, analytics, any framework, any build step. Note good
   ideas in the PR description as future work instead of building them.
7. **Never touch:** `.impeccable/`, `.claude/`, `.agents/`, `.codex/`, `.gemini/`,
   `PRODUCT.md`. `_reference/` is read-only input and is gitignored.
   `DESIGN.md` is Impeccable-owned — obey it; only update it in Impeccable's own format.
8. **Any `*.local.json` is gitignored and never committed.**

---

## Data schema — `data/shoes.json`

A JSON array of shoe objects. Enforced by `scripts/validate-shoes.js` (run in CI).

| Field | Type | Rules |
|---|---|---|
| `id` | string | **required, unique.** lowercase `a-z0-9-` only. Also the `photos/<id>/` folder name. |
| `brand` | string | required, non-empty. Drives the brand filter chips. |
| `model` | string | required, non-empty. |
| `sizeEU` | number | required, > 0. Drives the size filter chips. |
| `sizeUS` | string | required. A **string**, so `"8.5"` and `"9-9.5"` both work and `"8.0"` doesn't render as `8`. |
| `condition` | object | required. `{ "grade": "A"\|"B"\|"C", "note": "<short Thai note>" }` |
| `price` | number | required, **> 0**. THB. |
| `originalPrice` | number | *optional.* If present must be **> `price`**, or it isn't a discount. |
| `status` | string | required. One of `available` \| `reserved` \| `sold`. |
| `photos` | string[] | required, **non-empty**. Relative paths. First photo is the card image. |
| `notes` | string | required, non-empty. Thai. Shown in the detail modal. |
| `dateAdded` | string | required. `YYYY-MM-DD`, and a **real** date (`2026-02-31` fails). |

### Status behaviour
- `available` → blue-tinted badge, LINE order button active.
- `reserved` → outlined amber badge, CTA becomes "ask for the next slot".
- `sold` → photo grayscale + `SOLD` ribbon, CTA disabled, card **sorted last but still
  visible** (a sold-out shelf is social proof).

### Adding a shoe
1. Add the object to `data/shoes.json`.
2. Put its photos in `photos/<id>/`.
3. Run `node scripts/validate-shoes.js`.
That's it. Do not edit HTML, CSS or JS to add stock.

---

## Shop identity — the `SHOP` config

The shop's name and social links live in **one place**: the `SHOP` object at the top
of `js/app.js`. `applyShopIdentity()` writes them into the page at load.

```js
const SHOP = { name: 'Second Kick', line: '', instagram: '' };
```

**An empty string is a supported state, not a bug.** The shop has no LINE or Instagram
yet, so:
- `line: ''` → the order CTA renders as a **disabled button** ("ยังไม่เปิดรับสั่งซื้อ"),
  and the LINE links in nav and footer remove themselves. It must **never** become an
  `<a>` pointing at an empty or placeholder href — a buy button that goes nowhere costs
  more trust than one that admits the shop isn't open yet.
- `instagram: ''` → the footer Instagram link isn't rendered.

Do not scatter these values back into the markup. Elements opt in with
`data-shop-name` and `data-shop-link="line|instagram"`.

---

## Files

| Path | Role |
|---|---|
| `index.html` | Markup and static copy. No listings. |
| `css/style.css` | The entire "Electric Night" design system. See `DESIGN.md`. |
| `js/app.js` | Fetch → filter → render → modal. All DOM built via `textContent`, never `innerHTML`. |
| `data/shoes.json` | **The database.** |
| `photos/<id>/` | Photos for one shoe. Currently SVG placeholders — the owner replaces these with real photos. |
| `scripts/validate-shoes.js` | Dependency-free validator. Exits non-zero with readable errors. |
| `.github/workflows/validate.yml` | Runs the validator + a photo-existence check on every PR and push to main. |
| `DESIGN.md` | The design system of record (Impeccable format). |
| `DECISIONS.md` | Why vanilla / why JSON / why no cart / why CI / why rebuild the template / why `fetch`. |

---

## Local development

Browsers block `fetch()` on `file://`, so **double-clicking `index.html` will not load
the catalog** — it will show an explained error state instead. Run a static server:

```bash
npx serve          # then open the printed http://localhost:… URL
# or:  python -m http.server 8000
```

This is a deliberate trade-off, explained in full in `DECISIONS.md` §6.
On GitHub Pages (the real deploy target) the site works normally.

Before pushing:
```bash
node scripts/validate-shoes.js
```

---

## Design system: "Electric Night"

Full spec in `DESIGN.md`. The two rules most easily broken:

- **Two accents, two jobs, never mixed in one element.**
  Orange `#FF5E00` = commerce (prices, LINE CTA, active chip, glow).
  Blue `#00B2FF` = system/info (links, size badges, focus rings, `available` status).
- **Text on orange is dark ink `#0B0B10`, never white.**

Product photos always sit on the light `#F2F2F2` plate — that is what makes
inconsistent secondhand photography look like one catalog.

Respect `prefers-reduced-motion`. No particles, scanlines, animated grids, floating
shapes, or auto-rotating text — all considered and rejected for performance.

---

## Accessibility baseline (do not regress)

- One tab stop per card; the card's accessible name includes brand, model, size, price.
- Filter chips are `<button aria-pressed>`, not styled divs.
- Modal: `aria-modal`, focus moves in on open, **Tab is trapped**, Escape closes,
  focus returns to the card that opened it, body scroll is locked while open.
- Focus is always visible (`:focus-visible`, blue ring).
- Status is never colour-only — `sold` also has grayscale and a text ribbon.
- Thai `alt` text and Thai UI copy throughout. Body line-height ≥ 1.65 so Thai tone
  marks don't clip.
