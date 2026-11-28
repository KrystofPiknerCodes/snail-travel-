/* Filtr hotelů na /hotely. Bez JS jsou vidět všechny karty (server-side render).
   Stav filtru se zrcadlí do URL (?q=&zeme=a,b&retezec=&hvezdy=3,4&strava=&odznaky=),
   ať jde filtrovaný pohled sdílet. */
(function () {
  var form = document.getElementById('hfForm');
  var grid = document.getElementById('hfGrid');
  if (!form || !grid) return;

  var cards = Array.prototype.slice.call(grid.children);
  var q = document.getElementById('hfQ');
  var sort = document.getElementById('hfSort');
  var count =document.getElementById('hfCount');
  var empty = document.getElementById('hfEmpty');
  var dds = Array.prototype.slice.call(form.querySelectorAll('.hf-dd'));
  var chips = Array.prototype.slice.call(form.querySelectorAll('.hf-chip'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('hf-ready');

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
    var z = selected('zeme');
    var r = selected('retezec');
    var hv = selected('hvezdy');
    var st = selected('strava');
    var ce = selected('cena');
    var od = selected('odznaky');
    var shown = 0;

    cards.forEach(function (li) {
      var d = li.dataset;
      var ok = true;
      if (text && loose(d.nazev).indexOf(loose(text)) === -1) ok = false;
      if (ok && z.length && z.indexOf(d.zeme) === -1) ok = false;
      if (ok && r.length) ok = r.some(function (x) { return x === '_nezavisle' ? d.retezec === '' : d.retezec === x; });
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
    var nPanel = z.length + r.length + hv.length + st.length + od.length + ce.length;
    form.classList.toggle('has-filters', nPanel > 0 || !!text);
    var box = q.closest('.dest-search');
    if (box) box.classList.toggle('has-value', q.value.length > 0);
    updateDds();
    empty.hidden = shown !== 0;
    grid.hidden = shown === 0;

    if (updateUrl) {
      var p = new URLSearchParams();
      if (q.value.trim()) p.set('q', q.value.trim());
      if (z.length) p.set('zeme', z.join(','));
      if (r.length) p.set('retezec', r.join(','));
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
    if (sort) {
      sort.value = p.get('razeni') || 'destinace';
      if (sort.value !== (p.get('razeni') || 'destinace')) sort.value = 'destinace';
    }
    ['zeme', 'retezec', 'hvezdy', 'cena', 'strava', 'odznaky'].forEach(function (g) {
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
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('reset', function (e) { e.preventDefault(); reset(); });
  document.getElementById('hfEmptyReset').addEventListener('click', function () {
    reset();
    try { form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) {}
  });

  // Rozbalovací tlačítka filtrů (<details>): popisek ukazuje výběr
  // (nic = název filtru, jedna volba = ta volba, víc = "Hvězdy (2)").
  function updateDds() {
    dds.forEach(function (dd) {
      var on = chips.filter(function (c) { return c.dataset.group === dd.dataset.group && c.getAttribute('aria-pressed') === 'true'; });
      var t = dd.querySelector('.hf-dd-text');
      t.textContent = on.length === 0 ? dd.dataset.label
        : on.length === 1 ? on[0].dataset.short
        : dd.dataset.label + ' (' + on.length + ')';
      dd.classList.toggle('is-active', on.length > 0);
    });
  }
  dds.forEach(function (dd) {
    dd.addEventListener('toggle', function () {
      if (dd.open) dds.forEach(function (o) { if (o !== dd) o.open = false; });
    });
  });
  document.addEventListener('click', function (e) {
    dds.forEach(function (dd) { if (dd.open && !dd.contains(e.target)) dd.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    dds.forEach(function (dd) {
      if (dd.open) { dd.open = false; dd.querySelector('summary').focus(); }
    });
  });


  readUrl();
  apply(false);
})();
