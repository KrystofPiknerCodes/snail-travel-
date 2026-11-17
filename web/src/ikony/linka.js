// Snail Travel — tenké linkové piktogramy s animací při najetí.
// Styl: linka 1.5 (currentColor = zlatá), kulaté konce, jemná světle zlatá výplň
// hlavního tvaru (14 % currentColor). Mřížka 24×24, tvary z kruhů/oblouků/obdélníků.
// Formát { name, markup, target(hover), draw(p, E) } je stejný jako u Kubai Icons,
// takže je pohání stejný runtime (animate/bindTrigger z balíčku kubai-icons):
// dvě sady klíčových hodnot (klid / hover), 460 ms, každý pohyb na konci plynule
// zastaví (hodnoty odvozené z o = 0→1 tak, aby rychlost na konci byla 0).

const f = (n) => +n.toFixed(3);
const SOFT = 'fill="currentColor" fill-opacity="0.14"';
const L = 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
const set = (el, a) => { if (el) for (const k in a) el.setAttribute(k, a[k]); };
const rot = (a, cx, cy) => `rotate(${f(a)} ${cx} ${cy})`;
// tlumený kmit: 0 na začátku i na konci, na konci nulová rychlost
const rattle = (o, k = 3) => (1 - o) * (1 - o) * Math.sin(k * Math.PI * o);
// jeden pulz tam a zpět, na obou koncích nulová rychlost
const bump = (o) => Math.sin(Math.PI * o) ** 2;

const icon = (name, markup, target, draw) => ({ name, markup: `<g fill="none" ${L}>${markup}</g>`, tap: false, target, draw });
const O = (h) => ({ o: h ? 1 : 0 });

