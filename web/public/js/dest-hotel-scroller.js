/* Horizontální scroller karet oblastí/hotelů na detailu destinace (Black
   Tomato styl) — šipky + drag-to-scroll, stejný princip jako #destSlider
   na homepage (main.js), jen samostatně pro #hotelScroller, protože jich
   může být na stránce víc (různé instance nejsou, ale sdílená #id stačí,
   je vždy max jedna sekce Ubytování na stránce). */
(function () {
  var slider = document.getElementById('hotelScroller');
  if (!slider) return;
  if (slider.hasAttribute('data-embla')) return; // dest-embla.js drives this one instead

  var card = slider.querySelector('.hotel-card, .tile');
  function step() {
    var w = card ? card.getBoundingClientRect().width : 272;
    var gap = parseFloat(getComputedStyle(slider).columnGap || getComputedStyle(slider).gap || 20) || 20;
    return w + gap;
  }

  var arrPrev = document.querySelector('.hotel-arrow-prev');
  var arrNext = document.querySelector('.hotel-arrow-next');

  // Homepage destination slider advances a full page of cards per click (data-scroll-by
  // on #hotelScroller, e.g. "4"); detail-page hotel/area rows have no such attribute and
  // keep the original one-card-at-a-time step.
  var scrollBy = parseInt(slider.dataset.scrollBy, 10) || 1;
  document.querySelectorAll('.hotel-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      slider.scrollBy({ left: step() * scrollBy * parseInt(btn.dataset.dir, 10), behavior: 'smooth' });
    });
  });

  var ticking = false;
  function updateArrows() {
    ticking = false;
    if (!arrPrev || !arrNext) return;
    var max = slider.scrollWidth - slider.clientWidth - 2;
    arrPrev.disabled = slider.scrollLeft <= 2;
    arrNext.disabled = slider.scrollLeft >= max || max <= 0;
  }
  slider.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(updateArrows); ticking = true; }
  }, { passive: true });
  setTimeout(updateArrows, 100);
  window.addEventListener('resize', updateArrows);

  var isDown = false, startX = 0, startScroll = 0, moved = 0;
  slider.addEventListener('pointerdown', function (e) {
    isDown = true; moved = 0;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!isDown) return;
    var dx = e.clientX - startX;
    moved = Math.abs(dx);
    if (moved > 6) slider.classList.add('dragging');
    slider.scrollLeft = startScroll - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('dragging');
  });
  slider.addEventListener('click', function (e) {
    if (moved > 6) { e.preventDefault(); }
  }, true);
})();
