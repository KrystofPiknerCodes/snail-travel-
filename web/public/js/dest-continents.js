/* Snail Travel — dlaždice kontinentů vedle glóbusu na /destinace.

   Najetí myší / fokus klávesnicí na dlaždici natočí glóbus na daný kontinent
   a zvýrazní ho zlatě (window.snailGlobe z js/globe.js). Klik skočí na sekci
   kontinentu. Na dotykovém zařízení (bez najetí) se při ťuknutí glóbus nejdřív
   otočí a teprve pak stránka sjede dolů, ať je otočení vidět.

   Odkazy mají plnou cestu stránky + #id (kvůli <base href>, viz dest-toc.js),
   skok řešíme sami, se stejným odsazením pod hlavičkou a rozcestníkem
   (--dest-scroll-offset nastavuje js/dest-toc.js). */
(function () {
  'use strict';

  var tiles = Array.prototype.slice.call(document.querySelectorAll('.cont-tile'));
  if (!tiles.length) return;

  var list = tiles[0].closest('.cont-tiles');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = null;

  function globe() { return window.snailGlobe; }

  function focusTile(tile) {
    var code = tile.dataset.cont;
    tiles.forEach(function (t) { t.classList.toggle('is-active', t === tile); });
    if (current === code) return;
    current = code;
    if (globe()) globe().focus(code);
  }

  function release() {
    tiles.forEach(function (t) { t.classList.remove('is-active'); });
    current = null;
    if (globe()) globe().release();
  }

  function scrollToSection(id) {
    var section = document.getElementById(id);
    if (!section) return;
    var offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dest-scroll-offset')) || 150;
    var top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    if (history.pushState) history.pushState(null, '', location.pathname + location.search + '#' + id);
  }

  tiles.forEach(function (tile) {
    tile.addEventListener('mouseenter', function () { focusTile(tile); });
    tile.addEventListener('focus', function () { focusTile(tile); });
    tile.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var alreadyTurned = current === tile.dataset.cont;
      focusTile(tile);
      // Když se glóbus teprve otáčí (ťuknutí na mobilu), chvilku počkat.
      var delay = alreadyTurned || prefersReduced || !globe() ? 0 : 750;
      setTimeout(function () { scrollToSection(tile.dataset.target); }, delay);
    });
  });

  if (list) {
    list.addEventListener('mouseleave', release);
    list.addEventListener('focusout', function (e) {
      if (!list.contains(e.relatedTarget)) release();
    });
  }
})();
