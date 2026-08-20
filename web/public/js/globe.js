/* Snail Travel — interactive globe
   D3 orthographic globe. Drag to rotate. Hover a continent → gold tint +
   floating label. Click → smooth-scroll to the continent's country grid.
   ============================================================ */
(function () {
  'use strict';

  const stage = document.getElementById('globe');
  const tooltip = document.getElementById('globeTooltip');
  if (!stage || !window.d3 || !window.topojson) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Continent labels + section anchors
  const CONT = {
    EU: { label: 'Evropa',                 anchor: '#kontinent-evropa'         },
    AF: { label: 'Afrika',                 anchor: '#kontinent-afrika'         },
    AS: { label: 'Asie',                   anchor: '#kontinent-asie'           },
    NA: { label: 'Střední a Severní Amerika', anchor: '#kontinent-amerika-sever' },
    SA: { label: 'Jižní Amerika',          anchor: '#kontinent-amerika-jih'    },
    OC: { label: 'Austrálie a Oceánie',    anchor: '#kontinent-australie'      }
  };

  // Country (Natural Earth "name" property) → continent code
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
    'Vanuatu':'OC'
  };

  // ---- Set up SVG + projection -----------------------------------------
  const SIZE = 640;
  const svg = d3.select(stage).append('svg')
    .attr('class', 'globe-svg')
    .attr('viewBox', `0 0 ${SIZE} ${SIZE}`)
    .attr('role', 'img');

  const defs = svg.append('defs');

  // Ocean gradient (very subtle for a light editorial feel)
  const oceanGrad = defs.append('radialGradient')
    .attr('id', 'oceanGrad').attr('cx', '35%').attr('cy', '35%').attr('r', '75%');
  oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#FFFFFF');
  oceanGrad.append('stop').attr('offset', '65%').attr('stop-color', '#F5EFE1');
  oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#E6DECF');

  // Soft outer glow
  const glow = defs.append('radialGradient')
    .attr('id', 'globeGlow').attr('cx', '50%').attr('cy', '50%').attr('r', '52%');
  glow.append('stop').attr('offset', '90%').attr('stop-color', 'rgba(189,154,69,0)');
  glow.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(189,154,69,0.28)');

  svg.append('circle')
    .attr('cx', SIZE / 2).attr('cy', SIZE / 2).attr('r', SIZE / 2 - 8)
    .attr('fill', 'url(#globeGlow)')
    .attr('class', 'globe-glow');

  const projection = d3.geoOrthographic()
    .scale(SIZE / 2 - 24)
    .translate([SIZE / 2, SIZE / 2])
    .clipAngle(90)
    .rotate([-15, -15, 0]);

  const path = d3.geoPath(projection);

  // Sphere (ocean)
  svg.append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'globe-sphere')
    .attr('d', path);

  // Graticule (subtle grid — barely there)
  svg.append('path')
    .datum(d3.geoGraticule10())
    .attr('class', 'globe-graticule')
    .attr('d', path);

  // Container for country / continent paths
  const gLand = svg.append('g').attr('class', 'globe-land');

  // ---- Load world atlas -------------------------------------------------
  const ATLAS = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

  fetch(ATLAS)
    .then(r => r.json())
    .then(topology => {
      const countries = topojson.feature(topology, topology.objects.countries).features;

      // tag each country with continent
      countries.forEach(f => {
        const name = f.properties && f.properties.name;
        f.__cont = COUNTRY[name] || null;
      });

      // draw
      const paths = gLand.selectAll('path')
        .data(countries)
        .join('path')
          .attr('class', 'globe-country')
          .attr('data-cont', d => d.__cont || '')
          .attr('d', path);

      // hover: highlight ALL countries in same continent
      paths
        .on('mouseenter', (event, d) => {
          if (!d.__cont) return;
          setActive(d.__cont);
          showTooltip(event, CONT[d.__cont].label);
          stage.classList.add('is-hover');
        })
        .on('mousemove', event => moveTooltip(event))
        .on('mouseleave', () => {
          setActive(null);
          hideTooltip();
          stage.classList.remove('is-hover');
        })
        .on('click', (event, d) => {
          if (didDrag) { didDrag = false; return; }
          if (!d.__cont) return;
          scrollToAnchor(CONT[d.__cont].anchor);
        });

      // remove loading placeholder
      const loading = stage.querySelector('.globe-loading');
      if (loading) loading.remove();

      startAutoRotate();
    })
    .catch(err => {
      console.error('Globe: failed to load atlas', err);
      const loading = stage.querySelector('.globe-loading');
      if (loading) loading.textContent = 'Nepodařilo se načíst mapu. Zkuste to prosím znovu.';
    });

  function scrollToAnchor(sel) {
    const target = document.querySelector(sel);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - 20;
    try {
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    } catch (_) {
      window.scrollTo(0, y);
    }
    // Update the hash so back-button works, but do not jump
    history.pushState(null, '', sel);
  }

  function setActive(cont) {
    gLand.selectAll('.globe-country')
      .classed('is-active', function () {
        return cont && this.getAttribute('data-cont') === cont;
      });
  }

  // ---- Tooltip (follows cursor, floats above it) -----------------------
  function showTooltip(event, text) {
    tooltip.textContent = text;
    tooltip.classList.add('is-visible');
    moveTooltip(event);
  }
  function moveTooltip(event) {
    const rect = stage.getBoundingClientRect();
    tooltip.style.left = (event.clientX - rect.left) + 'px';
    tooltip.style.top  = (event.clientY - rect.top)  + 'px';
  }
  function hideTooltip() {
    tooltip.classList.remove('is-visible');
  }

  // ---- Drag to rotate --------------------------------------------------
  let dragging = false;
  let didDrag = false;
  let lastP = null;
  let lastRot = null;

  function pointFromEvent(event) {
    const t = event.touches ? event.touches[0] : event;
    const rect = svg.node().getBoundingClientRect();
    // map screen → viewBox coords
    return [
      (t.clientX - rect.left) * SIZE / rect.width,
      (t.clientY - rect.top)  * SIZE / rect.height
    ];
  }

  function dragStart(event) {
    dragging = true;
    didDrag = false;
    stopAutoRotate();
    lastP = pointFromEvent(event);
    lastRot = projection.rotate();
    stage.classList.add('is-dragging');
  }
  function dragMove(event) {
    if (!dragging) return;
    const p = pointFromEvent(event);
    const dx = p[0] - lastP[0];
    const dy = p[1] - lastP[1];
    if (Math.abs(dx) + Math.abs(dy) > 3) didDrag = true;
    const k = 0.4; // sensitivity
    const rot = [
      lastRot[0] + dx * k,
      Math.max(-85, Math.min(85, lastRot[1] - dy * k)),
      lastRot[2]
    ];
    projection.rotate(rot);
    redraw();
    if (event.cancelable) event.preventDefault();
  }
  function dragEnd() {
    dragging = false;
    stage.classList.remove('is-dragging');
    // resume auto-rotate after brief pause
    clearTimeout(autoResumeT);
    autoResumeT = setTimeout(startAutoRotate, 3200);
  }

  svg.on('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove, { passive: false });
  window.addEventListener('mouseup', dragEnd);

  svg.on('touchstart', dragStart, { passive: true });
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('touchend', dragEnd);

  function redraw() {
    svg.select('.globe-sphere').attr('d', path);
    svg.select('.globe-graticule').attr('d', path);
    gLand.selectAll('.globe-country').attr('d', path);
  }

  // ---- Auto-rotate -----------------------------------------------------
  let autoT = 0, autoResumeT = 0;
  function startAutoRotate() {
    if (prefersReduced) return;
    stopAutoRotate();
    autoT = setInterval(() => {
      if (dragging || stage.classList.contains('is-hover')) return;
      const r = projection.rotate();
      projection.rotate([r[0] + 0.18, r[1], r[2]]);
      redraw();
    }, 33);
  }
  function stopAutoRotate() {
    if (autoT) { clearInterval(autoT); autoT = 0; }
  }
})();
