/*
 * Fundadores:
 *  - cartões com foto, inclinação 3D e holograma que "salta" do cartão ao passar o mouse
 *    (no toque: primeiro toque liga o holograma, segundo abre a história);
 *  - modal com foto e holograma ao vivo;
 *  - mural de fundo com desenhos P&B de outros fundadores (revelados pelo cursor);
 *  - créditos das imagens no rodapé.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var grid = document.getElementById('people');
  if (!grid) return;
  var P = DATA.people, N = P.length, cards = [], holos = [], holoOn = [];
  var touchMode = window.matchMedia('(hover: none)').matches;
  var canTilt = !touchMode;
  var PHOTO = 'assets/img/people/cards/';

  /* ---------- cartões ---------- */
  P.forEach(function (p, i) {
    var wrap = document.createElement('div');
    wrap.className = 'pcard reveal' + (SV.xp.has('pe', p.id) ? ' is-met' : '');
    wrap.style.setProperty('--h', p.hue);
    wrap.style.setProperty('--d', (i % 4) * 0.08 + 's');
    wrap.innerHTML =
      '<button type="button" class="pcard__btn" aria-label="Abrir a história de ' + U.esc(p.name) + '">' +
        '<div class="pcard__in">' +
          '<div class="pcard__art"><span class="pcard__ini" aria-hidden="true">' + U.esc(p.ini) + '</span>' +
            '<img class="pcard__photo" src="' + PHOTO + p.id + '.webp" alt="Retrato de ' + U.esc(p.name) + '" width="600" height="480" loading="lazy" decoding="async">' +
            '<span class="pcard__yrs mono">' + U.esc(p.years) + '</span>' +
            '<span class="pcard__hint mono" aria-hidden="true">' + (touchMode ? 'toque: holograma' : '◈ holograma') + '</span></div>' +
          '<div class="pcard__txt">' +
            '<span class="pcard__role mono">' + U.esc(p.role) + '</span>' +
            '<span class="pcard__name">' + U.esc(p.name) + '</span>' +
            '<span class="pcard__short">' + U.esc(p.short) + '</span>' +
            '<span class="pcard__go mono">Ler a história →</span>' +
          '</div>' +
        '</div>' +
      '</button>' +
      '<div class="holo" aria-hidden="true"><div class="holo__in"><canvas></canvas><span class="holo__tag mono">HOLO · ' + U.esc(p.name.toUpperCase()) + '</span></div></div>';

    var btn = wrap.querySelector('.pcard__btn');
    var holo = SV.Holo && SV.Holo.has(p.id) ? SV.Holo.create(wrap.querySelector('canvas'), p.id) : null;
    holos.push(holo); holoOn.push(false);

    var stopTimer = 0;
    function setHolo(on) {
      if (!holo || holoOn[i] === on) return;
      holoOn[i] = on; clearTimeout(stopTimer);
      wrap.classList.toggle('is-holo', on);
      if (on) { holo.start(); SV.xp.mark('misc', 'holo', 5, 'Holograma ativado'); }
      else stopTimer = setTimeout(function () { if (!holoOn[i]) holo.stop(); }, 450);
    }

    if (canTilt) {
      wrap.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setHolo(true); });
      wrap.addEventListener('pointermove', function (e) {
        if (SV.reduced() || e.pointerType !== 'mouse') return;
        var r = wrap.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        wrap.classList.add('is-tilting');
        wrap.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        wrap.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
        wrap.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        wrap.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (holo) holo.setYaw((px - 0.5) * 2);
      });
      wrap.addEventListener('pointerleave', function () {
        wrap.classList.remove('is-tilting');
        wrap.style.setProperty('--rx', '0deg'); wrap.style.setProperty('--ry', '0deg');
        if (holo) holo.setYaw(0);
        setHolo(false);
      });
    }
    btn.addEventListener('focus', function () { if (btn.matches(':focus-visible')) setHolo(true); });
    btn.addEventListener('blur', function () { setHolo(false); });
    btn.addEventListener('click', function () {
      if (touchMode && holo && !holoOn[i]) {
        holoOn.forEach(function (o, k) { if (o && k !== i) { cards[k].classList.remove('is-holo'); holoOn[k] = false; holos[k].stop(); } });
        setHolo(true); return;
      }
      open(i);
    });

    grid.appendChild(wrap); cards.push(wrap);
    new IntersectionObserver(function (en, ob) {
      if (en[0].isIntersecting) { wrap.classList.add('is-in'); ob.disconnect(); }
    }, { threshold: 0.12 }).observe(wrap);
  });

  /* ---------- modal ---------- */
  var modalHolo = null;
  function open(i) {
    var p = P[i];
    if (modalHolo) { modalHolo.stop(); modalHolo = null; }
    var html =
      '<div class="m-hero" style="--h:' + p.hue + '"><img class="m-hero__img" src="' + PHOTO + p.id + '.webp" alt="Retrato de ' + U.esc(p.name) + '">' +
      '<div class="m-hero__holo" aria-hidden="true"><canvas id="mHolo"></canvas><span class="mono">HOLOGRAMA</span></div></div>' +
      '<span class="m-kicker mono">' + U.esc(p.role) + '</span>' +
      '<h3 class="m-title" id="modalTitle">' + U.esc(p.name) + '</h3>' +
      '<p class="m-sub m-mono">' + U.esc(p.years) + '</p>' +
      '<p class="m-text">' + U.esc(p.bio) + '</p>' +
      '<div class="m-nav"><button type="button" class="btn" data-dir="-1">← ' + U.esc(P[(i + N - 1) % N].name.split(' ').pop()) + '</button>' +
      '<button type="button" class="btn" data-dir="1" data-autofocus>' + U.esc(P[(i + 1) % N].name.split(' ').pop()) + ' →</button></div>';
    var go = function (d) { open((i + d + N) % N); };
    SV.modal.open(html, { prev: function () { go(-1); }, next: function () { go(1); } });
    SV.modal.onClose = function () { if (modalHolo) { modalHolo.stop(); modalHolo = null; } };
    [].forEach.call(document.querySelectorAll('#modalBody [data-dir]'), function (b) {
      b.addEventListener('click', function () { go(parseInt(b.dataset.dir, 10)); });
    });
    var cv = document.getElementById('mHolo');
    if (cv && SV.Holo && SV.Holo.has(p.id)) { modalHolo = SV.Holo.create(cv, p.id); modalHolo.start(); }
    cards[i].classList.add('is-met');
    SV.xp.mark('pe', p.id, 10, p.name + ' conhecido');
  }

  /* ---------- mural de desenhos ---------- */
  var sec = document.getElementById('fundadores'), wall = null, tiles = [], tip = null, built = false;
  var WALL = (SV.wallPeople || []).slice();
  (function () {
    var first = ['elon-musk', 'sam-altman', 'henrique-dubugras', 'jensen-huang', 'mark-zuckerberg', 'jeff-bezos', 'bill-gates', 'dario-amodei'], seed = Math.random() * 1000;
    WALL.sort(function (a, b) {
      var ia = first.indexOf(a.k), ib = first.indexOf(b.k);
      if (ia > -1 || ib > -1) return (ia > -1 ? ia : 99) - (ib > -1 ? ib : 99);
      return U.rnd(a.k.length, a.k.charCodeAt(0) + a.k.charCodeAt(2), seed) - U.rnd(b.k.length, b.k.charCodeAt(0) + b.k.charCodeAt(2), seed);
    });
  })();
  function buildWall() {
    if (built || !WALL.length) return;
    built = true;
    wall = document.createElement('div'); wall.className = 'fwall'; wall.setAttribute('aria-hidden', 'true');
    tip = document.createElement('div'); tip.className = 'fwall__tip mono';
    sec.insertBefore(wall, sec.firstChild); sec.appendChild(tip);
    layoutWall();
  }
  function layoutWall() {
    wall.innerHTML = ''; tiles.length = 0;
    var sw = sec.clientWidth, sh = sec.clientHeight, sr = sec.getBoundingClientRect();
    var blocked = cards.map(function (cd) { var q = cd.getBoundingClientRect(); return { x0: q.left - sr.left - 8, y0: q.top - sr.top - 8, x1: q.right - sr.left + 8, y1: q.bottom - sr.top + 8 }; });
    var t = U.clamp(sw / 19, 50, 78), gap = 10, cols = Math.max(3, Math.floor((sw + gap) / (t + gap))), rows = Math.max(3, Math.floor((sh + gap) / (t + gap)));
    var offX = (sw - (cols * (t + gap) - gap)) / 2, offY = (sh - (rows * (t + gap) - gap)) / 2;
    var cells = [], c, r, k;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var x0 = offX + c * (t + gap), y0 = offY + r * (t + gap), hit = false;
      for (k = 0; k < blocked.length; k++) if (x0 < blocked[k].x1 && x0 + t > blocked[k].x0 && y0 < blocked[k].y1 && y0 + t > blocked[k].y0) { hit = true; break; }
      if (!hit) cells.push([c, r]);
    }
    cells.sort(function (a, b) { return U.rnd(a[0], a[1], 5) - U.rnd(b[0], b[1], 5); });
    var count = Math.min(cells.length, Math.round(cells.length * 0.82));
    for (k = 0; k < count; k++) {
      var person = WALL[k % WALL.length], cell = cells[k];
      var el = document.createElement('figure');
      var size = t * (0.86 + U.rnd(k, 1, 9) * 0.24);
      el.className = 'ftile';
      el.style.cssText = 'left:' + (offX + cell[0] * (t + gap) + (t - size) / 2).toFixed(1) + 'px;top:' + (offY + cell[1] * (t + gap) + (t - size) / 2).toFixed(1) + 'px;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;' +
        '--r:' + ((U.rnd(k, 2, 9) - 0.5) * 6).toFixed(2) + 'deg;--dy:' + ((U.rnd(k, 3, 9) - 0.5) * 12).toFixed(1) + 'px;--dur:' + (7 + U.rnd(k, 4, 9) * 7).toFixed(1) + 's;--dl:-' + (U.rnd(k, 5, 9) * 8).toFixed(1) + 's';
      el.innerHTML = '<img src="assets/img/people/bg/' + person.k + '.webp" alt="" loading="lazy" decoding="async">';
      (function (pp, node) {
        node.addEventListener('pointerenter', function () {
          var rr = node.getBoundingClientRect(), sr = sec.getBoundingClientRect();
          tip.innerHTML = '<b>' + U.esc(pp.n) + '</b><span>' + U.esc(pp.r) + '</span>';
          tip.style.left = (rr.left - sr.left + rr.width / 2) + 'px'; tip.style.top = (rr.top - sr.top - 10) + 'px';
          tip.classList.add('is-on');
        });
        node.addEventListener('pointerleave', function () { tip.classList.remove('is-on'); });
      })(person, el);
      wall.appendChild(el);
      tiles.push({ el: el, cx: offX + cell[0] * (t + gap) + t / 2, cy: offY + cell[1] * (t + gap) + t / 2, k: 0, tk: 0 });
    }
  }

  var mx = -9999, my = -9999, raf = 0, wallVisible = false;
  function lightTiles() {
    raf = 0;
    for (var i = 0; i < tiles.length; i++) {
      var tl = tiles[i], d = Math.hypot(tl.cx - mx, tl.cy - my), tk = Math.exp(-Math.pow(d / 190, 2));
      if (Math.abs(tk - tl.k) > 0.01) { tl.k = tk; tl.el.style.setProperty('--k', tk.toFixed(3)); }
    }
  }
  sec.addEventListener('pointermove', function (e) {
    if (!built || SV.reduced()) return;
    var r = sec.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    if (!raf) raf = requestAnimationFrame(lightTiles);
  }, { passive: true });
  sec.addEventListener('pointerleave', function () { mx = my = -9999; if (!raf) raf = requestAnimationFrame(lightTiles); });

  var rsz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () { if (built) layoutWall(); }, 250);
  });

  new IntersectionObserver(function (en) {
    wallVisible = en[0].isIntersecting;
    if (wallVisible) buildWall();
    if (wall) wall.classList.toggle('is-on', wallVisible);
  }, { rootMargin: '300px 0px' }).observe(sec);

  /* ---------- créditos das imagens (rodapé) ---------- */
  var credits = SV.photoCredits || [];
  var footer = document.querySelector('.footer__inner > div:first-child');
  if (credits.length && footer) {
    var det = document.createElement('details');
    det.className = 'credits';
    det.innerHTML = '<summary>Créditos das fotos e desenhos (' + credits.length + ')</summary><p>Imagens do Wikimedia Commons em licenças livres. Os desenhos em preto e branco são versões processadas dessas fotos e mantêm a atribuição e a licença originais.</p><ul>' +
      credits.map(function (c) {
        return '<li><b>' + U.esc(c.name) + '</b> · ' + (c.kind === 'card' ? 'foto' : 'desenho') + ' · ' + U.esc(c.artist || 'autor não informado') + ' · ' + U.esc(c.license) + ' · <a href="' + U.esc(c.page) + '" target="_blank" rel="noopener">Commons</a></li>';
      }).join('') + '</ul>';
    footer.appendChild(det);
  }
})();
