// Hvězdy a cenové $ (prvky s data-rate): když se objeví na obrazovce, aktivní
// znaky se postupně rozsvítí (CSS .rate-anim / .is-in v destinace-detail.css).
// Při prefers-reduced-motion se nic nepřidá — znaky jsou rovnou plné.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = document.querySelectorAll<HTMLElement>('[data-rate]');
if (!reduced && 'IntersectionObserver' in window && els.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => {
    el.classList.add('rate-anim');
    io.observe(el);
  });
}
