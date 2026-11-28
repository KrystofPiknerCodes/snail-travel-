// "Zobrazit všechny" na detailu destinace — sdílený mechanismus pro víc
// nezávislých mřížek na jedné stránce (sekce Ubytování/"Vyberte oblast" i
// Zájezdy/"Zobrazit všechny hotely"), stejný .country-grid/.is-more princip
// jako .country-grid-toggle na /destinace (web/public/js/destinations.js).
// Každé tlačítko najde svou mřížku přes aria-controls, takže jde nezávisle
// na sobě přepínat víc toggle/grid dvojic na stejné stránce (Krystof,
// listopad 2026 — "oblasti sbal, zbytek na rozkliknutí").
(function () {
  'use strict';
  document.querySelectorAll('.country-grid-toggle').forEach(function (toggle) {
    var grid = document.getElementById(toggle.getAttribute('aria-controls') || '');
    if (!grid) return;
    var label = toggle.querySelector('.btn-ghost-label');
    var moreText = label ? label.textContent : '';

    toggle.addEventListener('click', function () {
      var open = grid.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Zobrazit méně' : moreText;
      if (!open) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
