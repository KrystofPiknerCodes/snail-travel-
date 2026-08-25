/* /home-v2/ and every v2 clean-room page — shared interactivity engine.
 *
 * Loaded on ALL v2 templates via the clean-room enqueue (cbd-v2-home-js), so this one
 * file lights up the whole redesign. Vanilla JS, no deps. Deferred, so the DOM is parsed.
 *
 * It wires three things, all by class so no per-page markup is required:
 *   1. Carousels  — native horizontal scroll-snap rows (.v2dest / .arcar / .v2insp cards):
 *                   prev/next arrows scroll by one card, progress (fill OR segment bars)
 *                   tracks scroll position, arrows disable at the ends, touch is native.
 *   2. Accordions — single-open toggles (.btmonths / .deaccord / .v2hiw): head toggles its
 *                   panel (animated max-height) and rotates the chevron.
 *   3. Nav        — hardens the burger overlay (#v2menu): Esc + click-outside close, and
 *                   wires submenu expand/collapse + the desktop dropdowns.
 *
 * Design choice (Q1, confirmed in OPEN-QUESTIONS): arrows + swipe + progress, NO autoplay,
 * NO loop — the premium/considered feel; autoplay fights reading.
 */
(function () {
  'use strict';

  /* ----------------------------------------------------------------- helpers */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function arr(list) { return Array.prototype.slice.call(list); }
  /* Some people get motion sickness from movement they did not ask for, and say so in their
     operating system. Nothing on the site listened (2026-08-22: zero prefers-reduced-motion rules
     in any stylesheet). CSS handles transitions and animations in reset.css; this covers the part
     CSS cannot reach, the scrolls this file performs with behavior:'smooth' and Embla's animated
     slide changes, which ignore the stylesheet entirely. Read live, not cached, so a visitor who
     changes the setting is respected without reloading. */
  var REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reducedMotion() { return !!(REDUCED && REDUCED.matches); }
  function ease() { return reducedMotion() ? 'auto' : 'smooth'; }

  function throttleRAF(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  /* =================================================================== CAROUSELS
   * Each carousel root contains a scrollable TRACK (its only flex row of cards),
   * one or more ARROW pairs, and a PROGRESS indicator (a moving fill bar, or a set
   * of segment <i> bars). The track is made horizontally scrollable here so the
   * page CSS does not have to change; arcar already scrolls, the rest get it inline.
   */
  var CAROUSELS = [
    // .v2dest (home destinations) stays NATIVE: its desktop track is absolutely positioned within a
    // fixed 900px composition, which Embla can't drive without a home-page refactor (flagged).
    { root: '.v2dest',  track: '.v2dest__track' },
    // .v2insp__cards stays NATIVE: it is the tablet/mobile row (hidden on desktop), so there is no
    // mouse-drag to gain; native touch momentum is already ideal and it shares the bars indicator.
    { root: '.v2insp',  track: '.v2insp__cards', arrowsScope: '.v2insp__arrows-h' }
  ];

  // Card rows promoted from native scroll-snap to Embla (real drag + momentum + unified easing,
  // matching the inspiration carousel). The engine wraps the existing track in an Embla viewport,
  // so NO page markup changes; the track becomes the Embla container and its cards the slides.
  // align:'start', no loop (these are linear rows with arrows/progress).
  var EMBLA_ROWS = [
    { root: '.arcar', track: '.arcar__track', arrowsScope: '.arcar__arrows' },   // area camp carousels (x2)
    // .ttdep REMOVED 2026-07-31: the departure strip pages a WHOLE SCREENFUL at a time, not one
    // card, per the annotation on Hugo's node 514:45326. It has its own setupDepartureDates().
    // Leaving it here too would put two scripts on one track, which is how the FAQ accordion
    // ended up refusing to open.
    { root: '.ldcar', track: '.ldcar__row',   arrowsScope: '.ldcar__arrows' }    // landing related-articles (arrows were unwired before)
  ];

  function findArrows(root) {
    // Every <button> inside an *arrows* wrapper in this carousel root.
    var btns = [];
    arr(root.querySelectorAll('[class*="arrow"] button, [class*="arrows"] button')).forEach(function (b) {
      btns.push(b);
    });
    var prev = [], next = [];
    btns.forEach(function (b) {
      var label = (b.getAttribute('aria-label') || '').toLowerCase();
      if (label.indexOf('prev') !== -1) prev.push(b);
      else if (label.indexOf('next') !== -1) next.push(b);
    });
    return { prev: prev, next: next };
  }

  /* Rows that could not be wired at page load because they were hidden at that width. Retried
     whenever the window resizes. ADDED 2026-08-22 after Jon reported the homepage "looking for
     inspiration?" row dead, and it reproduced on the live site: .v2insp__cards is display:none
     above 1280, so on a desktop load setupCarousel found no visible cards and returned BEFORE it
     had made the track scrollable or bound its arrows, and nothing ever ran again. Narrowing the
     window past 1280 then showed a row that no thumb or arrow could move, while a fresh load at
     the same width was fine. Not a developer-tools artefact: an iPad Pro turned from landscape
     (1366) to portrait (1024) crosses the same breakpoint and reproduced it exactly.
     Only this direction needs help. Going the other way Embla re-measures the filmstrip itself
     (verified: a filmstrip revealed by widening lands on the identical transform as one loaded
     wide), so nothing is re-initialised there. */
  var pendingCarousels = [];
  function retryPendingCarousels() {
    if (!pendingCarousels.length) return;
    pendingCarousels = pendingCarousels.filter(function (p) {
      wireCarousel(p.root, p.cfg);
      var t = p.root.querySelector(p.cfg.track);
      return !(t && t.__carWired);          // still hidden: keep waiting
    });
  }

  function setupCarousel(cfg) {
    arr(document.querySelectorAll(cfg.root)).forEach(function (root) { wireCarousel(root, cfg); });
  }

  function wireCarousel(root, cfg) {
      var track = root.querySelector(cfg.track);
      if (!track || track.__carWired) return;          // never wire the same track twice
      var cards = arr(track.children).filter(function (c) { return c.offsetParent !== null || c.getClientRects().length; });
      if (cards.length < 2) {
        // Hidden at this width (or not laid out yet). Come back to it after a resize.
        if (!pendingCarousels.some(function (p) { return p.root === root && p.cfg === cfg; })) {
          pendingCarousels.push({ root: root, cfg: cfg });
        }
        return;
      }
      track.__carWired = true;

      // Make the track a scroll container (arcar already is; this is idempotent).
      track.style.overflowX = 'auto';
      track.style.scrollSnapType = 'x mandatory';
      track.style.scrollBehavior = ease();
      track.style.scrollbarWidth = 'none';            // Firefox
      track.style.webkitOverflowScrolling = 'touch';
      // If the desktop track is absolutely positioned (v2dest), bound its right edge so it can scroll.
      if (getComputedStyle(track).position === 'absolute' && !track.style.right) track.style.right = '0';
      cards.forEach(function (c) { if (!c.style.scrollSnapAlign) c.style.scrollSnapAlign = 'start'; });

      var arrowHost = cfg.arrowsScope ? (root.querySelector(cfg.arrowsScope) || root) : root;
      var arrows = findArrows(arrowHost);
      var fill = root.querySelector('[class*="pfill"]');
      var bars = arr(root.querySelectorAll('[class*="__bars"] i, .v2insp__bars i'));

      function step() {
        // One card width including the gap, measured from the first two cards.
        if (cards.length > 1) return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
        return cards[0].getBoundingClientRect().width;
      }
      function maxScroll() { return track.scrollWidth - track.clientWidth; }

      function update() {
        // batch2 #1/#6: when this track is hidden (desktop hides .v2insp__cards while the
        // foot arrows stay visible for the Embla filmstrip), a hidden track measures
        // scrollWidth 0 and this used to DISABLE both foot arrows at 35% opacity and fight
        // Embla for the progress bars. A hidden track owns nothing: clear and stand down.
        if (!track.offsetParent) {
          arrows.prev.concat(arrows.next).forEach(function (b) { b.disabled = false; b.style.opacity = ''; });
          return;
        }
        var max = maxScroll();
        var sl = track.scrollLeft;
        // Progress — fill model: width = visible fraction, left = scrolled fraction.
        if (fill) {
          var vis = track.clientWidth / track.scrollWidth;
          fill.style.width = (vis * 100) + '%';
          fill.style.left = (max > 0 ? (sl / max) * (100 - vis * 100) : 0) + '%';
        }
        // Progress — segment bars: light the card the row is currently aligned to.
        if (bars.length) {
          var idx = Math.round(sl / Math.max(1, step()));
          idx = Math.max(0, Math.min(bars.length - 1, idx));
          bars.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
        }
        // Arrow enable/disable at the ends.
        var atStart = sl <= 1, atEnd = sl >= max - 1;
        arrows.prev.forEach(function (b) { b.disabled = atStart; b.style.opacity = atStart ? '.35' : ''; });
        arrows.next.forEach(function (b) { b.disabled = atEnd;  b.style.opacity = atEnd  ? '.35' : ''; });
      }

      function go(dir) { track.scrollBy({ left: dir * step(), behavior: ease() }); }
      arrows.prev.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); go(-1); }); });
      arrows.next.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); go(1); }); });

      track.addEventListener('scroll', throttleRAF(update), { passive: true });
      window.addEventListener('resize', throttleRAF(update));
      window.addEventListener('load', update);
      update();
  }

  /* ============================================================== EMBLA CARD ROWS
   * Promote a native scroll-snap card row to Embla without touching its markup: wrap the
   * existing track in a viewport (overflow hidden), init Embla on it (track = container,
   * cards = slides), and wire the existing arrows + progress (segment bars or fill). At rest
   * (startIndex 0, align start, no transform) the cards keep their original positions, so the
   * measured geometry is unchanged. Drag/swipe/wheel + momentum come for free.
   */
  /* Sideways swipe on a Mac trackpad or Magic Mouse (Paul's father, 2026-08-22).
     That gesture reaches the page as a wheel event carrying sideways movement. Every NATIVE
     scroll row on the site answers it for free, and all three Embla carousels ignored it:
     measured on the live site, the home destinations row moved 868px on a swipe while the
     desktop inspiration filmstrip, the area camp rows and the article related row all moved 0.
     Embla's bundle contains no wheel handling whatsoever and the add-on that supplies it was
     never loaded, so a Mac visitor got nothing from a gesture that worked on the same page a
     section earlier. This is the smallest thing that closes the gap.
     It deliberately does NOT hijack vertical scrolling: unless the gesture is more sideways
     than up-and-down it is left alone, so scrolling the page with the pointer resting over a
     carousel still scrolls the page. Claiming the sideways gesture also stops macOS reading it
     as a back/forward history swipe, which it otherwise does over any component that has no
     scrolling of its own. */
  function wireTrackpadSwipe(viewport, embla) {
    if (!viewport || viewport.__wheelWired) return;
    viewport.__wheelWired = true;
    var STEP = 50;        // sideways pixels that advance one slide
    var COOLDOWN = 280;   // ms between slides, so one long push pages steadily instead of racing
    var acc = 0, lastStep = 0, lastEvent = 0;
    viewport.addEventListener('wheel', function (e) {
      var dx = e.deltaX, dy = e.deltaY;
      if (e.deltaMode === 1) { dx *= 16; dy *= 16; }                                    // lines
      else if (e.deltaMode === 2) { dx *= viewport.clientWidth; dy *= viewport.clientHeight; }  // pages
      if (Math.abs(dx) <= Math.abs(dy)) return;    // an up-and-down scroll: it belongs to the page
      e.preventDefault();
      var now = Date.now();
      if (now - lastEvent > 200) acc = 0;          // a fresh gesture, not the tail of the last one
      lastEvent = now;
      acc += dx;
      if (Math.abs(acc) < STEP || now - lastStep < COOLDOWN) return;
      if (acc > 0) embla.scrollNext(reducedMotion()); else embla.scrollPrev(reducedMotion());
      acc = 0; lastStep = now;
    }, { passive: false });
  }

  function setupEmblaRow(cfg) {
    if (typeof EmblaCarousel === 'undefined') return;
    arr(document.querySelectorAll(cfg.root)).forEach(function (root) {
      var track = root.querySelector(cfg.track);
      if (!track || track.__emblaRow) return;
      var slides = arr(track.children);
      if (slides.length < 2) return;

      // Wrap the track in an Embla viewport (its first child must be the container).
      var vp = document.createElement('div');
      vp.className = 'emblavp';
      vp.style.overflow = 'hidden';
      vp.style.width = '100%';
      track.parentNode.insertBefore(vp, track);
      vp.appendChild(track);
      track.style.overflowX = 'visible';          // Embla translates the track; it must not also scroll
      track.style.scrollSnapType = 'none';

      var embla = EmblaCarousel(vp, { align: cfg.align || 'start', loop: false, containScroll: 'trimSnaps', dragFree: false, slidesToScroll: 1 });
      track.__emblaRow = embla;
      wireTrackpadSwipe(vp, embla);

      var host = cfg.arrowsScope ? (root.querySelector(cfg.arrowsScope) || root) : root;
      var arrows = findArrows(host);
      arrows.prev.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); embla.scrollPrev(reducedMotion()); }, true); });
      arrows.next.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); embla.scrollNext(reducedMotion()); }, true); });

      var fill = root.querySelector('[class*="pfill"]');
      var bars = arr(root.querySelectorAll('[class*="__bars"] i'));
      function update() {
        var canP = embla.canScrollPrev(), canN = embla.canScrollNext();
        arrows.prev.forEach(function (b) { b.disabled = !canP; b.style.opacity = canP ? '' : '.35'; });
        arrows.next.forEach(function (b) { b.disabled = !canN; b.style.opacity = canN ? '' : '.35'; });
        var i = embla.selectedScrollSnap(), n = embla.scrollSnapList().length;
        if (bars.length) bars.forEach(function (b, bi) { b.classList.toggle('on', bi === i); });
        if (fill) { var vis = 1 / Math.max(1, n); fill.style.width = (vis * 100) + '%'; fill.style.left = (n > 1 ? (i / (n - 1)) * (100 - vis * 100) : 0) + '%'; }
      }
      embla.on('select', update).on('reInit', update);
      update();
    });
  }

  /* =================================================================== ACCORDIONS
   * A list of rows; each row has a clickable HEAD and a collapsible PANEL. Single-open:
   * opening one closes the rest in the same list. Panels animate via max-height; the
   * chevron rotates. All styling is set inline so no page CSS change is needed.
   */
  var ACCORDIONS = [
    { list: '.btmonths__list',  row: '.btmonths__row',  head: '.btmonths__head',  panel: '.btmonths__panel', chev: '.btmonths__chev', single: true },
    { list: '.deaccord__list',  row: '.deaccord__item', head: '.deaccord__head',  panel: '.deaccord__panel', chev: '.deaccord__chev', single: true },
    { list: '.v2hiw__acc',      row: '.v2hiw__item',    head: '.v2hiw__bar',      panel: '.v2hiw__body',     chev: '.v2hiw__chev',     single: true },
    { list: '.ttfaq__list',     row: '.ttfaq__item',    head: '.ttfaq__head',     panel: '.ttfaq__panel',    chev: '.ttfaq__chev',     single: true },
    { list: '.ihfaq__list',     row: '.ihfaq__item',    head: '.ihfaq__head',     panel: '.ihfaq__panel',    chev: '.ihfaq__chev',     single: true },
    { list: '.ttdaily__acc',    row: '.ttdaily__entry', head: '.ttdaily__head',   panel: '.ttdaily__panel',  chev: '.ttdaily__chev',   single: true }
  ];

  var ACC_ID = 0;
  function setupAccordion(cfg) {
    arr(document.querySelectorAll(cfg.list)).forEach(function (list) {
      var rows = arr(list.querySelectorAll(cfg.row));
      if (!rows.length) return;

      function panelOf(row) { return row.querySelector(cfg.panel); }
      function setOpen(row, open) {
        var panel = panelOf(row);
        row.classList.toggle('is-open', open);
        // Say out loud whether this row is open. The heads are real buttons and work by keyboard,
        // but nothing told a screen reader whether pressing one had opened or closed anything
        // (2026-08-22: none of the six accordion types carried aria-expanded).
        var h = row.querySelector(cfg.head);
        if (h) {
          h.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (panel) {
            if (!panel.id) panel.id = 'fzacc-' + (++ACC_ID);
            h.setAttribute('aria-controls', panel.id);
          }
        }
        var chev = row.querySelector(cfg.chev);
        if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
        if (chev) chev.style.transition = 'transform .3s ease-in-out';
        if (!panel) return;
        panel.style.overflow = 'hidden';
        panel.style.display = 'block';
        // Hugo's accordion motion spec (2026-07-12): ~300ms ease-in-out height + brief text fade,
        // no snap. Padding is IN the transition because several panels gain padding-top from their
        // .is-open CSS (e.g. .deaccord__panel +16px), which otherwise snaps instantly = the jitter
        // Paul saw. The fade trails the reveal by 80ms on open so it reads as a fade, not clipping.
        // max-height gets +48 headroom: with padding animating, scrollHeight at t0 under-measures.
        panel.style.transition = open
          ? 'max-height .3s ease-in-out, padding .3s ease-in-out, opacity .25s ease-in-out .08s'
          : 'max-height .3s ease-in-out, padding .3s ease-in-out, opacity .18s ease-in-out';
        if (open) { panel.style.maxHeight = (panel.scrollHeight + 48) + 'px'; panel.style.opacity = '1'; }
        else { panel.style.maxHeight = '0px'; panel.style.opacity = '0'; }
      }

      rows.forEach(function (row) {
        var head = row.querySelector(cfg.head) || row;
        // Mobile: kill the native tap-highlight flash and double-tap text selection on the
        // heads (Paul 2026-07-12) — the accordion's own animation is the touch feedback.
        head.style.webkitTapHighlightColor = 'transparent';
        head.style.userSelect = 'none';
        head.style.webkitUserSelect = 'none';
        var startOpen = row.classList.contains('is-open') || row.classList.contains('v2hiw__item--open');
        // Collapse everything except a pre-opened row, with no transition flash on load.
        var panel = panelOf(row);
        if (panel) { panel.style.transition = 'none'; }
        setOpen(row, startOpen);
        if (panel) { requestAnimationFrame(function () { panel.style.transition = 'max-height .3s ease-in-out, padding .3s ease-in-out, opacity .25s ease-in-out .08s'; }); }

        head.addEventListener('click', function (e) {
          e.preventDefault();
          var willOpen = !row.classList.contains('is-open');
          if (cfg.single) rows.forEach(function (r) { if (r !== row) setOpen(r, false); });
          setOpen(row, willOpen);
        });
      });

      // Recalculate the open panel's height on resize (text reflow).
      window.addEventListener('resize', throttleRAF(function () {
        rows.forEach(function (r) {
          if (!r.classList.contains('is-open')) return;
          var p = panelOf(r);
          if (p) { p.style.maxHeight = 'none'; var h = p.scrollHeight; p.style.maxHeight = h + 'px'; }
        });
      }));
    });
  }

  /* The old fade-nudge cycler (setupInspFeatured) was removed 2026-06-17: every .v2insp section
   * now uses the Embla filmstrip below (all four pages carry data-embla). */

  /* ============================================== INSPIRATION — EMBLA FILMSTRIP
   * The gold-standard replacement for the old fade-nudge cycler (Paul, 2026-06-17).
   * Each slide is a full trip card (image + info); Embla centres the active card and
   * slides the strip with a real transform, while a Scale tween shrinks the peeking
   * neighbours (matching the node's 600 active / ~500 peek). align center + loop so a
   * neighbour always peeks. Active card stays measure-0 (it sits at the node position).
   * Gated to .v2insp__featured[data-embla]; other pages keep setupInspFeatured().
   */
  function setupInspEmbla() {
    if (typeof EmblaCarousel === 'undefined') return;
    arr(document.querySelectorAll('.v2insp__featured[data-embla]')).forEach(function (featured) {
      var viewport = featured.querySelector('.emblafs');
      if (!viewport) return;
      var section = featured.closest('.v2insp') || featured;
      var embla = EmblaCarousel(viewport, { align: 'center', loop: true, containScroll: false, duration: 26 });
      wireTrackpadSwipe(viewport, embla);

      // ---- Scale tween (the "Embla Scale" pattern): peeks shrink toward MIN as they leave centre.
      var MIN = 500 / 600, BASE = 0.2, factor = 0, nodes = [];   // node peek = 500 of active 600 (Hugo QA #3 2026-07-21: was .83, 2px off)
      function clamp(n, lo, hi) { return Math.min(Math.max(n, lo), hi); }
      function setNodes() { nodes = embla.slideNodes().map(function (s) { return s.querySelector('.v2trip') || s; }); }
      function setFactor() { factor = BASE * embla.scrollSnapList().length; }
      function tween(evt) {
        var engine = embla.internalEngine();
        var progress = embla.scrollProgress();
        var inView = embla.slidesInView();
        var isScroll = evt === 'scroll';
        embla.scrollSnapList().forEach(function (snap, snapIndex) {
          var diff = snap - progress;
          engine.slideRegistry[snapIndex].forEach(function (slideIndex) {
            if (isScroll && inView.indexOf(slideIndex) === -1) return;
            if (engine.options.loop) {
              engine.slideLooper.loopPoints.forEach(function (lp) {
                var target = lp.target();
                if (slideIndex === lp.index && target !== 0) {
                  var sign = Math.sign(target);
                  if (sign === -1) diff = snap - (1 + progress);
                  if (sign === 1) diff = snap + (1 - progress);
                }
              });
            }
            var node = nodes[slideIndex];
            if (node) {
              node.style.transform = 'scale(' + clamp(1 - Math.abs(diff * factor), MIN, 1) + ')';
              // Hugo QA #3 (2026-07-21): scale peeks about the edge FACING the viewport, not their
              // centre. Centre-origin pulled the neighbour image away from the seam and collapsed
              // the node's 96px image peeks (Image 1 at -404..96, Image 3 at 1344..1844) to ~4px
              // slivers, leaving the (node-exact) arrows floating on empty sand. Origin only
              // matters at scale!=1, and slides change sides at scale~1, so the flip is seamless.
              node.style.transformOrigin = diff > 0.001 ? 'left center' : (diff < -0.001 ? 'right center' : 'center center');
            }
          });
        });
      }
      setNodes(); setFactor(); tween();
      embla.on('reInit', function () { setNodes(); setFactor(); tween(); })
           .on('scroll', function () { tween('scroll'); })
           .on('slideFocus', function () { tween(); });

      // ---- Progress bars (desktop foot indicator) follow the selected slide.
      var bars = arr(section.querySelectorAll('.v2insp__bars i'));
      function onSelect() {
        var i = embla.selectedScrollSnap();
        bars.forEach(function (b, bi) { b.classList.toggle('on', bi === i); });
        // P4 2026-07-12: only the active slide shows its text column — the peeking neighbours
        // read as plain images (the node's peeks carry no text), replacing the old edge mask.
        // The LEFT neighbour additionally slides its media across the hidden text column so an
        // IMAGE peeks at the left seam, mirroring the node's left peek (Paul, P4 follow-up).
        var n = embla.slideNodes().length;
        var prev = (i - 1 + n) % n;
        embla.slideNodes().forEach(function (sn, si) {
          sn.classList.toggle('is-active', si === i);
          sn.classList.toggle('is-left', si === prev && n > 1);
        });
      }
      embla.on('select', onSelect); onSelect();

      // ---- Arrows (batch2 #1): the desktop side set is gone from the design — the FOOT
      //      arrows (.v2insp__arrows-h) now show at every breakpoint (stacked 32px under the
      //      progress bar, node 1076:145603) and must drive whichever carousel is on screen:
      //      the Embla filmstrip on desktop, the native cards row (via setupCarousel, whose
      //      own listener stays bound) on tablet/mobile. Guard on the filmstrip's visibility
      //      so exactly one engine responds per click — this also hardens the tablet path
      //      Hugo reported dead (batch2 #6): if the filmstrip is hidden, this handler steps
      //      aside entirely.
      arr(section.querySelectorAll('.v2insp__foot .v2insp__arrows-h button')).forEach(function (b) {
        var prev = (b.getAttribute('aria-label') || '').toLowerCase().indexOf('prev') !== -1;
        b.addEventListener('click', function (e) {
          if (!featured.offsetParent) return;              // filmstrip hidden: the cards row owns this click
          e.preventDefault(); e.stopPropagation();
          prev ? embla.scrollPrev(reducedMotion()) : embla.scrollNext(reducedMotion());
        }, true);
      });
    });
  }

  /* ============================================================ SHARE POPOVER (batch2 #15)
   * ONE shared component for every share button site-wide (.arhero__share on the
   * destination/area/lodge/accommodation/trip/hub heroes, .ldhero__share on article and
   * landing heroes) — nodes 1083:146023 (default) / 1083:146008 (row hover). The JS wraps
   * each button, builds the popover once, and fills the three links with the CURRENT
   * page's title + URL (never hardcoded). Open on hover where a hover pointer exists;
   * tap/click toggles everywhere; outside tap, second tap or Esc closes.
   * The sms: scheme differs by OS (iOS wants sms:&body=..., Android sms:?body=...) —
   * flagged for a real-iPhone test before this is called done.
   */
  function setupSharePopover() {
    var btns = arr(document.querySelectorAll('.arhero__share, .ldhero__share'));
    if (!btns.length) return;
    var enc = encodeURIComponent;
    btns.forEach(function (a) {
      // The popover lives at BODY level (Paul review 2026-08-01: the hero panel's overflow
      // clipped it to one row on mobile), positioned under the button on desktop and as a
      // centred sheet over a dimmed backdrop on mobile. Third row is COPY LINK per Paul,
      // replacing the ticket's share-via-text (Hugo's component to follow).
      var pop = document.createElement('div');
      pop.className = 'sharepop';
      var back = document.createElement('div');
      back.className = 'sharepop-backdrop';
      var title = document.title, url = location.href;
      [
        { label: 'share via email',    href: 'mailto:?subject=' + enc(title) + '&body=' + enc(url) },
        { label: 'share via whatsapp', href: 'https://wa.me/?text=' + enc(title + ' ' + url), blank: true },
        { label: 'copy link',          copy: true }
      ].forEach(function (l) {
        var el = document.createElement('a');
        el.className = 'sharepop__item';
        el.href = l.copy ? '#' : l.href;
        el.textContent = l.label;
        if (l.blank) { el.target = '_blank'; el.rel = 'noopener'; }
        if (l.copy) el.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          function done() { el.textContent = 'link copied'; setTimeout(function () { el.textContent = 'copy link'; }, 1600); }
          function fallback() {
            var t = document.createElement('textarea');
            t.value = url; t.style.position = 'fixed'; t.style.opacity = '0';
            document.body.appendChild(t); t.select();
            try { document.execCommand('copy'); done(); } catch (err) {}
            document.body.removeChild(t);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback);
          else fallback();
        });
        pop.appendChild(el);
      });
      document.body.appendChild(back);
      document.body.appendChild(pop);
      var isSheet = function () { return matchMedia('(max-width: 767.98px)').matches; };
      function position() {
        if (isSheet()) { pop.classList.add('sharepop--sheet'); pop.style.left = ''; pop.style.top = ''; return; }
        pop.classList.remove('sharepop--sheet');
        var r = a.getBoundingClientRect();
        pop.style.left = Math.round(r.left + window.scrollX) + 'px';
        pop.style.top = Math.round(r.bottom + window.scrollY + 6) + 'px';
      }
      function show() { position(); pop.classList.add('is-open'); if (isSheet()) back.classList.add('is-open'); }
      function hide() { pop.classList.remove('is-open'); back.classList.remove('is-open'); }
      function isOpen() { return pop.classList.contains('is-open'); }
      if (window.matchMedia && matchMedia('(hover: hover)').matches) {
        var hoverTimer;
        var cancel = function () { clearTimeout(hoverTimer); };
        var leave = function () { hoverTimer = setTimeout(hide, 180); };
        a.addEventListener('mouseenter', function () { cancel(); show(); });
        a.addEventListener('mouseleave', leave);
        pop.addEventListener('mouseenter', cancel);
        pop.addEventListener('mouseleave', leave);
      }
      a.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        isOpen() ? hide() : show();
      });
      back.addEventListener('click', hide);
      document.addEventListener('click', function (e) { if (!pop.contains(e.target) && !a.contains(e.target)) hide(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
      window.addEventListener('resize', function () { if (isOpen()) position(); });
      window.addEventListener('scroll', function () { if (isOpen() && !isSheet()) position(); }, { passive: true });
    });
  }

  /* ======================================================================= NAV
   * The mobile/tablet overlay (#v2menu) already opens/closes via inline onclick on the
   * burger + close button. Harden it: Esc and click-outside close. Submenu expand and the
   * desktop dropdowns are wired here too where their hooks exist.
   */
  // Where each nav item points within the v2 staging set. Matched by the link's text so it
  // works on both nav variants (.btnav and the transparent home .v2nav) and in the #v2menu
  // overlay, without editing every template. Destinations -> the destinations index; Ideas &
  // Inspiration -> the editorial/articles hub (the Inspiration Hub itself is not built yet —
  // flagged); the desktop mega-dropdown is undesigned in Figma so these are plain links for now.
  var NAV_MAP = [
    // Switchover 2026-07-22: every v2 page now lives at its real URL (the -v2 twins and the
    // old-design originals are retired), so the map points at the real site.
    { re: /destination/i,        href: '/destinations/' },
    { re: /idea|inspiration/i,   href: '/inspiration/' },
    { re: /process/i,            href: '/our-process/' },
    { re: /about/i,              href: '/about-us/' },
    { re: /contact/i,            href: '/contact-us/' }
  ];
  function wireNavLinks() {
    // Logo -> home (the v2 homepage serves at the root since the 2026-07-22 switchover).
    arr(document.querySelectorAll('.btnav__logo, .v2nav__logo, .aunav__logo')).forEach(function (a) {
      a.setAttribute('href', '/'); a.onclick = null; a.removeAttribute('onclick');
    });
    // Nav links + CTAs in the bar and the overlay. Only rewrite dead links (href="#" / return-false),
    // never the real tel: phone link. .aunav is the about-us transparent white-on-photo variant.
    var sel = '.btnav__links a, .v2nav__links a, .v2nav a, .aunav__links a, .aunav a, #v2menu a, .btnav__cta, .v2nav__cta, .aunav__cta';
    arr(document.querySelectorAll(sel)).forEach(function (a) {
      if (a.getAttribute('href') && a.getAttribute('href').indexOf('tel:') === 0) return;
      var txt = (a.textContent || '').trim();
      for (var i = 0; i < NAV_MAP.length; i++) {
        if (NAV_MAP[i].re.test(txt)) { a.setAttribute('href', NAV_MAP[i].href); a.onclick = null; a.removeAttribute('onclick'); return; }
      }
    });
  }

  // Where every other DEAD link in the page (footer, breadcrumbs, in-content CTAs) should point.
  // Same text-match philosophy as NAV_MAP so one deploy wires every page without editing 16 templates.
  // Only ever rewrites links that are dead (href="#" or onclick="return false"); a real destination,
  // a tel:/mailto:, or a working in-page #anchor is left alone.
  var SITE_MAP = [
    { re: /^home$/i,                                 href: '/' },
    { re: /^destinations?$/i,                        href: '/destinations/' },
    { re: /^(zimbabwe|uganda|rwanda|tanzania|namibia|botswana|kenya)$/i, slug: true },
    { re: /get in touch|^contact us$|^enquire|book a call/i, href: '/contact-us/' },
    { re: /^view safari$|view trip itinerary/i,      href: '/inspiration/' }, // dead card fallback -> the safaris hub (real cards carry their own trip URL server-side)
    { re: /^our process$/i,                          href: '/our-process/' },
    { re: /^about us$/i,                             href: '/about-us/' },
    { re: /terms\s*(&|and|&amp;)?\s*conditions/i,    href: '/terms-conditions/' },
    { re: /privacy\s*policy/i,                       href: '/privacy-policy/' },
    { re: /financial\s*protection/i,                 href: '/financial-protection/' }
  ];
  function wireSiteLinks() {
    // The footer logo carries no text -> wire it explicitly to home.
    arr(document.querySelectorAll('.opfoot__logo')).forEach(function (a) {
      a.setAttribute('href', '/'); a.onclick = null; a.removeAttribute('onclick');
    });
    arr(document.querySelectorAll('a')).forEach(function (a) {
      if (a.closest('#v2menu') || a.closest('.btnav') || a.closest('.v2nav') || a.closest('.aunav') || a.closest('.v2cta')) return; // nav handled by wireNavLinks
      var href = a.getAttribute('href') || '';
      var dead = (href === '#' || href === '' || a.getAttribute('onclick') === 'return false');
      // A blocked in-page anchor (href="#foo" + onclick return false) whose target exists: just
      // free the jump, keep the href. Covers the best-time #btmonths / area #armonths defects.
      if (href.length > 1 && href.charAt(0) === '#' && document.getElementById(href.slice(1))) {
        a.onclick = null; a.removeAttribute('onclick'); return;
      }
      // A real tel:/mailto: link wrongly carrying onclick="return false" — free it so it works.
      if ((href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) && a.getAttribute('onclick') === 'return false') {
        a.onclick = null; a.removeAttribute('onclick'); return;
      }
      if (!dead) return;
      var txt = (a.textContent || '').trim();
      for (var i = 0; i < SITE_MAP.length; i++) {
        if (SITE_MAP[i].re.test(txt)) {
          // country rows resolve to their own canonical page (/uganda/, /kenya/, ...); all 7 exist
          var dest = SITE_MAP[i].slug ? '/' + txt.toLowerCase().trim() + '/' : SITE_MAP[i].href;
          a.setAttribute('href', dest); a.onclick = null; a.removeAttribute('onclick'); return;
        }
      }
    });
  }

  // Tablet/mobile burger DRAWER — rebuilt to Hugo's dropdown-panel designs (QA 2026-07-31
  // item 1; tablet 1073:127734/127850/127921/127992, mobile 1073:128696/128987/129098/129185).
  // Right-hand drawer over a dimmed page; Bebas rows with rules; the CHEVRON BUTTON is the
  // only submenu trigger (16px hit ring) — row text links straight to the hub page. Countries
  // + submenu rows carry the double-arrow that shows on hover/tap. ABTOT + the gold-outline
  // phone pill pin to the drawer foot. One deploy fixes every page (#v2menu placeholder).
  var NAV_COUNTRIES = ['zimbabwe', 'uganda', 'rwanda', 'tanzania', 'namibia', 'botswana', 'kenya'];
  var CHEV = '<svg class="nschev" viewBox="0 0 16 8" aria-hidden="true"><polyline points="1,1 8,7 15,1"/></svg>';
  var ARROWS = '<svg class="nsarrows" viewBox="0 0 14 10" aria-hidden="true"><path d="M1 1l4 4-4 4"/><path d="M7 1l4 4-4 4"/></svg>';
  function themeBase() {
    var s = document.querySelector('script[src*="home-v2.js"]');
    return s ? s.getAttribute('src').split('/js/')[0] : '/wp-content/themes/cbd';
  }
  function buildMenu(menu) {
    var countries = NAV_COUNTRIES.map(function (c) {
      return '<li><a href="/' + c + '/">' + ARROWS + '<span>' + c + '</span></a></li>';
    }).join('');
    menu.innerHTML =
      '<aside class="v2menu__panel" role="dialog" aria-modal="true" aria-label="Menu">' +
      '<button type="button" class="v2menu__close" aria-label="Close menu">' +
        '<svg class="nsclose" viewBox="0 0 22 22" aria-hidden="true"><line x1="1" y1="1" x2="21" y2="21"/><line x1="21" y1="1" x2="1" y2="21"/></svg>' +
      '</button>' +
      '<nav class="v2menu__list">' +
        '<div class="v2menu__group" data-submenu>' +
          '<div class="nsrow">' +
            '<a class="nsitem" href="/destinations/"><span>destinations</span></a>' +
            '<button type="button" class="nschevbtn" data-submenu-toggle aria-expanded="false" aria-label="Open the destinations menu">' + CHEV + '</button>' +
          '</div>' +
          '<ul class="nssub">' + countries + '</ul>' +
        '</div>' +
        '<div class="v2menu__group" data-submenu>' +
          '<div class="nsrow">' +
            '<a class="nsitem" href="/inspiration/"><span>ideas &amp; inspiration</span></a>' +
            '<button type="button" class="nschevbtn" data-submenu-toggle aria-expanded="false" aria-label="Open the ideas and inspiration menu">' + CHEV + '</button>' +
          '</div>' +
          '<ul class="nssub">' +
            '<li><a href="/inspiration/">' + ARROWS + '<span>Browse Safaris</span></a></li>' +
            '<li><a href="/stories/">' + ARROWS + '<span>Articles</span></a></li>' +
          '</ul>' +
        '</div>' +
        '<a class="nsrow" href="/our-process/"><span class="nsitem">our process</span>' + ARROWS + '</a>' +
        '<a class="nsrow" href="/about-us/"><span class="nsitem">about us</span>' + ARROWS + '</a>' +
        '<a class="nsrow" href="/contact-us/"><span class="nsitem">contact us</span>' + ARROWS + '</a>' +
      '</nav>' +
      '<img class="v2menu__abtot" src="' + themeBase() + '/img/r1/abtot.png" alt="ABTOT Member 5409" width="100" height="50">' +
      '<a class="v2menu__phone" href="tel:+15855056307"><svg class="ic" aria-hidden="true"><use href="#ic-phone"></use></svg><span>+1 585 505 6307</span></a>' +
      '</aside>';
    // move the foot pieces inside the panel (flex column pins them to the drawer bottom)
    var panel = menu.querySelector('.v2menu__panel');
    arr(menu.children).forEach(function (c) { if (c !== panel) panel.appendChild(c); });
    // MOBILE TAP STATES (no hover on touch): the tap visual lands INSTANTLY on touchstart,
    // the action fires on the natural click at touchend (never a timer), and the visual
    // fades out ~130ms after release (Hugo item 1 timing note).
    arr(menu.querySelectorAll('a.nsrow, .nsrow > a.nsitem, .nssub a, .v2menu__phone')).forEach(function (el) {
      el.addEventListener('touchstart', function () { el.classList.add('is-tap'); }, { passive: true });
      function endTap() { setTimeout(function () { el.classList.remove('is-tap'); }, 130); }
      el.addEventListener('touchend', endTap, { passive: true });
      el.addEventListener('touchcancel', endTap, { passive: true });
    });
  }

  // Desktop nav dropdown panels — Hugo's REAL designs (QA 2026-07-31 item 2, replacing the
  // teal Q-NAV-1 approximation). Destinations = the 620x294 split panel (1075:122645 hover /
  // 1075:126109 default): sand country list left, live image panel right that crossfades to
  // the hovered country's page hero (heroes are read from the live pages on first open, so
  // they always match what Paul has published — no hardcoded list to go stale). Ideas &
  // Inspiration = the 310-wide text-only panel (1075:129620/129612). TRIGGER (item 1): only
  // the chevron arrow opens a panel — it gets a 16px hit ring; the item TEXT is a plain link
  // to its hub page. A 200ms grace timer covers the pointer's hop from arrow to panel.
  var DD_HEROES = {};
  var DESKTOP_DD = [
    // `dd` matches the data-dd on the server-rendered panel in inc/chrome-nav-dropdowns.php.
    { re: /destination/i, image: true, dd: 'dest',
      items: NAV_COUNTRIES.map(function (c) { return { label: c, href: '/' + c + '/', slug: c }; }) },
    { re: /idea|inspiration/i, image: false, dd: 'ideas', items: [
        { label: 'Browse Safaris', href: '/inspiration/' },
        { label: 'Articles',       href: '/stories/' }
    ] }
  ];
  function ddPrefetchHeroes(cfg) {
    if (cfg.__fetched) return;
    cfg.__fetched = true;
    cfg.items.forEach(function (it) {
      if (!it.slug || DD_HEROES[it.slug]) return;
      fetch(it.href).then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var el = doc.querySelector('.arhero__photo');
        if (!el) return;
        // The destination hero became a real <img> on 2026-08-13 (a CSS background cannot be
        // indexed by image search), so read the img first. The inline-style branch stays as the
        // fallback for any page type still painting its hero as a background — without it this
        // dropdown would silently lose its country photograph, on every page of the site, and
        // nothing on the destination page itself would look wrong.
        var img = el.querySelector('img');
        var src = img && (img.getAttribute('src') || '');
        if (!src) {
          var m = (el.getAttribute('style') || '').match(/url\((['"]?)([^'")]+)\1/);
          src = m ? m[2] : '';
        }
        if (src) { DD_HEROES[it.slug] = src; var im = new Image(); im.src = src; }
      }).catch(function () {});
    });
  }
  function buildDesktopDropdown() {
    var nav = document.querySelector('.btnav, .v2nav, .aunav');
    if (!nav) return;
    arr(document.querySelectorAll('.btnav__links a, .v2nav__links a, .aunav__links a')).forEach(function (a) {
      var txt = (a.textContent || '').trim();
      var cfg = null;
      for (var i = 0; i < DESKTOP_DD.length; i++) { if (DESKTOP_DD[i].re.test(txt)) { cfg = DESKTOP_DD[i]; break; } }
      if (!cfg || a.closest('.v2dd-wrap')) return;
      // strip the old "▾" chevron out of the link's text — the arrow becomes its own button.
      // ONLY the ▾ and surrounding space: the homepage nav writes its labels as BARE text
      // ("Destinations ▾", no span), and removing whole text nodes deleted the labels there
      // (Paul's screenshot, 2026-07-31). A node left empty (the btnav " ▾" tail) is dropped.
      arr(a.childNodes).forEach(function (n) {
        if (n.nodeType !== 3) return;
        var cleaned = n.textContent.replace(/\s*▾\s*$/g, '');
        if (cleaned.trim()) n.textContent = cleaned; else a.removeChild(n);
      });
      var wrap = document.createElement('span');
      wrap.className = 'v2dd-wrap';
      a.parentNode.insertBefore(wrap, a);
      wrap.appendChild(a);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v2dd-arrow';
      btn.setAttribute('aria-label', 'Open the ' + txt + ' menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<svg viewBox="0 0 8 4" aria-hidden="true"><path d="M0 0l4 4 4-4"/></svg>';
      wrap.appendChild(btn);
      // The panel is rendered by inc/chrome-nav-dropdowns.php so its links exist in the HTML
      // (2026-08-22: built here from a JS array, /stories/ and with it the 15 blog posts had no
      // crawlable link anywhere on the site). Reuse that markup; only build one if it is absent,
      // which keeps this working on any page whose template has not included the partial yet.
      var dd = cfg.dd ? nav.querySelector('.v2dd[data-dd="' + cfg.dd + '"]') : null;
      if (!dd) {
        dd = document.createElement('div');
        dd.className = 'v2dd ' + (cfg.image ? 'v2dd--dest' : 'v2dd--ideas');
        var rows = cfg.items.map(function (it) {
          return '<a href="' + it.href + '"' + (it.slug ? ' data-dd-slug="' + it.slug + '"' : '') + '>' +
                 '<span>' + it.label + '</span>' +
                 '<svg class="v2dd__arrows" viewBox="0 0 14 10" aria-hidden="true"><path d="M1 1l4 4-4 4"/><path d="M7 1l4 4-4 4"/></svg></a>';
        }).join('');
        dd.innerHTML = '<div class="v2dd__list">' + rows + '</div>' + (cfg.image
          ? '<div class="v2dd__media"><img class="v2dd__img" src="' + themeBase() + '/img/v2/navdd-default.webp" alt=""' + (window.matchMedia && window.matchMedia('(min-width: 1024px)').matches ? '' : ' loading="lazy"') + '><img class="v2dd__img v2dd__img--hover" alt=""></div>'
          : '');
        nav.appendChild(dd);   // the nav bar is the positioned box in every scroll state -> top:100% = flush under the bar
      }
      var closeT = null;
      function openDD() {
        clearTimeout(closeT);
        var nr = nav.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
        var w = cfg.image ? 620 : 310;
        var left = Math.max(8, Math.min(wr.left - nr.left + wr.width / 2 - w / 2, nr.width - w - 8));
        dd.style.left = Math.round(left) + 'px';
        dd.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        if (cfg.image) ddPrefetchHeroes(cfg);
      }
      function shutDD() { dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
      function closeSoon() { closeT = setTimeout(shutDD, 200); }
      function cancelClose() { clearTimeout(closeT); }
      btn.addEventListener('mouseenter', openDD);
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (dd.classList.contains('is-open')) { cancelClose(); shutDD(); } else { openDD(); }
      });
      wrap.addEventListener('mouseleave', closeSoon);
      wrap.addEventListener('mouseenter', cancelClose);
      dd.addEventListener('mouseleave', closeSoon);
      dd.addEventListener('mouseenter', cancelClose);
      document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target) && !dd.contains(e.target)) { cancelClose(); shutDD(); }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cancelClose(); shutDD(); } });
      if (cfg.image) {
        var hoverImg = dd.querySelector('.v2dd__img--hover');
        arr(dd.querySelectorAll('.v2dd__list a')).forEach(function (row) {
          row.addEventListener('mouseenter', function () {
            var u = DD_HEROES[row.getAttribute('data-dd-slug')];
            if (!u) return;
            if (hoverImg.getAttribute('src') === u) { hoverImg.classList.add('is-showing'); return; }
            hoverImg.classList.remove('is-showing');
            hoverImg.onload = function () { hoverImg.classList.add('is-showing'); };
            hoverImg.src = u;
            if (hoverImg.complete && hoverImg.naturalWidth) hoverImg.classList.add('is-showing');
          });
        });
        dd.querySelector('.v2dd__list').addEventListener('mouseleave', function () { hoverImg.classList.remove('is-showing'); });
      }
    });
  }

  /* Hold the page still while the burger drawer is open (Paul, 2026-08-22). Measured before this:
     open the drawer on a phone, swipe, and the page underneath scrolled 0 to 385 while the drawer
     stayed put. That is the classic overlay leak and it reads as the site being broken.
     Watching the class rather than hooking every open/close path, because the drawer is opened by
     an inline onclick in six templates and closed from five places (the X, Escape, a tap outside,
     a link, and the browser back button); a watcher cannot be forgotten by the next one added.
     position:fixed rather than overflow:hidden, because overflow alone does not hold iOS Safari,
     and the scroll position is put back exactly on close so nothing jumps. */
  function lockScrollWhileMenuOpen() {
    var menu = document.getElementById('v2menu');
    if (!menu || !window.MutationObserver) return;
    var b = document.body, locked = null;
    function lock() {
      if (locked !== null) return;
      locked = window.scrollY || window.pageYOffset || 0;
      b.style.position = 'fixed';
      b.style.top = -locked + 'px';
      b.style.left = '0';
      b.style.right = '0';
      b.style.width = '100%';
      b.style.overflow = 'hidden';
    }
    function unlock() {
      if (locked === null) return;
      var y = locked; locked = null;
      b.style.position = ''; b.style.top = ''; b.style.left = ''; b.style.right = '';
      b.style.width = ''; b.style.overflow = '';
      window.scrollTo(0, y);          // instant on purpose: an eased jump back would be worse
    }
    new MutationObserver(function () {
      menu.classList.contains('is-open') ? lock() : unlock();
    }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    if (menu.classList.contains('is-open')) lock();
  }

  function setupNav() {
    var menu = document.getElementById('v2menu');
    if (menu) buildMenu(menu);
    wireNavLinks();
    wireSiteLinks();
    buildDesktopDropdown();
    if (menu) {
      var closeBtn = menu.querySelector('.v2menu__close');
      function close() { menu.classList.remove('is-open'); }
      if (closeBtn) closeBtn.addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
      menu.addEventListener('click', function (e) { if (e.target === menu) close(); });
    }
    // Submenu expand/collapse inside the overlay (mobile/tablet designed states).
    arr(document.querySelectorAll('[data-submenu-toggle]')).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var li = btn.closest('[data-submenu]') || btn.parentNode;
        li.classList.toggle('is-expanded');
        btn.setAttribute('aria-expanded', li.classList.contains('is-expanded') ? 'true' : 'false');
      });
    });
    // Desktop dropdowns (hover + focus + click), where a panel exists.
    arr(document.querySelectorAll('[data-dropdown]')).forEach(function (item) {
      function open() { item.classList.add('is-open'); }
      function shut() { item.classList.remove('is-open'); }
      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', shut);
      var trigger = item.querySelector('[data-dropdown-trigger]');
      if (trigger) trigger.addEventListener('click', function (e) { e.preventDefault(); item.classList.toggle('is-open'); });
    });
  }

  /* ============================================================== FIXED CTA BANNER
   * Hugo's mobile/tablet sticky bottom bar (Figma 786:102165 / 786:101929): two gold buttons,
   * Contact Us (mail) + the phone number, on a dark teal bar. Always visible on mobile/tablet,
   * hidden on desktop (CSS). Injected once so it appears on every page.
   */
  function buildFixedCTA() {
    if (document.querySelector('.v2cta')) return;
    // Not on a client's payment page. They came to pay, our number is already in the trip
    // summary and in the declined message, and a fixed bar across the bottom of a card form
    // sits on top of the pay button and pulls them away from it. Paul, 2026-08-12.
    if (document.body.classList.contains('payment-live')) return;
    // Not on the contact page either (Paul, 2026-08-23). Same reasoning one step further on:
    // its "contact us" button links to the page the visitor is already reading, its phone
    // number is already in the contact details beside the form, and on a phone the bar covers
    // the bottom of the form the whole way down.
    if (document.body.classList.contains('contact-v2')) return;
    var bar = document.createElement('div');
    bar.className = 'v2cta';
    bar.innerHTML =
      '<a class="v2cta__btn" href="/contact-us/"><svg class="ic" aria-hidden="true"><use href="#ic-mail"></use></svg><span>contact us</span></a>' +
      '<a class="v2cta__btn" href="tel:+15855056307"><svg class="ic" aria-hidden="true"><use href="#ic-phone"></use></svg><span>+1 585 505 6307</span></a>';
    document.body.appendChild(bar);
  }

  /* ================================================================= GALLERY LIGHTBOX
   * Any [data-tt-lightbox] trigger (Trip hero / daily-summary / gallery "more photos",
   * Figma annotation 'Button' = opens a gallery lightbox). Collects the gallery cell photos
   * and shows them in a full-screen viewer with prev/next + Esc/arrow keys. Styles injected once.
   */
  var lbOpen = null;   // exposed opener: lbOpen(imgsArray, startIdx) — assigned by setupLightbox
  function setupLightbox() {
    if (!document.querySelector('[data-tt-lightbox]')) return;
    var st = document.createElement('style');
    // Fade + subtle zoom in (opacity/visibility transition, not display, so it can animate).
    st.textContent = '.v2lb{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,20,22,.92);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s ease}' +
      // max-sizing, no fixed 84vh box: the img hugs the photo, so there is no invisible
      // letterbox swallowing backdrop taps — and no box-shadow. The old shadow painted around
      // the full-height BOX; two neighbouring shadows met between slides mid-swipe as a dark
      // full-height channel (Paul spotted it on his phone, 2026-08-15). On a 92% dark backdrop
      // a shadow adds nothing; Instagram-class viewers run none.
      '.v2lb.is-open{opacity:1;visibility:visible}.v2lb img{max-height:84vh;max-width:92vw;width:auto;height:auto;transform:scale(.985);transition:transform .2s ease}' +
      '.v2lb.is-open img{transform:scale(1)}' +
      // Scroll-snap viewer strip (2026-08-15, Paul: the popup swipe felt loose next to the hero
      // strip): same engine, 1:1 finger tracking + momentum + snap. Slides are viewport-wide
      // flex centres; the img keeps the contain sizing above. Placeholder imgs have no box
      // shadow so an unhydrated slide shows pure backdrop, not a floating grey slab.
      '.v2lb__strip{position:absolute;inset:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
      '.v2lb__strip::-webkit-scrollbar{display:none}' +
      '.v2lb__slide{flex:0 0 100%;width:100%;height:100%;display:flex;align-items:center;justify-content:center;scroll-snap-align:start;scroll-snap-stop:always}' +
      // z-index:2 because the img's transform makes it a stacking context painted AFTER these
      // earlier-in-DOM buttons — a tall portrait photo was sitting ON TOP of the close target,
      // which is why taps beside the x did nothing (found on Paul's report, 2026-08-15).
      '.v2lb button{position:absolute;z-index:2;background:none;border:0;color:#fff;cursor:pointer;font-size:34px;line-height:1;padding:16px}' +
      // Close = a 64px circular target, clear of the phone's status bar, with a visible pill so
      // the finger knows where home is (Paul 2026-08-15: the bare x was too fiddly to hit).
      '.v2lb button.v2lb__close{top:calc(10px + env(safe-area-inset-top, 0px));right:calc(10px + env(safe-area-inset-right, 0px));font-size:36px;width:64px;height:64px;padding:0;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.5);background:rgba(0,0,0,.25)}' +
      '.v2lb button.v2lb__close:hover,.v2lb button.v2lb__close:active{background:rgba(0,0,0,.5)}' +
      '.v2lb__prev{left:8px;top:50%;transform:translateY(-50%)}.v2lb__next{right:8px;top:50%;transform:translateY(-50%)}' +
      '@media (prefers-reduced-motion: reduce){.v2lb,.v2lb img{transition:none}}';
    document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'v2lb';
    // A real dialog (2026-08-15): keyboard focus moves INTO the viewer on open, Tab cycles its
    // three buttons instead of wandering the covered page, Esc/close returns focus where the
    // visitor was. Screen readers are told a photo viewer opened.
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<div class="v2lb__strip" data-lb-strip></div>' +
      '<button class="v2lb__close" aria-label="Close">&times;</button>' +
      '<button class="v2lb__prev" aria-label="Previous">&#8249;</button>' +
      '<button class="v2lb__next" aria-label="Next">&#8250;</button>';
    document.body.appendChild(box);
    var strip = box.querySelector('[data-lb-strip]');
    var api = wireStrip(strip, { dynamic: true });
    var lastFocus = null;
    box.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = arr(box.querySelectorAll('button'));
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    });
    // Phone back button closes the viewer instead of leaving the page (Paul 2026-08-15,
    // "people are used to how Instagram behaves"). Opening pushes one history entry; the
    // back press pops it and we close. A manual close (X, Esc, backdrop) consumes the same
    // entry via history.back() so the back stack never grows.
    var histOpen = false;
    function close(viaPop) {
      box.classList.remove('is-open'); document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (err) {} }
      if (!viaPop && histOpen) { histOpen = false; try { history.back(); } catch (err) {} }
      histOpen = false;
    }
    window.addEventListener('popstate', function () { if (box.classList.contains('is-open')) close(true); });
    lbOpen = function (list, start) {
      lastFocus = document.activeElement;
      try { history.pushState({ fzLb: 1 }, ''); histOpen = true; } catch (err) { histOpen = false; }
      if (list && list.length) {
        // rebuild the strip for THIS gallery: slide 0..n, only the opening slide carries a live
        // src (wireStrip hydrates neighbours and chains the rest on first touch)
        strip.innerHTML = list.map(function (u, k) {
          var live = (k === (start || 0));
          return '<div class="v2lb__slide"><img alt="Gallery image" decoding="async" ' +
            (live ? 'src="' + u + '"' : 'src="' + STRIP_GIF + '" data-src="' + u + '"') + '></div>';
        }).join('');
      }
      box.classList.add('is-open'); document.body.style.overflow = 'hidden';
      // the strip has a size only once visible: seat the opening slide on the next frame.
      // Focus needs one more beat — at rAF time the box's visibility transition hasn't started,
      // and a still-hidden button silently refuses focus (caught by the probe, 2026-08-15).
      requestAnimationFrame(function () { api.reset(start || 0); });
      setTimeout(function () { box.querySelector('.v2lb__close').focus(); }, 60);
    };
    // wrap: passing close directly would hand it the click EVENT as viaPop, skipping the
    // history cleanup (probe-caught 2026-08-15)
    box.querySelector('.v2lb__close').addEventListener('click', function () { close(); });
    box.querySelector('.v2lb__prev').addEventListener('click', function (e) { e.stopPropagation(); api.go(-1); });
    box.querySelector('.v2lb__next').addEventListener('click', function (e) { e.stopPropagation(); api.go(1); });
    // tap on the backdrop (the strip/slide padding around the photo) closes — but never a tap
    // that ends a swipe, so track movement from pointerdown (the inspiration-card guard).
    var pdX = 0, pdY = 0, pdMoved = false;
    box.addEventListener('pointerdown', function (e) { pdX = e.clientX; pdY = e.clientY; pdMoved = false; }, { passive: true });
    box.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - pdX) > 8 || Math.abs(e.clientY - pdY) > 8) pdMoved = true; }, { passive: true });
    box.addEventListener('click', function (e) {
      if (pdMoved) return;
      var t = e.target;
      if (t === box || t.classList.contains('v2lb__strip') || t.classList.contains('v2lb__slide')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') api.go(-1); else if (e.key === 'ArrowRight') api.go(1);
    });
    // Gallery-section triggers (NOT the daily one) show the 2x2 gallery photos.
    var galImgs = arr(document.querySelectorAll('.ttgal__cell')).map(function (c) {
      var m = (c.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/); return m ? m[1] : null;
    }).filter(Boolean);
    arr(document.querySelectorAll('[data-tt-lightbox]:not([data-tt-lightbox-daily])')).forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault();
        var own = t.getAttribute('data-images'), list = galImgs;   // lodge gallery carries its own full list
        if (own) { try { list = JSON.parse(own); } catch (err) {} }
        lbOpen(list, 0); });
    });
  }

  /* ============================================================== HERO SCROLL-SNAP STRIP
   * One engine for every [data-hero-strip] (lodge + trip heroes; the daily galleries build their
   * strips with the same classes below). The browser's own scroll physics move the photo 1:1
   * under the finger with momentum + mandatory snap; this JS only (a) hydrates slides just ahead
   * of use, (b) drives the arrows, (c) syncs the caption overlay where the page carries
   * data-hero-caps. Canaried on Kifaru House 2026-08-15, rolled out on Paul's approval.
   * The templates' inline cyclers stay as the fallback when no strip is rendered.
   */
  var STRIP_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Soft photo swap for the arrow-only cyclers (Paul 2026-08-15): decode the target first, swap,
  // and rise from a brief dip — the hard src-pop becomes a crossfeel without any second layer.
  // Web Animations aren't covered by the CSS reduced-motion rule, so honour it here.
  function softSwap(el, url, doSwap) {
    var pre = new Image(); pre.src = url;
    var done = function () {
      doSwap();
      if (!REDUCED_MOTION && el.animate) el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180, easing: 'ease' });
    };
    if (pre.decode) pre.decode().then(done, done);
    else if (pre.complete) done();
    else { pre.onload = done; pre.onerror = done; }
  }
  // opts.dynamic: wire even while empty and read children live — the lightbox rebuilds its
  // slides on every open, so the engine must not cache the slide list at wire time.
  function wireStrip(strip, opts) {
    opts = opts || {};
    function n() { return strip.children.length; }
    if (!opts.dynamic && n() < 2) return null;
    var idx = 0, prog = 0, progT = 0, raf = 0, chained = false;
    function hydrate(k, hi) {
      var N = n(); if (!N) return;
      k = ((k % N) + N) % N;
      var sl = strip.children[k];
      var so = sl.querySelector('source[data-srcset]');
      if (so) { so.srcset = so.getAttribute('data-srcset'); so.removeAttribute('data-srcset'); }
      var im = sl.querySelector('img[data-src]');
      if (!im) return;
      var ss = im.getAttribute('data-srcset');   // srcset first so a phone never fetches the big src
      if (ss) { im.sizes = im.getAttribute('data-sizes') || '100vw'; im.srcset = ss; im.removeAttribute('data-srcset'); }
      if (hi) im.setAttribute('fetchpriority', 'high');   // the slide a finger is heading for jumps the queue
      im.src = im.getAttribute('data-src'); im.removeAttribute('data-src');
    }
    // First swipe = intent to browse: quietly pull the whole set one image at a time, so the
    // background chain never competes with the slide the finger actually wants.
    function chainAll() {
      if (chained) return; chained = true;
      var q = [];
      for (var k = 0; k < n(); k++) q.push(k);
      (function nextOne() {
        var k = q.shift();
        if (k == null) return;
        var sl = strip.children[k]; if (!sl) return nextOne();
        var im = sl.querySelector('img[data-src]');
        if (!im) return nextOne();
        im.addEventListener('load', nextOne, { once: true });
        im.addEventListener('error', nextOne, { once: true });
        hydrate(k);
      })();
    }
    function w() { return strip.clientWidth || 1; }
    function cur() { return Math.max(0, Math.min(n() - 1, Math.round(strip.scrollLeft / w()))); }
    strip.addEventListener('touchstart', function () { hydrate(idx + 1, true); hydrate(idx - 1); chainAll(); }, { passive: true });
    strip.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var i = cur();
        if (i !== idx) { idx = i; if (opts.onChange) opts.onChange(idx); }
        if (prog) return;   // an arrow wrap flying across the strip must not fire 20 downloads
        hydrate(idx, true); hydrate(idx + 1, true); hydrate(idx - 1); hydrate(idx + 2); hydrate(idx + 3);
        chainAll();
      });
    }, { passive: true });
    var smooth = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';
    function go(d) {
      var t = ((idx + d) % n() + n()) % n();
      hydrate(t, true); chainAll(); prog = 1; clearTimeout(progT); progT = setTimeout(function () { prog = 0; }, 900);
      strip.scrollTo({ left: t * w(), behavior: smooth });
    }
    // keep the current slide seated when the viewport resizes or the phone rotates
    var rsz = 0;
    window.addEventListener('resize', function () {
      var keep = idx; clearTimeout(rsz);
      rsz = setTimeout(function () { strip.scrollTo({ left: keep * w(), behavior: 'auto' }); }, 120);
    });
    // idle warm-up: the first two swipe targets plus the prev-arrow wrap target
    function warm() { if (n() > 1) { hydrate(1); hydrate(2); hydrate(n() - 1); } }
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 });
    else setTimeout(warm, 1500);
    // reset(i): new content just landed in the strip (lightbox open) — seat slide i instantly,
    // restart the hydration chain state, and warm the new neighbours.
    function reset(i) {
      idx = Math.max(0, Math.min(n() - 1, i || 0)); chained = false;
      hydrate(idx, true);
      strip.scrollTo({ left: idx * w(), behavior: 'auto' });
      hydrate(idx + 1); hydrate(idx - 1);
    }
    return { go: go, cur: cur, reset: reset };
  }
  /* Phone back button closes the full-screen menu instead of leaving the page (Paul 2026-08-15,
   * matching the photo viewer). The burger/close buttons keep their inline handlers; this rides
   * along via delegation. Known edge: navigating to a page FROM the open menu leaves the pushed
   * entry behind, costing one extra back press later — the trade every site with this pattern makes. */
  function setupMenuHistory() {
    var menu = document.getElementById('v2menu'); if (!menu) return;
    var mOpen = false;
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.btnav__burger, .v2nav__burger, .aunav__burger')) {
        if (menu.classList.contains('is-open') && !mOpen) { try { history.pushState({ fzMenu: 1 }, ''); mOpen = true; } catch (err) {} }
      } else if (e.target.closest && e.target.closest('.v2menu__close')) {
        if (mOpen) { mOpen = false; try { history.back(); } catch (err) {} }
      }
    });
    window.addEventListener('popstate', function () {
      if (menu.classList.contains('is-open')) { menu.classList.remove('is-open'); mOpen = false; }
    });
  }

  function setupHeroStrip() {
    var strip = document.querySelector('[data-hero-strip]'); if (!strip) return;
    var photo = strip.parentNode;
    var caps; try { caps = JSON.parse(photo.getAttribute('data-hero-caps') || '[]'); } catch (e) { caps = []; }
    var capEl = photo.querySelector('.arhero__caption'), capTxt = capEl && capEl.querySelector('span');
    var api = wireStrip(strip, { onChange: function (i) {
      if (!capEl || !caps.length) return;   // trip heroes carry per-photo credits; lodge heroes never do
      var c = caps[i] || '';
      if (capTxt) capTxt.textContent = c;
      capEl.style.display = c ? '' : 'none';
    } });
    if (!api) return;
    var prev = photo.querySelector('[data-hero-prev]'), next = photo.querySelector('[data-hero-next]');
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); api.go(-1); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); api.go(1); });
  }

  /* ============================================================== DAILY-SUMMARY GALLERY
   * Each itinerary day (.ttdaily__entry) carries its own data-images list. The right-hand figure
   * shows the OPEN day's photos: opening a day swaps to its first image, the arrows scroll that
   * day's photos, and "more photos" opens them in the lightbox. (Paul, 2026-06-16.)
   */
  function setupDailyGallery() {
    var sec = document.querySelector('.ttdaily'); if (!sec) return;
    var fig = sec.querySelector('[data-ttdaily-gallery]'); if (!fig) return;
    var entries = arr(sec.querySelectorAll('.ttdaily__entry'));
    var imgs = [], imgsWide = [], imgsFull = [], idx = 0;
    function render() { if (imgs.length) fig.style.backgroundImage = 'url("' + imgs[idx] + '")'; }
    // the compact figure stays on the square crop (fits the fixed box); the lightbox ("more
    // photos") shows THE OPEN DAY's photos at their NATURAL shape via the entry's
    // data-images-full list (Paul 2026-08-01 — the button briefly carried a loop variable
    // frozen on the LAST day, so every day opened Days 9-12's gallery; it now always
    // follows whichever day is open, like the figure itself).
    function setDay(en) {
      var d = (en.getAttribute('data-images') || '').split(',').filter(Boolean); if (!d.length) return;
      var dw = (en.getAttribute('data-images-wide') || '').split(',').filter(Boolean);
      var df = (en.getAttribute('data-images-full') || '').split(',').filter(Boolean);
      imgs = d; imgsWide = (dw.length === d.length) ? dw : d;
      imgsFull = (df.length === d.length) ? df : imgsWide; idx = 0; render();
      // a one-image day (departure/transfer stages) gets no arrows: nothing to flip to (Paul 2026-08-08)
      var ga = fig.querySelector('.ttdaily__garrows'); if (ga) ga.style.display = imgs.length > 1 ? '' : 'none';
    }
    var prev = fig.querySelector('.ttdaily__garrow[aria-label="Previous"]');
    var next = fig.querySelector('.ttdaily__garrow[aria-label="Next"]');
    // the next/prev photo should already be local when the arrow lands (2026-08-15)
    function dgPreload(k) { if (imgs.length) { var im = new Image(); im.src = imgs[((k % imgs.length) + imgs.length) % imgs.length]; } }
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); if (imgs.length) { idx = (idx - 1 + imgs.length) % imgs.length; softSwap(fig, imgs[idx], render); dgPreload(idx - 1); } });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); if (imgs.length) { idx = (idx + 1) % imgs.length; softSwap(fig, imgs[idx], render); dgPreload(idx + 1); } });
    fig.addEventListener('pointerenter', function () { dgPreload(idx + 1); dgPreload(idx - 1); }, { passive: true, once: true });
    // when a day's header is clicked, swap to that day's photos once it's the open one
    // Vertical alignment (Paul, 2026-06-17): on desktop the right-hand image sits so its BOTTOM lines
    // up with the bottom of the OPEN day's content, when that content runs past the image. For a long
    // itinerary this stops the image floating at the top while you read text beside/under it. If the
    // open day's content is shorter than the image, the image stays at the top. Stacked layouts: no shift.
    var col = sec.querySelector('.ttdaily__col'), grid = sec.querySelector('.ttdaily__grid'), curY = 0;
    function sideBySide() { if (!col) return false; var c = col.getBoundingClientRect(), f = fig.getBoundingClientRect(); return f.left >= c.right - 2; }
    function alignImage() {
      // Desktop: the image is sticky + capped to the viewport (CSS .ttdaily__img), so it stays
      // fully visible beside the open day on ANY itinerary length. The old bottom-align translate
      // is removed because on long trips it pushed the photo's top out of view (Paul 2026-06-23).
      // Just clear any legacy transform so it never fights the sticky positioning.
      if (curY) { curY = 0; fig.style.transform = ''; }
    }
    // On opening a day, bring its details into view so you start at the day's header rather than
    // landing partway down the expanded content (Paul, 2026-06-17). Offsets a fixed/sticky nav if present.
    function navOffset() { var n = document.querySelector('.btnav'); if (!n) return 0; var ps = getComputedStyle(n).position; return (ps === 'fixed' || ps === 'sticky') ? n.offsetHeight : 0; }
    function scrollDayIntoView(en) { var y = en.getBoundingClientRect().top + window.scrollY - navOffset() - 16; window.scrollTo({ top: Math.max(0, y), behavior: ease() }); }
    entries.forEach(function (en) {
      var head = en.querySelector('.ttdaily__head');
      // On desktop (side-by-side) the tall right-hand image is bottom-aligned to the open day and
      // stays beside the content, so forcing the day header to the viewport top would push the image
      // off-screen (Paul 2026-06-22). Only auto-scroll on STACKED layouts (the image is inside the
      // panel there, so bringing the header into view is helpful and crops nothing).
      if (head) head.addEventListener('click', function () { setTimeout(function () { if (en.classList.contains('is-open')) setDay(en); }, 0); setTimeout(function () { alignImage(); if (en.classList.contains('is-open') && !sideBySide()) scrollDayIntoView(en); }, 360); });
      var panel = en.querySelector('.ttdaily__panel');
      if (panel) panel.addEventListener('transitionend', function (e) { if (e.propertyName === 'max-height') alignImage(); });
    });
    var openEntry = entries.filter(function (e) { return e.classList.contains('is-open'); })[0] || entries[0];
    if (openEntry) setDay(openEntry);
    var more = fig.querySelector('[data-tt-lightbox-daily]');
    if (more) more.addEventListener('click', function (e) { e.preventDefault(); if (lbOpen) lbOpen(imgsFull.length ? imgsFull : (imgsWide.length ? imgsWide : imgs), idx); });

    // per-day inline image (tablet/mobile): each panel carries its own figure + gallery (its own
    // photos). Multi-photo days get a scroll-snap strip (finger-following swipe, same engine as
    // the heroes); the square-on-phones / wide-on-tablets art direction (the dhow bug, Paul
    // 2026-07-11) is a <picture> source per slide, deferred with data-srcset so a tablet doesn't
    // download every slide at build time. Single-photo days keep the plain background.
    entries.forEach(function (en) {
      var pfig = en.querySelector('[data-ttdaily-pgallery]'); if (!pfig) return;
      var pimgs = (en.getAttribute('data-images') || '').split(',').filter(Boolean);
      var pwide = (en.getAttribute('data-images-wide') || '').split(',').filter(Boolean);
      var pga = pfig.querySelector('.ttdaily__garrows');
      if (pimgs.length < 2) {
        // a one-image day gets no arrows and no strip (Paul 2026-08-08)
        if (pga) pga.style.display = 'none';
        // a lazy <img>, not a background: fetched only when the day nears the viewport (2026-08-16)
        if (pimgs.length && !pfig.querySelector('img.lo-img')) { var one = document.createElement('img'); one.className = 'lo-img'; one.alt = ''; one.decoding = 'async'; one.loading = 'lazy'; one.src = pimgs[0]; pfig.insertBefore(one, pfig.firstChild); }
        var pmore1 = pfig.querySelector('[data-tt-lightbox-pdaily]');
        if (pmore1) pmore1.addEventListener('click', function (e) { e.preventDefault(); if (lbOpen) lbOpen(pwide.length ? pwide : pimgs, 0); });
        return;
      }
      var pstrip = document.createElement('div');
      pstrip.className = 'arhero__strip';
      pimgs.forEach(function (u, k) {
        var sl = document.createElement('div'); sl.className = 'arhero__slide';
        var pic = document.createElement('picture');
        if (pwide[k]) {
          var so = document.createElement('source');
          so.media = '(min-width: 768px) and (max-width: 1279.98px)';
          if (k === 0) so.srcset = pwide[k]; else so.setAttribute('data-srcset', pwide[k]);
          pic.appendChild(so);
        }
        var im = document.createElement('img'); im.className = 'lo-img'; im.alt = ''; im.decoding = 'async';
        // slide 0 is lazy: the figure sits far down the page on phones/tablets and is display:none on
        // desktop, so an eager src fetched 11 days' photos on every load, desktop included (2026-08-16)
        if (k === 0) { im.loading = 'lazy'; im.src = u; } else { im.src = STRIP_GIF; im.setAttribute('data-src', u); }
        pic.appendChild(im); sl.appendChild(pic); pstrip.appendChild(sl);
      });
      pfig.insertBefore(pstrip, pfig.firstChild);
      var papi = wireStrip(pstrip);
      var pp = pfig.querySelector('.ttdaily__garrow[aria-label="Previous"]');
      var pn = pfig.querySelector('.ttdaily__garrow[aria-label="Next"]');
      if (pp) pp.addEventListener('click', function (e) { e.preventDefault(); papi.go(-1); });
      if (pn) pn.addEventListener('click', function (e) { e.preventDefault(); papi.go(1); });
      var pmore = pfig.querySelector('[data-tt-lightbox-pdaily]');
      if (pmore) pmore.addEventListener('click', function (e) { e.preventDefault(); if (lbOpen) lbOpen((pwide.length === pimgs.length && pwide.length) ? pwide : pimgs, papi.cur()); });
    });
    // keep the open panel's height correct when the per-day image's size changes (resize / breakpoint cross)
    function recomputeOpen() {
      var open = entries.filter(function (e) { return e.classList.contains('is-open'); })[0];
      if (!open) return; var pn2 = open.querySelector('.ttdaily__panel'); if (pn2) pn2.style.maxHeight = pn2.scrollHeight + 'px';
    }
    var rAF; window.addEventListener('resize', function () { cancelAnimationFrame(rAF); rAF = requestAnimationFrame(function () { alignImage(); recomputeOpen(); }); });
    setTimeout(alignImage, 150);
  }

  /* =============================================================== INSPIRATION HUB FILTER
   * The filter-bar dropdowns (.ihtrips__drop, Figma drop-down 538:51277). Each opens a panel of
   * checkbox options; selecting them filters the trip-card grid by the matching data attribute and
   * updates the results count. Click-outside / Esc close. A real, working interaction (the demo
   * options are placeholder; the live facets come from the CMS).
   */
  var IH_FILTER_OPTS = {
    'Private or group': ['Private Safari', 'Group Departure'],
    // Capitalised for display; the filter still matches on the lowercased value, so the
    // (lowercase) card eyebrows/country tags continue to match.
    'Destination': ['Botswana', 'Zimbabwe', 'Kenya', 'Tanzania', 'Namibia', 'Uganda', 'Rwanda'],
    'Price (per person)': ['Under $15,000', '$15,000 - $20,000', 'Over $20,000'],
    'Duration': ['Up to 7 days', '8 - 10 days', '11+ days']
  };

  /* INSPIRATION HUB CARD BATCHING (2026-08-16 performance sweep). page-inspiration-hub-v2.php renders
     the first eight cards as markup and ships the other ~89 as JSON (#ih-cards-data). Each entry becomes
     a real card, with markup identical to the PHP, only when it is about to be shown, inserted at its
     canonical position so the grid order never changes. Filters and load-more see every card, real or
     pending, through the same dataset fields. Before: 6,600 elements / 2,159 slide tags / 1.1MB of HTML
     on load; after: eight cards' worth. */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ihSrcset(u, alts) {
    var m = alts && /^(.*)-(\d+)x\d+(\.\w+)$/.exec(u); if (!m) return '';
    var list = alts.split(' ').filter(Boolean).map(function (a) { return m[1] + '-' + a + m[3] + ' ' + a.split('x')[0] + 'w'; });
    list.push(u + ' ' + m[2] + 'w'); return list.join(', ');
  }
  function buildIhCard(d, base, sizes) {
    var ICONS = ['ic-group', 'ic-currency', 'ic-guest', 'ic-calendar'];
    var slides = d.slides || [], n = slides.length, multi = n > 1;
    var h = '<div class="ihcard" data-url="' + esc(d.url) + '" data-style="' + esc(d.style) + '" data-country="' + esc(d.country) + '" data-price="' + esc(d.price) + '" data-days="' + esc(d.days) + '" style="display:none">';
    h += '<div class="ihcard__media"' + (multi ? ' data-ihcard' : '') + '><div class="ihcard__gal"' + (multi ? ' data-ihgal data-ihsizes="' + esc(sizes) + '"' : '') + '>';
    slides.forEach(function (sl, i) {
      var u = /^https?:/.test(sl[0]) ? sl[0] : base + sl[0], alt = sl[1] || '', tok = sl[2] || '';
      if (i === 0) {
        var ss = ihSrcset(u, tok);
        h += '<img class="ihcard__slide" src="' + esc(u) + '"' + (ss ? ' srcset="' + esc(ss) + '" sizes="' + esc(sizes) + '"' : '') + ' loading="lazy" alt="' + esc(alt) + '" draggable="false">';
      } else {
        h += '<img class="ihcard__slide" data-src="' + esc(u) + '"' + (tok ? ' data-alts="' + esc(tok) + '"' : '') + ' loading="lazy" alt="' + esc(alt) + '" draggable="false">';
      }
    });
    h += '</div><span class="ihcard__grad" aria-hidden="true"></span>';
    if (multi) {
      // Photo count with the camera mark (Paul, 2026-08-22, second attempt). The bare number was
      // pulled earlier the same day for reading exactly like the CARD counter on the home rows; the
      // icon says what is being counted. MUST match page-inspiration-hub-v2.php exactly, or the
      // cards revealed by "load more" would differ from the ones that shipped with the page.
      h += '<span class="ihcard__count" aria-hidden="true"><svg class="ihcard__counticon"><use href="#ic-camera-line"></use></svg><span data-ihcur>01</span> of ' + (n < 10 ? '0' : '') + n + '</span>';
      h += '<button type="button" class="ihcard__nav ihcard__nav--prev" data-ihprev aria-label="Previous photo"><svg viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M6.5 1 1 7l5.5 6"/></svg></button>';
      h += '<button type="button" class="ihcard__nav ihcard__nav--next" data-ihnext aria-label="Next photo"><svg viewBox="0 0 8 14" fill="none" aria-hidden="true"><path d="M1.5 1 7 7l-5.5 6"/></svg></button>';
    }
    h += '</div><a class="ihcard__body" href="' + esc(d.url) + '"><span class="ihcard__titlewrap"><span class="ihcard__eyebrow">' + esc(d.country) + '</span><span class="ihcard__title">' + esc(d.short) + '</span></span>';
    h += '<span class="ihcard__desc">' + esc(d.desc) + '</span><span class="ihcard__details">';
    var st = d.stats || [];
    for (var c = 0; c < 2; c++) {
      h += '<span class="ihcard__detcol">';
      for (var j = 0; j < 2; j++) { var k = c * 2 + j; if (k >= st.length) continue; h += '<span class="ihcard__detrow"><svg class="ihcard__detic ic"><use href="#' + ICONS[k] + '"></use></svg><span class="ihcard__dettxt">' + st[k] + '</span></span>'; }
      h += '</span>';
    }
    h += '</span><span class="ihcard__cta"><span>View Safari</span><svg class="ihcard__ctaic" viewBox="0 0 14 10" fill="none" stroke="#b19f70" stroke-width="1.2" aria-hidden="true"><path d="M0 5h13M9 1l4 4-4 4"/></svg></span></a></div>';
    var tpl = document.createElement('template'); tpl.innerHTML = h;
    return tpl.content.firstChild;
  }
  function setupFilters() {
    var bar = document.querySelector('[data-ih-filter]');
    if (!bar) return;
    // tablet/mobile: the SHOW FILTERS bar opens the full-screen filter overlay (wired below).
    var ftoggle = document.querySelector('[data-ih-togglefilters]');
    var grid = document.querySelector('.ihtrips__cards');
    var cards = grid ? arr(grid.querySelectorAll('.ihcard')) : [];
    // tag each card with its country (the eyebrow) so the Destination facet can filter.
    cards.forEach(function (c) { var e = c.querySelector('.ihcard__eyebrow'); c.dataset.country = e ? e.textContent.trim().toLowerCase() : ''; });
    // Pending cards from the JSON island join the list as light stubs carrying the same dataset
    // fields the filters read; each becomes real markup only when it is about to be shown.
    var island = document.getElementById('ih-cards-data'), ihBase = '', ihSizes = '100vw';
    if (island && grid) {
      try {
        var payload = JSON.parse(island.textContent); ihBase = payload.base || ''; ihSizes = payload.sizes || ihSizes;
        (payload.cards || []).forEach(function (d) {
          cards.push({ pending: true, data: d, el: null, style: { display: 'none' },
            dataset: { country: String(d.country || '').toLowerCase(), style: String(d.style || '').toLowerCase(), price: String(d.price == null ? '' : d.price), days: String(d.days == null ? '' : d.days) } });
        });
      } catch (e) { console.error('inspiration hub: card data unreadable', e); }
    }
    // Turn a pending stub into a real card at its canonical position, wire its gallery, return the element.
    function materialise(i) {
      var c = cards[i]; if (!c.pending) return c;
      var el = buildIhCard(c.data, ihBase, ihSizes);
      var next = null; for (var k = i + 1; k < cards.length; k++) { if (!cards[k].pending) { next = cards[k]; break; } }
      if (next) grid.insertBefore(el, next); else grid.appendChild(el);
      cards[i] = el; el.dataset.country = c.dataset.country;
      // The sort keeps its own copy of the canonical order, so the SAME swap has to happen there or
      // a later re-sort brings this card's stub back from the dead: the card would stop being hidden
      // when it should be and get built a second time. Found by _ihsort_magnus.js on the second sort
      // of a session, which is the only place it shows.
      if (typeof baseOrder !== 'undefined' && baseOrder) { var bi = baseOrder.indexOf(c); if (bi !== -1) baseOrder[bi] = el; }
      wireCardGallery(el);
      // Drop the crawlable stub for this trip now that the real card carries the link.
      var stub = c.data && c.data.url ? document.querySelector('[data-ih-pending] a[href="' + c.data.url + '"]') : null;
      if (stub) stub.parentNode.removeChild(stub);
      return el;
    }
    var results = document.querySelector('.ihtrips__results');
    // Filter dropdown panels, built to the node (drop-down 538:64887 / checkbox 538:64889 /
    // salary-range-slider 538:91421): white panel + soft shadow + caret, 48px rows with a 24px gold
    // checkbox + count, hover + selected states; the Price facet renders the dual-handle slider.
    // NOTE: the option VALUES/COUNTS are placeholders (Hugo: "final filter options to be decided by
    // Paul"); Destination counts are real. Live multi-facet filtering arrives with the CMS.
    var st = document.createElement('style');
    st.textContent =
      '.ihtrips__drop{position:relative}' +
      '.ihtrips__drop.is-open{border-color:#b19f70 !important}' +
      '.ihfpanel{position:absolute;left:0;top:100%;z-index:30;background:#fff;box-shadow:0 20px 20px rgba(0,0,0,.05);padding:12px;display:none;flex-direction:column;margin-top:14px}' +
      '.ihfpanel::before{content:"";position:absolute;left:24px;top:-8px;width:18px;height:9px;background:#fff;clip-path:polygon(50% 0,100% 100%,0 100%)}' +
      '.ihtrips__drop.is-open .ihfpanel{display:flex}' +
      '.ihfpanel--check{min-width:340px}' +
      '.ihfopt{display:flex;align-items:center;gap:10px;height:48px;padding:0 12px;cursor:pointer;font:400 16px/26px "Roboto Flex",sans-serif;color:#15292c;text-transform:none;letter-spacing:0;white-space:nowrap}' +
      '.ihfopt:hover{background:#f9f5f2}' +
      '.ihfopt input{width:24px;height:24px;flex:0 0 24px;margin:0;accent-color:#b19f70;cursor:pointer}' +
      '.ihfopt span{flex:1}' +
      '.ihfopt .ihfcount{flex:0 0 auto;color:rgba(0,0,0,.45)}' +
      '.ihfopt.is-sel{font-weight:500}' +
      '.ihfpanel--price{padding:24px}' +
      '.ihslider{display:flex;align-items:center;gap:19px}' +
      /* the two figures are EDITABLE now (Baymard: a numeric slider "should always be accompanied by
         text input fields acting as a fallback"), so they are inputs styled as the node's boxes */
      '.ihslider__val{width:100px;height:38px;box-sizing:border-box;padding:0;border:1px solid rgba(0,0,0,.1);border-radius:0;background:#fff;text-align:center;font:400 16px/36px "Roboto Flex",sans-serif;color:#000;white-space:nowrap;-webkit-appearance:none;appearance:none}' +
      '.ihslider__val:focus{outline:none;border-color:#b19f70}' +
      /* 13px of margin each side: the handles are centred on their position and would otherwise hang
         over the ends of the track. The mapping reads the track box, so this must be margin, not padding */
      '.ihslider__track{position:relative;width:304px;height:26px;margin:0 13px;display:flex;align-items:center;touch-action:none}' +
      '.ihslider__back{position:absolute;left:0;right:0;height:4px;border-radius:24px;background:rgba(0,0,0,.07)}' +
      '.ihslider__fill{position:absolute;height:6px;border-radius:8px;background:#b19f70}' +
      /* 26px with opposing arrows inside: more than half of Baymard's test subjects read a two-handle
         slider as a single control, and the node's 16px circle had no room to say otherwise */
      '.ihslider__handle{position:absolute;width:26px;height:26px;border-radius:50%;background:#fff;border:3px solid #b19f70;box-sizing:border-box;transform:translateX(-50%);top:50%;margin-top:-13px;cursor:grab;display:flex;align-items:center;justify-content:center}' +
      '.ihslider__handle:active{cursor:grabbing}' +
      '.ihslider__handle:focus-visible{outline:2px solid #b19f70;outline-offset:3px}' +
      '.ihslider__hic{width:13px;height:8px;fill:none;stroke:#b19f70;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}' +
      '.ihslider__hint{margin:14px 0 0;font:300 13px/20px "Roboto Flex",sans-serif;color:rgba(0,0,0,.45);text-align:center}';
    document.head.appendChild(st);
    var selected = {};
    var priceLo = 0, priceHi = Infinity;   // From / To price range (overlay dropdowns)
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

    /* DESKTOP price facet. Hugo's node is a dual-handle range slider (538:91421). Three things were
       wrong with it and all three are now fixed.

       1. IT NEVER FILTERED. Nothing in it assigned the bounds the filter reads and applyFilter was
          never called, so a full drag of a handle changed the results by zero (measured 2026-08-23,
          "Showing 8 of 96 results" before and after). Its scale was placeholder too, $5,000 to
          $120,000 opening at $55,000-$95,000, on a page whose dearest trip is $50,570.

       2. THE SCALE WAS LINEAR ON PRICES THAT ARE NOT EVENLY SPREAD, which Baymard find on 83 per
          cent of the sites that use a slider, and which was true of ours: 89 of the 96 trips sat in
          the left half of the track and 37 of them inside about 26 pixels of it. The track is now
          mapped from the real spread of the trips, half-way between the plain scale and the
          distribution itself, so the crowded band gets room without the sparse top becoming jumpy.

       3. NO WAY TO TYPE A FIGURE. Baymard: a slider controlling a numeric filter "should always be
          accompanied by text input fields acting as a fallback". The two figures beside the track
          are now editable, and they are the precise route in for anyone who knows their budget.

       Also, more than half of their test subjects read a two-handle slider as a single control, so
       each handle now carries opposing arrows and is large enough to show them. Paul approved all
       three on 23 August. */
    var sliderSync = null;           // moves the handles to whatever the filter currently holds
    /* Track position (0-100) to price. Seven tenths of the position comes from where the price sits
       in the REAL spread of the trips and three tenths from the plain scale. All distribution and the
       sparse top of the range becomes unusably jumpy (7 trips would share half the price range in a
       twentieth of the track); all plain and the crowded band is 26 pixels wide, which is the fault
       Baymard name. The mix is strictly rising, because the plain part always is, so it inverts. */
    var SCALE_W = 0.7;
    function buildScale(prices) {
      var v = prices.slice().sort(function (a, b) { return a - b; });
      var MIN = Math.floor(v[0] / 1000) * 1000, MAX = Math.ceil(v[v.length - 1] / 1000) * 1000;
      if (MAX <= MIN) { console.error('inspiration hub: every trip is the same price, price facet not built'); return null; }
      // share of trips at or below v, interpolated between neighbours so the map has no steps in it
      function qpos(x) {
        var n = v.length;
        if (x <= v[0]) return 0;
        if (x >= v[n - 1]) return 100;
        var lo = 0, hi = n - 1;
        while (lo < hi) { var mid = (lo + hi) >> 1; if (v[mid] < x) lo = mid + 1; else hi = mid; }
        var a = v[lo - 1], b = v[lo];
        return ((lo - 1) + (b === a ? 0 : (x - a) / (b - a))) / (n - 1) * 100;
      }
      function pos(x) {
        x = Math.min(MAX, Math.max(MIN, x));
        return SCALE_W * qpos(x) + (1 - SCALE_W) * ((x - MIN) / (MAX - MIN) * 100);
      }
      // inverted by bisection: exact to a fraction of a dollar, long before the figure is rounded to $1,000
      function price(p) {
        var a = MIN, b = MAX;
        for (var k = 0; k < 40; k++) { var m = (a + b) / 2; if (pos(m) < p) a = m; else b = m; }
        return (a + b) / 2;
      }
      return { MIN: MIN, MAX: MAX, pos: pos, price: price };
    }
    function buildSlider(drop) {
      var prices = cards.map(function (c) { return +c.dataset.price; }).filter(function (n) { return n > 0; });
      if (!prices.length) { console.error('inspiration hub: no trip prices, price facet not built'); return; }
      var sc = buildScale(prices); if (!sc) return;
      var MIN = sc.MIN, MAX = sc.MAX;
      var STEP = 1000, GAP = 6;      // GAP: the handles never come closer than 6 per cent of the track
      var lo = MIN, hi = MAX;
      var panel = document.createElement('div'); panel.className = 'ihfpanel ihfpanel--price';
      var arrows = '<svg class="ihslider__hic" viewBox="0 0 16 10" aria-hidden="true"><path d="M6 1L2 5l4 4M10 1l4 4-4 4"/></svg>';
      panel.innerHTML =
        '<div class="ihslider">' +
        '<input type="text" inputmode="numeric" class="ihslider__val ihslider__min" aria-label="Lowest price">' +
        '<div class="ihslider__track" data-ih-slidertrack><div class="ihslider__back"></div><div class="ihslider__fill"></div>' +
        '<div class="ihslider__handle ihslider__handle--min" tabindex="0" role="slider" aria-label="Lowest price">' + arrows + '</div>' +
        '<div class="ihslider__handle ihslider__handle--max" tabindex="0" role="slider" aria-label="Highest price">' + arrows + '</div></div>' +
        '<input type="text" inputmode="numeric" class="ihslider__val ihslider__max" aria-label="Highest price">' +
        '</div><p class="ihslider__hint">Drag the handles, or type a figure</p>';
      drop.appendChild(panel);
      var track = panel.querySelector('[data-ih-slidertrack]');
      var fill = panel.querySelector('.ihslider__fill');
      var hMin = panel.querySelector('.ihslider__handle--min'), hMax = panel.querySelector('.ihslider__handle--max');
      var vMin = panel.querySelector('.ihslider__min'), vMax = panel.querySelector('.ihslider__max');
      function posToPrice(p) { return Math.round(sc.price(p) / STEP) * STEP; }
      function priceToPos(v) { return sc.pos(v); }
      function render() {
        var lp = priceToPos(lo), hp = priceToPos(hi);
        hMin.style.left = lp + '%'; hMax.style.left = hp + '%';
        fill.style.left = lp + '%'; fill.style.width = Math.max(0, hp - lp) + '%';
        vMin.value = money(lo); vMax.value = money(hi);
        [[hMin, lo], [hMax, hi]].forEach(function (pair) {
          pair[0].setAttribute('aria-valuemin', MIN); pair[0].setAttribute('aria-valuemax', MAX);
          pair[0].setAttribute('aria-valuenow', pair[1]); pair[0].setAttribute('aria-valuetext', money(pair[1]));
        });
      }
      // a handle resting on its end is NOT a filter, so no chip and no count appear for it
      function commit() { priceLo = lo <= MIN ? 0 : lo; priceHi = hi >= MAX ? Infinity : hi; applyFilter(); }
      // Reads the filter rather than being told: one call puts the handles back to the ends when the
      // price chip is removed AND moves them to a range restored from the last visit to this tab.
      sliderSync = function () {
        lo = priceLo > 0 ? Math.max(MIN, Math.min(priceLo, MAX)) : MIN;
        hi = priceHi < Infinity ? Math.min(MAX, Math.max(priceHi, MIN)) : MAX;
        if (hi <= lo) { lo = MIN; hi = MAX; }
        render();
      };
      render();
      // TYPED figures are the precise route in, and the fallback Baymard require. Anything unreadable
      // puts the real figure back rather than guessing at what was meant.
      function readBox(box, isMin) {
        var n = parseInt(String(box.value).replace(/[^\d]/g, ''), 10);
        if (!isFinite(n)) { render(); return; }
        n = Math.round(n / STEP) * STEP;
        if (isMin) lo = Math.max(MIN, Math.min(n, hi - STEP)); else hi = Math.min(MAX, Math.max(n, lo + STEP));
        render(); commit();
      }
      [[vMin, true], [vMax, false]].forEach(function (pair) {
        pair[0].addEventListener('change', function () { readBox(pair[0], pair[1]); });
        pair[0].addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); readBox(pair[0], pair[1]); } });
      });
      function drag(handle, isMin) {
        handle.addEventListener('pointerdown', function (e) {
          e.preventDefault(); e.stopPropagation();
          function move(ev) {
            var r = track.getBoundingClientRect();
            var pos = Math.min(100, Math.max(0, (ev.clientX - r.left) / r.width * 100));
            if (isMin) { pos = Math.max(0, Math.min(pos, priceToPos(hi) - GAP)); lo = Math.max(MIN, posToPrice(pos)); }
            else { pos = Math.min(100, Math.max(pos, priceToPos(lo) + GAP)); hi = Math.min(MAX, posToPrice(pos)); }
            render();
          }
          // filtering happens on release, not on every pixel of the drag: a pass can build cards
          function up() { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); commit(); }
          document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
        });
        // the handles take focus, so the range is reachable with arrow keys as well as a mouse
        handle.addEventListener('keydown', function (e) {
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowUp') ? STEP : ((e.key === 'ArrowLeft' || e.key === 'ArrowDown') ? -STEP : 0);
          if (!d) return;
          e.preventDefault(); e.stopPropagation();
          if (isMin) lo = Math.max(MIN, Math.min(lo + d, hi - STEP)); else hi = Math.min(MAX, Math.max(hi + d, lo + STEP));
          render(); commit();
        });
      }
      drag(hMin, true); drag(hMax, false);
    }

    arr(bar.querySelectorAll('.ihtrips__drop')).forEach(function (drop) {
      var label = drop.querySelector('.ihtrips__droplabel'); var key = label ? label.textContent.trim() : '';
      // Remember what Hugo wrote on the facet: the label is rewritten to carry the selection
      // ("Destination: Kenya") and has to be able to go back.
      if (label) label.dataset.base = key;
      if (key === 'Price (per person)') {
        buildSlider(drop);
      } else {
        var opts = IH_FILTER_OPTS[key] || [];
        var panel = document.createElement('div'); panel.className = 'ihfpanel ihfpanel--check';
        panel.innerHTML = opts.map(function (o) {
          var cnt = (key === 'Destination') ? cards.filter(function (c) { return (c.dataset.country || '').indexOf(o.toLowerCase()) !== -1; }).length : '';
          // The value is the option EXACTLY as written, matching the phone overlay. It used to be
          // lowercased here, which silently disabled the desktop Duration facet: durMatch compared
          // against 'Up to 7 days', never matched 'up to 7 days', fell through to "keep the card",
          // so ticking a duration on desktop filtered nothing (96 of 96, measured 2026-08-23).
          // data-facet lets one routine keep this panel and the phone overlay in step.
          return '<label class="ihfopt"><input type="checkbox" data-facet="' + key + '" value="' + o + '"><span>' + o + '</span>' + (cnt !== '' ? '<span class="ihfcount">' + cnt + '</span>' : '') + '</label>';
        }).join('');
        drop.appendChild(panel);
        panel.addEventListener('change', function (e) {
          selected[key] = arr(panel.querySelectorAll('input:checked')).map(function (i) { return i.value; });
          syncControls(); applyFilter();
        });
      }
      drop.addEventListener('click', function (e) {
        if (e.target.closest('.ihfpanel')) return;
        e.preventDefault();
        var willOpen = !drop.classList.contains('is-open');
        arr(bar.querySelectorAll('.ihtrips__drop')).forEach(function (d) { d.classList.remove('is-open'); d.setAttribute('aria-expanded', 'false'); });
        if (willOpen) { drop.classList.add('is-open'); drop.setAttribute('aria-expanded', 'true'); }
      });
    });
    function lc(a) { return a.map(function (s) { return s.toLowerCase(); }); }
    function durMatch(d, ranges) {
      if (!ranges.length) return true;
      return ranges.some(function (r) {
        // Matched case-insensitively so a value arriving in a different case from some future panel
        // cannot quietly disable the facet again, and an unrecognised range SAYS SO instead of
        // falling through to "everything matches", which is exactly how the last one hid.
        r = String(r).toLowerCase();
        if (r === 'up to 7 days') return d <= 7;
        if (r === '8 - 10 days') return d >= 8 && d <= 10;
        if (r === '11+ days') return d >= 11;
        console.error('inspiration hub: unknown duration range "' + r + '", not filtering on it');
        return true;
      });
    }
    function matches(c) {
      var dest = selected['Destination'] || [];
      // substring match: a multi-country trip ("kenya & uganda") matches either country
      if (dest.length && !lc(dest).some(function (d) { return (c.dataset.country || '').indexOf(d) !== -1; })) return false;
      var sty = selected['Private or group'] || [];
      if (sty.length && lc(sty).indexOf(c.dataset.style || '') === -1) return false;
      var pr = +c.dataset.price; if (pr < priceLo || pr > priceHi) return false;
      if (!durMatch(+c.dataset.days, selected['Duration'] || [])) return false;
      return true;
    }
    // "load more" paging: CAP cards visible at a time, the button reveals the next page.
    var CAP = 8, cap = CAP;
    var moreBtn = document.querySelector('[data-ih-loadmore]');
    function applyFilter() {
      var matched = cards.filter(matches);
      cards.forEach(function (c) { if (!c.pending) c.style.display = 'none'; });
      matched.forEach(function (c, i) { if (i < cap) { if (c.pending) c = materialise(cards.indexOf(c)); c.style.display = ''; } });
      var shown = Math.min(cap, matched.length);
      if (results) results.textContent = 'Showing ' + shown + ' of ' + matched.length + ' result' + (matched.length === 1 ? '' : 's');
      if (moreBtn) moreBtn.style.display = matched.length > cap ? '' : 'none';
      var ab = document.querySelector('[data-ihfo-apply]');
      if (ab) ab.textContent = 'Show ' + matched.length + ' trip' + (matched.length === 1 ? '' : 's');
      renderFilterState();
      saveState();
      return matched.length;
    }

    /* ---- APPLIED FILTERS: chips, facet labels and the active-filter count (2026-08-23) ----------
       Baymard #488 (desktop) and #2572 (mobile) both treat this as essential and it was the one real
       fault in the filter: the moment the panel closed, nothing on the page said what was on. Their
       benchmark also warns that 42 per cent of the sites that address it show the selection in ONE
       place, so every active choice now appears in THREE — a removable chip above the trips, the tick
       left in its panel, and the facet's own label. */
    var chipRow = document.querySelector('[data-ih-chips]');
    var fcount = ftoggle ? ftoggle.querySelector('[data-ih-fcount]') : null;
    // Chip labels for a price range are SHORT ("$10k to $20k", not "$10,000 - $20,000"): the row has
    // to wrap cleanly inside a 360px phone.
    function shortMoney(v) {
      if (v < 1000) return '$' + v;
      var k = v / 1000;
      return '$' + (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10) + 'k';
    }
    function priceLabel() {
      if (priceLo <= 0 && priceHi === Infinity) return '';
      if (priceLo <= 0) return 'Under ' + shortMoney(priceHi);
      if (priceHi === Infinity) return 'Over ' + shortMoney(priceLo);
      return shortMoney(priceLo) + ' to ' + shortMoney(priceHi);
    }
    // One entry per ACTIVE filter, in the order the facets sit in the bar. A price range counts as
    // one filter however wide it is, so the chip row and the count on the button can never disagree.
    function activeFilters() {
      var out = [];
      Object.keys(IH_FILTER_OPTS).forEach(function (key) {
        if (key === 'Price (per person)') { var p = priceLabel(); if (p) out.push({ facet: key, value: '', label: p }); return; }
        (selected[key] || []).forEach(function (v) { out.push({ facet: key, value: v, label: v }); });
      });
      return out;
    }
    function renderFilterState() {
      var live = activeFilters();
      if (chipRow) {
        if (!live.length) { chipRow.innerHTML = ''; chipRow.hidden = true; }
        else {
          chipRow.innerHTML = live.map(function (c) {
            return '<button type="button" class="ihchip" data-ih-chip data-facet="' + esc(c.facet) + '" data-value="' + esc(c.value) +
              '" aria-label="Remove ' + esc(c.label) + ' filter"><span class="ihchip__txt">' + esc(c.label) + '</span>' +
              '<svg class="ihchip__x" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg></button>';
          }).join('') + '<button type="button" class="ihchips__clear" data-ih-clearall>Clear all</button>';
          chipRow.hidden = false;
        }
      }
      // the facet's own label carries its selection: "Destination: Kenya", "Destination (2)"
      arr(bar.querySelectorAll('.ihtrips__drop')).forEach(function (drop) {
        var label = drop.querySelector('.ihtrips__droplabel'); if (!label) return;
        var base = label.dataset.base || label.textContent.trim();
        var txt = base, on = false;
        if (base === 'Price (per person)') { var p = priceLabel(); if (p) { txt = 'Price: ' + p; on = true; } }
        else {
          var vals = selected[base] || [];
          if (vals.length === 1) { txt = base + ': ' + vals[0]; on = true; }
          else if (vals.length > 1) { txt = base + ' (' + vals.length + ')'; on = true; }
        }
        if (label.textContent !== txt) label.textContent = txt;
        drop.classList.toggle('is-active', on);
      });
      // The phone's SHOW FILTERS button counts ACTIVE FILTERS. The button inside the panel counts
      // TRIPS ("Show 31 trips"), so the two numbers must not be readable as the same thing: this one
      // is a small gold pill, and the button says which it is in words for a screen reader.
      if (fcount) { fcount.textContent = live.length ? String(live.length) : ''; fcount.hidden = !live.length; }
      if (ftoggle) ftoggle.setAttribute('aria-label', live.length
        ? 'Show filters, ' + live.length + ' filter' + (live.length === 1 ? '' : 's') + ' active' : 'Show filters');
    }
    // Both the desktop panels and the phone overlay are in the document at all times, so a chip
    // removed at one width has to untick the box at the other. This is the single place that does it.
    function syncControls() {
      arr(document.querySelectorAll('input[data-facet]')).forEach(function (i) {
        var on = (selected[i.dataset.facet] || []).indexOf(i.value) !== -1;
        i.checked = on;
        var l = i.closest('.ihfopt, .ihfo__opt'); if (l) l.classList.toggle('is-sel', on);
      });
      arr(document.querySelectorAll('select[data-ihfo-price]')).forEach(function (s) {
        var want = s.dataset.ihfoPrice === 'min' ? (priceLo > 0 ? String(priceLo) : '') : (priceHi < Infinity ? String(priceHi) : '');
        // a figure the phone's ladder does not carry (the desktop slider steps in thousands) leaves
        // the select blank rather than showing a number it cannot represent
        s.value = arr(s.options).some(function (o) { return o.value === want; }) ? want : '';
      });
      if (sliderSync) sliderSync();
    }
    function clearAll() {
      selected = {}; priceLo = 0; priceHi = Infinity;
      syncControls(); applyFilter();
    }
    if (chipRow) chipRow.addEventListener('click', function (e) {
      if (e.target.closest('[data-ih-clearall]')) { clearAll(); return; }
      var chip = e.target.closest('[data-ih-chip]'); if (!chip) return;
      var f = chip.dataset.facet;
      if (f === 'Price (per person)') { priceLo = 0; priceHi = Infinity; }
      else selected[f] = (selected[f] || []).filter(function (v) { return v !== chip.dataset.value; });
      syncControls(); applyFilter();
      // the chip the keyboard was on has just gone, so put focus somewhere sensible
      var next = chipRow.querySelector('[data-ih-chip], [data-ih-clearall]');
      if (next) next.focus(); else if (ftoggle && ftoggle.offsetParent) ftoggle.focus();
    });

    /* ---- SORT (2026-08-23) --------------------------------------------------------------------
       Three orders: Recommended, which is what the server sent and is the showcase spread built in
       cbd_trip_cards_recommended, and the two price orders.

       The fiddly part is that the page does not hold all 96 cards. Eight are real markup and the
       rest wait in the JSON island as light stubs, each becoming a card at its canonical position
       the moment it is needed. So a re-order has to move BOTH: the real nodes are moved in the
       document, and the stubs are re-ordered in the same list, which is the list materialise()
       looks forward through to decide what a new card should sit in front of. Get one without the
       other and cards appear in the wrong place as they load. */
    var sortSel = document.querySelector('[data-ih-sort]');
    var baseOrder = cards.slice();      // the order the server sent = Recommended
    function priceOf(c) { return +(c.dataset.price || 0); }
    function applySort(mode) {
      var next = baseOrder.slice();
      if (mode === 'price-desc') next.sort(function (a, b) { return priceOf(b) - priceOf(a); });
      else if (mode === 'price-asc') next.sort(function (a, b) { return priceOf(a) - priceOf(b); });
      cards = next;
      // move the cards that already exist; the ones still waiting slot into the new order as they load
      cards.forEach(function (c) { if (!c.pending && c.parentNode === grid) grid.appendChild(c); });
      applyFilter();
    }
    if (sortSel) sortSel.addEventListener('change', function () { applySort(sortSel.value); });

    /* ---- A REPEAT VISIT MIXES THE OPENING UP (2026-08-23) --------------------------------------
       Paul: a returning visitor should not meet the same trips first every time.

       This does NOT happen on the server, and that is the whole point. One order is built there and
       every request gets it, so Cloudflare can cache the page and Google sees the same order on
       every crawl. The variation happens here in the browser, and only for someone the browser can
       tell has been before: a first visit, and every crawler, gets the server's order untouched.

       It ROTATES rather than re-sorts. The first 24 trips of the recommended order are the showcase
       band; they move round by eight, so a returning visitor meets a different eight of that same
       curated band, still alternating dear and cheap. The other 72 never move, and no trip ever
       leaves the band it was put in. Three variations, then it comes round again. */
    var SHOWCASE = 24, SHOWCASE_STEP = 8, rotated = false;
    var VISIT_GAP = 30 * 60 * 1000;   // a fresh visit means half an hour since the last one
    function visitOffset() {
      try {
        // Counted by the CLOCK, not by the tab. Counting per browser session sounds right and is
        // not: a second tab is a second session, so opening the hub twice at once gave two different
        // orders. Half an hour's gap is a visit; a reload, a second tab, or coming back from a trip
        // page five minutes later is the same visit and the page does not move under the reader.
        var now = new Date().getTime();
        var last = parseInt(localStorage.getItem('fitzroy-hub-last'), 10) || 0;
        var v = parseInt(localStorage.getItem('fitzroy-hub-visits'), 10) || 0;
        if (now - last > VISIT_GAP) {
          v += 1;
          localStorage.setItem('fitzroy-hub-visits', String(v));
          localStorage.setItem('fitzroy-hub-last', String(now));
        }
        return ((Math.max(1, v) - 1) % Math.floor(SHOWCASE / SHOWCASE_STEP)) * SHOWCASE_STEP;
      } catch (e) {
        // private browsing refuses storage. That is not a fault: it means no rotation, which is
        // exactly what a first-time visitor gets anyway.
        return 0;
      }
    }
    (function () {
      var off = visitOffset();
      if (!off || baseOrder.length < SHOWCASE) return;
      var block = baseOrder.slice(0, SHOWCASE);
      baseOrder = block.slice(off).concat(block.slice(0, off), baseOrder.slice(SHOWCASE));
      rotated = true;
    })();

    /* ---- REMEMBERING THE CHOICE FOR THIS TAB (2026-08-23) --------------------------------------
       Paul, 23 August: pick Uganda, open a trip, press back, and the choice has gone. On STAGING
       that is the no-store header added on 9 July so he never reviews a stale page, which is exactly
       what switches off the browser's back button cache; live does not send it and the choice does
       survive there (both measured). But that cache is an optimisation, not a promise, and browsers
       skip it for many ordinary reasons, so the choice is remembered here as well.

       sessionStorage, never the address bar: the URL does not change, so there is still one page for
       Google to crawl and one for Cloudflare to cache, and the memory dies with the tab. */
    var STORE = 'fitzroy-hub-state-v1', restoring = false;
    function saveState() {
      if (restoring) return;
      try {
        sessionStorage.setItem(STORE, JSON.stringify({ selected: selected, lo: priceLo,
          hi: priceHi === Infinity ? null : priceHi, sort: sortSel ? sortSel.value : 'recommended', cap: cap }));
      } catch (e) { console.error('inspiration hub: could not remember the filter for this tab', e); }
    }
    function restoreState() {
      var raw = null;
      try { raw = sessionStorage.getItem(STORE); }
      catch (e) { console.error('inspiration hub: could not read the remembered filter', e); return false; }
      if (!raw) return false;
      var st;
      try { st = JSON.parse(raw); }
      catch (e) { console.error('inspiration hub: the remembered filter was unreadable, starting fresh', e); return false; }
      if (!st || typeof st !== 'object') return false;
      restoring = true;
      selected = (st.selected && typeof st.selected === 'object') ? st.selected : {};
      priceLo = +st.lo || 0;
      priceHi = (st.hi === null || st.hi === undefined) ? Infinity : (+st.hi || Infinity);
      // the number of cards they had revealed, so pressing back does not undo their "load more"
      cap = Math.max(CAP, Math.min(+st.cap || CAP, cards.length));
      if (sortSel && st.sort) sortSel.value = st.sort;
      syncControls();
      restoring = false;
      return true;
    }

    if (moreBtn) moreBtn.addEventListener('click', function (e) { e.preventDefault(); cap += CAP; applyFilter(); });

    /* ---- full-screen filter overlay (mobile + tablet). SHOW FILTERS opens it; desktop keeps the
       inline dropdowns. Price is preset ranges (chips), not a slider (Baymard/NN-g, see research). */
    function buildOverlay() {
      var secs = Object.keys(IH_FILTER_OPTS).map(function (key) {
        var opts = IH_FILTER_OPTS[key], inner;
        if (key === 'Price (per person)') {
          var ladder = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
          var fmt = function (v) { return '$' + v.toLocaleString('en-US'); };
          var rungs = ladder.map(function (v) { return '<option value="' + v + '">' + fmt(v) + '</option>'; }).join('');
          inner = '<div class="ihfo__range">' +
            '<label class="ihfo__field"><span class="ihfo__fieldlbl">From</span>' +
              '<select class="ihfo__select" data-ihfo-price="min"><option value="">No minimum</option>' + rungs + '</select></label>' +
            '<label class="ihfo__field"><span class="ihfo__fieldlbl">To</span>' +
              '<select class="ihfo__select" data-ihfo-price="max">' + rungs + '<option value="" selected>No maximum</option></select></label>' +
            '</div>';
        } else {
          inner = '<div class="ihfo__opts">' + opts.map(function (o) {
            var cnt = (key === 'Destination') ? cards.filter(function (c) { return (c.dataset.country || '').indexOf(o.toLowerCase()) !== -1; }).length : '';
            return '<label class="ihfo__opt"><input type="checkbox" data-facet="' + key + '" value="' + o + '"><span>' + o + '</span>' + (cnt !== '' ? '<span class="ihfo__cnt">' + cnt + '</span>' : '') + '</label>';
          }).join('') + '</div>';
        }
        return '<div class="ihfo__sec"><h3 class="ihfo__sectitle">' + key + '</h3>' + inner + '</div>';
      }).join('');
      var ov = document.createElement('div'); ov.className = 'ihfo'; ov.setAttribute('aria-hidden', 'true');
      ov.innerHTML =
        '<div class="ihfo__scrim" data-ihfo-close></div>' +
        '<div class="ihfo__sheet" role="dialog" aria-modal="true" aria-label="Filter trips">' +
          '<div class="ihfo__head"><h2 class="ihfo__title">Filters</h2>' +
            '<button type="button" class="ihfo__close" data-ihfo-close aria-label="Close filters">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg></button></div>' +
          '<div class="ihfo__body">' + secs + '</div>' +
          '<div class="ihfo__foot"><button type="button" class="ihfo__clear" data-ihfo-clear>Clear all</button>' +
            '<button type="button" class="ihfo__apply" data-ihfo-apply>Show ' + cards.length + ' trips</button></div>' +
        '</div>';
      document.body.appendChild(ov);
      return ov;
    }
    var overlay = buildOverlay();
    function openOverlay() { overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; }
    /* Send focus back to the SHOW FILTERS button BEFORE the sheet is hidden. Whoever closes it has
       just pressed "Show 31 trips" or the x, so the focus is still on a control inside it, and
       hiding a focused element from assistive technology is the one thing aria-hidden must never
       do: Chrome refuses the attribute and logs "Blocked aria-hidden on an element because its
       descendant retained focus" (Paul saw it, 2026-08-23). Returning focus to the control that
       opened the sheet is also what a keyboard or screen-reader user expects: without it the next
       Tab starts again from the top of the page. */
    function closeOverlay() {
      if (overlay.contains(document.activeElement)) {
        if (ftoggle && ftoggle.focus) ftoggle.focus();
        else if (document.activeElement.blur) document.activeElement.blur();
      }
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    }
    if (ftoggle) ftoggle.addEventListener('click', openOverlay);
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-ihfo-close]') || e.target.closest('[data-ihfo-apply]')) { closeOverlay(); return; }
      // same routine as the chip row's Clear all, so the two can never drift apart
      if (e.target.closest('[data-ihfo-clear]')) { clearAll(); return; }
    });
    overlay.addEventListener('change', function (e) {
      if (e.target.matches('select[data-ihfo-price]')) {
        if (e.target.dataset.ihfoPrice === 'min') priceLo = e.target.value ? +e.target.value : 0;
        else priceHi = e.target.value ? +e.target.value : Infinity;
        applyFilter(); return;
      }
      if (!e.target.matches('input[type="checkbox"]')) return;
      var f = e.target.dataset.facet;
      selected[f] = arr(overlay.querySelectorAll('input[data-facet="' + f + '"]:checked')).map(function (i) { return i.value; });
      syncControls(); applyFilter();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay(); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-ih-filter]')) arr(bar.querySelectorAll('.ihtrips__drop')).forEach(function (d) { d.classList.remove('is-open'); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') arr(bar.querySelectorAll('.ihtrips__drop')).forEach(function (d) { d.classList.remove('is-open'); }); });

    // Everything is wired, so put back what this tab was last looking at, and apply the repeat-visit
    // rotation. The grid is only touched if one of the two actually changed something: a first-time
    // visitor, and every crawler, gets the page exactly as the server drew it, with no reshuffle.
    var restored = restoreState();
    if (restored || rotated) applySort(sortSel ? sortSel.value : 'recommended');
  }

  /* Home hero fire anchor (Paul, 2026-07-12). MOBILE ONLY: the campfire is the key part of the
     hero photo and must sit in the clear band below the copy block and above the fixed CTA bar
     at ANY phone viewport. Desktop/tablet compose fine by default (the clear area sits right of
     the text) and are left untouched. Plain object-position cannot do this: with object-fit:cover
     on a phone-shaped viewport the image's vertical placement is locked, so when a viewport
     demands it we zoom slightly beyond cover (capped at 1.35x to protect sharpness) to create
     the slack, then place the fire at the band's midpoint. Fire centroid in
     hero-mchenja-sq-2x.webp (same window as the original sq-1200 crop) measured mechanically: fraction (0.559, 0.815) of the image.
     No-JS fallback = the plain CSS cover. */
  /* Trip cards whose photos swipe: a native horizontal scroll-snap strip (real touch momentum)
     with overlaid prev/next arrows, extra slides hydrated just ahead of the finger. The photos are
     NOT inside the card's body link, so a swipe never navigates while a plain tap on the photo
     still opens the trip. Cards hidden by the hub's filter or "load more" are wired here too.
     TWO card types share this since 2026-08-22 (Paul: the trip page's cards "don't swipe with the
     thumb like they do on the cards in the inspiration hub"). The trip page's related cards used to
     hold ONE photo and swap its file on an arrow press, so a thumb had nothing to move. They now
     carry the same strip and run through the same code; only the class names differ, and the
     behaviour hooks (data-ihgal, data-ihprev, data-ihnext) are identical on both. */
  var CARD_GALLERY_HUB  = { media: '.ihcard__media', slide: '.ihcard__slide', nav: '.ihcard__nav' };
  var CARD_GALLERY_TRIP = { media: '.v2card__media', slide: '.v2card__slide', nav: '.v2card__imgnav' };
  function setupCardGalleries() {
    arr(document.querySelectorAll('.ihcard')).forEach(function (c) { wireCardGallery(c, CARD_GALLERY_HUB); });
    // Every .v2card row, not only the trip page's (Paul, 2026-08-23). .v2insp is the section class
    // on all four: the home page, the destinations hub, each country page and the trip page.
    arr(document.querySelectorAll('.v2insp .v2card')).forEach(function (c) { wireCardGallery(c, CARD_GALLERY_TRIP); });
  }
  // Wires ONE card (2026-08-16): setupCardGalleries walks the cards in the document at load; the
  // hub's card batching builds the rest later and calls this for each as it materialises.
  function wireCardGallery(card, opt) {
      opt = opt || CARD_GALLERY_HUB;
      if (card.__ihWired) return; card.__ihWired = true;
      var media = card.querySelector(opt.media);
      if (!media) return;
      var url = card.getAttribute('data-url');
      // Tapping the image opens the trip (the image is OUTSIDE the body link) — for every card,
      // single-photo ones included. A swipe/drag must NOT navigate, so only a genuine tap counts.
      var down = false, moved = false, sx = 0;
      media.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; }, { passive: true });
      media.addEventListener('pointermove', function (e) { if (down && Math.abs(e.clientX - sx) > 8) moved = true; }, { passive: true });
      media.addEventListener('pointerup', function () { down = false; }, { passive: true });
      media.addEventListener('pointercancel', function () { down = false; }, { passive: true });
      /* The photograph opens the trip by script, because it cannot be wrapped in a link without
         killing the swipe. That quietly broke three things people do without thinking: cmd-click,
         ctrl-click and middle-click to open a trip in a new tab, which is exactly how anyone
         compares safaris. Honour them (Paul, 2026-08-22). The card's TEXT is a real link, so
         search engines were never affected. */
      function openTrip(e) {
        // Only ever follow a real web address. Every url here is a WordPress permalink written by
        // esc_url() server-side, so this can only fire on a bug or a tampered-with page, but the
        // check costs nothing and a scheme like javascript: reaching window.open would run as this
        // page. Flagged by the security review 2026-08-22 as defence in depth; taken.
        if (!url || !/^https?:\/\//i.test(url)) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) { window.open(url, '_blank', 'noopener'); return; }
        window.location.href = url;
      }
      media.addEventListener('click', function (e) {
        if (e.target.closest(opt.nav)) return;          // arrows handle themselves
        if (moved) { e.preventDefault(); return; }       // that click ended a swipe
        openTrip(e);
      });
      media.addEventListener('auxclick', function (e) {  // middle button never fires a plain click
        if (e.button !== 1 || moved || e.target.closest(opt.nav)) return;
        e.preventDefault();
        openTrip(e);
      });
      media.style.cursor = 'pointer';                   // it navigates, so it must look like it does
      // Multi-photo cards also get the swipe gallery (arrows + counter + lazy slides).
      var gal = media.querySelector('[data-ihgal]');
      if (!gal) return;
      var slides = arr(gal.querySelectorAll(opt.slide));
      if (slides.length < 2) return;
      var cur = media.querySelector('[data-ihcur]');
      var prevBtn = media.querySelector('[data-ihprev]');
      var nextBtn = media.querySelector('[data-ihnext]');
      var n = slides.length;
      /* Slide loading (rewritten 2026-08-16, Paul: "there is a lag and it is affecting usability").
         Before: every slide beyond the first had NO src until the first arrow press, and that press
         set src on all 40 at once. So the photo the user asked for only STARTED downloading on the
         click (measured 391ms at 4G before it could paint) while its neighbours competed for the
         same bandwidth. Now: a slide is hydrated (src assigned, lazy hint removed so a horizontally
         off-screen image fetches at once) individually, one or two AHEAD of where the user is, and
         the first neighbours are warmed before any press: on hover for pointer devices, on entering
         the viewport for touch devices (no hover to lean on there). Same idea as the related-trip
         cyclers' preload from the 2026-08-15 tightness pass. */
      // Returns true when this call STARTED the download (the slide was cold), false when it was
      // already on its way or here. `then` runs once the photo has landed either way.
      function hydrate(i, priority, then) {
        i = ((i % n) + n) % n;
        var s = slides[i];
        if (!s.dataset.src) { if (then) { if (s.complete) then(); else s.addEventListener('load', then, { once: true }); } return false; }
        s.removeAttribute('loading');
        if (priority && 'fetchPriority' in s) s.fetchPriority = priority;
        if (then) s.addEventListener('load', then, { once: true });
        // Downloaded is not painted: the browser decodes a photo only when it first paints, and
        // an off-screen slide arriving mid-scroll pays that decode (10-30ms desktop, more on a
        // phone) exactly when the eye is on it. That was the last "very short lag" Paul saw on
        // fibre. Pre-decode as soon as the bytes land so the paint is immediate.
        if (s.decode) s.addEventListener('load', function () { s.decode().catch(function () {}); }, { once: true });
        // Responsive candidates come compact: data-alts holds the sibling files' "WxH" tokens
        // ("1080x675 1536x960 2048x1280"), expanded here against the src's own name so a 604px
        // card takes the 1080 file, not the 1350. srcset is set BEFORE src so the browser never
        // fetches the big one by mistake. The sizes hint sits once on the gallery (data-ihsizes).
        var u = s.dataset.src, alts = s.getAttribute('data-alts'), m = alts && /^(.*)-(\d+)x\d+(\.\w+)$/.exec(u);
        if (m) {
          var list = alts.split(' ').filter(Boolean).map(function (a) { return m[1] + '-' + a + m[3] + ' ' + a.split('x')[0] + 'w'; });
          list.push(u + ' ' + m[2] + 'w');
          s.sizes = gal.getAttribute('data-ihsizes') || '100vw';
          s.srcset = list.join(', ');
        }
        s.removeAttribute('data-alts');
        s.src = u; s.removeAttribute('data-src');
        return true;
      }
      // Look-ahead is a STAGGERED PARALLEL window, not a one-at-a-time chain. The chain measured
      // best on a low-bandwidth link, but Paul's phone showed the other regime: a 270ms round
      // trip (every dependent request in the access log landed 266-270ms after the one before),
      // where a chain costs a full round trip per photo and the old burst-everything was faster.
      // So: the next photo starts now; the two after it start 120ms later. On a long-latency link
      // the three overlap almost entirely and all land within about one round trip; on a thin
      // link the very next photo still gets a head start on the line. At the first photo the
      // "previous" one is the LAST slide (wrap), which nobody is about to ask for, so from the
      // start we look forward, not back. Save-Data: one ahead only.
      var lean = !!(navigator.connection && navigator.connection.saveData);
      var warmedAt = -1;
      function later(fn) { setTimeout(fn, 120); }
      function warm(i) {
        if (i === warmedAt) return; warmedAt = i;
        hydrate(i + 1, 'low');
        if (!lean) later(function () { hydrate(i + 2, 'low'); if (i > 0) hydrate(i - 1, 'low'); });
      }
      function ahead(i, d) {
        hydrate(i + d, 'low');
        if (!lean) later(function () { hydrate(i + 2 * d, 'low'); hydrate(i + 3 * d, 'low'); });
      }
      function index() { var w = gal.clientWidth || 1; return Math.max(0, Math.min(n - 1, Math.round(gal.scrollLeft / w))); }
      function updateCount() { if (cur) { var i = index() + 1; cur.textContent = (i < 10 ? '0' : '') + i; } }
      function goTo(i, d) {
        i = ((i % n) + n) % n;   // wrap at the ends
        // The one they asked for goes first and urgent. If it was already warm, the look-ahead
        // starts at once; if it was cold (no hover, card not yet seen) it gets the line to itself
        // and the look-ahead starts the moment it lands (a thin link measured 387ms vs 205ms when
        // three others started alongside a cold target).
        var cold = hydrate(i, 'high', function () { if (cold) ahead(i, d); });
        if (!cold) ahead(i, d);
        gal.scrollTo({ left: i * gal.clientWidth, behavior: ease() });
      }
      if (prevBtn) prevBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(index() - 1, -1); });
      if (nextBtn) nextBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(index() + 1, 1); });
      var raf = 0;
      gal.addEventListener('scroll', function () {
        warm(index());   // a native swipe keeps one slide ready either side as it goes
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; updateCount(); });
      }, { passive: true });
      // Warm the neighbours BEFORE any press. Hover and pointerdown give a head start on a mouse,
      // but a quick hand can beat a hover-to-click gap of under 100ms, and a swipe gives no
      // warning at all. So every device also warms a card as it comes on screen. NOT gated on
      // the window load event: on a phone that event arrived 15s in (it waits for every image on
      // the page), and until then nothing was warmed, so the first swipes fetched cold; that was
      // the "worse" Paul felt on 2026-08-16. The warm requests carry low priority, so the page's
      // own images still go first. Skipped when the visitor has asked to save data.
      media.addEventListener('pointerenter', function () { warm(index()); }, { passive: true });
      gal.addEventListener('pointerdown', function () { warm(index()); }, { passive: true });
      if ('IntersectionObserver' in window && !lean) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { warm(index()); io.disconnect(); } });
        }, { rootMargin: '0px' });
        io.observe(media);
      }
      updateCount();
  }

  /* setupV2CardGalleries (the trip page's src-swapping photo cycler, 2026-07-18) was RETIRED
     2026-08-22. It could never be swiped: the card is covered by a stretched link overlay and the
     photo area held a single <img>, so there was no scrolling strip for a thumb to move and the
     arrows were the only way through the photos. The cards now use the inspiration hub's real
     scroll-snap strip and go through wireCardGallery above, which is the same code the hub runs. */

  function setupHeroFireAnchor() {
    var img = document.querySelector('.v2hero__media img');
    var media = document.querySelector('.v2hero__media');
    if (!img || !media) return;
    var FIRE = { x: 0.559, y: 0.815 };
    var ZOOM_CAP = 1.6;   // only spent when a short viewport genuinely needs it; 0 zoom when cover already works
    function clear() {
      img.style.width = ''; img.style.height = ''; img.style.left = ''; img.style.top = '';
      img.style.maxWidth = ''; img.style.objectFit = '';
    }
    function position() {
      if (window.innerWidth >= 768 || (img.currentSrc || '').indexOf('hero-mchenja-sq') === -1 || !img.naturalWidth) { clear(); return; }
      var mr = media.getBoundingClientRect(), cw = mr.width, ch = mr.height;
      if (!cw || !ch) return;
      var copy = document.querySelector('.v2hero__copy');
      var cta = document.querySelector('.v2cta');
      var bandTop = copy ? (copy.getBoundingClientRect().bottom - mr.top) : ch * 0.55;
      var bandBottom = ch;
      if (cta) {
        var cr = cta.getBoundingClientRect();
        if (cr.height > 0 && cr.top - mr.top < ch) bandBottom = cr.top - mr.top;
      }
      if (bandBottom - bandTop < 60) { clear(); return; }   // no usable band; leave the CSS cover
      var lo = bandTop + 24, hi = bandBottom - 24;
      if (hi <= lo) { clear(); return; }
      // where the fire sits under plain CSS cover (object-position 50% 50%)
      var s0 = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      var dh0 = img.naturalHeight * s0;
      var fire0 = (ch - dh0) / 2 + FIRE.y * dh0;
      if (fire0 >= lo && fire0 <= hi) { clear(); return; }   // native cover already frames it — no zoom cost
      // minimal intervention: zoom just enough to move the fire to the nearest band edge
      var targetY = Math.min(Math.max(fire0, lo), hi), targetX = cw * 0.5;
      var needH = Math.max(ch, (ch - targetY) / (1 - FIRE.y), targetY / FIRE.y);
      var s = Math.min(Math.max(s0, needH / img.naturalHeight), s0 * ZOOM_CAP);
      var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      var ox = Math.min(0, Math.max(cw - dw, targetX - FIRE.x * dw));
      var oy = Math.min(0, Math.max(ch - dh, targetY - FIRE.y * dh));
      img.style.maxWidth = 'none'; img.style.objectFit = 'fill';
      img.style.width = Math.round(dw) + 'px'; img.style.height = Math.round(dh) + 'px';
      img.style.left = Math.round(ox) + 'px'; img.style.top = Math.round(oy) + 'px';
    }
    if (img.complete) position(); else img.addEventListener('load', position);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { position(); });
    window.addEventListener('resize', throttleRAF(position));
  }

  /* ============================================================== DEPARTURE DATES
   * The set-departure strip on group departure pages (.ttdep). Its own function rather than a
   * row in EMBLA_ROWS because it needs two behaviours that generic row does not have.
   *
   * 1. STEPS ONE DATE per click. Hugo's annotation on node 514:45326 offers two options and
   *    recommended paging a whole set at a time; Paul chose the other one after seeing it live
   *    (2026-07-31): "it should just move one date at a time, otherwise it is really hard to
   *    follow what is going on". That is Hugo's Option 2, "a familiar pattern (think train
   *    booking)", so this is picking between his documented options, not inventing a third.
   *
   * 2. NEVER SHOWS A PART CARD. The track is 1232px and a card step is 153px, so eight whole
   *    cards occupy 1225 and the ninth peeked 7px through the right edge (Paul: "it should
   *    either show a whole date or not at all"). The track is measured down to an exact whole
   *    number of cards on load and on resize, so the strip always ends on a card boundary.
   */
  function setupDepartureDates() {
    arr(document.querySelectorAll('.ttdep')).forEach(function (root) {
      var track = root.querySelector('.ttdep__cards');
      if (!track) return;
      var cards = arr(track.children);
      if (cards.length < 2) return;
      var bar = root.querySelector('.ttdep__pbar');
      var nums = arr(root.querySelectorAll('.ttdep__pnum'));
      var prev = root.querySelector('[data-ttdep-prev]');
      var next = root.querySelector('[data-ttdep-next]');

      track.style.overflowX = 'auto';
      track.style.scrollBehavior = ease();
      track.style.scrollbarWidth = 'none';
      track.style.webkitOverflowScrolling = 'touch';

      function cardStep() {
        return cards.length > 1
          ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
          : cards[0].getBoundingClientRect().width;
      }
      function cardWidth() { return cards[0].getBoundingClientRect().width; }

      // DESKTOP ONLY: trim the track to a whole number of cards so none is ever half-visible.
      // Below 1280 the strip deliberately BLEEDS past both edges, which is what Hugo's tablet
      // (813:126538) and mobile (721:83606) nodes do with their fixed 1232px track: running off
      // the screen is the signal there is more to scroll. Paul confirmed that reading 2026-07-31.
      // Measured against the PARENT's width, not the track's own, or each pass would shrink it.
      function fitWholeCards() {
        var s = cardStep(), w = cardWidth();
        if (s <= 0) return cards.length;
        if (!window.matchMedia('(min-width: 1280px)').matches) {
          track.style.width = '';                       // let the CSS bleed rule own it
          return Math.max(1, Math.round(track.clientWidth / s));
        }
        var avail = (track.parentNode ? track.parentNode.clientWidth : track.clientWidth);
        var n = Math.max(1, Math.min(cards.length, Math.floor((avail - (w - s)) / s)));
        track.style.width = (n === cards.length) ? '' : ((n - 1) * s + w) + 'px';
        return n;
      }
      var visible = cards.length;

      // One segment per STOP: with a one-card step there are (total - visible + 1) places the
      // strip can rest, which is 8 at the designed desktop width and matches the node's density.
      function stopCount() { return Math.max(1, cards.length - visible + 1); }
      function currentStop() {
        var s = cardStep();
        return s > 0 ? Math.round(track.scrollLeft / s) : 0;
      }

      var segs = [];
      function buildSegs() {
        if (!bar) return;
        var want = stopCount();
        if (segs.length === want) return;
        bar.innerHTML = '';
        segs = [];
        for (var i = 0; i < want; i++) {
          var s = document.createElement('span');
          s.className = 'ttdep__pseg';
          bar.appendChild(s);
          segs.push(s);
        }
        if (nums.length === 2) nums[1].textContent = ('0' + want).slice(-2);
      }

      function update() {
        visible = fitWholeCards();
        buildSegs();
        var stops = stopCount(), i = Math.max(0, Math.min(stops - 1, currentStop()));
        segs.forEach(function (s, si) { s.classList.toggle('is-on', si === i); });
        if (nums.length === 2) nums[0].textContent = ('0' + (i + 1)).slice(-2);
        var max = track.scrollWidth - track.clientWidth;
        if (prev) prev.disabled = track.scrollLeft <= 1;
        if (next) next.disabled = track.scrollLeft >= max - 1;
      }

      function go(dir) { track.scrollBy({ left: dir * cardStep(), behavior: ease() }); }
      if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); go(-1); });
      if (next) next.addEventListener('click', function (e) { e.preventDefault(); go(1); });

      track.addEventListener('scroll', throttleRAF(update), { passive: true });
      window.addEventListener('resize', throttleRAF(update));
      window.addEventListener('load', update);
      update();
    });
  }

  /* ============================================================ SCROLL-AWARE NAV
   * Hugo 2026-07-31 (Fitzroy-Nav-and-Anchor-Links spec). All pages, all breakpoints:
   * past the top of the page the nav pins itself (position:fixed + a spacer for the
   * in-flow .btnav so the layout never jumps); scrolling down ~90px from the last
   * direction change slides it up out of view; ANY scroll up brings it straight back.
   * 300ms ease-in-out both ways (the accordion easing convention, CSS in home-v2.css).
   * HOMEPAGE + ABOUT-US (the two navs that start transparent): Naked ONLY at scroll
   * position 0; the instant the page scrolls at all the nav crossfades to Light, and
   * fades back to Naked at exactly 0 (Hugo amendment v2 2026-07-31, replacing the
   * original hero-boundary rule in full — identical on both pages, eased both ways).
   * navScroll is shared state: setupAnchorLinks() reads it live for its sticky offset.
   */
  var navScroll = {
    el: null, fixed: false, hidden: false,
    height: function () { return this.el ? this.el.offsetHeight : 0; },
    visible: function () { return this.fixed && !this.hidden; }
  };
  function setupScrollNav() {
    var nav = document.querySelector('.btnav, .v2nav, .aunav');
    if (!nav) return;
    navScroll.el = nav;
    var inFlow = nav.classList.contains('btnav');   // .v2nav/.aunav are absolute over their heroes
    var spacer = null;
    // The overlay navs are authored INSIDE their hero/team section, and those sections are
    // isolation:isolate — a fixed child can never paint above later sections from inside
    // that stacking context (found by pixel-check 2026-07-31: the DOM said visible while
    // the rendered bar was buried). Move them to <body> ONCE at init: absolute top-0 in
    // <body> is the identical position, no selector depends on the old ancestry, and doing
    // it here (not per pin/unpin) means no mid-scroll DOM move ever kills a running
    // crossfade — the DOM-move-on-unpin was the About Us snap-back Hugo reported (v2).
    if (!inFlow && nav.parentNode !== document.body) document.body.appendChild(nav);
    var lastY = Math.max(0, window.scrollY), dirAnchor = lastY, lastDir = 0;
    var BUFFER = 90;   // Hugo: hide after ~80-100px of downward travel from the last direction change

    // toggle the state classes with the transition suppressed for one frame, so entering/
    // leaving fixed mode never animates (the positions coincide at the switch point)
    function instant(fn) { nav.classList.add('no-anim'); fn(); void nav.offsetHeight; nav.classList.remove('no-anim'); }

    function setFixed(on, startHidden) {
      if (navScroll.fixed === on) return;
      navScroll.fixed = on;
      if (on) {
        if (inFlow) {
          spacer = document.createElement('div');
          spacer.style.height = nav.offsetHeight + 'px';
          spacer.style.flex = '0 0 auto';               // .v2fold is a flex column
          spacer.setAttribute('aria-hidden', 'true');
          nav.parentNode.insertBefore(spacer, nav);
        }
        navScroll.hidden = !!startHidden;
        instant(function () { nav.classList.add('is-fixed'); nav.classList.toggle('is-up', !!startHidden); });
      } else {
        navScroll.hidden = false;
        instant(function () { nav.classList.remove('is-fixed', 'is-up'); });
        if (spacer && spacer.parentNode) { spacer.parentNode.removeChild(spacer); }
        spacer = null;
      }
    }
    function setHidden(on) {
      if (!navScroll.fixed || navScroll.hidden === on) return;
      navScroll.hidden = on;
      nav.classList.toggle('is-up', on);
    }
    function update() {
      var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var y = Math.max(0, Math.min(window.scrollY, maxY));   // clamp out rubber-band overscroll
      var dir = y > lastY ? 1 : (y < lastY ? -1 : 0);
      if (dir && dir !== lastDir) { dirAnchor = lastY; lastDir = dir; }
      if (y <= 2) {
        setFixed(false);            // back at the very top: return to the natural in-flow/absolute bar
      } else if (!navScroll.fixed && y > nav.offsetHeight + 8) {
        setFixed(true, true);       // scrolled clear of the natural bar: pin it, parked off-screen
      }
      if (navScroll.fixed) {
        if (dir < 0) setHidden(false);                                   // any scroll up: reveal
        else if (dir > 0 && y - dirAnchor > BUFFER) setHidden(true);     // sustained scroll down: hide
      }
      // Naked only at scroll position 0; Light the instant the page scrolls at all, fading
      // back at exactly 0. Identical on home + about-us; eased both ways by the CSS colour
      // transitions (Hugo amendment v2 2026-07-31 — supersedes the hero-boundary rule).
      if (!inFlow) nav.classList.toggle('is-light', y > 0);
      lastY = y;
    }
    window.addEventListener('scroll', throttleRAF(update), { passive: true });
    window.addEventListener('resize', throttleRAF(function () {
      if (spacer) spacer.style.height = nav.offsetHeight + 'px';
      update();
    }));
    update();
  }

  /* ========================================================= ANCHOR LINKS (STICKY)
   * Part 2 of the same spec. Desktop + tablet only (the component is display:none on
   * mobile). The bar floats 40px below the overview section's top edge (its 0-height
   * .ttanchor section never moves, so it is the position reference). Once the bar's
   * natural spot reaches the target offset it pins (position:fixed) — offset = nav
   * height + 24 while the nav is showing (106 desktop / 88 tablet), 24 while it is
   * hidden (gap 40 -> 24, Hugo amendment v2 2026-07-31) — reading navScroll LIVE, so a
   * nav reveal/hide glides the pinned bar
   * between the two offsets with the same 300ms ease (CSS top transition). At the
   * Our approach section the bar fades out for good (.is-away latch): unlike the nav
   * it does NOT come back on scroll-up; the latch only clears once the bar is back
   * in its natural in-flow spot above the trigger.
   */
  function setupAnchorLinks() {
    var sec = document.querySelector('.ttanchor');
    var bar = sec ? sec.querySelector('.ttanchor__bar') : null;
    if (!sec || !bar) return;
    var approach = document.querySelector('.v2approach');
    var mq = window.matchMedia('(min-width: 768px)');
    var GAP = 24;      // sticky-offset gap below the nav (was 40; Hugo amendment v2 2026-07-31)
    var STATIC_TOP = 40;   // the bar's NATURAL spot inside the section (node y=40 — NOT amended)
    var pinned = false;
    function offset() { return GAP + (navScroll.visible() ? navScroll.height() : 0); }
    function instant(fn) { bar.style.transition = 'none'; fn(); void bar.offsetHeight; bar.style.transition = ''; }
    function setPinned(on) {
      if (pinned === on) return;
      pinned = on;
      // suppress the top transition for the switch frame: absolute→fixed swaps coordinate
      // systems and top 40→122 would otherwise animate as a visible 82px slide
      instant(function () {
        bar.classList.toggle('is-pinned', on);
        bar.style.top = on ? offset() + 'px' : '';
      });
    }
    function update() {
      if (!mq.matches) { setPinned(false); bar.classList.remove('is-away'); return; }
      var off = offset();
      var naturalTop = sec.getBoundingClientRect().top + STATIC_TOP;   // where the bar sits un-pinned
      if (!pinned && naturalTop <= off) setPinned(true);
      else if (pinned && naturalTop > off) setPinned(false);
      if (pinned) bar.style.top = off + 'px';                   // eased by the CSS top transition
      if (approach && pinned && approach.getBoundingClientRect().top <= off + bar.offsetHeight) {
        bar.classList.add('is-away');                           // reached Our approach: gone for good
      } else if (!pinned) {
        bar.classList.remove('is-away');                        // back above its natural spot: reset
      }
    }
    window.addEventListener('scroll', throttleRAF(update), { passive: true });
    window.addEventListener('resize', throttleRAF(update));
    if (mq.addEventListener) mq.addEventListener('change', update);
    update();
  }

  /* ====================================================================== INIT */
  ready(function () {
    buildFixedCTA();
    setupHeroFireAnchor();
    CAROUSELS.forEach(setupCarousel);
    window.addEventListener('resize', throttleRAF(retryPendingCarousels));   // wire rows revealed by a resize
    EMBLA_ROWS.forEach(setupEmblaRow);
    ACCORDIONS.forEach(setupAccordion);
    setupInspEmbla();
    setupSharePopover();
    setupNav();
    lockScrollWhileMenuOpen();
    setupScrollNav();      // must run before setupAnchorLinks: its scroll listener registers
    setupAnchorLinks();    // first, so navScroll is fresh when the anchor offset reads it
    setupLightbox();
    setupMenuHistory();
    setupHeroStrip();
    setupDailyGallery();
    setupDepartureDates();
    setupFilters();
    setupCardGalleries();
  });
})();
