/*
 * Núcleo: utilitários, laço de animação único, tema, navegação, revelações,
 * contadores, ticker, modal, toasts e o "passaporte" (XP + conquistas).
 * Os módulos de cada seção se registram em SV.frame() e usam SV.xp / SV.modal.
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};
  var DATA = SV.data;
  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- utilitários ---------------- */
  var U = SV.util = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    sstep: function (a, b, v) { var t = U.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
    easeOut: function (t) { return 1 - Math.pow(1 - t, 3); },
    pad2: function (n) { return (n < 10 ? '0' : '') + n; },
    esc: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
    fmt: function (n) { return Math.round(n).toLocaleString('pt-BR'); },
    rnd: function (a, b, c) { var s = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return s - Math.floor(s); }
  };
  SV.reduced = function () { return mqReduce.matches; };

  function $(id) { return document.getElementById(id); }
  function store(get, key, val) {
    try { if (get) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { /* storage indisponível */ }
    return null;
  }

  /* ---------------- laço de animação único ---------------- */
  var subs = [], lastTs = 0;
  SV.frame = function (fn) { subs.push(fn); };
  function tick(ts) {
    var t = ts / 1000, dt = Math.min(0.05, lastTs ? t - lastTs : 0.016);
    lastTs = t;
    for (var i = 0; i < subs.length; i++) subs[i](t, dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------------- tema ---------------- */
  var themeBtn = $('themeBtn');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f4f0e7' : '#07090c');
    document.dispatchEvent(new Event('sv:theme'));
  }
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    store(false, 'sv-theme', next);
    SV.xp.mark('misc', 'theme', 5, 'Tema alternado');
  });
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  /* ---------------- toasts ---------------- */
  var toasts = $('toasts');
  SV.toast = function (title, sub, kind) {
    var el = document.createElement('div');
    el.className = 'toast' + (kind === 'ach' ? ' is-ach' : '');
    el.innerHTML = '<i>' + (kind === 'ach' ? '★' : '+') + '</i><div><b>' + U.esc(title) + '</b><small>' + U.esc(sub) + '</small></div>';
    toasts.appendChild(el);
    while (toasts.children.length > 4) toasts.removeChild(toasts.firstChild);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }, kind === 'ach' ? 4600 : 2600);
  };

  /* ---------------- XP, conquistas e passaporte ---------------- */
  var xpChip = $('xpChip'), xpVal = $('xpVal'), xpRing = xpChip.querySelector('.xpchip__ring');
  var state = { xp: 0, seen: { cp: [], st: [], pe: [], dna: [], misc: [] }, ach: [], best: 0 };
  try {
    var saved = JSON.parse(store(true, 'sv-state') || 'null');
    if (saved && saved.seen) state = saved;
  } catch (e) { /* estado inválido: recomeça */ }
  function save() { store(false, 'sv-state', JSON.stringify(state)); }

  function level() {
    var L = DATA.levels, cur = 0;
    for (var i = 0; i < L.length; i++) if (state.xp >= L[i].xp) cur = i;
    var next = L[cur + 1];
    return { i: cur, name: L[cur].name, from: L[cur].xp, to: next ? next.xp : null, pct: next ? (state.xp - L[cur].xp) / (next.xp - L[cur].xp) : 1 };
  }
  function refreshChip(pop) {
    var lv = level();
    xpVal.textContent = state.xp;
    xpRing.style.setProperty('--xp', Math.round(lv.pct * 100));
    xpChip.title = lv.name + ' · ' + state.xp + ' XP';
    if (pop) { xpChip.classList.remove('is-pop'); void xpChip.offsetWidth; xpChip.classList.add('is-pop'); }
  }

  var CHECKS = {
    cp1: function () { return state.seen.cp.length >= 1; },
    cp10: function () { return state.seen.cp.length >= 10; },
    cp20: function () { return state.seen.cp.length >= DATA.timeline.length; },
    journey: function () { return has('misc', 'journey'); },
    stations: function () { return state.seen.st.length >= DATA.stations.length; },
    moore: function () { return has('misc', 'moore'); },
    people4: function () { return state.seen.pe.length >= 4; },
    dna: function () { return state.seen.dna.length >= DATA.dna.length; },
    quiz: function () { return state.best >= DATA.quiz.length; },
    theme: function () { return has('misc', 'theme'); }
  };
  function has(g, id) { return state.seen[g].indexOf(id) !== -1; }

  function checkAch() {
    DATA.achievements.forEach(function (a) {
      if (state.ach.indexOf(a.id) === -1 && CHECKS[a.id] && CHECKS[a.id]()) {
        state.ach.push(a.id);
        setTimeout(function () { SV.toast('Conquista: ' + a.name, a.desc, 'ach'); }, 700);
      }
    });
  }

  SV.xp = {
    /* registra uma ação única (grupo + id); devolve true se for a primeira vez */
    mark: function (group, id, xp, label) {
      id = String(id);
      if (!state.seen[group]) state.seen[group] = [];
      if (has(group, id)) return false;
      state.seen[group].push(id);
      state.xp += xp;
      SV.toast(label, '+' + xp + ' XP', 'xp');
      refreshChip(true); checkAch(); save();
      return true;
    },
    has: has,
    count: function (g) { return state.seen[g] ? state.seen[g].length : 0; },
    quizDone: function (score) {
      var first = state.best === 0 && score > 0;
      if (score > state.best) {
        var gain = (score - state.best) * 10 + (state.best === 0 ? 50 : 0);
        state.best = score; state.xp += gain;
        SV.toast('Quiz concluído: ' + score + '/' + DATA.quiz.length, '+' + gain + ' XP', 'xp');
      }
      refreshChip(true); checkAch(); save();
      return first;
    }
  };
  refreshChip(false);

  /* ---------------- modal ---------------- */
  var modal = $('modal'), modalBody = $('modalBody'), modalKeys = null;
  function openDialog(d) { if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  SV.modal = {
    open: function (html, keys) {
      modalBody.innerHTML = html;
      modalKeys = keys || null;
      modal.querySelector('.modal__box').scrollTop = 0;
      openDialog(modal);
      var first = modalBody.querySelector('[data-autofocus]');
      if (first) first.focus();
    },
    close: function () { closeDialog(modal); }
  };
  $('modalClose').addEventListener('click', SV.modal.close);
  modal.addEventListener('click', function (e) { if (e.target === modal) SV.modal.close(); });
  modal.addEventListener('close', function () { modalKeys = null; if (SV.modal.onClose) { var f = SV.modal.onClose; SV.modal.onClose = null; f(); } });
  modal.addEventListener('keydown', function (e) {
    if (!modalKeys) return;
    if (e.key === 'ArrowLeft' && modalKeys.prev) { e.preventDefault(); modalKeys.prev(); }
    if (e.key === 'ArrowRight' && modalKeys.next) { e.preventDefault(); modalKeys.next(); }
  });

  /* passaporte */
  var pass = $('passport'), passBody = $('passBody');
  function openPassport() {
    var lv = level();
    var html = '<span class="m-kicker mono">Passaporte do explorador</span>' +
      '<h3 class="m-title" id="passTitle">' + U.esc(lv.name) + '</h3>' +
      '<div class="pp-level"><b>' + state.xp + ' XP</b><span class="m-sub mono">nível ' + (lv.i + 1) + ' de ' + DATA.levels.length + '</span></div>' +
      '<div class="pp-bar"><i id="ppFill"></i></div>' +
      '<p class="pp-hint">' + (lv.to ? 'Faltam ' + (lv.to - state.xp) + ' XP para o próximo nível.' : 'Você chegou ao topo. Parabéns!') + '</p>' +
      '<div class="pp-grid">' + DATA.achievements.map(function (a) {
        var on = state.ach.indexOf(a.id) !== -1;
        return '<div class="pp-badge' + (on ? ' is-on' : '') + '"><i>' + (on ? '★' : '·') + '</i><div><b>' + U.esc(a.name) + '</b><small>' + U.esc(a.desc) + '</small></div></div>';
      }).join('') + '</div>' +
      '<button type="button" class="pp-reset" id="ppReset">Zerar progresso</button>';
    passBody.innerHTML = html;
    openDialog(pass);
    requestAnimationFrame(function () { var f = $('ppFill'); if (f) f.style.width = Math.round(lv.pct * 100) + '%'; });
    $('ppReset').addEventListener('click', function () {
      if (!window.confirm('Zerar XP, conquistas e checkpoints visitados?')) return;
      store(false, 'sv-state', '');
      window.location.reload();
    });
  }
  xpChip.addEventListener('click', openPassport);
  $('btnPassport').addEventListener('click', openPassport);
  $('passClose').addEventListener('click', function () { closeDialog(pass); });
  pass.addEventListener('click', function (e) { if (e.target === pass) closeDialog(pass); });

  /* ---------------- navegação ---------------- */
  var nav = $('nav'), navLinks = $('navLinks'), burger = $('burger'), bar = $('scrollbar');
  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { setMenu(!navLinks.classList.contains('is-open')); });
  navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var hero = $('top');
  var linkMap = {};
  [].forEach.call(navLinks.querySelectorAll('a'), function (a) { linkMap[a.getAttribute('href').slice(1)] = a; });
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = linkMap[en.target.id];
      if (!a) return;
      if (en.isIntersecting) {
        [].forEach.call(navLinks.querySelectorAll('a'), function (x) { x.classList.remove('is-on'); });
        a.classList.add('is-on');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(linkMap).forEach(function (id) { var s = $(id); if (s) sectionObs.observe(s); });

  var scrollY = 0, lastY = 0, vel = 0;
  SV.frame(function (t, dt) {
    scrollY = window.scrollY || window.pageYOffset || 0;
    var h = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? U.clamp(scrollY / h, 0, 1) : 0) + ')';
    nav.classList.toggle('is-scrolled', scrollY > 24);
    var heroBottom = hero.offsetTop + hero.offsetHeight - 80;
    nav.classList.toggle('is-hero', scrollY < heroBottom);
    vel = U.lerp(vel, (scrollY - lastY) / Math.max(dt, 0.001), 0.12);
    lastY = scrollY;
  });
  SV.scrollVel = function () { return vel; };

  /* ---------------- revelações, contadores ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  [].forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });

  var counted = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      counted.unobserve(en.target);
      var el = en.target, to = parseFloat(el.dataset.count), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      var put = function (v) { el.innerHTML = (pre ? '<small>' + pre + '</small>' : '') + U.fmt(v) + (suf ? '<small>' + suf + '</small>' : ''); };
      if (SV.reduced()) { put(to); return; }
      var t0 = performance.now(), dur = 1700;
      (function step(now) {
        var k = U.clamp((now - t0) / dur, 0, 1);
        put(to * U.easeOut(k));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  [].forEach.call(document.querySelectorAll('[data-count]'), function (el) { counted.observe(el); });

  /* ---------------- ticker que reage à velocidade do scroll ---------------- */
  var track = $('tickerTrack');
  var words = ['Stanford', 'HP', 'Shockley', 'Fairchild', 'Intel', 'ARPANET', 'Xerox PARC', 'Apple', 'Cisco', 'Netscape', 'Google', 'Facebook', 'iPhone', 'NVIDIA', 'OpenAI'];
  track.innerHTML = words.concat(words).map(function (w) { return '<span>' + w + '</span>'; }).join('');
  var tx = 0;
  SV.frame(function (t, dt) {
    if (SV.reduced()) return;
    var half = track.scrollWidth / 2;
    if (!half) return;
    tx -= (46 + Math.abs(vel) * 0.22) * dt;
    if (tx <= -half) tx += half;
    track.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,0,0)';
  });

  /* ---------------- interações de ponteiro: spotlight e botões magnéticos ---------------- */
  document.addEventListener('pointermove', function (e) {
    var s = e.target.closest ? e.target.closest('[data-spot]') : null;
    if (s) {
      var r = s.getBoundingClientRect();
      s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      s.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  }, { passive: true });
  [].forEach.call(document.querySelectorAll('[data-mag]'), function (b) {
    b.addEventListener('pointermove', function (e) {
      if (SV.reduced() || e.pointerType === 'touch') return;
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  $('btnTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: SV.reduced() ? 'auto' : 'smooth' }); });

  /* ---------------- cabeçalhos de modais dos outros módulos ---------------- */
  SV.html = {
    facts: function (arr) {
      return '<dl class="m-facts">' + arr.map(function (f) { return '<div><dt>' + U.esc(f[0]) + '</dt><dd>' + U.esc(f[1]) + '</dd></div>'; }).join('') + '</dl>';
    }
  };
})();
