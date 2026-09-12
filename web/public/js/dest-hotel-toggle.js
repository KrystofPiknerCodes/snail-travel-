// "Zobrazit všechny hotely" na detailu destinace (sekce Zájezdy, [...slug].astro)
// — stejný .country-grid/.is-more mechanismus jako .country-grid-toggle na
// /destinace (web/public/js/destinations.js), jen bez vazby na .continent-block,
// protože na detailu destinace je grid jen jeden.
(function () {
  'use strict';
  var toggle = document.querySelector('.country-grid-toggle');
  if (!toggle) return;
  var grid = document.getElementById(toggle.getAttribute('aria-controls') || '');
  if (!grid) return;
  var label = toggle.querySelector('.btn-ghost-label');
  var moreText = label ? label.textContent : '';

  toggle.addEventListener('click', function () {
    var open = grid.classList.toggle('is-expanded');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (label) label.textContent = open ? 'Zobrazit méně hotelů' : moreText;
    if (!open) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