export const LINKA = [
  // Lupa: sklo se „rozhlédne“ doleva-doprava a zastaví se.
  icon('magnifier',
    `<g data-n="g"><circle cx="10.5" cy="10.5" r="6.5" ${SOFT}/><path d="M15.3 15.3 L20 20"/></g>`,
    O, (p, E) => set(E.g, { transform: `translate(${f(2.2 * rattle(p.o, 2))} 0)` })),

  // Telefon: sluchátko zazvoní (zakmitá) a objeví se dvě vlnky.
  icon('phone',
    `<g data-n="h"><path d="M6.6 3.5h2.6l1.4 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" ${SOFT}/></g>
     <g data-n="w" opacity="0"><path d="M15 3.6a5.8 5.8 0 0 1 5.4 5.4"/><path d="M15 7a2.6 2.6 0 0 1 2 2"/></g>`,
    O, (p, E) => { set(E.h, { transform: rot(12 * rattle(p.o, 4), 12, 12) }); set(E.w, { opacity: f(p.o) }); }),

  // Obálka: chlopeň se zvedne a obálka se otevře.
  icon('mail',
    `<rect x="3" y="5.5" width="18" height="13" rx="2" ${SOFT}/><path data-n="flap" d="M3.6 6.8 L12 12.8 L20.4 6.8"/>`,
    O, (p, E) => { const y = 12.8 - 10.3 * p.o; set(E.flap, { d: `M3.6 6.8 L12 ${f(y)} L20.4 6.8` }); }),

  // Kompas: střelka se jednou otočí dokola a zastaví na severu.
  icon('compass',
    `<circle cx="12" cy="12" r="9" ${SOFT}/><g data-n="n"><path d="M15.2 8.8 L13.2 13.2 L8.8 15.2 L10.8 10.8 Z"/></g>`,
    O, (p, E) => set(E.n, { transform: rot(360 * p.o, 12, 12) })),

  // Špendlík: vyskočí nahoru a dopadne zpět, stín pod ním se zmenší.
  icon('map-pin',
    `<ellipse data-n="s" cx="12" cy="21" rx="3.2" ry="0.9"/>
     <g data-n="p"><path d="M12 19c-3.8-4.2-6.5-7.4-6.5-10.3a6.5 6.5 0 0 1 13 0c0 2.9-2.7 6.1-6.5 10.3z" ${SOFT}/><circle cx="12" cy="8.7" r="2.4"/></g>`,
    O, (p, E) => { const b = bump(p.o); set(E.p, { transform: `translate(0 ${f(-3 * b)})` }); set(E.s, { rx: f(3.2 - 1.2 * b) }); }),

  // Visací zámek (Soukromí): třmen se zvedne a zámek se odemkne.
  icon('lock',
    `<path data-n="t" d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5"/><rect x="5.5" y="10.5" width="13" height="10" rx="2" ${SOFT}/><path d="M12 14.6 V16.6"/>`,
    O, (p, E) => { const y = -2.6 * p.o; set(E.t, { transform: `translate(0 ${f(y)})`, d: `M8 ${f(10.5 - y)} V7.5 a4 4 0 0 1 8 0 V10.5` }); }),

  // Přesýpací hodiny: otočí se o 180° (přesypou se).
  icon('hourglass',
    `<g data-n="h"><path d="M6.5 3.5h11 M6.5 20.5h11"/><path d="M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5h9c0-4.5-4.5-5.5-4.5-8.5s4.5-4 4.5-8.5" ${SOFT}/><path d="M10 18.2 L12 16.6 L14 18.2 Z" fill="currentColor"/></g>`,
    O, (p, E) => set(E.h, { transform: rot(180 * p.o, 12, 12) })),

  // Bublina chatu: tři tečky postupně poskočí.
  icon('message-circle',
    `<path d="M12 4.5c4.4 0 8 2.9 8 6.6s-3.6 6.6-8 6.6c-1 0-2-.1-2.9-.4L5 19l1.2-3.4C4.8 14.4 4 12.8 4 11.1 4 7.4 7.6 4.5 12 4.5z" ${SOFT}/>
     <circle data-n="d0" cx="8.6" cy="11.2" r="0.7" fill="currentColor"/><circle data-n="d1" cx="12" cy="11.2" r="0.7" fill="currentColor"/><circle data-n="d2" cx="15.4" cy="11.2" r="0.7" fill="currentColor"/>`,
    O, (p, E) => { for (let i = 0; i < 3; i++) { const t = Math.min(1, Math.max(0, (p.o - i * 0.15) / 0.7)); set(E['d' + i], { transform: `translate(0 ${f(-1.8 * bump(t))})` }); } }),

  // Zavřít: křížek se otočí o čtvrt otáčky.
  icon('circle-x',
    `<circle cx="12" cy="12" r="9" ${SOFT}/><g data-n="x"><path d="M9.2 9.2l5.6 5.6 M14.8 9.2l-5.6 5.6"/></g>`,
    O, (p, E) => set(E.x, { transform: rot(90 * p.o, 12, 12) })),

  // Dokument: list se nadzvedne a pootočí, jako když ho berete do ruky.
  icon('file-text',
    `<g data-n="d"><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" ${SOFT}/><path d="M14 3.5V8h4.5"/><path d="M8.8 12.2h6.4 M8.8 15.6h4.4"/></g>`,
    O, (p, E) => set(E.d, { transform: `translate(0 ${f(-1.4 * p.o)}) ${rot(-5 * p.o, 12, 20.5)}` })),

  // Pohovka: polštáře se při „usednutí“ promáčknou a vrátí.
  icon('sofa',
    `<g data-n="s"><path d="M5.5 11V8.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V11"/><path d="M3.5 12.5a1.5 1.5 0 0 1 3 0v1h11v-1a1.5 1.5 0 0 1 3 0v4.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" ${SOFT}/></g><path d="M6 18v1.8 M18 18v1.8"/>`,
    O, (p, E) => { const b = bump(p.o); set(E.s, { transform: `translate(12 18) scale(${f(1 + 0.04 * b)} ${f(1 - 0.08 * b)}) translate(-12 -18)` }); }),

  // Letecká doprava: papírové letadlo vyletí šikmo nahoru a vrátí se.
  icon('plane',
    `<g data-n="p"><path d="M20.5 3.5 L3.5 10.6 L10.2 13.8 L13.4 20.5 Z" ${SOFT}/><path d="M20.5 3.5 L10.2 13.8"/></g>`,
    O, (p, E) => { const b = bump(p.o); set(E.p, { transform: `translate(${f(2.6 * b)} ${f(-2.6 * b)})` }); }),

  // Auto: při rozjezdu se karoserie zhoupne na pérování.
  icon('car',
    `<g data-n="b"><path d="M8.6 10.5 L10.1 8 H14.2 L16 10.5 Z" ${SOFT}/><path d="M5.6 16.5H4V13a2 2 0 0 1 1.4-1.9l2.1-.6 1.8-3.1A2 2 0 0 1 11 6.5h3.4a2 2 0 0 1 1.6.8l2.4 3.2 1.3.4A2 2 0 0 1 21 12.8v3.7h-2.1 M9.4 16.5h5.7"/></g>
     <circle cx="7.5" cy="16.5" r="1.9"/><circle cx="17" cy="16.5" r="1.9"/>`,
    O, (p, E) => set(E.b, { transform: `translate(0 ${f(-0.9 * Math.abs(rattle(p.o, 3)))})` })),

  // Privátní lety: tryskáč nabere výšku nad dráhou.
  icon('plane-takeoff',
    `<g data-n="p"><g transform="rotate(-18 12 12) translate(0 -1.5)"><rect x="4" y="10.6" width="16" height="2.8" rx="1.4" ${SOFT}/><path d="M10.5 10.6 L8.2 6 H9.9 L13.8 10.6 M10.5 13.4 L8.2 18 H9.9 L13.8 13.4 M5.6 10.6 L4.4 7.6 H5.8 L7.6 10.6"/></g></g><path d="M3 20.5h18"/>`,
    O, (p, E) => set(E.p, { transform: `translate(${f(1.2 * p.o)} ${f(-1.8 * p.o)}) ${rot(-6 * p.o, 12, 12)}` })),

  // Hotel: okna se postupně rozsvítí.
  icon('hotel',
    `<rect x="5" y="3.5" width="14" height="17" rx="1.5" ${SOFT}/><path d="M10.5 20.5V17h3v3.5"/>
     ${[[8.4, 6.6], [13.6, 6.6], [8.4, 10.2], [13.6, 10.2], [8.4, 13.8], [13.6, 13.8]].map(([x, y], i) => `<rect data-n="w${i}" x="${x - 0.5}" y="${y - 0.5}" width="2.6" height="2" rx="0.4" fill="currentColor" fill-opacity="0"/>`).join('')}`,
    O, (p, E) => { for (let i = 0; i < 6; i++) { const t = Math.min(1, Math.max(0, (p.o - i * 0.08) / 0.6)); set(E['w' + i], { 'fill-opacity': f(0.55 * t) }); } }),

  // Postel: polštář se načechrá.
  icon('bed',
    `<path d="M3 6.5V19 M21 19v-5H3"/><path d="M11.5 14v-2.5a1 1 0 0 1 1-1H20a1 1 0 0 1 1 1V14" ${SOFT}/><rect data-n="pl" x="5" y="10.2" width="4.6" height="3.8" rx="1.3" ${SOFT}/>`,
    O, (p, E) => { const s = 1 + 0.16 * bump(p.o); set(E.pl, { transform: `translate(7.3 12.1) scale(${f(s)}) translate(-7.3 -12.1)` }); }),

  // Stravování: vidlička a nůž se rozevřou jako při prostírání.
  icon('utensils',
    `<g data-n="fk"><path d="M7 3v5 M9 3v5 M11 3v5 M7 8a2 2 0 0 0 4 0 M9 10v10.5"/></g>
     <g data-n="kn"><path d="M17 20.5V3.5c-2 1.2-3 3.4-3 6.3v3.7h3" ${SOFT}/></g>`,
    O, (p, E) => { set(E.fk, { transform: rot(-9 * p.o, 9, 20.5) }); set(E.kn, { transform: rot(9 * p.o, 17, 20.5) }); }),

  // Pláž: slunečník se zhoupne ve větru.
  icon('beach-umbrella',
    `<g data-n="u"><path d="M3.5 11a8.5 8.5 0 0 1 17 0 Q18.4 9.6 16.25 11 Q14.1 9.6 12 11 Q9.9 9.6 7.75 11 Q5.6 9.6 3.5 11z" ${SOFT}/><path d="M12 11v8.5"/></g>
     <path d="M6 20.5c2-1.2 4-1.2 6 0s4 1.2 6 0"/>`,
    O, (p, E) => set(E.u, { transform: rot(9 * rattle(p.o, 3), 12, 19.5) })),

  // Sport: činka se zvedne a položí.
  icon('dumbbell',
    `<g data-n="d"><path d="M7 12h10 M2.5 10.5v3 M21.5 10.5v3"/><rect x="4" y="8" width="3" height="8" rx="1" ${SOFT}/><rect x="17" y="8" width="3" height="8" rx="1" ${SOFT}/></g>`,
    O, (p, E) => set(E.d, { transform: `translate(0 ${f(-2.6 * bump(p.o))})` })),

  // All inclusive: sklenka si „ťukne“ (zakmitá).
  icon('cocktail',
    `<g data-n="g"><path d="M5 5h14L12 13z" ${SOFT}/><path d="M12 13v6.5 M8.5 20.5h7 M13.6 8.2 L17.4 3"/><circle cx="15.6" cy="5.6" r="1.2"/></g>`,
    O, (p, E) => set(E.g, { transform: rot(11 * rattle(p.o, 2), 12, 20.5) })),

  // Wellness: kapka dopadne — zploští se a vrátí do tvaru.
  icon('droplet',
    `<g data-n="d"><path d="M12 3.5c3.8 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.2-6.4 6-11z" ${SOFT}/><path d="M9.4 15a2.7 2.7 0 0 0 2.3 2.6"/></g>`,
    O, (p, E) => { const b = bump(p.o); set(E.d, { transform: `translate(12 20.5) scale(${f(1 + 0.1 * b)} ${f(1 - 0.1 * b)}) translate(-12 -20.5)` }); }),

  // Golf: vlajka zavlaje a míček se dokutálí k jamce.
  icon('golf-flag',
    `<path d="M9 19.6V3.5"/><g data-n="fl"><path d="M9 3.8 L17 6.8 L9 9.8z" ${SOFT}/></g><ellipse cx="9" cy="19.8" rx="4" ry="1.1"/><circle data-n="b" cx="17" cy="18.6" r="1.2"/>`,
    O, (p, E) => { set(E.fl, { transform: `translate(9 6.8) skewY(${f(10 * rattle(p.o, 3))}) translate(-9 -6.8)` }); set(E.b, { transform: `translate(${f(-3.4 * p.o)} 0)` }); }),

  // Eurovíkend: kufr se nakloní, jako když ho táhnete za sebou.
  icon('luggage',
    `<g data-n="l"><rect x="6" y="7" width="12" height="13" rx="2" ${SOFT}/><path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2 M10 10.5v6 M14 10.5v6 M8.5 20v1 M15.5 20v1"/></g>`,
    O, (p, E) => set(E.l, { transform: rot(10 * p.o, 15.5, 21) })),

  // Pobytový zájezd: palma na ostrůvku se zhoupne ve větru.
  icon('island',
    `<path d="M3.5 19.5 Q12 14.5 20.5 19.5z" ${SOFT}/><path d="M3 21.5c1.5-.8 3-.8 4.5 0s3 .8 4.5 0 3-.8 4.5 0 3 .8 4.5 0"/>
     <g data-n="t"><path d="M12.5 17.2 C12.5 13.5 11.6 10.4 10 8"/><path d="M10 8 C8 6.6 5.8 7 4.8 8.6 M10 8 C10.2 5.8 8.8 4.2 7 3.8 M10 8 C12 6 14.6 6.2 16 7.6 M10 8 C12.4 8.6 13.8 10.4 13.9 12.2"/></g>`,
    O, (p, E) => set(E.t, { transform: rot(7 * rattle(p.o, 3), 12.5, 17.2) })),

  // Slunce: paprsky se pootočí a mírně se prodlouží.
  icon('sun',
    `<circle cx="12" cy="12" r="4.2" ${SOFT}/><g data-n="r"><path d="M12 2.8v2 M12 19.2v2 M2.8 12h2 M19.2 12h2 M5.5 5.5l1.4 1.4 M17.1 17.1l1.4 1.4 M5.5 18.5l1.4-1.4 M17.1 6.9l1.4-1.4"/></g>`,
    O, (p, E) => set(E.r, { transform: `${rot(45 * p.o, 12, 12)} translate(12 12) scale(${f(1 + 0.08 * bump(p.o))}) translate(-12 -12)` })),
];
