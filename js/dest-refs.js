/* Snail Travel — destinace.html
   Na karty zemí, ke kterým máme klientské reference, přišije odznak
   "N referencí" odkazující na reference.html?dest=<země>.

   Počty čte z window.SNAIL_REF_COUNTS (js/ref-counts.js) — malý generovaný
   soubor, aby se sem netahalo 170 KB js/references-data.js.
   Odznak je samostatný <a> jako sourozenec karty (vnořený odkaz v odkazu
   není validní HTML), proto má .country-grid li position: relative. */
(function () {
  'use strict';

  var COUNTS = window.SNAIL_REF_COUNTS || {};
  var grid = document.querySelectorAll('.country-grid li');
  if (!grid.length) return;

  var norm = function (s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /* Klíče podle normalizovaného názvu, ať sedí i s nezlomitelnou mezerou. */
  var byName = {};
  Object.keys(COUNTS).forEach(function (name) {
    var e = COUNTS[name];
    byName[norm(name)] = { name: name, count: e.n, tag: e.t || name };
  });

  function plural(n) {
    if (n === 1) return 'reference';
    if (n < 5) return 'reference';
    return 'referencí';
  }

  Array.prototype.forEach.call(grid, function (li) {
    var nameEl = li.querySelector('.country-name');
    if (!nameEl) return;

    var hit = byName[norm(nameEl.textContent)];
    if (!hit) return;

    var badge = document.createElement('a');
    badge.className = 'country-refs';
    badge.href = 'reference.html?dest=' + encodeURIComponent(hit.tag);
    badge.setAttribute('aria-label', 'Reference klientů — ' + hit.name + ' (' + hit.count + ')');
    badge.innerHTML =
      '<span class="country-refs-n">' + hit.count + '</span>' +
      '<span class="country-refs-w">' + plural(hit.count) + '</span>';

    li.appendChild(badge);
    li.classList.add('has-refs');
  });
})();
