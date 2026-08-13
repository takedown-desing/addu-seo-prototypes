/* Анимации дизайна ADDU для внутренних страниц:
   появление блоков по скроллу, счётчики цифр, аккордеон FAQ, прилипающая шапка.
   Классы навешиваются из JS — без JS страница остаётся полностью читаемой. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. что анимируем появлением */
  var SEL = '.page-content .heading2, .work-card, .metric-case, .tariff, .pain, .step,' +
            ' .number, .definition, .expert, .ai-ask, .ai-inline, .cta-horizontal,' +
            ' .faq-item, .table-wrap, .skel-block, .callout-proto, .new-block, .case-card-f,' +
            ' .quiz, .hero-badge, .team-card, .ph, .ph-photo, .ph-video';

  var nodes = [].slice.call(document.querySelectorAll(SEL));
  nodes.forEach(function (el, i) {
    el.classList.add('rv');
    var d = i % 4;                       // лёгкая лесенка внутри ряда
    if (d) el.setAttribute('data-d', d);
  });

  if (reduce || !('IntersectionObserver' in window)) {
    nodes.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    requestAnimationFrame(function () { nodes.forEach(function (el) { io.observe(el); }); });
  }

  /* 2. счётчики в блоке цифр */
  function count(el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d]*)(\d[\d\s]*)(.*)$/);
    if (!m) return;
    var pre = m[1], to = parseInt(m[2].replace(/\s/g, ''), 10), post = m[3];
    if (!to || to > 100000) return;
    var t0 = null, dur = 1300;
    requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = pre + Math.floor(to * (1 - Math.pow(1 - p, 3))) + post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    });
  }
  var vals = document.querySelectorAll('.number__val');
  if (vals.length && !reduce && 'IntersectionObserver' in window) {
    var ioC = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); ioC.unobserve(e.target); } });
    }, { threshold: 0.6 });
    [].forEach.call(vals, function (el) { ioC.observe(el); });
  }

  /* 3. аккордеон FAQ (единый обработчик вместо inline-скриптов) */
  document.addEventListener('click', function (e) {
    var q = e.target.closest && e.target.closest('.faq-question');
    if (!q) return;
    var item = q.parentElement, was = item.classList.contains('open');
    var list = item.parentElement;
    [].forEach.call(list.querySelectorAll('.faq-item'), function (x) { x.classList.remove('open'); });
    if (!was) item.classList.add('open');
  });

  /* 4. шапка появляется при прокрутке вверх */
  var hdr = document.querySelector('.hdr'), last = 0;
  if (hdr) window.addEventListener('scroll', function () {
    var y = window.scrollY, h = window.innerHeight * 0.7;
    if (y > h && y < last) hdr.classList.add('hdr--stuck');
    else hdr.classList.remove('hdr--stuck');
    last = y;
  }, { passive: true });

  /* 5. лёгкий параллакс фона hero */
  if (!reduce) {
    var hero = document.querySelector('.page-hero');
    if (hero) window.addEventListener('scroll', function () {
      if (window.scrollY < window.innerHeight * 1.2)
        hero.style.setProperty('--par', (window.scrollY * 0.12) + 'px');
    }, { passive: true });
  }
})();
