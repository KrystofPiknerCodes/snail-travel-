/* Snail Travel — reference.html
   Renders the archive from window.SNAIL_REFERENCES, with tag chips + free-text
   search (diacritics-agnostic) and a "show all" toggle for the long tail. */
(function () {
  'use strict';

  var DATA = window.SNAIL_REFERENCES || [];
  var BATCH = 12; // cards visible before "Zobrazit všechny reference"
  var CLAMP_CHARS = 420; // total chars above which a card gets a "Číst více" toggle

  var grid = document.getElementById('refGrid');
  var chipsEl = document.getElementById('refChips');
  var searchInput = document.getElementById('refSearch');
  var searchForm = document.querySelector('.ref-search');
  var clearBtn = document.getElementById('refSearchClear');
  var hint = document.getElementById('refResultHint');
  var empty = document.getElementById('refEmpty');
  var loadMoreBtn = document.getElementById('refLoadMore');
  var statCount = document.getElementById('refStatCount');
  var statYears = document.getElementById('refStatYears');
  var statDest = document.getElementById('refStatDest');

  if (!grid || !DATA.length) return;

  var norm = function (s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  };

  /* ---------- Stats (auto-derived so numbers never drift) ---------- */
  var tagCounts = {};
  var years = [];
  DATA.forEach(function (r) {
    years.push(r.year);
    r.tags.forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  });
  var tagList = Object.keys(tagCounts).sort(function (a, b) { return tagCounts[b] - tagCounts[a]; });

  if (statCount) statCount.textContent = DATA.length;
  if (statYears) statYears.textContent = Math.min.apply(null, years) + '–' + Math.max.apply(null, years);
  if (statDest) statDest.textContent = tagList.length;

  /* ---------- Tag chips ---------- */
  var activeTag = 'Vše';
  if (chipsEl) {
    var allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'ref-chip is-active';
    allChip.dataset.tag = 'Vše';
    allChip.innerHTML = 'Vše <span class="ref-chip-count">' + DATA.length + '</span>';
    chipsEl.appendChild(allChip);

    tagList.forEach(function (tag) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ref-chip';
      chip.dataset.tag = tag;
      chip.innerHTML = tag + ' <span class="ref-chip-count">' + tagCounts[tag] + '</span>';
      chipsEl.appendChild(chip);
    });

    chipsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.ref-chip');
      if (!btn) return;
      activeTag = btn.dataset.tag;
      chipsEl.querySelectorAll('.ref-chip').forEach(function (c) {
        c.classList.toggle('is-active', c === btn);
      });
      applyFilter();
    });
  }

  /* ---------- Render cards ---------- */
  function buildCard(r, index) {
    var card = document.createElement('article');
    card.className = 'ref-card' + (index >= BATCH ? ' ref-more-item' : '');
    card.dataset.tags = r.tags.join('|');
    card.dataset.search = norm(r.tags.join(' ') + ' ' + r.text.join(' '));

    var totalChars = r.text.join(' ').length;
    var clampable = totalChars > CLAMP_CHARS;
    if (clampable) card.classList.add('is-clampable');

    var head = document.createElement('div');
    head.className = 'ref-card-head';
    var tagsEl = document.createElement('span');
    tagsEl.className = 'ref-card-tags';
    tagsEl.textContent = r.tags.join(' · ');
    var dateEl = document.createElement('span');
    dateEl.className = 'ref-card-date';
    dateEl.textContent = r.dateLabel;
    head.appendChild(tagsEl);
    head.appendChild(dateEl);

    var textEl = document.createElement('div');
    textEl.className = 'ref-card-text';
    r.text.forEach(function (para) {
      var p = document.createElement('p');
      p.textContent = para;
      textEl.appendChild(p);
    });

    card.appendChild(head);
    card.appendChild(textEl);

    if (clampable) {
      var more = document.createElement('button');
      more.type = 'button';
      more.className = 'ref-card-more';
      more.textContent = 'Zobrazit celý text';
      more.addEventListener('click', function () {
        var open = card.classList.toggle('is-open');
        more.textContent = open ? 'Skrýt' : 'Zobrazit celý text';
      });
      card.appendChild(more);
    }

    return card;
  }

  var frag = document.createDocumentFragment();
  DATA.forEach(function (r, i) { frag.appendChild(buildCard(r, i)); });
  grid.appendChild(frag);

  var allCards = Array.prototype.slice.call(grid.querySelectorAll('.ref-card'));

  /* ---------- "Show all" toggle ---------- */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      var open = grid.classList.toggle('is-expanded');
      loadMoreBtn.textContent = open
        ? 'Skrýt starší reference'
        : 'Zobrazit všechny reference (' + DATA.length + ')';
    });
  }

  /* ---------- Search + tag filter ---------- */
  var searchTimer = 0;
  function applyFilter() {
    var q = norm(searchInput ? searchInput.value : '');
    if (searchForm) searchForm.classList.toggle('has-value', q.length > 0);
    var filtering = q.length > 0 || activeTag !== 'Vše';
    grid.classList.toggle('is-filtering', filtering);

    if (!filtering) {
      allCards.forEach(function (c) { c.classList.remove('is-hidden'); });
      if (hint) hint.textContent = '';
      if (empty) empty.classList.remove('is-visible');
      return;
    }

    var total = 0;
    allCards.forEach(function (c) {
      var tagOk = activeTag === 'Vše' || c.dataset.tags.split('|').indexOf(activeTag) !== -1;
      var textOk = !q || c.dataset.search.indexOf(q) !== -1;
      var hit = tagOk && textOk;
      c.classList.toggle('is-hidden', !hit);
      if (hit) total += 1;
    });

    if (hint) {
      if (total === 0) {
        hint.textContent = '';
      } else if (total === 1) {
        hint.textContent = '1 reference nalezena';
      } else if (total < 5) {
        hint.textContent = total + ' reference nalezeny';
      } else {
        hint.textContent = total + ' referencí nalezeno';
      }
    }
    if (empty) empty.classList.toggle('is-visible', total === 0);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      clearTimeout(searchTimer);
      var val = e.target.value;
      searchTimer = setTimeout(function () { applyFilter(); }, 80);
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      searchInput.value = '';
      applyFilter();
      searchInput.focus();
    });
  }
})();
