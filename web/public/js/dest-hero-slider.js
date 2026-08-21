/* Hero fotoslider na detailu destinace/oblasti — crossfade mezi 2-4 fotkami
   z galerie + tečkový indikátor. Respektuje prefers-reduced-motion (žádný
   autoplay, jen ruční přepínání přes tečky). */
(function () {
  var root = document.getElementById('destHeroSlider');
  if (!root) return;

  var slides = root.querySelectorAll('.dest-hero-slide');
  var dots = root.querySelectorAll('.dest-hero-dot');
  if (slides.length < 2) return;

  var current = 0;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer;

  function goTo(i) {
    slides[current].classList.remove('is-active');
    if (dots[current]) dots[current].classList.remove('is-active');
    current = i;
    slides[current].classList.add('is-active');
    if (dots[current]) dots[current].classList.add('is-active');
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goTo(i);
      resetTimer();
    });
  });

  function resetTimer() {
    if (prefersReduced) return;
    clearInterval(timer);
    timer = setInterval(function () {
      goTo((current + 1) % slides.length);
    }, 5500);
  }

  resetTimer();
})();
