/* Snail Travel — akce v hlavičce: telefon + fulltextové vyhledávání.
   Markup se injektuje z JS (stejný princip jako popup.js), aby nebyl
   duplikovaný ve všech HTML stránkách.
   Data pro hledání: js/search-index.js (window.SNAIL_SEARCH_INDEX). */
(function () {
  'use strict';

  var PHONE = '+420 602 552 624';
  var PHONE_HREF = 'tel:+420602552624';
  var MAX_RESULTS = 14;

  // Stránky v podsložce (destinace/*.html) potřebují ../ prefix
  var basePath = /\/destinace\//.test(window.location.pathname) ? '../' : '';

  var header = document.querySelector('.header-inner');
  if (!header) return;

  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7" /><path d="M20 20 L16 16" /></svg>';
  var ICON_PHONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" />' +
    '</svg>';

  // ---- Injekce tlačítek do hlavičky ------------------------------------
  var actions = document.createElement('div');
  actions.className = 'hact';
  actions.innerHTML =
    '<button type="button" class="hact-btn" id="hactSearchBtn" aria-label="Hledat" ' +
      'aria-expanded="false" title="Hledat">' + ICON_SEARCH + '</button>' +
    '<div class="hact-phone" id="hactPhoneWrap">' +
      '<a class="hact-phone-num" href="' + PHONE_HREF + '" tabindex="-1">' + PHONE + '</a>' +
      '<button type="button" class="hact-btn" id="hactPhoneBtn" aria-label="Zobrazit telefonní číslo" ' +
        'aria-expanded="false" title="Telefon">' + ICON_PHONE + '</button>' +
    '</div>';

  var cta = header.querySelector('.nav-cta');
  if (cta) header.insertBefore(actions, cta);
  else header.appendChild(actions);

  var phoneWrap = document.getElementById('hactPhoneWrap');
  var phoneBtn = document.getElementById('hactPhoneBtn');
  var phoneNum = phoneWrap.querySelector('.hact-phone-num');
  var searchBtn = document.getElementById('hactSearchBtn');

  // ---- Telefon ---------------------------------------------------------
  function setPhone(open) {
    phoneWrap.classList.toggle('is-open', open);
    phoneBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    phoneBtn.setAttribute('aria-label', open ? 'Skrýt telefonní číslo' : 'Zobrazit telefonní číslo');
    phoneNum.setAttribute('tabindex', open ? '0' : '-1');
  }

  phoneBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    // Na dotykových zařízeních rovnou volat
    if (window.matchMedia('(hover: none)').matches) {
      window.location.href = PHONE_HREF;
      return;
    }
    setPhone(!phoneWrap.classList.contains('is-open'));
  });

  document.addEventListener('click', function (e) {
    if (!phoneWrap.contains(e.target)) setPhone(false);
  });

  // ---- Overlay vyhledávání --------------------------------------------
  var overlay = document.createElement('div');
  overlay.className = 'hsearch';
  overlay.id = 'hsearch';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="hsearch-scrim" data-close></div>' +
    '<div class="hsearch-panel" role="dialog" aria-modal="true" aria-label="Vyhledávání">' +
      '<form class="hsearch-bar" role="search" onsubmit="return false;">' +
        '<span class="hsearch-icon" aria-hidden="true">' + ICON_SEARCH + '</span>' +
        '<input type="search" id="hsearchInput" autocomplete="off" spellcheck="false" ' +
          'placeholder="Hledat destinaci, zážitek nebo stránku…" aria-label="Hledat na webu" ' +
          'aria-controls="hsearchResults" />' +
        '<button type="button" class="hsearch-close" data-close aria-label="Zavřít vyhledávání">×</button>' +
      '</form>' +
      '<div class="hsearch-results" id="hsearchResults" role="listbox" aria-label="Výsledky"></div>' +
    '</div>';
  document.body.appendChild(overlay);

  var input = document.getElementById('hsearchInput');
  var results = document.getElementById('hsearchResults');

  // Na úzkých displejích se dlouhý placeholder ořízne
  if (window.matchMedia('(max-width: 540px)').matches) {
    input.placeholder = 'Hledat destinaci…';
  }

  var INDEX = Array.isArray(window.SNAIL_SEARCH_INDEX) ? window.SNAIL_SEARCH_INDEX : [];

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function href(url) {
    // index je psaný relativně ke kořenu webu
    return basePath + url;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var i = norm(text).indexOf(q);
    if (i < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, i)) +
      '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' +
      escapeHtml(text.slice(i + q.length));
  }

  function score(item, q) {
    var t = norm(item.t);
    if (t === q) return 0;
    if (t.indexOf(q) === 0) return 1;
    if (t.indexOf(q) > 0) return 2;
    if ((item.n || '').indexOf(q) >= 0) return 3;
    return -1;
  }

  var SUGGEST = ['Seychely', 'Bali', 'Maledivy', 'Mauritius', 'Madeira', 'Azorské ostrovy', 'Safari', 'Reference'];

  function renderEmpty() {
    var chips = SUGGEST.map(function (s) {
      return '<button type="button" class="hsearch-chip" data-q="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
    }).join('');
    results.innerHTML =
      '<p class="hsearch-hint">Zkuste například:</p>' +
      '<div class="hsearch-chips">' + chips + '</div>';
  }

  function render(raw) {
    var q = norm(raw);
    if (!q) { renderEmpty(); return; }

    var hits = [];
    INDEX.forEach(function (item) {
      var s = score(item, q);
      if (s >= 0) hits.push({ item: item, s: s });
    });
    hits.sort(function (a, b) {
      return a.s - b.s || a.item.t.localeCompare(b.item.t, 'cs');
    });

    if (!hits.length) {
      results.innerHTML =
        '<p class="hsearch-empty">Nic jsme nenašli — napište nám a cestu připravíme na míru.<br />' +
        '<a href="' + href('index.html#kontakt') + '">Kontaktovat Snail Travel</a></p>';
      return;
    }

    var shown = hits.slice(0, MAX_RESULTS);
    var html = shown.map(function (h, i) {
      var it = h.item;
      return '<a class="hsearch-item' + (i === 0 ? ' is-active' : '') + '" role="option" ' +
        'aria-selected="' + (i === 0 ? 'true' : 'false') + '" href="' + href(it.u) + '">' +
        '<span class="hsearch-item-main">' +
          '<span class="hsearch-item-title">' + highlight(it.t, q) + '</span>' +
          (it.s ? '<span class="hsearch-item-sub">' + escapeHtml(it.s) + '</span>' : '') +
        '</span>' +
        '<span class="hsearch-item-cat">' + escapeHtml(it.c) + '</span>' +
      '</a>';
    }).join('');

    var more = hits.length - shown.length;
    results.innerHTML = html + (more > 0
      ? '<p class="hsearch-hint">a&nbsp;dalších ' + more + ' výsledků — zpřesněte hledání</p>'
      : '');
  }

  function activeItems() {
    return Array.from(results.querySelectorAll('.hsearch-item'));
  }

  function move(dir) {
    var items = activeItems();
    if (!items.length) return;
    var i = items.findIndex(function (el) { return el.classList.contains('is-active'); });
    var next = (i + dir + items.length) % items.length;
    items.forEach(function (el, n) {
      el.classList.toggle('is-active', n === next);
      el.setAttribute('aria-selected', n === next ? 'true' : 'false');
    });
    items[next].scrollIntoView({ block: 'nearest' });
  }

  var open = false;
  function setOpen(state) {
    open = state;
    document.body.classList.toggle('hsearch-open', state);
    overlay.classList.toggle('is-open', state);
    overlay.setAttribute('aria-hidden', state ? 'false' : 'true');
    searchBtn.setAttribute('aria-expanded', state ? 'true' : 'false');
    if (state) {
      setPhone(false);
      render(input.value);
      setTimeout(function () { input.focus(); input.select(); }, 60);
    } else {
      searchBtn.focus();
    }
  }

  searchBtn.addEventListener('click', function () { setOpen(!open); });

  overlay.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) { setOpen(false); return; }
    var chip = e.target.closest('.hsearch-chip');
    if (chip) {
      input.value = chip.dataset.q;
      render(input.value);
      input.focus();
    }
  });

  var timer = 0;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    var val = input.value;
    timer = setTimeout(function () { render(val); }, 70);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      var active = results.querySelector('.hsearch-item.is-active');
      if (active) { e.preventDefault(); window.location.href = active.href; }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); return; }
    // Ctrl/⌘ + K otevře hledání
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  });

  renderEmpty();
})();
