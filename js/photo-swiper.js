// Fotogalerie s jednou velkou fotkou — šipky + swipe/drag, žádné
// zvětšování/lightbox (viz CenaTag.astro sourozenec PhotoSwiper.astro).
(function () {
  function setup(el) {
    var track = el.querySelector('.photo-swiper-track');
    var slides = Array.prototype.slice.call(el.querySelectorAll('.photo-swiper-slide'));
    var prev = el.querySelector('.photo-swiper-arrow-prev');
    var next = el.querySelector('.photo-swiper-arrow-next');
    var counter = el.querySelector('[data-photo-swiper-current]');
    var index = 0;
    var dragging = false;
    var startX = 0;
    var dx = 0;

    function render() {
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      if (counter) counter.textContent = String(index + 1);
    }

    function go(delta) {
      index = (index + delta + slides.length) % slides.length;
      render();
    }

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    el.addEventListener('pointerdown', function (e) {
      // Klik na šipku/počítadlo nesmí spustit drag — setPointerCapture níže by
      // jinak přesměroval navazující click event z tlačítka na .photo-swiper
      // (skutečné kliknutí by pak vůbec nedoběhlo do click handleru šipky).
      if (slides.length < 2 || e.target.closest('.photo-swiper-arrow')) return;
      dragging = true;
      startX = e.clientX;
      dx = 0;
      track.style.transition = 'none';
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = 'translateX(calc(-' + index * 100 + '% + ' + dx + 'px))';
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      else render();
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointerleave', endDrag);
    el.addEventListener('pointercancel', endDrag);

    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });

    render();
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-photo-swiper]')).forEach(setup);
})();
