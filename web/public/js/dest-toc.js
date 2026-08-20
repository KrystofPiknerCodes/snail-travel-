/* Snail Travel — rozcestník (sticky kotevní navigace) na detailu destinace.
   Vykreslený seznam odkazů (src/components/Rozcestnik.astro) sestavuje na
   serveru [slug].astro z toho, co destinace v obsahu má. Tenhle skript:

   1) doladí seznam za běhu — odstraní odkaz na sekci "Reference", pokud se
      sama skryla (js/dest-references.js nastaví section.hidden, když pro
      danou destinaci nejsou žádné citace);
   2) změří skutečnou výšku pevné hlavičky a nastaví CSS proměnné --header-h
      a --dest-scroll-offset (ta jde do scroll-margin-top sekcí, aby nadpis
      po kliknutí na kotvu neskončil schovaný pod hlavičkou + rozcestníkem);
   3) zvýrazňuje aktivní sekci podle polohy scrollu (scrollspy) přes
      IntersectionObserver — bez scroll listeneru.

   Musí běžet AŽ PO js/dest-references.js (pořadí <script> tagů v
   layouts/Base.astro), jinak by ještě neviděl případné section.hidden. */
(function () {
  'use strict';

  var toc = document.getElementById('destToc');
  if (!toc) return;

  var header = document.getElementById('header');

  function headerHeight() {
    return header ? header.offsetHeight : 84;
  }

  function updateOffsets() {
    document.documentElement.style.setProperty('--header-h', headerHeight() + 'px');
    var offset = headerHeight() + toc.offsetHeight + 16;
    document.documentElement.style.setProperty('--dest-scroll-offset', offset + 'px');
  }

  // 1) Odeber odkazy na sekce, které na stránce chybí nebo se za běhu skryly.
  var links = Array.prototype.slice.call(toc.querySelectorAll('[data-toc-link]'));
  var activeLinks = [];
  links.forEach(function (link) {
    var id = link.dataset.target;
    var section = id ? document.getElementById(id) : null;
    if (!section || section.hidden) {
      link.remove();
    } else {
      activeLinks.push(link);
    }
  });

  // Rozcestník s jednou položkou (nebo žádnou) nemá smysl zobrazovat.
  if (activeLinks.length < 2) {
    toc.hidden = true;
    return;
  }

  updateOffsets();
  window.addEventListener('resize', updateOffsets);
  window.addEventListener('load', updateOffsets);
  // Hlavička může ještě chvíli po prvním výpočtu změnit výšku (načtení
  // webfontů, layout shift) — ResizeObserver na header i na samotný
  // rozcestník to doladí bez nutnosti resize okna.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(updateOffsets);
    if (header) ro.observe(header);
    ro.observe(toc);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateOffsets);
  }

  // 2) Scrollspy — zvýrazní odkaz sekce, která právě prochází pásem těsně
  // pod hlavičkou + rozcestníkem. Observer se znovu sestaví, kdykoli se
  // změří jiná výška hlavičky (viz updateOffsets/ResizeObserver výše), aby
  // pásmo zůstalo přesné i po dozvednutí webfontů.
  var spy = null;
  function rebuildSpy() {
    if (!('IntersectionObserver' in window)) return;
    if (spy) spy.disconnect();
    var topMargin = headerHeight() + toc.offsetHeight + 10;
    spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          activeLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.dataset.target === id);
          });
        });
      },
      { rootMargin: '-' + topMargin + 'px 0px -65% 0px', threshold: 0 }
    );
    activeLinks.forEach(function (link) {
      var section = document.getElementById(link.dataset.target);
      if (section) spy.observe(section);
    });
  }

  rebuildSpy();
  window.addEventListener('resize', rebuildSpy);
  if ('ResizeObserver' in window) {
    var roSpy = new ResizeObserver(rebuildSpy);
    if (header) roSpy.observe(header);
  }
})();
