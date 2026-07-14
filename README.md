# secondhand-kicks

[![Validate](https://github.com/[CONFIRM: GitHub username or org]/secondhand-kicks/actions/workflows/validate.yml/badge.svg)](https://github.com/[CONFIRM: GitHub username or org]/secondhand-kicks/actions/workflows/validate.yml)

A static catalog site for a Thai secondhand sneaker shop — casual and running shoes.
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

> **Double-clicking `index.html` will not work** — and the page will tell you so in
> Thai, with the command to run. Browsers block reading local data files from
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
  "condition": { "grade": "B", "note": "ใช้งานปกติ พื้นยังเด้งดี" },
  "price": 2390,
  "originalPrice": 5200,
  "status": "available",
  "photos": ["photos/nike-vomero-17-eu43/1.jpg", "photos/nike-vomero-17-eu43/2.jpg"],
  "notes": "รองเท้าวิ่งพื้นนุ่ม เหมาะกับวิ่งยาว มีรอยเปื้อนเล็กน้อยที่ผ้า",
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
| `condition` | ✅ | `{ "grade": "A"\|"B"\|"C", "note": "…" }` — grade plus a short Thai note. |
| `price` | ✅ | Number, greater than 0. Thai baht. |
| `originalPrice` | ➖ | Optional. Must be **higher** than `price`. Shows the strike-through and the saving. |
| `status` | ✅ | `available` \| `reserved` \| `sold` |
| `photos` | ✅ | At least one. Relative paths. The first one is the card image. |
| `notes` | ✅ | Thai. Shown in the detail popup. |
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

## Before this goes live

These need real values — search the repo for `[CONFIRM:` to find them all.

- [ ] `[CONFIRM: shop name]` — `index.html` (page title, nav, footer).
- [ ] `[CONFIRM: LINE OA or line.me link]` — `js/app.js` (`LINE_URL`) and `index.html`.
- [ ] `[CONFIRM: IG handle]` — `index.html` footer.
- [ ] `[CONFIRM: GitHub username or org]` — the CI badge at the top of this file.
- [ ] Replace the placeholder art in `photos/*/` with real photos.
