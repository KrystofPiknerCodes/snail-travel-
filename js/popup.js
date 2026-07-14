/* ============================================================
   SNAIL TRAVEL — kontaktní karta v rohu (Barbora Blaschke)
   Nenápadná karta vpravo dole (žádné ztmavení / blokování stránky).
   Vysune se po 15 s (jednou za návštěvu), zavírá se zlatým křížkem,
   znovu se otevře launcherem v rohu. Bez závislostí.
   ============================================================ */
(function () {
  "use strict";

  var DELAY = 15000;          // po jak dlouhé nečinnosti popup vyskočí
  var SESSION_KEY = "snailContactDismissed";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Ikony (inline SVG, currentColor)
  var icoClose = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>';
  var icoMail  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7 L12 13 L20.5 7"/></svg>';
  var icoPhone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H9 L10.5 8 L8.5 9.5 C9.5 12 12 14.5 14.5 15.5 L16 13.5 L21 15 V18 C21 19.5 19.7 21 18 21 C10.8 20.5 3.5 13.2 3 6 C3 4.3 4.5 3 6 3 Z"/></svg>';
  var icoChat  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5 H20 A1 1 0 0 1 21 6 V15 A1 1 0 0 1 20 16 H9 L5 20 V16 H4 A1 1 0 0 1 3 15 V6 A1 1 0 0 1 4 5 Z"/></svg>';

  // --- Overlay + popup ---
  var overlay = document.createElement("div");
  overlay.className = "cpop-overlay";
  overlay.setAttribute("role", "complementary");
  overlay.setAttribute("aria-labelledby", "cpopTitle");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="cpop">' +
      '<button class="cpop-close" type="button" aria-label="Zavřít">' + icoClose + '</button>' +
      '<img class="cpop-mark" src="assets/logo-mark.png" alt="" />' +
      '<p class="kicker">Váš osobní kontakt</p>' +
      '<h2 class="cpop-title" id="cpopTitle">Naplánujte cestu<br />s&nbsp;Barborou</h2>' +
      '<p class="cpop-text">Nechte se provést světem beze spěchu. Barbora vám ráda ' +
        'připraví cestu na&nbsp;míru — nezávazně a&nbsp;diskrétně.</p>' +
      '<p class="cpop-person">Barbora Blaschke</p>' +
      '<p class="cpop-role">Travel designer</p>' +
      '<div class="cpop-lines">' +
        '<a href="mailto:barbora@snailtravel.cz">' + icoMail + 'barbora@snailtravel.cz</a>' +
        '<a href="tel:+420602552624">' + icoPhone + '+420&nbsp;602&nbsp;552&nbsp;624</a>' +
      '</div>' +
      '<a class="btn btn-solid" href="mailto:barbora@snailtravel.cz">Napsat Barboře</a>' +
    '</div>';

  // --- Launcher (znovuotevření) ---
  var launcher = document.createElement("button");
  launcher.className = "cpop-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Otevřít kontakt na Barboru");
  launcher.innerHTML = icoChat + '<span>Kontakt</span>';

  document.body.appendChild(overlay);
  document.body.appendChild(launcher);

  var closeBtn = overlay.querySelector(".cpop-close");

  function open() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    launcher.classList.remove("is-visible");
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    launcher.classList.add("is-visible");
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
  }

  closeBtn.addEventListener("click", close);
  launcher.addEventListener("click", open);

  // Esc zavře
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  // Auto-otevření po prodlevě — jen pokud návštěvník popup ještě nezavřel
  var dismissed = false;
  try { dismissed = sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) {}

  if (dismissed) {
    launcher.classList.add("is-visible");
  } else {
    setTimeout(function () {
      // mezitím ho mohl uživatel otevřít/zavřít sám
      if (!overlay.classList.contains("is-open")) {
        var alreadyDismissed = false;
        try { alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) {}
        if (!alreadyDismissed) open();
      }
    }, prefersReduced ? Math.min(DELAY, 3000) : DELAY);
  }
})();
