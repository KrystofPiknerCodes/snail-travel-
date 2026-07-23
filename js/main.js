/* ============================================================
   SNAIL TRAVEL — interactions
   Lightweight, dependency-free, respects reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: solid bar after scroll ---------- */
  var header = document.getElementById("header");
  function onScrollHeader() {
    if (window.scrollY > 60) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();

  /* ---------- Scrollspy: gold nav link for the section in view ----------
     Only affects links whose target section exists on this page (bare "#id"
     hrefs, or an explicit data-nav-section — used for "Destinace" pointing
     at destinace.html while this page also has an #destinace section). The
     static .is-active on destinace.html/reference.html is left alone since
     no matching section exists there. */
  (function () {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a, .mobile-nav a"));
    function linkSectionId(a) {
      var href = a.getAttribute("href") || "";
      return a.getAttribute("data-nav-section") || (href.charAt(0) === "#" ? href.slice(1) : "");
    }
    var sections = navLinks
      .map(linkSectionId)
      .filter(function (id, i, arr) { return id && arr.indexOf(id) === i; })
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    function setActive(id) {
      navLinks.forEach(function (a) {
        a.classList.toggle("is-active", linkSectionId(a) === id);
      });
    }

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  })();

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero video montage (crossfade between clips) ----------
     Only the active clip plays; others stay paused (but buffered) so we
     never decode 4 videos at once — that was causing the stutter. */
  var heroVids = document.querySelectorAll(".hero-video");
  if (heroVids.length > 1 && !prefersReduced) {
    var vIdx = 0;
    // pause every non-active clip up front
    heroVids.forEach(function (v, i) { if (i !== 0) { try { v.pause(); } catch (e) {} } });

    setInterval(function () {
      var current = heroVids[vIdx];
      vIdx = (vIdx + 1) % heroVids.length;
      var next = heroVids[vIdx];
      try { next.currentTime = 0; next.play(); } catch (e) {}
      next.classList.add("is-active");
      current.classList.remove("is-active");
      // pause the outgoing clip once the crossfade has finished
      setTimeout(function () { try { current.pause(); } catch (e) {} }, 1500);
    }, 7000);
  }

  /* ---------- Destinations slider (arrows + drag-to-scroll) ---------- */
  var slider = document.getElementById("destSlider");
  if (slider) {
    var card = slider.querySelector(".dest-card");
    var step = function () {
      var w = card ? card.getBoundingClientRect().width : 320;
      var gap = parseFloat(getComputedStyle(slider).columnGap || getComputedStyle(slider).gap || 24) || 24;
      return w + gap;
    };

    document.querySelectorAll(".dest-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        slider.scrollBy({ left: step() * parseInt(btn.dataset.dir, 10), behavior: "smooth" });
      });
    });

    // enable/disable arrows at the ends
    var arrPrev = document.querySelector('.dest-arrow[data-dir="-1"]');
    var arrNext = document.querySelector('.dest-arrow[data-dir="1"]');
    var ticking2 = false;
    function updateArrows() {
      ticking2 = false;
      if (!arrPrev || !arrNext) return;
      var max = slider.scrollWidth - slider.clientWidth - 2;
      arrPrev.disabled = slider.scrollLeft <= 2;
      arrNext.disabled = slider.scrollLeft >= max;
    }
    slider.addEventListener("scroll", function () {
      if (!ticking2) { window.requestAnimationFrame(updateArrows); ticking2 = true; }
    }, { passive: true });
    setTimeout(updateArrows, 100);
    window.addEventListener("resize", updateArrows);

    // drag / swipe to scroll (pointer events)
    var isDown = false, startX = 0, startScroll = 0, moved = 0;
    slider.addEventListener("pointerdown", function (e) {
      isDown = true; moved = 0;
      startX = e.clientX;
      startScroll = slider.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      moved = Math.abs(dx);
      // only treat this as a drag (and disable the card links) once the
      // pointer has actually travelled — otherwise a plain click leaves
      // pointer-events:none on the link during its own pointerup hit-test
      // and the click silently fails to navigate.
      if (moved > 6) slider.classList.add("dragging");
      slider.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!isDown) return;
      isDown = false;
      slider.classList.remove("dragging");
    });
    // stop a drag from triggering the card link
    slider.addEventListener("click", function (e) {
      if (moved > 6) { e.preventDefault(); }
    }, true);
  }

  /* ---------- Zážitky: expand extra bento tiles ---------- */
  var bentoToggle = document.getElementById("bentoToggle");
  var bentoExtra = document.getElementById("bentoExtra");
  if (bentoToggle && bentoExtra) {
    var bentoLabel = bentoToggle.querySelector(".btn-ghost-label");
    bentoToggle.addEventListener("click", function () {
      var open = bentoExtra.classList.toggle("is-open");
      bentoToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (bentoLabel) { bentoLabel.textContent = open ? "Skrýt zážitky" : "Všechny zážitky"; }
      if (open) {
        setTimeout(function () {
          bentoExtra.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" });
        }, 120);
      }
    });
  }

  /* ---------- Subtle parallax on quote band ---------- */
  var parallax = document.querySelector("[data-parallax]");
  var ticking = false;
  function updateParallax() {
    if (!parallax) return;
    var rect = parallax.parentElement.getBoundingClientRect();
    var offset = (rect.top - window.innerHeight / 2) * -0.06;
    parallax.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    ticking = false;
  }

  function onScroll() {
    onScrollHeader();
    if (!ticking && parallax && !prefersReduced) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  updateParallax();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Contact form (front-end feedback only) ---------- */
  var form = document.querySelector(".contact-form");
  var note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var msg = form.querySelector("#message");
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

      if (!name.value.trim() || !emailOk || !msg.value.trim()) {
        note.style.color = "#9a3b2e";
        note.textContent = "Vyplňte prosím jméno, platný e‑mail a zprávu.";
        var firstInvalid = !name.value.trim() ? name : (!emailOk ? email : msg);
        firstInvalid.focus();
        return;
      }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Odesílám…";
      // Demo: no backend wired yet — simulate success.
      setTimeout(function () {
        form.reset();
        btn.disabled = false;
        btn.textContent = "Odeslat poptávku";
        note.style.color = "";
        note.textContent = "Děkujeme. Ozveme se vám do 48 hodin.";
      }, 900);
    });
  }
})();
