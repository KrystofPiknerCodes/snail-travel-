/* Snail Travel — PROTOTYP ploché mapy místo glóbusu (listopad 2026).
   Equal Earth projekce, celý svět najednou, nic se netočí ani netáhne
   (na mobilu neblokuje scroll). Zlatá tečka = destinace, kterou nabízíme
   (klik → rovnou detail země), větší tečka = vybraná destinace.
   Najetí na kontinent nebo na řádek kontinentů nad mapou zvýrazní kontinent.
   Data teček: window.__MAPA_BODY z prototyp-mapa.astro.
   ============================================================ */
(function () {
  'use strict';

  const stage = document.getElementById('worldMap');
  const tip = document.getElementById('worldMapTip');
  const chips = document.querySelectorAll('[data-map-cont]');
  const points = window.__MAPA_BODY || [];
  if (!stage || !window.d3 || !window.topojson) return;

  const CONT = {
    EU: { label: 'Evropa',                    anchor: 'destinace#kontinent-evropa' },
    AF: { label: 'Afrika',                    anchor: 'destinace#kontinent-afrika' },
    AS: { label: 'Asie',                      anchor: 'destinace#kontinent-asie' },
    NA: { label: 'Střední a Severní Amerika', anchor: 'destinace#kontinent-amerika-sever' },
    SA: { label: 'Jižní Amerika',             anchor: 'destinace#kontinent-amerika-jih' },
    OC: { label: 'Austrálie a Oceánie',       anchor: 'destinace#kontinent-australie' },
    AA: { label: 'Antarktida',                anchor: 'destinace#kontinent-antarktida' }
  };

  // Natural Earth název → kontinent (stejná tabulka jako v globe.js)
  const COUNTRY = {
    // Europe
    'Albania':'EU','Andorra':'EU','Austria':'EU','Belarus':'EU','Belgium':'EU','Bosnia and Herz.':'EU',
    'Bulgaria':'EU','Croatia':'EU','Cyprus':'EU','Czechia':'EU','Denmark':'EU','Estonia':'EU',
    'Faeroe Is.':'EU','Finland':'EU','France':'EU','Germany':'EU','Greece':'EU','Hungary':'EU',
    'Iceland':'EU','Ireland':'EU','Isle of Man':'EU','Italy':'EU','Kosovo':'EU','Latvia':'EU',
    'Liechtenstein':'EU','Lithuania':'EU','Luxembourg':'EU','Macedonia':'EU','North Macedonia':'EU',
    'Malta':'EU','Moldova':'EU','Monaco':'EU','Montenegro':'EU','Netherlands':'EU','Norway':'EU',
    'Poland':'EU','Portugal':'EU','Romania':'EU','Russia':'EU','San Marino':'EU','Serbia':'EU',
    'Slovakia':'EU','Slovenia':'EU','Spain':'EU','Sweden':'EU','Switzerland':'EU','Ukraine':'EU',
    'United Kingdom':'EU','Vatican':'EU','N. Cyprus':'EU',

    // Africa
    'Algeria':'AF','Angola':'AF','Benin':'AF','Botswana':'AF','Burkina Faso':'AF','Burundi':'AF',
    'Cabo Verde':'AF','Cameroon':'AF','Central African Rep.':'AF','Chad':'AF','Comoros':'AF',
    'Congo':'AF','Dem. Rep. Congo':'AF',"Côte d'Ivoire":'AF','Djibouti':'AF','Egypt':'AF',
    'Eq. Guinea':'AF','Eritrea':'AF','Ethiopia':'AF','eSwatini':'AF','Gabon':'AF','Gambia':'AF',
    'Ghana':'AF','Guinea':'AF','Guinea-Bissau':'AF','Kenya':'AF','Lesotho':'AF','Liberia':'AF',
    'Libya':'AF','Madagascar':'AF','Malawi':'AF','Mali':'AF','Mauritania':'AF','Mauritius':'AF',
    'Morocco':'AF','Mozambique':'AF','Namibia':'AF','Niger':'AF','Nigeria':'AF','Rwanda':'AF',
    'São Tomé and Principe':'AF','Senegal':'AF','Seychelles':'AF','Sierra Leone':'AF','Somalia':'AF',
    'Somaliland':'AF','South Africa':'AF','S. Sudan':'AF','Sudan':'AF','Swaziland':'AF','Tanzania':'AF',
    'Togo':'AF','Tunisia':'AF','Uganda':'AF','W. Sahara':'AF','Zambia':'AF','Zimbabwe':'AF',

    // Asia
    'Afghanistan':'AS','Armenia':'AS','Azerbaijan':'AS','Bahrain':'AS','Bangladesh':'AS','Bhutan':'AS',
    'Brunei':'AS','Cambodia':'AS','China':'AS','Georgia':'AS','India':'AS','Indonesia':'AS','Iran':'AS',
    'Iraq':'AS','Israel':'AS','Japan':'AS','Jordan':'AS','Kazakhstan':'AS','Kuwait':'AS','Kyrgyzstan':'AS',
    'Laos':'AS','Lebanon':'AS','Malaysia':'AS','Maldives':'AS','Mongolia':'AS','Myanmar':'AS','Nepal':'AS',
    'North Korea':'AS','Dem. Rep. Korea':'AS','Oman':'AS','Pakistan':'AS','Palestine':'AS','Philippines':'AS',
    'Qatar':'AS','Saudi Arabia':'AS','Singapore':'AS','South Korea':'AS','Korea':'AS','Sri Lanka':'AS',
    'Syria':'AS','Taiwan':'AS','Tajikistan':'AS','Thailand':'AS','Timor-Leste':'AS','Turkey':'AS',
    'Turkmenistan':'AS','United Arab Emirates':'AS','Uzbekistan':'AS','Vietnam':'AS','Yemen':'AS',

    // North & Central America + Caribbean
    'Antigua and Barb.':'NA','Aruba':'NA','Bahamas':'NA','Barbados':'NA','Belize':'NA','Canada':'NA',
    'Cayman Is.':'NA','Costa Rica':'NA','Cuba':'NA','Curaçao':'NA','Dominica':'NA','Dominican Rep.':'NA',
    'El Salvador':'NA','Greenland':'NA','Grenada':'NA','Guatemala':'NA','Haiti':'NA','Honduras':'NA',
    'Jamaica':'NA','Mexico':'NA','Nicaragua':'NA','Panama':'NA','Puerto Rico':'NA','Saint Lucia':'NA',
    'St. Vin. and Gren.':'NA','Trinidad and Tobago':'NA','Turks and Caicos Is.':'NA','U.S. Virgin Is.':'NA',
    'United States':'NA','United States of America':'NA','USA':'NA',

    // South America
    'Argentina':'SA','Bolivia':'SA','Brazil':'SA','Chile':'SA','Colombia':'SA','Ecuador':'SA',
    'Falkland Is.':'SA','French Guiana':'SA','Guyana':'SA','Paraguay':'SA','Peru':'SA','Suriname':'SA',
    'Uruguay':'SA','Venezuela':'SA',

    // Oceania
    'Australia':'OC','Fiji':'OC','French Polynesia':'OC','Kiribati':'OC','Marshall Is.':'OC',
    'Micronesia':'OC','N. Mariana Is.':'OC','Nauru':'OC','New Caledonia':'OC','New Zealand':'OC',
    'Palau':'OC','Papua New Guinea':'OC','Samoa':'OC','Solomon Is.':'OC','Tonga':'OC','Tuvalu':'OC',
    'Vanuatu':'OC',

    // Antarctica
    'Antarctica':'AA'
  };

  const W = 1200;
  const svg = d3.select(stage).append('svg')
    .attr('class', 'wmap-svg')
    .attr('role', 'group')
    .attr('aria-label', 'Mapa světa s destinacemi Snail Travel');

  const gLand = svg.append('g').attr('class', 'wmap-land');
  const gDots = svg.append('g').attr('class', 'wmap-dots');

  let activeCont = null;
  function setActive(cont) {
    activeCont = cont;
    gLand.selectAll('path').classed('is-active', d => !!cont && d.__cont === cont);
    gDots.selectAll('a').classed('is-dim', d => !!cont && d.kontinent !== cont);
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.mapCont === cont));
  }

  function showTip(html, x, y) {
    tip.innerHTML = html;
    const r = stage.getBoundingClientRect();
    tip.style.left = (x - r.left) + 'px';
    tip.style.top = (y - r.top) + 'px';
    tip.classList.add('is-visible');
  }
  function hideTip() { tip.classList.remove('is-visible'); }

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
    .then(r => r.json())
    .then(topology => {
      const all = topojson.feature(topology, topology.objects.countries).features;
      // Antarktida jen jako položka v řádku kontinentů — na mapě by zabrala
      // čtvrtinu výšky a nic tam nenabízíme kromě jedné cesty.
      const countries = all.filter(f => f.properties.name !== 'Antarctica');
      countries.forEach(f => { f.__cont = COUNTRY[f.properties.name] || null; });

      const fc = { type: 'FeatureCollection', features: countries };
      const projection = d3.geoEqualEarth().fitWidth(W - 20, fc);
      const path = d3.geoPath(projection);
      const b = path.bounds(fc);
      projection.translate([projection.translate()[0] + 10, projection.translate()[1] - b[0][1] + 10]);
      const H = Math.ceil(b[1][1] - b[0][1]) + 20;
      svg.attr('viewBox', `0 0 ${W} ${H}`);

      gLand.selectAll('path')
        .data(countries)
        .join('path')
          .attr('class', 'wmap-country')
          .attr('data-cont', d => d.__cont || '')
          .attr('d', path)
          .on('mouseenter', (event, d) => {
            if (!d.__cont) return;
            setActive(d.__cont);
            showTip(CONT[d.__cont].label, event.clientX, event.clientY);
          })
          .on('mousemove', (event, d) => { if (d.__cont) showTip(CONT[d.__cont].label, event.clientX, event.clientY); })
          .on('mouseleave', () => { setActive(null); hideTip(); })
          .on('click', (event, d) => { if (d.__cont) window.location.href = CONT[d.__cont].anchor; });

      // Tečky — vybrané navrch, ať je menší nepřekryjí
      const pts = points
        .map(p => Object.assign({}, p, { xy: projection([p.lng, p.lat]) }))
        .filter(p => p.xy && p.xy[1] >= 0 && p.xy[1] <= H)
        .sort((a, b) => (a.vybrana === b.vybrana ? 0 : a.vybrana ? 1 : -1));

      const dots = gDots.selectAll('a')
        .data(pts)
        .join('a')
          .attr('href', d => 'destinace/' + d.slug)
          .attr('class', d => 'wmap-dot' + (d.vybrana ? ' is-featured' : ''))
          .attr('aria-label', d => d.nazev)
          .attr('transform', d => `translate(${d.xy[0]},${d.xy[1]})`);
      dots.append('circle').attr('class', 'wmap-dot-hit');
      dots.append('circle').attr('class', 'wmap-dot-mark');

      function focusDot(event, d) {
        setActive(d.kontinent);
        const r = event.currentTarget.getBoundingClientRect();
        showTip(`<strong>${d.nazev}</strong><span>${CONT[d.kontinent] ? CONT[d.kontinent].label : ''}</span>`,
          r.left + r.width / 2, r.top);
      }
      dots
        .on('mouseenter', focusDot)
        .on('focus', focusDot)
        .on('mouseleave', () => { setActive(null); hideTip(); })
        .on('blur', () => { setActive(null); hideTip(); });

      // Velikost teček v obrazovkových px nezávisle na šířce mapy
      function sizeDots() {
        const k = W / stage.clientWidth;
        const small = stage.clientWidth < 600;
        gDots.selectAll('.wmap-dot-mark').attr('r', d => (d.vybrana ? (small ? 4 : 6) : (small ? 2.5 : 3.5)) * k);
        gDots.selectAll('.wmap-dot-hit').attr('r', d => (d.vybrana ? 12 : 8) * k);
      }
      sizeDots();
      window.addEventListener('resize', sizeDots, { passive: true });

      stage.classList.add('is-ready');
    })
    .catch(() => { stage.classList.add('is-failed'); });

  // Řádek kontinentů nad mapou: najetí zvýrazní kontinent na mapě
  chips.forEach(c => {
    const on = () => setActive(c.dataset.mapCont);
    const off = () => setActive(null);
    c.addEventListener('mouseenter', on);
    c.addEventListener('focus', on);
    c.addEventListener('mouseleave', off);
    c.addEventListener('blur', off);
  });
})();
