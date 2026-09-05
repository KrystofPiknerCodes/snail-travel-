// Sdílený "rozbal na klik" mechanismus pro detail destinace — používá ho
// jak sekce Info (dlouhý text odstínovaný/clamp, tlačítko "Přečíst více"),
// tak akordeony Poznávejte/Relaxujte (úplně sbalené, klik na nadpis odkryje
// obsah). Vizuální chování (clamp vs. sbalení na 0) řeší CSS podle třídy
// nadřazeného prvku (.dest-intro-body / .dest-accordion), JS jen přepíná
// `.is-open` na wrapperu s `data-collapse` a případně mění text tlačítka.
(function () {
  Array.prototype.slice.call(document.querySelectorAll('[data-collapse]')).forEach(function (wrap) {
    var trigger = wrap.querySelector('[data-collapse-trigger]');
    var panel = wrap.querySelector('[data-collapse-panel]');
    if (!trigger || !panel) return;

    var labelMore = trigger.dataset.labelMore;
    var labelLess = trigger.dataset.labelLess;

    trigger.addEventListener('click', function () {
      var open = wrap.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (labelMore && labelLess) {
        trigger.textContent = open ? labelLess : labelMore;
      }
    });
  });
})();
