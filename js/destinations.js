/* Snail Travel — destinace.html
   Search bar + continent map interactions.
   Country counts are auto-derived from DOM so labels never drift. */
(function () {
  'use strict';

  const searchForm = document.querySelector('.dest-search');
  const input = document.getElementById('destSearch');
  const clearBtn = document.getElementById('destSearchClear');
  const hint = document.getElementById('destSearchHint');
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
    block.querySelectorAll('.country-grid li').forEach(li => {
      const name = li.textContent.trim();
      index.push({ name, key: norm(name), li, block });
    });
  });

  // ---- Search --------------------------------------------------------
  let searchTimer = 0;
  function runSearch(raw) {
    const q = norm(raw);
    searchForm.classList.toggle('has-value', raw.length > 0);

    if (!q) {
      index.forEach(({ li }) => { li.classList.remove('is-hidden', 'is-match'); });
      blocks.forEach(b => b.classList.remove('is-empty'));
      hint.textContent = '';
      return;
    }

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

    blocks.forEach(b => b.classList.toggle('is-empty', !(perBlock.get(b) > 0)));

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
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = norm(input.value);
    if (!q) return;
    const first = index.find(({ key }) => key.includes(q));
    if (first) {
      first.block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      first.li.querySelector('a')?.focus({ preventScroll: true });
    }
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    runSearch('');
    input.focus();
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
