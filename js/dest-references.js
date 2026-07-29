/* Snail Travel — detail destinace (destinace/<slug>.html)
   Vyrenderuje pár reálných klientských referencí k dané destinaci přímo na
   stránku, aby návštěvník nemusel za důkazem chodit na reference.html.

   Data: window.SNAIL_REF_QUOTES (js/ref-quotes.js) — generovaný výtah, max
   3 reference na destinaci. Plný archiv (221 kusů) zůstává na reference.html.

   Očekávaný markup (viz destinace/seychely.html):
     <section class="ref-inline" data-dest="Seychely" data-root="../">
       <div class="ref-grid" data-ref-grid></div>
       <a data-ref-all>…</a>
     </section>
   Když k destinaci reference nejsou, sekce se skryje. */
(function () {
  'use strict';

  var QUOTES = window.SNAIL_REF_QUOTES || {};
  var CLAMP_CHARS = 420; // stejný práh jako v js/references.js

  Array.prototype.forEach.call(document.querySelectorAll('[data-dest]'), function (section) {
    var tag = section.dataset.dest;
    var root = section.dataset.root || '';
    var grid = section.querySelector('[data-ref-grid]');
    var items = QUOTES[tag];

    if (!grid || !items || !items.length) {
      section.hidden = true;
      return;
    }

    items.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'ref-card';

      var total = item.t.join(' ').length;
      var clampable = total > CLAMP_CHARS;
      if (clampable) card.classList.add('is-clampable');

      var head = document.createElement('div');
      head.className = 'ref-card-head';
      var tagsEl = document.createElement('span');
      tagsEl.className = 'ref-card-tags';
      tagsEl.textContent = tag;
      var dateEl = document.createElement('span');
      dateEl.className = 'ref-card-date';
      dateEl.textContent = item.d;
      head.appendChild(tagsEl);
      head.appendChild(dateEl);

      var textEl = document.createElement('div');
      textEl.className = 'ref-card-text';
      item.t.forEach(function (para) {
        var p = document.createElement('p');
        p.textContent = para;
        textEl.appendChild(p);
      });

      card.appendChild(head);
      card.appendChild(textEl);

      if (clampable) {
        var more = document.createElement('button');
        more.type = 'button';
        more.className = 'ref-card-more';
        more.textContent = 'Zobrazit celý text';
        more.addEventListener('click', function () {
          var open = card.classList.toggle('is-open');
          more.textContent = open ? 'Skrýt' : 'Zobrazit celý text';
        });
        card.appendChild(more);
      }

      grid.appendChild(card);
    });

    var allLink = section.querySelector('[data-ref-all]');
    if (allLink) {
      allLink.href = root + 'reference.html?dest=' + encodeURIComponent(tag);
    }
  });
})();
