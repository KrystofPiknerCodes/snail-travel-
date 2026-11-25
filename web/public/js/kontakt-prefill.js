/* Snail Travel — předvyplnění kontaktního formuláře z odkazu "Poptat hotel"
   na kartě hotelu (web/src/pages/destinace/[...slug].astro, kind 'hotel').
   Odkaz nese hotel + lokaci v query stringu (?hotel=...&misto=...#kontakt),
   tenhle skript je přečte a doplní do pole "Kam vás to láká?" — Krystofovo
   zadání, listopad 2026. Běží jen na homepage, kde formulář žije. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var hotel = params.get('hotel');
  if (!hotel) return;

  var message = document.getElementById('message');
  if (!message) return;

  var misto = params.get('misto');
  message.value = 'Mám zájem o hotel ' + hotel + (misto ? ' (' + misto + ')' : '') + '.';

  // Ať URL po předvyplnění nezůstane zanesená query stringem (kotva #kontakt
  // zůstává, ať stránka neposkočí zpátky nahoru).
  if (history.replaceState) {
    history.replaceState(null, '', location.pathname + location.hash);
  }
})();
