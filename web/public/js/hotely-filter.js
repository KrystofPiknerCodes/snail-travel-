/* Filtr hotelů na /hotely. Bez JS jsou vidět všechny karty (server-side render).
   Stav filtru se zrcadlí do URL (?q=&zeme=&retezec=&hvezdy=3,4&strava=&odznaky=),
   ať jde filtrovaný pohled sdílet. */
(function () {
  var form = document.getElementById('hfForm');
  var grid = document.getElementById('hfGrid');
  if (!form || !grid) return;

  var cards = Array.prototype.slice.call(grid.children);
  var q = document.getElementById('hfQ');
  var zeme = document.getElementById('hfZeme');
  var retezec = document.getElementById('hfRetezec');
  var sort = document.getElementById('hfSort');
  var count =document.getElementById('hfCount');
  var empty = document.getElementById('hfEmpty');
  var toggle = document.getElementById('hfToggle');
  var chips = Array.prototype.slice.call(form.querySelectorAll('.hf-chip'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('hf-ready');
  if (toggle) toggle.hidden = false;

  function norm(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  // Hledání ignoruje i apostrofy/pomlčky/mezery ("reids" najde "Reid's").
  function loose(s) { return s.replace(/[^a-z0-9]/g, ''); }
  function plural(n) { return n + ' ' + (n === 1 ? 'hotel' : n >= 2 && n <= 4 ? 'hotely' : 'hotelů'); }
  function selected(group) {
    return chips.filter(function (c) { return c.dataset.group === group && c.getAttribute('aria-pressed') === 'true'; })
      .map(function (c) { return c.dataset.value; });
  }

  function sortCards() {
    var mode = sort ? sort.value : 'destinace';
    var num = function (v) { return v === '' ? Infinity : parseFloat(v); };
    var cmp = {
      destinace: function (a, b) { return a.dataset.poradi - b.dataset.poradi; },
      nazev: function (a, b) { return a.dataset.nazev.localeCompare(b.dataset.nazev, 'cs'); },
      hvezdy: function (a, b) { return (b.dataset.hvezdy || 0) - (a.dataset.hvezdy || 0) || a.dataset.poradi - b.dataset.poradi; },
      cena: function (a, b) {
        var x = num(a.dataset.cenaod), y = num(b.dataset.cenaod);
        return x === y ? a.dataset.poradi - b.dataset.poradi : (x < y ? -1 : 1);
      }
    }[mode];
    if (!cmp) return;
    cards.slice().sort(cmp).forEach(function (li) { grid.appendChild(li); });
  }

  function apply(updateUrl) {
    var text = norm(q.value);
    var z = zeme.value;
    var r = retezec ? retezec.value : '';
    var hv = selected('hvezdy');
    var st = selected('strava');
    var ce = selected('cena');
    var od = selected('odznaky');
    var shown = 0;

    cards.forEach(function (li) {
      var d = li.dataset;
      var ok = true;
      if (text && loose(d.nazev).indexOf(loose(text)) === -1) ok = false;
      if (ok && z && d.zeme !== z) ok = false;
      if (ok && r) ok = r === '_nezavisle' ? d.retezec === '' : d.retezec === r;
      if (ok && hv.length && hv.indexOf(d.hvezdy) === -1) ok = false;
      if (ok && ce.length && ce.indexOf(d.cena) === -1) ok = false;
      if (ok && st.length && st.indexOf(d.strava) === -1) ok = false;
      if (ok && od.length) {
        var have = (d.odznaky || '').split(' ');
        ok = od.every(function (o) { return have.indexOf(o) !== -1; });
      }
      li.hidden = !ok;
      if (ok) shown++;
    });

    sortCards();
    var vis = cards.filter(function (li) { return !li.hidden; }).map(function (li) { return li.dataset.id; });
    document.dispatchEvent(new CustomEvent('hotely:filtr', { detail: { visible: vis } }));

    count.textContent = 'Nalezeno ' + plural(shown);
    // Kolik filtrů z panelu je aktivních — číslo na mobilním tlačítku
    // "Další filtry" a viditelnost odkazu "Zrušit filtry".
    var nPanel = (z ? 1 : 0) + (r ? 1 : 0) + hv.length + st.length + od.length + ce.length;
    form.classList.toggle('has-filters', nPanel > 0 || !!text);
    var box = q.closest('.dest-search');
    if (box) box.classList.toggle('has-value', q.value.length > 0);
    var tn = document.getElementById('hfToggleN');
    if (tn) tn.textContent = nPanel ? '(' + nPanel + ')' : '';
    empty.hidden = shown !== 0;
    grid.hidden = shown === 0;

    if (updateUrl) {
      var p = new URLSearchParams();
      if (q.value.trim()) p.set('q', q.value.trim());
      if (z) p.set('zeme', z);
      if (r) p.set('retezec', r);
      if (hv.length) p.set('hvezdy', hv.join(','));
      if (st.length) p.set('strava', st.join(','));
      if (od.length) p.set('odznaky', od.join(','));
      if (ce.length) p.set('cena', ce.join(','));
      if (sort && sort.value !== 'destinace') p.set('razeni', sort.value);
      var qs = p.toString();
      try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
    }
  }

  function setChips(group, values) {
    chips.forEach(function (c) {
      if (c.dataset.group === group) c.setAttribute('aria-pressed', values.indexOf(c.dataset.value) !== -1 ? 'true' : 'false');
    });
  }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    q.value = p.get('q') || '';
    zeme.value = p.get('zeme') || '';
    if (zeme.value !== (p.get('zeme') || '')) zeme.value = '';
    if (retezec) {
      retezec.value = p.get('retezec') || '';
      if (retezec.value !== (p.get('retezec') || '')) retezec.value = '';
    }
    if (sort) {
      sort.value = p.get('razeni') || 'destinace';
      if (sort.value !== (p.get('razeni') || 'destinace')) sort.value = 'destinace';
    }
    ['hvezdy', 'cena', 'strava', 'odznaky'].forEach(function (g) {
      var v = p.get(g);
      setChips(g, v ? v.split(',') : []);
    });
  }

  function reset() {
    form.reset();
    q.value = '';
    chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    apply(true);
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      apply(true);
    });
  });
  if (sort) sort.addEventListener('change', function () { apply(true); });
  q.addEventListener('input', function () { apply(true); });
  // Křížek v poli hledání (stejné .dest-search jako na /destinace, /reference).
  var qClear = document.getElementById('hfQClear');
  if (qClear) qClear.addEventListener('click', function () { q.value = ''; apply(true); q.focus(); });
  zeme.addEventListener('change', function () { apply(true); });
  if (retezec) retezec.addEventListener('change', function () { apply(true); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('reset', function (e) { e.preventDefault(); reset(); });
  document.getElementById('hfEmptyReset').addEventListener('click', function () {
    reset();
    try { form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) {}
  });

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      form.classList.toggle('is-open', open);
    });
  }

  readUrl();
  apply(false);
})();
