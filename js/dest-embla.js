/* Promotes the homepage "Destinace" slider (#hotelScroller) to a real Embla carousel
   (drag + momentum + unified easing) instead of the plain native scroll-snap row that
   dest-hotel-scroller.js drives everywhere else. Krystof asked for the same feel as
   fitzroy-travel.com's "looking for inspiration?" filmstrip (27.8.2026) -- that one is
   genuinely Embla-powered (unlike the site's own destinations row, which turned out to
   still be native scroll-snap under the hood, confirmed by inspecting the live page).
   Scoped to elements carrying data-embla (its value is slidesToScroll) so destination-
   detail pages keep the untouched native scroller. dest-hotel-scroller.js bails out on
   sight of data-embla, so exactly one script drives any given track. */
(function () {
  if (typeof EmblaCarousel === 'undefined') return;

  var REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reducedMotion() { return !!(REDUCED && REDUCED.matches); }

  document.querySelectorAll('[data-embla]').forEach(function (container) {
    if (container.__emblaWired) return;
    container.__emblaWired = true;

    var slidesToScroll = parseInt(container.dataset.embla, 10) || 1;

    // This Embla build's scrollSnapList collapses to a single [0] entry (canScrollNext()
    // permanently false, no matter the config) unless two things are both true, found by
    // bisecting real markup against a synthetic carousel piece by piece:
    //  1. The slide element Embla measures must not itself be display:flex (our cards are
    //     flex-direction:column) -- wrapped below in a plain block .embla-slide div per
    //     card, sized via the CSS rule in destinace-detail.css; the card's own flex layout
    //     is untouched one level down.
    //  2. The container (this element) must not have an explicit CSS width (e.g.
    //     width:max-content) -- see .hotel-grid[data-embla] in destinace-detail.css. Looks
    //     identical from getBoundingClientRect() either way; only shows up in Embla's
    //     internal engine.limit calculation.
    Array.prototype.slice.call(container.children).forEach(function (card) {
      var slide = document.createElement('div');
      slide.className = 'embla-slide';
      card.parentNode.insertBefore(slide, card);
      slide.appendChild(card);
    });

    var viewport = document.createElement('div');
    viewport.className = 'emblavp';
    container.parentNode.insertBefore(viewport, container);
    viewport.appendChild(container);

    var embla = EmblaCarousel(viewport, {
      align: 'start',
      loop: false,
      containScroll: 'trimSnaps',
      dragFree: false,
      slidesToScroll: slidesToScroll,
      duration: reducedMotion() ? 1 : 22,
    });

    var root = viewport.closest('.hotel-scroller') || viewport.parentElement;
    var prev = root.querySelector('.hotel-arrow-prev');
    var next = root.querySelector('.hotel-arrow-next');
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); embla.scrollPrev(); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); embla.scrollNext(); });

    function update() {
      if (prev) { prev.disabled = !embla.canScrollPrev(); prev.style.opacity = prev.disabled ? '.35' : ''; }
      if (next) { next.disabled = !embla.canScrollNext(); next.style.opacity = next.disabled ? '.35' : ''; }
    }
    embla.on('select', update).on('reInit', update);
    update();
  });
})();
