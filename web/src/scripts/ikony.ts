// Oživení piktogramů (tenká sada, src/ikony/linka.js).
// 1) SVG vykreslené komponentou <Ikona> (svg[data-ki]) dostanou animaci při najetí.
// 2) Zástupné prvky <i data-kubai="jmeno" data-size="20"> — vkládá je JS v public/
//    (hlavička, popup, mapa) — se nahradí ikonou. Hlídá se i obsah přidaný později.
// Hover spouští nejbližší předek s data-kubai-trigger (karta, tlačítko), jinak ikona.
// prefers-reduced-motion respektuje runtime sám (skočí rovnou do koncového stavu).
import { animate, bindTrigger } from 'kubai-icons';
import { IKONY, ikonaSvg } from '../ikony';

type Wired = SVGElement & { kubai?: unknown };

function wire(svg: Wired) {
  if (svg.kubai) return;
  const ic = IKONY[svg.getAttribute('data-ki') || ''];
  if (!ic) return;
  const ctl = animate(svg as any, ic as any);
  svg.kubai = ctl;
  const trigger = svg.closest('[data-kubai-trigger]') || svg;
  bindTrigger(trigger as any, ctl, ic as any);
}

function upgrade(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-kubai]').forEach((el) => {
    const ic = IKONY[el.dataset.kubai || ''];
    if (!ic) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = ikonaSvg(ic, {
      size: Number(el.dataset.size) || 24,
      className: el.getAttribute('class') || undefined,
    });
    el.replaceWith(tpl.content.firstElementChild!);
  });
  root.querySelectorAll<Wired>('svg[data-ki]').forEach(wire);
}

upgrade(document);

let pending = false;
new MutationObserver(() => {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    upgrade(document);
  });
}).observe(document.body, { childList: true, subtree: true });
