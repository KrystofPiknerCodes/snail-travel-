// Živé aktuální počasí v sekci "Kdy jet" — MET Norway / Yr Locationforecast
// (zdarma i pro komerční použití na rozdíl od Open-Meteo, licence CC BY 4.0,
// viz jejich Terms of Service). Souřadnice se podle podmínek zaokrouhlují na
// max. 4 desetinná místa a výsledek se cachuje v localStorage na 10 minut,
// ať se stejná souřadnice nedotazuje při každém načtení stránky zvlášť.
// Tichý fail: když se nepodaří stáhnout nebo souřadnice chybí, widget se
// prostě schová, ať tam nestraší "Načítám…".
//
// Pozor: MET vyžaduje identifikační User-Agent hlavičku, tu ale fetch() z
// prohlížeče z bezpečnostních důvodů nastavit nejde (forbidden header) —
// posílá se tak výchozí UA prohlížeče. Při objemu provozu tohohle webu je
// riziko blokace prakticky nulové; pro 100% čistý soulad by bylo potřeba
// server-side proxy, což je mimo scope (web je čistá statika bez backendu).
(function () {
  var CACHE_PREFIX = 'live-weather:';
  var CACHE_TTL_MS = 10 * 60 * 1000;

  var SYMBOL_POPIS = {
    clearsky: 'jasno',
    fair: 'skoro jasno',
    partlycloudy: 'polojasno',
    cloudy: 'zataženo',
    fog: 'mlha',
    lightrain: 'slabý déšť',
    lightrainandthunder: 'slabý déšť s bouřkou',
    lightrainshowers: 'slabé přeháňky',
    lightrainshowersandthunder: 'slabé přeháňky s bouřkou',
    rain: 'déšť',
    rainandthunder: 'déšť s bouřkou',
    rainshowers: 'přeháňky',
    rainshowersandthunder: 'přeháňky s bouřkou',
    heavyrain: 'vydatný déšť',
    heavyrainandthunder: 'vydatný déšť s bouřkou',
    heavyrainshowers: 'vydatné přeháňky',
    heavyrainshowersandthunder: 'vydatné přeháňky s bouřkou',
    lightsleet: 'slabý déšť se sněhem',
    lightsleetandthunder: 'slabý déšť se sněhem a bouřkou',
    lightsleetshowers: 'slabé přeháňky se sněhem s deštěm',
    lightssleetshowersandthunder: 'slabé přeháňky se sněhem s deštěm a bouřkou',
    sleet: 'déšť se sněhem',
    sleetandthunder: 'déšť se sněhem a bouřkou',
    sleetshowers: 'přeháňky se sněhem s deštěm',
    sleetshowersandthunder: 'přeháňky se sněhem s deštěm a bouřkou',
    heavysleet: 'vydatný déšť se sněhem',
    heavysleetandthunder: 'vydatný déšť se sněhem a bouřkou',
    heavysleetshowers: 'vydatné přeháňky se sněhem s deštěm',
    heavysleetshowersandthunder: 'vydatné přeháňky se sněhem s deštěm a bouřkou',
    lightsnow: 'slabé sněžení',
    lightsnowandthunder: 'slabé sněžení s bouřkou',
    lightsnowshowers: 'slabé sněhové přeháňky',
    lightssnowshowersandthunder: 'slabé sněhové přeháňky s bouřkou',
    snow: 'sněžení',
    snowandthunder: 'sněžení s bouřkou',
    snowshowers: 'sněhové přeháňky',
    snowshowersandthunder: 'sněhové přeháňky s bouřkou',
    heavysnow: 'vydatné sněžení',
    heavysnowandthunder: 'vydatné sněžení s bouřkou',
    heavysnowshowers: 'vydatné sněhové přeháňky',
    heavysnowshowersandthunder: 'vydatné sněhové přeháňky s bouřkou',
  };

  function popis(symbolCode) {
    var base = (symbolCode || '').replace(/_(day|night|polartwilight)$/, '');
    return SYMBOL_POPIS[base] || 'proměnlivo';
  }

  function render(el, textEl, temp, symbolCode) {
    textEl.textContent = 'Teď na ostrově: ' + Math.round(temp) + ' °C, ' + popis(symbolCode);
    el.classList.add('is-loaded');
  }

  function setup(el) {
    var lat = el.dataset.lat;
    var lng = el.dataset.lng;
    var textEl = el.querySelector('.live-weather-text');
    if (!lat || !lng || !textEl) {
      el.hidden = true;
      return;
    }
    var latR = Number(lat).toFixed(4);
    var lngR = Number(lng).toFixed(4);
    var cacheKey = CACHE_PREFIX + latR + ',' + lngR;

    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        render(el, textEl, cached.temp, cached.symbol);
        return;
      }
    } catch (e) {}

    var url =
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + latR + '&lon=' + lngR;

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('weather request failed');
        return r.json();
      })
      .then(function (data) {
        var ts = data && data.properties && data.properties.timeseries && data.properties.timeseries[0];
        var details = ts && ts.data && ts.data.instant && ts.data.instant.details;
        var next1h = ts && ts.data.next_1_hours;
        var next6h = ts && ts.data.next_6_hours;
        var symbol =
          (next1h && next1h.summary && next1h.summary.symbol_code) ||
          (next6h && next6h.summary && next6h.summary.symbol_code);
        if (!details || typeof details.air_temperature !== 'number') throw new Error('no data');
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ at: Date.now(), temp: details.air_temperature, symbol: symbol })
          );
        } catch (e) {}
        render(el, textEl, details.air_temperature, symbol);
      })
      .catch(function () {
        el.hidden = true;
      });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-live-weather]')).forEach(setup);
})();
