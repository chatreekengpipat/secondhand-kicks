# secondhand-kicks

[![Validate](https://github.com/chatreekengpipat/secondhand-kicks/actions/workflows/validate.yml/badge.svg)](https://github.com/chatreekengpipat/secondhand-kicks/actions/workflows/validate.yml)

A static catalog site for a second-hand sneaker shop — casual and running shoes.
Browse, filter by brand / size / price, open a shoe, and order through LINE.

No framework. No build step. No backend. Clone it, serve it, it works.

**Design system:** [Electric Night](DESIGN.md) — dark, neon, mobile-first.
**Why it's built this way:** [DECISIONS.md](DECISIONS.md).

---

## Run it locally

```bash
npx serve
# or:  python -m http.server 8000
```

Then open the URL it prints.

> **Double-clicking `index.html` will not work** — and the page will tell you so,
> with the exact command to run. Browsers block reading local data files from
> `file://` for security, and this site keeps its catalog in `data/shoes.json`.
> On GitHub Pages (where it actually lives) it works normally.
> The full reasoning is in [DECISIONS.md §6](DECISIONS.md).

---

## Add a shoe

This is the whole workflow. You never edit HTML, CSS or JavaScript to change stock.

**1. Put the photos in `photos/<id>/`** — pick an `id` of lowercase letters, numbers
and hyphens. It's the folder name and the shoe's code.

```
photos/nike-vomero-17-eu43/1.jpg
photos/nike-vomero-17-eu43/2.jpg
```

**2. Add an entry to `data/shoes.json`:**

```json
{
  "id": "nike-vomero-17-eu43",
  "brand": "Nike",
  "model": "Zoom Vomero 17",
  "sizeEU": 43,
  "sizeUS": "9.5",
  "condition": { "grade": "B", "note": "Normal use. Foam still springy." },
  "price": 2390,
  "originalPrice": 5200,
  "status": "available",
  "photos": ["photos/nike-vomero-17-eu43/1.jpg", "photos/nike-vomero-17-eu43/2.jpg"],
  "notes": "Soft-riding trainer, good for long runs. Light staining on the mesh.",
  "dateAdded": "2026-07-14"
}
```

**3. Check it:**

```bash
node scripts/validate-shoes.js
```

**4. Commit and push.** The card, the "Nike" brand chip and the "EU 43" size chip all
appear on their own. GitHub Actions re-runs the validator on the push.

### When a shoe sells

Change one field. Don't delete the entry — a sold-out shelf shows buyers the shop
actually ships.

```json
"status": "sold"
```

The card goes grayscale, gets a `SOLD` ribbon, moves to the end of the grid, and its
order button is disabled.

---

## The fields

| Field | Required | Notes |
|---|---|---|
| `id` | ✅ | Unique. Lowercase `a-z0-9-`. Also the photo folder name. |
| `brand` | ✅ | Creates the brand filter chip automatically. |
| `model` | ✅ | |
| `sizeEU` | ✅ | A number. Creates the size chip automatically. |
| `sizeUS` | ✅ | A **string** — `"8.5"`, `"9-9.5"`. |
| `condition` | ✅ | `{ "grade": "A"\|"B"\|"C", "note": "…" }` — grade plus a short note on the wear. |
| `price` | ✅ | Number, greater than 0. Thai baht — rendered as ฿2,490. |
| `originalPrice` | ➖ | Optional. Must be **higher** than `price`. Shows the strike-through and the saving. |
| `status` | ✅ | `available` \| `reserved` \| `sold` |
| `photos` | ✅ | At least one. Relative paths. The first one is the card image. |
| `notes` | ✅ | Shown in the detail popup. |
| `dateAdded` | ✅ | `YYYY-MM-DD`. Must be a real date. |

Get any of this wrong and `node scripts/validate-shoes.js` tells you exactly which
shoe and exactly what's wrong — and CI blocks the merge.

---

## Deploying to GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)`.

Every path in this project is relative, so it works from the `/secondhand-kicks/`
subpath that GitHub Pages serves a project site from.

---

## Project layout

```
index.html                     Markup. Contains zero shoe listings.
css/style.css                  The whole design system.
js/app.js                      Fetch → filter → render → modal.
data/shoes.json                ← the database. This is the only file you edit.
photos/<id>/                   Photos for one shoe.
scripts/validate-shoes.js      Checks the data. Runs in CI.
DESIGN.md                      The Electric Night design system.
DECISIONS.md                   Why it's built this way.
CLAUDE.md / AGENTS.md          Context for AI coding agents.
```

---

## Shop settings

The shop's name and its social links live in **one place** — the `SHOP` object at the
top of [`js/app.js`](js/app.js):

```js
const SHOP = {
  name: 'Second Kick',
  line: '',        // e.g. 'https://line.me/R/ti/p/@abc1234'
  instagram: '',   // e.g. 'https://instagram.com/secondkick.bkk'
};
```

An empty string means *"the shop doesn't have this yet"*, and that is a **supported
state, not a broken one**:

| Setting | When it's empty | When you fill it in |
|---|---|---|
| `line` | The order button renders **disabled** — "Ordering not open yet". It never becomes a link that goes nowhere. The LINE links in the nav and footer remove themselves. | The button becomes a real LINE link and the nav/footer links come back. |
| `instagram` | The Instagram link isn't rendered. | It appears in the footer. |

Paste a real URL in and everything starts working. **No other file needs to change.**

---

## Before this goes live

- [x] ~~CI badge~~ — points at `chatreekengpipat`.
- [x] ~~Shop name~~ — `Second Kick`. Change it in `SHOP.name`, one line.
- [ ] **`SHOP.line`** — the shop has no LINE yet, so ordering is correctly disabled.
      This is the one thing standing between the site and taking real orders.
- [ ] **`SHOP.instagram`** — optional. Leave `''` if the shop has no Instagram.
- [ ] **Real photos** — `photos/*/` currently holds SVG stand-ins. Drop real images in
      and point `photos` at them in `data/shoes.json`.
- [ ] **Real stock** — the six shoes in `data/shoes.json` are realistic **demo data**,
      not actual inventory.
- [ ] **Turn on GitHub Pages** — Settings → Pages → Deploy from a branch → `main` / `(root)`.
      Worth leaving off until `SHOP.line` is set, so the site doesn't go public with
      ordering disabled.
