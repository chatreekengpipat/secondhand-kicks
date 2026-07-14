#!/usr/bin/env node
/**
 * Validates data/shoes.json — the single source of truth for the catalog.
 *
 * WHY this exists: the site has no backend and no build step, so a typo in the
 * JSON is not caught by a compiler or a server — it ships straight to a buyer's
 * phone as a broken card. This validator is the only gate between an edit and
 * production, so it runs in CI on every push and PR.
 *
 * WHY dependency-free: adding a schema library (ajv, zod) would mean a
 * node_modules/ and a lockfile in a repo whose whole point is "no build step".
 * The schema is small and stable; hand-rolled checks keep the repo installable
 * by cloning it. Trade-off: we give up JSON Schema's expressiveness and have to
 * write our own error messages — which turns out to be a win, because we can
 * write them in the shop owner's terms rather than in JSON Pointer syntax.
 *
 * Usage: node scripts/validate-shoes.js [path/to/shoes.json]
 * Exits 0 when valid, 1 when not.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const VALID_STATUSES = ['available', 'reserved', 'sold'];
const VALID_GRADES = ['A', 'B', 'C'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Keys we know about. Anything else is a typo (e.g. "prices", "sizeUk") that
// would otherwise fail silently: the renderer would just read undefined.
const KNOWN_KEYS = new Set([
  'id', 'brand', 'model', 'sizeEU', 'sizeUS', 'condition',
  'price', 'originalPrice', 'status', 'photos', 'notes', 'dateAdded',
]);

const REQUIRED_KEYS = [
  'id', 'brand', 'model', 'sizeEU', 'sizeUS', 'condition',
  'price', 'status', 'photos', 'notes', 'dateAdded',
];

const errors = [];

/** Record an error against a human-findable location, e.g. `shoe #2 (nike-af1) → price`. */
function fail(where, message) {
  errors.push({ where, message });
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/** A real calendar date, not just four-two-two digits: 2026-02-31 must fail. */
function isRealDate(str) {
  if (!DATE_RE.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function validateShoe(shoe, index, seenIds) {
  // Label the shoe by id where possible — "shoe #4" alone means counting array
  // entries by hand in an editor.
  const label = isPlainObject(shoe) && isNonEmptyString(shoe.id)
    ? `shoe #${index + 1} (${shoe.id})`
    : `shoe #${index + 1}`;

  if (!isPlainObject(shoe)) {
    fail(label, 'must be an object { ... }');
    return;
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in shoe)) fail(label, `missing required field "${key}"`);
  }

  for (const key of Object.keys(shoe)) {
    if (!KNOWN_KEYS.has(key)) {
      fail(label, `unknown field "${key}" — typo? (known: ${[...KNOWN_KEYS].join(', ')})`);
    }
  }

  if ('id' in shoe) {
    if (!isNonEmptyString(shoe.id)) {
      fail(label, '"id" must be a non-empty string');
    } else {
      // The id is used as a URL-ish key and as the photos/<id>/ folder name, so
      // keep it filesystem- and URL-safe. This also keeps it stable if we ever
      // add deep links (?shoe=<id>).
      if (!/^[a-z0-9][a-z0-9-]*$/.test(shoe.id)) {
        fail(label, `"id" must be lowercase letters, numbers and hyphens only (got "${shoe.id}")`);
      }
      if (seenIds.has(shoe.id)) {
        fail(label, `duplicate "id" — "${shoe.id}" is already used by shoe #${seenIds.get(shoe.id) + 1}`);
      } else {
        seenIds.set(shoe.id, index);
      }
    }
  }

  for (const key of ['brand', 'model', 'notes']) {
    if (key in shoe && !isNonEmptyString(shoe[key])) {
      fail(label, `"${key}" must be a non-empty string`);
    }
  }

  if ('sizeEU' in shoe) {
    if (typeof shoe.sizeEU !== 'number' || !Number.isFinite(shoe.sizeEU) || shoe.sizeEU <= 0) {
      fail(label, `"sizeEU" must be a positive number (got ${JSON.stringify(shoe.sizeEU)})`);
    }
  }

  // sizeUS is a string, not a number: half sizes like "8.5" and ranges like
  // "9-9.5" both occur on real resale listings, and "8.0" must not render as 8.
  if ('sizeUS' in shoe && !isNonEmptyString(shoe.sizeUS)) {
    fail(label, '"sizeUS" must be a non-empty string, e.g. "8.5"');
  }

  if ('condition' in shoe) {
    const c = shoe.condition;
    if (!isPlainObject(c)) {
      fail(label, '"condition" must be an object { "grade": "A"|"B"|"C", "note": "..." }');
    } else {
      if (!VALID_GRADES.includes(c.grade)) {
        fail(label, `"condition.grade" must be one of ${VALID_GRADES.join(', ')} (got ${JSON.stringify(c.grade)})`);
      }
      if (!isNonEmptyString(c.note)) {
        fail(label, '"condition.note" must be a non-empty string (short Thai description)');
      }
    }
  }

  if ('price' in shoe) {
    if (typeof shoe.price !== 'number' || !Number.isFinite(shoe.price) || shoe.price <= 0) {
      fail(label, `"price" must be a number greater than 0 (got ${JSON.stringify(shoe.price)})`);
    }
  }

  // originalPrice is optional — but if present it must make sense as a
  // "was" price, otherwise the card would show a discount that isn't one.
  if ('originalPrice' in shoe) {
    const op = shoe.originalPrice;
    if (typeof op !== 'number' || !Number.isFinite(op) || op <= 0) {
      fail(label, `"originalPrice" must be a number greater than 0 (got ${JSON.stringify(op)})`);
    } else if (typeof shoe.price === 'number' && op <= shoe.price) {
      fail(label, `"originalPrice" (${op}) must be greater than "price" (${shoe.price}) — otherwise it is not a discount`);
    }
  }

  if ('status' in shoe && !VALID_STATUSES.includes(shoe.status)) {
    fail(label, `"status" must be one of ${VALID_STATUSES.join(', ')} (got ${JSON.stringify(shoe.status)})`);
  }

  if ('photos' in shoe) {
    if (!Array.isArray(shoe.photos) || shoe.photos.length === 0) {
      fail(label, '"photos" must be a non-empty array of image paths');
    } else {
      shoe.photos.forEach((p, i) => {
        if (!isNonEmptyString(p)) {
          fail(label, `"photos[${i}]" must be a non-empty string`);
          return;
        }
        // Absolute paths ("/photos/...") break on GitHub Pages project sites,
        // which are served from /<repo>/ — this is the single most likely way
        // to ship a site where every image 404s. Catch it here, not in prod.
        if (p.startsWith('/') || /^https?:\/\//i.test(p)) {
          fail(label, `"photos[${i}]" must be a relative path like "photos/${shoe.id || '<id>'}/1.jpg" (got "${p}") — absolute paths break on GitHub Pages`);
        }
      });
    }
  }

  if ('dateAdded' in shoe && !(typeof shoe.dateAdded === 'string' && isRealDate(shoe.dateAdded))) {
    fail(label, `"dateAdded" must be a real date in YYYY-MM-DD format (got ${JSON.stringify(shoe.dateAdded)})`);
  }
}

function main() {
  const file = process.argv[2] || path.join(__dirname, '..', 'data', 'shoes.json');
  const rel = path.relative(process.cwd(), file) || file;

  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`✖ Cannot read ${rel}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    // JSON.parse messages include the character offset; turning that into a
    // line/column is the difference between "go read 200 lines" and "go to L47".
    const offset = Number((err.message.match(/position (\d+)/) || [])[1]);
    let loc = '';
    if (Number.isInteger(offset)) {
      const before = raw.slice(0, offset);
      const line = before.split('\n').length;
      const col = offset - before.lastIndexOf('\n');
      loc = ` (line ${line}, column ${col})`;
    }
    console.error(`✖ ${rel} is not valid JSON${loc}\n  ${err.message}`);
    console.error('\n  Common causes: a trailing comma after the last item, or a missing " quote.');
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error(`✖ ${rel} must contain a JSON array of shoes, starting with [ and ending with ].`);
    process.exit(1);
  }

  if (data.length === 0) {
    console.error(`✖ ${rel} has no shoes in it. Add at least one, or the catalog page will be empty.`);
    process.exit(1);
  }

  const seenIds = new Map();
  data.forEach((shoe, i) => validateShoe(shoe, i, seenIds));

  if (errors.length > 0) {
    console.error(`✖ ${rel} — found ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n`);
    for (const { where, message } of errors) {
      console.error(`  ${where}\n    → ${message}\n`);
    }
    console.error('Fix the problems above and run this again:\n  node scripts/validate-shoes.js');
    process.exit(1);
  }

  const counts = VALID_STATUSES
    .map((s) => `${data.filter((x) => x.status === s).length} ${s}`)
    .join(', ');
  console.log(`✔ ${rel} is valid — ${data.length} shoes (${counts}).`);
  process.exit(0);
}

main();
