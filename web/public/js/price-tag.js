// Vysvětlivka cenové kategorie ($ .. $$$$$) — najetí myší na desktopu,
// klik/tap na mobilu. Panel se portáluje do <body> a pozicuje přes
// getBoundingClientRect, aby "unikl" z overflow:hidden karet/mapových
// popupů, ve kterých je .price-tag vnořená (viz CenaTag.astro).
(function () {
  var panel = null;
  var activeTrigger = null;

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'price-tag-panel';
    panel.setAttribute('role', 'tooltip');
    document.body.appendChild(panel);
    return panel;
  }

  function position(trigger) {
    var rect = trigger.getBoundingClientRect();
    var p = ensurePanel();
    var pw = p.offsetWidth;
    var ph = p.offsetHeight;
    var left = rect.left + rect.width / 2 - pw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    var top = rect.top - ph - 10;
    var placement = 'top';
    if (top < 12) {
      top = rect.bottom + 10;
      placement = 'bottom';
    }
    p.style.left = left + 'px';
    p.style.top = top + window.scrollY + 'px';
    p.dataset.placement = placement;
  }

  function open(trigger) {
    var wrap = trigger.closest('.price-tag-wrap');
    var tpl = wrap && wrap.querySelector('template');
    if (!tpl) return;
    var p = ensurePanel();
    p.innerHTML = '';
    p.appendChild(tpl.content.cloneNode(true));
    p.classList.add('is-open');
    activeTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    position(trigger);
  }

  function close() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
    activeTrigger = null;
  }

  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var t = e.target.closest && e.target.closest('.price-tag');
    if (t) open(t);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType === 'touch') return;
    var t = e.target.closest && e.target.closest('.price-tag');
    if (t) close();
  });
  document.addEventListener('focusin', function (e) {
    var t = e.target.closest && e.target.closest('.price-tag');
    if (t) open(t);
  });
  document.addEventListener('focusout', function (e) {
    var t = e.target.closest && e.target.closest('.price-tag');
    if (t) close();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.price-tag');
    if (t) {
      e.preventDefault();
      e.stopPropagation();
      if (activeTrigger === t) close();
      else open(t);
      return;
    }
    close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var t = document.activeElement && document.activeElement.closest && document.activeElement.closest('.price-tag');
      if (t) {
        e.preventDefault();
        if (activeTrigger === t) close();
        else open(t);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });
  window.addEventListener(
    'scroll',
    function () {
      if (activeTrigger) position(activeTrigger);
    },
    true
  );
  window.addEventListener('resize', function () {
    if (activeTrigger) position(activeTrigger);
  });
})();
