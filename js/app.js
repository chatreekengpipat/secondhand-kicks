/* ============================================================================
   secondhand-kicks — catalog app.
   Vanilla JS, no framework, no build step. Loaded with `defer`, so the DOM is
   parsed before this runs and we never need a DOMContentLoaded wrapper.

   Data flows one way:  shoes.json → state.shoes → filter() → render()
   Nothing writes back. Every re-render is a full re-render of the grid, which
   at catalog scale (tens of items) is far cheaper than the bug surface of
   incremental DOM patching.
   ========================================================================== */
'use strict';

(function () {
  /* ---------- Config ------------------------------------------------------ */

  /**
   * The shop's identity. THIS IS THE ONLY PLACE TO EDIT IT — the name, the LINE
   * link and the Instagram link are all read from here and written into the page
   * at load. Change a value here and it updates everywhere it appears.
   *
   * An empty string means "the shop does not have this yet", and that is a
   * supported state, not a broken one:
   *   - no `line`      → the order button renders disabled, saying orders aren't
   *                      open yet. It never becomes a link that goes nowhere.
   *   - no `instagram` → the Instagram link is simply not rendered.
   *
   * The moment a real URL is pasted in, the button and links start working. No
   * other file needs to be touched.
   */
  const SHOP = {
    name: 'Second Kick',

    // [CONFIRM: LINE OA or line.me link] — e.g. 'https://line.me/R/ti/p/@abc1234'
    // Leave '' until the shop's LINE actually exists.
    line: '',

    // [CONFIRM: IG handle] — e.g. 'https://instagram.com/secondkick.bkk'
    // Leave '' if the shop has no Instagram.
    instagram: '',
  };

  const DATA_URL = './data/shoes.json';

  // Order of display. A sold shoe stays visible (it is social proof — it shows
  // the shop actually ships) but must never sit above something buyable.
  const STATUS_ORDER = { available: 0, reserved: 1, sold: 2 };

  const STATUS_LABEL = {
    available: 'พร้อมส่ง',
    reserved: 'มีคนจองแล้ว',
    sold: 'ขายแล้ว',
  };

  const PRICE_BUCKETS = [
    { id: 'lt2000', label: 'ต่ำกว่า 2,000', test: (p) => p < 2000 },
    { id: '2000-2999', label: '2,000–2,999', test: (p) => p >= 2000 && p < 3000 },
    { id: 'gte3000', label: '3,000 ขึ้นไป', test: (p) => p >= 3000 },
  ];

  // Neutral placeholder for a photo that 404s or is corrupt. Inline data URI so
  // the fallback itself can never be the thing that fails to load.
  const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
    '<rect width="600" height="600" fill="#F2F2F2"/>' +
    '<g fill="none" stroke="#C4C4CB" stroke-width="14" stroke-linecap="round">' +
    '<path d="M188 330h224M188 330l-28 64h280l-28-64"/><circle cx="300" cy="252" r="52"/>' +
    '</g><text x="300" y="452" text-anchor="middle" font-family="sans-serif" ' +
    'font-size="26" fill="#9A9AA6">ไม่มีรูป</text></svg>'
  );

  /* ---------- Elements ---------------------------------------------------- */

  const el = {
    grid: document.getElementById('grid'),
    filters: document.getElementById('filters'),
    brand: document.getElementById('filter-brand'),
    size: document.getElementById('filter-size'),
    price: document.getElementById('filter-price'),
    count: document.getElementById('result-count'),
    reset: document.getElementById('filter-reset'),
    loading: document.getElementById('state-loading'),
    error: document.getElementById('state-error'),
    errorBody: document.getElementById('state-error-body'),
    errorRetry: document.getElementById('state-error-retry'),
    empty: document.getElementById('state-empty'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    modalDialog: document.getElementById('modal-dialog'),
    navToggle: document.getElementById('nav-toggle'),
    navMenu: document.getElementById('nav-menu'),
    year: document.getElementById('footer-year'),
  };

  const state = {
    shoes: [],
    filters: { brand: 'all', size: 'all', price: 'all' },
    lastFocused: null, // element to restore focus to when the modal closes
  };

  /* ---------- Utilities --------------------------------------------------- */

  // Thai buyers read prices grouped: 2,490 not 2490. Intl handles this and stays
  // correct if the locale ever changes; we only pin the currency symbol away
  // because "฿2,490" reads as a foreign-exchange rate to a local buyer.
  const priceFmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

  function formatPrice(n) {
    return priceFmt.format(n) + ' บาท';
  }

  /** Build an element. Text goes through textContent, never innerHTML. */
  function h(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    for (const [k, v] of Object.entries(opts.attrs || {})) {
      if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const child of children) {
      if (child) node.appendChild(child);
    }
    return node;
  }

  /** Show exactly one of the mutually-exclusive page states. */
  function setState(name) {
    el.loading.hidden = name !== 'loading';
    el.error.hidden = name !== 'error';
    el.empty.hidden = name !== 'empty';
    el.grid.hidden = name === 'loading' || name === 'error';
    el.filters.hidden = name === 'loading' || name === 'error';
  }

  /* ---------- Load -------------------------------------------------------- */

  async function load() {
    setState('loading');
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับ ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('ไฟล์ข้อมูลว่างเปล่า หรือรูปแบบไม่ถูกต้อง');
      }
      state.shoes = data.slice().sort(compareShoes);
      buildFilters();
      render();
    } catch (err) {
      showError(err);
    }
  }

  function compareShoes(a, b) {
    const byStatus = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (byStatus !== 0) return byStatus;
    // Newest first within a status group — new stock is what a repeat visitor
    // is here for.
    return String(b.dateAdded).localeCompare(String(a.dateAdded));
  }

  function showError(err) {
    setState('error');
    el.errorBody.textContent = '';

    // Browsers block fetch() on file:// for security, so double-clicking
    // index.html can never load the JSON. This is the single most likely way
    // the owner sees a broken page, so it gets its own instructions rather than
    // a generic network error.
    if (location.protocol === 'file:') {
      el.errorBody.append(
        'เบราว์เซอร์ไม่อนุญาตให้อ่านไฟล์ข้อมูลตอนเปิดหน้าเว็บตรง ๆ จากเครื่อง ' +
        '(ข้อจำกัดด้านความปลอดภัย) ให้เปิดผ่านเซิร์ฟเวอร์เล็ก ๆ แทน เช่นสั่ง ',
        h('code', { text: 'npx serve' }),
        ' ในโฟลเดอร์นี้ แล้วเปิด ',
        h('code', { text: 'http://localhost:3000' }),
        ' — บน GitHub Pages หน้านี้ทำงานได้ตามปกติครับ'
      );
      el.errorRetry.hidden = true;
      return;
    }

    el.errorRetry.hidden = false;
    el.errorBody.textContent =
      'ตอนนี้โหลดข้อมูลรองเท้าไม่ได้ ลองเช็กสัญญาณอินเทอร์เน็ตแล้วกดลองอีกครั้งดูครับ' +
      (err && err.message ? ` (${err.message})` : '');
  }

  /* ---------- Filters ----------------------------------------------------- */

  /**
   * Chips are derived from the data, never hardcoded: adding a shoe with a new
   * brand or size to shoes.json must produce a new chip with zero code edits.
   */
  function buildFilters() {
    const brands = [...new Set(state.shoes.map((s) => s.brand))].sort((a, b) => a.localeCompare(b));
    const sizes = [...new Set(state.shoes.map((s) => s.sizeEU))].sort((a, b) => a - b);

    renderChipGroup(el.brand, 'brand', [
      { value: 'all', label: 'ทั้งหมด' },
      ...brands.map((b) => ({ value: b, label: b })),
    ]);

    renderChipGroup(el.size, 'size', [
      { value: 'all', label: 'ทุกไซซ์' },
      ...sizes.map((s) => ({ value: String(s), label: `EU ${s}` })),
    ]);

    // Only offer a price bucket if something actually falls in it — a chip that
    // can only ever return zero results is a dead end.
    const usable = PRICE_BUCKETS.filter((b) => state.shoes.some((s) => b.test(s.price)));
    renderChipGroup(el.price, 'price', [
      { value: 'all', label: 'ทุกราคา' },
      ...usable.map((b) => ({ value: b.id, label: b.label })),
    ]);
  }

  function renderChipGroup(container, key, items) {
    container.textContent = '';
    for (const item of items) {
      const chip = h('button', {
        class: 'chip',
        text: item.label,
        attrs: {
          type: 'button',
          // aria-pressed is what tells a screen reader this is a toggle and
          // whether it is on. Colour alone would say nothing.
          'aria-pressed': String(state.filters[key] === item.value),
          'data-value': item.value,
        },
      });
      chip.addEventListener('click', () => {
        state.filters[key] = item.value;
        // Repaint this group's pressed state without rebuilding the chips —
        // rebuilding would drop keyboard focus off the chip just clicked.
        for (const sibling of container.children) {
          sibling.setAttribute('aria-pressed', String(sibling.dataset.value === item.value));
        }
        render();
      });
      container.appendChild(chip);
    }
  }

  function applyFilters(shoes) {
    const { brand, size, price } = state.filters;
    const bucket = PRICE_BUCKETS.find((b) => b.id === price);
    return shoes.filter((s) => {
      if (brand !== 'all' && s.brand !== brand) return false;
      if (size !== 'all' && String(s.sizeEU) !== size) return false;
      if (bucket && !bucket.test(s.price)) return false;
      return true;
    });
  }

  function resetFilters() {
    state.filters = { brand: 'all', size: 'all', price: 'all' };
    for (const container of [el.brand, el.size, el.price]) {
      for (const chip of container.children) {
        chip.setAttribute('aria-pressed', String(chip.dataset.value === 'all'));
      }
    }
    render();
  }

  /* ---------- Render ------------------------------------------------------ */

  function render() {
    const visible = applyFilters(state.shoes);
    const filtering = Object.values(state.filters).some((v) => v !== 'all');

    el.reset.hidden = !filtering;
    el.count.textContent = '';
    el.count.append('พบ ', h('strong', { text: String(visible.length) }), ' คู่');

    el.grid.textContent = '';
    if (visible.length === 0) {
      setState('empty');
      return;
    }
    setState('results');

    const frag = document.createDocumentFragment();
    for (const shoe of visible) frag.appendChild(card(shoe));
    el.grid.appendChild(frag);
  }

  function photoImg(shoe, index, className) {
    const img = h('img', {
      class: className,
      attrs: {
        src: shoe.photos[index],
        // Thai alt text: a screen-reader user here reads Thai, not filenames.
        alt: `${shoe.brand} ${shoe.model} ไซซ์ EU ${shoe.sizeEU}`,
        loading: 'lazy',
        decoding: 'async',
        width: '600',
        height: '600',
      },
    });
    // A secondhand shop's photos are hand-managed; a missing file is a matter of
    // when, not if. Swap in the neutral placeholder rather than showing the
    // browser's broken-image glyph. Guard against a loop if the URI itself fails.
    img.addEventListener('error', function onError() {
      img.removeEventListener('error', onError);
      img.src = PLACEHOLDER;
    });
    return img;
  }

  function statusBadge(status) {
    return h('span', {
      class: `badge badge--${status}`,
      text: STATUS_LABEL[status] || status,
    });
  }

  function card(shoe) {
    const sold = shoe.status === 'sold';

    const media = h('div', { class: 'card__media' }, [
      h('div', { class: 'card__status' }, [statusBadge(shoe.status)]),
      photoImg(shoe, 0, 'card__img'),
      sold ? h('div', { class: 'card__ribbon', text: 'SOLD' }) : null,
    ]);

    // The button carries the accessible name and is the card's only tab stop;
    // ::after stretches its hit area over the whole card. One card, one stop.
    const trigger = h('button', {
      class: 'card__link',
      text: shoe.model,
      attrs: {
        type: 'button',
        'aria-label': `ดูรายละเอียด ${shoe.brand} ${shoe.model} ไซซ์ EU ${shoe.sizeEU} ราคา ${formatPrice(shoe.price)}`,
      },
    });
    trigger.addEventListener('click', () => openModal(shoe, trigger));

    const body = h('div', { class: 'card__body' }, [
      h('p', { class: 'card__brand', text: shoe.brand }),
      h('h3', { class: 'card__model' }, [trigger]),
      h('div', { class: 'card__meta' }, [
        h('span', { class: 'badge badge--size', text: `EU ${shoe.sizeEU}` }),
        h('span', { class: 'badge badge--grade', text: `สภาพ ${shoe.condition.grade}` }),
      ]),
      h('div', { class: 'card__foot' }, [
        h('p', { class: 'card__price', text: formatPrice(shoe.price) }),
        shoe.originalPrice
          ? h('span', { class: 'card__was', text: priceFmt.format(shoe.originalPrice) })
          : null,
      ]),
    ]);

    return h('li', { class: `card${sold ? ' card--sold' : ''}` }, [media, body]);
  }

  /* ---------- Modal ------------------------------------------------------- */

  function detail(shoe) {
    const sold = shoe.status === 'sold';

    const mainImg = photoImg(shoe, 0, '');
    const main = h('div', { class: 'detail__main' }, [mainImg]);

    // Only build a thumb strip when there is more than one photo — a single
    // thumbnail under a single photo is noise.
    let thumbs = null;
    if (shoe.photos.length > 1) {
      thumbs = h('div', { class: 'detail__thumbs' });
      shoe.photos.forEach((src, i) => {
        const t = h('button', {
          class: 'detail__thumb',
          attrs: {
            type: 'button',
            'aria-current': String(i === 0),
            'aria-label': `ดูรูปที่ ${i + 1}`,
          },
        }, [photoImg(shoe, i, '')]);
        t.addEventListener('click', () => {
          mainImg.src = src;
          for (const sibling of thumbs.children) {
            sibling.setAttribute('aria-current', String(sibling === t));
          }
        });
        thumbs.appendChild(t);
      });
    }

    // Three states, in priority order. The middle one is the reason SHOP.line can
    // be empty: a shop without a LINE yet gets an honest disabled button, never an
    // <a> pointing at nothing. A buy button that goes nowhere costs more trust
    // than a button that admits the shop isn't taking orders yet.
    let cta;
    let hint;

    if (sold) {
      cta = h('button', {
        class: 'btn btn--primary btn--block detail__cta',
        text: 'ขายไปแล้ว',
        attrs: { type: 'button', disabled: 'disabled' },
      });
      hint = h('p', {
        class: 'detail__hint',
        text: 'คู่นี้ขายไปแล้วครับ ลองดูคู่อื่นที่ยังว่างอยู่ได้เลย',
      });
    } else if (!SHOP.line) {
      cta = h('button', {
        class: 'btn btn--primary btn--block detail__cta',
        text: 'ยังไม่เปิดรับสั่งซื้อ',
        attrs: { type: 'button', disabled: 'disabled' },
      });
      hint = h('p', {
        class: 'detail__hint',
        text: 'ร้านกำลังเตรียมเปิด LINE สำหรับสั่งซื้อ เร็ว ๆ นี้ครับ',
      });
    } else {
      cta = h('a', {
        class: 'btn btn--primary btn--block detail__cta',
        text: shoe.status === 'reserved' ? 'ทัก LINE เพื่อขอคิวถัดไป' : 'สั่งซื้อทาง LINE',
        attrs: { href: SHOP.line, target: '_blank', rel: 'noopener noreferrer' },
      });
      hint = h('p', { class: 'detail__hint' }, [
        document.createTextNode('แจ้งรหัสนี้กับทางร้านได้เลย: '),
        h('span', { class: 'detail__id', text: shoe.id }),
      ]);
    }

    const info = h('div', { class: 'detail__info' }, [
      h('p', { class: 'detail__brand', text: shoe.brand }),
      h('h2', { class: 'detail__title', text: shoe.model, attrs: { id: 'modal-title' } }),
      h('div', { class: 'detail__meta' }, [
        statusBadge(shoe.status),
        h('span', { class: 'badge badge--size', text: `EU ${shoe.sizeEU} · US ${shoe.sizeUS}` }),
        h('span', { class: 'badge badge--grade', text: `สภาพ ${shoe.condition.grade}` }),
      ]),
      h('div', { class: 'detail__price-row' }, [
        h('p', { class: 'detail__price', text: formatPrice(shoe.price) }),
        shoe.originalPrice
          ? h('span', { class: 'detail__was', text: priceFmt.format(shoe.originalPrice) })
          : null,
        shoe.originalPrice
          ? h('span', {
              class: 'detail__save',
              text: `ถูกลง ${priceFmt.format(shoe.originalPrice - shoe.price)} บาท`,
            })
          : null,
      ]),
      h('div', { class: 'detail__block' }, [
        h('p', { class: 'detail__label', text: 'สภาพรองเท้า' }),
        h('p', { class: 'detail__notes', text: shoe.condition.note }),
      ]),
      h('div', { class: 'detail__block' }, [
        h('p', { class: 'detail__label', text: 'รายละเอียด' }),
        h('p', { class: 'detail__notes', text: shoe.notes }),
      ]),
      cta,
      hint,
    ]);

    return h('div', { class: `detail${sold ? ' detail--sold' : ''}` }, [
      h('div', { class: 'detail__gallery' }, [main, thumbs]),
      info,
    ]);
  }

  const FOCUSABLE =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openModal(shoe, opener) {
    state.lastFocused = opener || document.activeElement;
    el.modalBody.textContent = '';
    el.modalBody.appendChild(detail(shoe));
    el.modal.hidden = false;
    // Lock the page behind the sheet: without this, scrolling the modal to its
    // end carries on scrolling the catalog underneath it.
    document.body.style.overflow = 'hidden';

    const first = el.modalDialog.querySelector(FOCUSABLE);
    (first || el.modalDialog).focus();

    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (el.modal.hidden) return;
    el.modal.hidden = true;
    el.modalBody.textContent = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    // Return focus where it came from, or a keyboard user is dumped at the top
    // of the document and has to tab all the way back to where they were.
    if (state.lastFocused && document.contains(state.lastFocused)) {
      state.lastFocused.focus();
    }
    state.lastFocused = null;
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key !== 'Tab') return;

    // Focus trap: while a dialog is modal, Tab must not walk out into the page
    // behind it — a screen-reader user would silently leave the dialog.
    const items = [...el.modalDialog.querySelectorAll(FOCUSABLE)].filter(
      (n) => n.offsetParent !== null || n === document.activeElement
    );
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------- Shop identity ----------------------------------------------- */

  /**
   * Writes SHOP into the page. Runs before anything else renders, so the shop
   * name is never briefly wrong and a LINE link that doesn't exist is never
   * briefly clickable.
   */
  function applyShopIdentity() {
    for (const node of document.querySelectorAll('[data-shop-name]')) {
      node.textContent = SHOP.name;
    }
    // Keep the tab/SEO title in step with the name, so it lives in one place too.
    document.title = `${SHOP.name} — รองเท้ามือสอง สภาพดี คัดมาแล้ว`;

    // A social link the shop doesn't have is removed, not left pointing nowhere.
    for (const node of document.querySelectorAll('[data-shop-link]')) {
      const url = SHOP[node.dataset.shopLink];
      if (url) {
        node.href = url;
      } else {
        // Drop the whole <li>/wrapper, not just the <a>, or the footer keeps an
        // empty bullet and the nav keeps a dead gap.
        (node.closest('[data-shop-link-item]') || node).remove();
      }
    }

    // If every social link was removed, the list itself is now an empty box.
    const links = document.getElementById('footer-links');
    if (links && links.children.length === 0) links.remove();
  }

  /* ---------- Wire up ----------------------------------------------------- */

  applyShopIdentity();

  for (const node of document.querySelectorAll('[data-close-modal]')) {
    node.addEventListener('click', closeModal);
  }
  el.reset.addEventListener('click', resetFilters);
  el.errorRetry.addEventListener('click', load);

  el.navToggle.addEventListener('click', () => {
    const open = el.navMenu.classList.toggle('is-open');
    el.navToggle.setAttribute('aria-expanded', String(open));
    el.navToggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
  });

  // Tapping a menu link on a phone should navigate AND put the menu away.
  for (const link of el.navMenu.querySelectorAll('a')) {
    link.addEventListener('click', () => {
      el.navMenu.classList.remove('is-open');
      el.navToggle.setAttribute('aria-expanded', 'false');
      el.navToggle.setAttribute('aria-label', 'เปิดเมนู');
    });
  }

  el.year.textContent = String(new Date().getFullYear());

  load();
})();
