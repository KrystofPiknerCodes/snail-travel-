// Živé aktuální počasí v sekci "Kdy jet" — Open-Meteo (zdarma, bez klíče,
// CORS povolený i pro statické weby). Tichý fail: když se nepodaří stáhnout
// nebo souřadnice chybí, widget se prostě schová, ať tam nestraší "Načítám…".
(function () {
  var WMO_POPIS = {
    0: 'jasno',
    1: 'skoro jasno',
    2: 'polojasno',
    3: 'zataženo',
    45: 'mlha',
    48: 'mlha s jinovatkou',
    51: 'slabé mrholení',
    53: 'mrholení',
    55: 'vydatné mrholení',
    56: 'mrznoucí mrholení',
    57: 'mrznoucí mrholení',
    61: 'slabý déšť',
    63: 'déšť',
    65: 'vydatný déšť',
    66: 'mrznoucí déšť',
    67: 'mrznoucí déšť',
    71: 'slabé sněžení',
    73: 'sněžení',
    75: 'vydatné sněžení',
    77: 'sněhové zrno',
    80: 'přeháňky',
    81: 'přeháňky',
    82: 'silné přeháňky',
    85: 'sněhové přeháňky',
    86: 'sněhové přeháňky',
    95: 'bouřky',
    96: 'bouřky s kroupami',
    99: 'bouřky s kroupami',
  };

  function popis(code) {
    return WMO_POPIS[code] || 'proměnlivo';
  }

  function setup(el) {
    var lat = el.dataset.lat;
    var lng = el.dataset.lng;
    var textEl = el.querySelector('.live-weather-text');
    if (!lat || !lng || !textEl) {
      el.hidden = true;
      return;
    }
    var url =
      'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&current=temperature_2m,weather_code&timezone=auto';

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('weather request failed');
        return r.json();
      })
      .then(function (data) {
        var current = data && data.current;
        if (!current || typeof current.temperature_2m !== 'number') throw new Error('no data');
        var temp = Math.round(current.temperature_2m);
        textEl.textContent = 'Teď na ostrově: ' + temp + ' °C, ' + popis(current.weather_code);
        el.classList.add('is-loaded');
      })
      .catch(function () {
        el.hidden = true;
      });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-live-weather]')).forEach(setup);
})();
