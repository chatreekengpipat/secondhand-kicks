# Decisions

Why the non-obvious calls were made. Each entry is a decision that had a real
alternative — if there was no trade-off, it isn't in here.

---

## 1. Why vanilla HTML/CSS/JS, and no build step

A catalog of a few dozen shoes is a list, a filter and a modal. React, Vue or Svelte
would each add a toolchain (`npm install`, a bundler, a lockfile, a `dist/`) and a
deploy step, to solve state-management problems this site does not have.

The cost of a framework here is not bundle size — it's **who can change the site
next year**. With no build step, the shop owner edits a JSON file and pushes; GitHub
Pages serves the repo as-is. With a framework, the same edit requires a working Node
version, a successful install, and a build that hasn't rotted. The dependency that
breaks in eighteen months is the one you never think about when you add it.

**Trade-off accepted:** we hand-write DOM construction in `js/app.js` rather than
writing JSX. For ~200 lines of rendering that is a fair price. If this ever grows a
cart, accounts, or multi-page routing, revisit — that is the point where a framework
starts paying for itself.

---

## 2. Why `data/shoes.json` as the database

There is no backend. The alternatives were: hardcode listings in HTML, or run a CMS
or database.

Hardcoding fails the moment stock changes — which for a secondhand shop is weekly.
Every listing edit would become an HTML edit, and every HTML edit is a chance to break
the page. A database or CMS means a server, a bill, credentials, and something that
can be down at 2am when a buyer is browsing.

A single JSON file is the smallest thing that separates **data** from **presentation**.
The owner adds a shoe by adding an object; the grid, the brand chips, the size chips
and the price buckets all rebuild themselves from it. Nothing else is edited — this
is verified in CI and in the PR's QA evidence.

**Trade-off accepted:** the whole catalog is fetched on every page load. At hundreds
of shoes that would need pagination; at the scale of one person's secondhand shop it
is a single small request, and it buys total simplicity.

---

## 3. Why no cart and no checkout

The shop sells one-of-one items to Thai buyers who already message shops on LINE.
Nobody buys two of the same secondhand shoe, so a cart's core feature — quantity and
multi-item batching — is dead weight. Meanwhile a real checkout would mean handling
payments, which means PCI scope, refunds, and a legal surface a one-person shop does
not want.

The actual conversion path is: see shoe → tap → LINE. That is three taps and it ends
in a conversation, which is where secondhand deals are actually closed (buyers ask
about fit, wear, and shipping before paying). The site's job is to get the buyer into
that conversation with the shoe's code in hand, and then get out of the way.

**Trade-off accepted:** no order tracking, no automatic inventory decrement. The owner
flips `status` to `reserved` or `sold` by hand. For weekly stock turnover that is a
few seconds of work, not a system worth building.

---

## 4. Why CI validation of the data

With no build step and no backend, **nothing else typechecks the data.** A trailing
comma, a `"price": "2490"` (string instead of number), a duplicate `id` or a photo
path with the wrong case will not fail loudly — it will ship, and the first person to
notice is a buyer looking at a broken card.

`scripts/validate-shoes.js` closes that hole. It runs on every PR and every push to
main, and it checks the things that actually go wrong in hand-edited JSON: schema
conformity, unique ids, `price > 0`, valid status, non-empty photos, real calendar
dates (so `2026-02-31` fails), and relative photo paths.

The photo-existence check runs on Linux in CI specifically because the owner develops
on Windows: `Photos/Nike.JPG` and `photos/nike.jpg` are the same file on Windows and
two different files on the server. That class of bug is invisible locally and fatal in
production.

**Trade-off accepted:** the validator is hand-rolled rather than using JSON Schema +
ajv. A schema library would be more expressive, but it would put a `node_modules/` and
a lockfile in a repo whose entire premise is "no install step". The schema is small and
stable; the payoff is that error messages are written for a shop owner ("`originalPrice`
must be greater than `price` — otherwise it is not a discount") rather than as JSON
Pointer paths.

---

## 5. Why "Electric Night" is a rebuild, not a template

The design was inspired by a neon/dark template (TemplateMo 596 "Electric Xtra").
We rebuilt every idea natively instead of importing, copying, or linking any of its
files. Three reasons:

**Licence and provenance.** Copied template CSS carries attribution requirements and
an ambiguous licence trail into a repo the owner will hand to other people. Original
code carries none.

**Weight.** A template ships CSS and JS for every component *it* might need — sliders,
counters, preloaders, its own grid. This site needs a grid, chips, a card and a modal.
Rebuilding meant shipping one stylesheet with no unused rules and no jQuery.

**The bad ideas don't come along.** A template's flourishes are written to demo well,
not to run on a mid-range Android phone on 4G. Rebuilding forced an explicit decision
on each one — and most were rejected (see below).

**Borrowed (as ideas, reimplemented from scratch):** the dark/neon mood; the neon glow
on the primary CTA; the tab pattern, reinterpreted as filter chips with a glowing active
state; the subtle lift-and-accent-border on card hover.

**Rejected outright, for performance:** particles, scanlines, an animated grid
background, floating shapes, and auto-rotating hero text. Every one of them animates
continuously, which keeps the compositor awake and drains battery to decorate a page
whose job is to show shoes. The single atmospheric effect kept is a static radial wash
behind the hero — one paint, never animated.

**Trade-off accepted:** rebuilding cost more time up front than dropping in a template
would have. What it bought is a stylesheet the owner can read end to end, and a site
with no attribution debt. Because no implementation ended up resembling the template's
own code, no TemplateMo credit comment is required anywhere in the source.

---

## 6. Why `fetch()` — and why the site asks for a local server

**This is the one place two requirements in the brief genuinely collide**, so it is
recorded here rather than quietly resolved.

The brief asks for both (a) a single source of truth in `data/shoes.json` with zero
hardcoded listings and no build step, and (b) a site that works opened straight from
the local filesystem.

Those cannot both be fully true. Every modern browser blocks `fetch()`/`XHR` against
`file://` URLs as a security measure (Chrome treats it as a cross-origin request;
Firefox has enforced it since v68). So a page that reads its data from a JSON file
*cannot* read that file when double-clicked from disk.

The alternatives, and why each was rejected:
- **Inline the listings in a `<script>` tag in `index.html`** — breaks "zero hardcoded
  listings" and makes the HTML the source of truth.
- **Ship a duplicate `data/shoes.js` that assigns `window.SHOES`** — works from
  `file://`, but now the owner must edit two files to add one shoe, which directly
  breaks the requirement that a 7th JSON entry needs *no other edits*.
- **Add a build step that generates the duplicate** — explicitly out of scope.

So `fetch()` stays, and `file://` is handled as a **first-class, explained failure**
rather than a blank page: the site detects `location.protocol === 'file:'` and shows a
Thai message saying the browser blocks local file reads, giving the exact command to
run (`npx serve`) and noting that GitHub Pages — the actual deploy target — works
normally. The CSS still loads, so the page looks intentional rather than broken.

**Trade-off accepted:** the owner must run a one-line local server to preview changes
on their own machine. In exchange, the data model stays honest and adding a shoe stays
a one-file edit. Production, which is GitHub Pages over HTTPS, is unaffected.
