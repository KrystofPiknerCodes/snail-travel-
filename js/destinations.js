/* Snail Travel — destinace.html
   Search bar + continent map interactions.
   Country counts are auto-derived from DOM so labels never drift. */
(function () {
  'use strict';

  const searchForm = document.querySelector('.dest-search');
  const input = document.getElementById('destSearch');
  const clearBtn = document.getElementById('destSearchClear');
  const hint = document.getElementById('destSearchHint');
  const resultsBox = document.getElementById('destSearchResults');
  const blocks = Array.from(document.querySelectorAll('.continent-block'));
  const mapTiles = Array.from(document.querySelectorAll('.continent[data-continent]'));

  if (!input || !blocks.length) return;

  // ---- Auto count countries per continent ------------------------------
  const counts = {};
  blocks.forEach(block => {
    const key = block.dataset.continent;
    const n = block.querySelectorAll('.country-grid li').length;
    counts[key] = n;
    const countEl = document.querySelector(`[data-count="${key}"]`);
    if (countEl) countEl.textContent = String(n);
  });

  // ---- Normalize (strip diacritics, lower-case) -----------------------
  const norm = s => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

  // Index: { normalized: [{ name, block, li }] }
  const index = [];
  blocks.forEach(block => {
    // "Destinace · Evropa" -> "Evropa", pro nálepku výsledku v dropdownu.
    const contLabel = (block.querySelector('.kicker')?.textContent || '').split('·').pop().trim();
    block.querySelectorAll('.country-grid li').forEach(li => {
      // Jen .country-name — v <li> sedí i odznak referencí (js/dest-refs.js),
      // jehož text by jinak zaneřádil vyhledávací klíč.
      const name = (li.querySelector('.country-name') || li).textContent.trim();
      const href = li.querySelector('a')?.getAttribute('href') || '';
      index.push({ name, key: norm(name), li, block, href, cont: contLabel });
    });
  });

  // ---- Dropdown s okamžitými výsledky (stejný princip jako fulltextové
  // hledání v hlavičce, js/header-search.js) — omezené jen na destinace. ----
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function highlight(text, q) {
    const i = norm(text).indexOf(q);
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) +
      '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' +
      escapeHtml(text.slice(i + q.length));
  }

  const MAX_RESULTS = 8;

  function closeResults() {
    resultsBox.classList.remove('is-open');
    resultsBox.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  }

  function renderResults(q) {
    if (!q) { closeResults(); return; }

    const hits = index
      .filter(it => it.key.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'cs'));

    if (!hits.length) {
      resultsBox.innerHTML = '<p class="dest-search-empty">Nic jsme nenašli — napište nám a připravíme cestu na míru.</p>';
      resultsBox.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    const shown = hits.slice(0, MAX_RESULTS);
    const html = shown.map((it, i) =>
      '<a class="dest-search-item' + (i === 0 ? ' is-active' : '') + '" role="option" ' +
        'aria-selected="' + (i === 0 ? 'true' : 'false') + '" href="' + it.href + '">' +
        '<span class="dest-search-item-title">' + highlight(it.name, q) + '</span>' +
        '<span class="dest-search-item-sub">' + escapeHtml(it.cont) + '</span>' +
      '</a>'
    ).join('');
    const more = hits.length - shown.length;

    resultsBox.innerHTML = html + (more > 0
      ? '<p class="dest-search-empty">a&nbsp;dalších ' + more + ' — zpřesněte hledání</p>'
      : '');
    resultsBox.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
  }

  function moveActive(dir) {
    const items = Array.from(resultsBox.querySelectorAll('.dest-search-item'));
    if (!items.length) return;
    const i = items.findIndex(el => el.classList.contains('is-active'));
    const next = (i + dir + items.length) % items.length;
    items.forEach((el, n) => {
      el.classList.toggle('is-active', n === next);
      el.setAttribute('aria-selected', n === next ? 'true' : 'false');
    });
    items[next].scrollIntoView({ block: 'nearest' });
  }

  // ---- Search --------------------------------------------------------
  let searchTimer = 0;
  function runSearch(raw) {
    const q = norm(raw);
    searchForm.classList.toggle('has-value', raw.length > 0);

    if (!q) {
      index.forEach(({ li }) => { li.classList.remove('is-hidden', 'is-match'); });
      blocks.forEach(b => {
        b.classList.remove('is-empty');
        b.querySelector('.country-grid')?.classList.remove('is-filtering');
      });
      hint.textContent = '';
      closeResults();
      return;
    }

    renderResults(q);

    let total = 0;
    const perBlock = new Map();
    index.forEach(({ key, li, block }) => {
      const hit = key.includes(q);
      li.classList.toggle('is-hidden', !hit);
      li.classList.toggle('is-match', hit);
      if (hit) {
        total += 1;
        perBlock.set(block, (perBlock.get(block) || 0) + 1);
      }
    });

    blocks.forEach(b => {
      b.classList.toggle('is-empty', !(perBlock.get(b) > 0));
      // Hledání musí najít i destinace sbalené za "Zobrazit všechny destinace".
      b.querySelector('.country-grid')?.classList.add('is-filtering');
    });

    if (total === 0) {
      hint.innerHTML = 'Nic jsme nenašli — napište nám a připravíme cestu na míru. <a href="index.html#kontakt">Kontakt</a>';
    } else if (total === 1) {
      hint.textContent = '1 destinace nalezena';
    } else if (total < 5) {
      hint.textContent = `${total} destinace nalezeny`;
    } else {
      hint.textContent = `${total} destinací nalezeno`;
    }
  }

  input.addEventListener('input', e => {
    clearTimeout(searchTimer);
    const val = e.target.value;
    searchTimer = setTimeout(() => runSearch(val), 80);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); return; }
    if (e.key === 'Escape') { closeResults(); return; }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const active = resultsBox.querySelector('.dest-search-item.is-active');
    if (active) window.location.href = active.getAttribute('href');
  });

  input.addEventListener('focus', () => {
    if (input.value) renderResults(norm(input.value));
  });

  document.addEventListener('click', e => {
    if (!searchForm.contains(e.target)) closeResults();
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    runSearch('');
    input.focus();
  });

  // ---- Předvyplnění z ?q= (odkazy z vyhledávání v hlavičce) ------------
  const preset = new URLSearchParams(window.location.search).get('q');
  if (preset) {
    input.value = preset;
    runSearch(preset);
    const first = index.find(({ key }) => key.includes(norm(preset)));
    if (first) {
      requestAnimationFrame(() => {
        first.li.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  // ---- Show more/less per continent ------------------------------------
  blocks.forEach(block => {
    const grid = block.querySelector('.country-grid');
    const toggle = block.querySelector('.country-grid-toggle');
    if (!grid || !toggle) return;
    const label = toggle.querySelector('.btn-ghost-label');
    const moreText = label ? label.textContent : '';
    toggle.addEventListener('click', () => {
      const open = grid.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Zobrazit méně destinací' : moreText;
      if (!open) {
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Map tile → smooth scroll (keeps URL clean-ish) -----------------
  mapTiles.forEach(tile => {
    tile.addEventListener('click', e => {
      const href = tile.getAttribute('href') || '';
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });
})();
