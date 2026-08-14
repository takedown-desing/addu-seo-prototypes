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

  // блоки прототипа + те, что уже помечены .rv в разметке (страницы кейсов, хаб)
  var nodes = [].slice.call(document.querySelectorAll(SEL));
  nodes.forEach(function (el, i) {
    el.classList.add('rv');
    var d = i % 4;                       // лёгкая лесенка внутри ряда
    if (d && !el.hasAttribute('data-d')) el.setAttribute('data-d', d);
  });
  [].forEach.call(document.querySelectorAll('.rv'), function (el) {
    if (nodes.indexOf(el) < 0) nodes.push(el);
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
    setTimeout(function () {                       // страховка от пустой страницы
      nodes.forEach(function (el) {
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 1.5)
          el.classList.add('in');
      });
    }, 2500);
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

  /* 3.5 мега-меню: наведение работает через CSS, здесь — тап на телефоне и клавиатура */
  document.querySelectorAll('.hdr__item').forEach(function (item) {
    var link = item.querySelector('a');
    if (!link) return;
    link.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: hover)').matches) return;   // на десктопе — обычный переход
      if (!item.classList.contains('is-open')) { e.preventDefault(); }
      document.querySelectorAll('.hdr__item').forEach(function (x) {
        if (x !== item) x.classList.remove('is-open');
      });
      item.classList.toggle('is-open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.hdr__item'))
      document.querySelectorAll('.hdr__item.is-open').forEach(function (x) { x.classList.remove('is-open'); });
  });

  /* 3.6 бургер: панель со всеми разделами — работает на любой ширине */
  (function () {
    var burger = document.querySelector('.hdr__burger');
    var hdr = document.querySelector('.hdr');
    if (!burger || !hdr) return;
    var panel = document.createElement('div');
    panel.className = 'hdr__panel';
    var mega = document.querySelector('.mega');
    var main = [].slice.call(document.querySelectorAll('.hdr__nav > a, .hdr__item > a'))
      .map(function (a) { return '<a href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>'; })
      .join('');
    panel.innerHTML =
      '<div class="hdr__panel-main">' + main + '</div>' +
      '<div class="hdr__panel-cols">' + (mega ? mega.innerHTML : '') + '</div>' +
      '<div class="hdr__panel-foot"><a class="phone" href="tel:+74951503200">+7 495 150-32-00</a>' +
      '<a class="btn btn--primary" href="/addu-seo-prototypes/kontakty/">Стать клиентом</a></div>';
    hdr.appendChild(panel);
    function toggle(on) {
      document.body.classList.toggle('menu-open', on === undefined ? !document.body.classList.contains('menu-open') : on);
    }
    burger.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('menu-open') && !e.target.closest('.hdr__panel')) toggle(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  })();

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
