/*
 * A travessia: trilha em SVG gerada por código que se acende com o scroll.
 * O layout vem do DOM (cada <li> tem uma altura); o JS lê a posição dos itens,
 * traça uma curva suave (Catmull-Rom → Bézier) por eles e mapeia
 * "altura na tela" → "comprimento do caminho" para animar o traço.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var list = document.getElementById('tlList');
  if (!list) return;

  var svg = document.getElementById('tlSvg'), base = document.getElementById('tlBase'), lit = document.getElementById('tlLit');
  var traveler = document.getElementById('tlTraveler'), nodesEl = document.getElementById('tlNodes');
  var hudCount = document.getElementById('tlCount'), hudEra = document.getElementById('tlEra'), hudBar = document.getElementById('tlBar');
  var TL = DATA.timeline, N = TL.length;
  var items = [], nodes = [];
  var pts = [], L = 0, ys = [], lens = [], ready = false, cur = 0;
  var itemState = [], nodeState = [], activeIdx = -2;
  var mq = window.matchMedia('(max-width: 820px)');

  /* ---------- DOM ---------- */
  TL.forEach(function (m, i) {
    var li = document.createElement('li');
    li.className = 'tl__item tl__item--' + (i % 2 ? 'r' : 'l');
    li.innerHTML =
      '<div class="tl__year" aria-hidden="true">' + m.year + '</div>' +
      '<article class="tl__card" data-spot tabindex="0" role="button" aria-label="Abrir checkpoint ' + U.pad2(i + 1) + ': ' + U.esc(m.title) + '">' +
        '<span class="tl__yr mono">' + m.year + ' · ' + U.esc(m.place) + '</span>' +
        '<h3>' + U.esc(m.title) + '</h3>' +
        '<p>' + U.esc(m.summary) + '</p>' +
        '<span class="tl__more mono">Abrir arquivo <span>→</span></span>' +
      '</article>';
    list.appendChild(li); items.push(li);
    var card = li.querySelector('.tl__card');
    card.addEventListener('click', function () { open(i); });
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });

    var n = document.createElement('button');
    n.type = 'button'; n.className = 'node';
    n.setAttribute('aria-label', 'Checkpoint ' + U.pad2(i + 1) + ': ' + m.title);
    n.addEventListener('click', function () { open(i); });
    nodesEl.appendChild(n); nodes.push(n);
    if (SV.xp.has('cp', i)) n.classList.add('is-visited');
  });
  hudCount.textContent = '00 / ' + U.pad2(N);

  /* ---------- geometria ---------- */
  function smooth(P) {
    var d = 'M' + P[0][0].toFixed(1) + ',' + P[0][1].toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
        p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  function build() {
    var lr = list.getBoundingClientRect();
    if (lr.width < 10) return;
    var w = lr.width, h = lr.height, mobile = mq.matches;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w); svg.setAttribute('height', h);

    var cx = mobile ? 26 : w / 2, off = mobile ? 7 : 40, amp = mobile ? 6 : 34;
    pts = [];
    items.forEach(function (li, i) {
      var r = li.getBoundingClientRect();
      var y = r.top - lr.top + r.height / 2;
      var x = cx + (i % 2 ? -off : off);
      pts.push([x, y]);
      nodes[i].style.left = x + 'px'; nodes[i].style.top = y + 'px';
    });

    var P = [[pts[0][0], Math.max(8, pts[0][1] - 120)]];
    for (var i = 0; i < pts.length; i++) {
      P.push(pts[i]);
      if (i < pts.length - 1) {
        for (var j = 1; j <= 2; j++) {
          var t = j / 3;
          P.push([U.lerp(pts[i][0], pts[i + 1][0], t) + (U.rnd(i, j, 9) - 0.5) * 2 * amp, U.lerp(pts[i][1], pts[i + 1][1], t)]);
        }
      }
    }
    P.push([pts[pts.length - 1][0], Math.min(h - 8, pts[pts.length - 1][1] + 130)]);
    var d = smooth(P);
    base.setAttribute('d', d); lit.setAttribute('d', d);
    L = lit.getTotalLength();
    lit.style.strokeDasharray = L + ' ' + L;

    var S = 700, prev = -1e9;
    ys = []; lens = [];
    for (var s = 0; s <= S; s++) {
      var len = L * s / S, pt = lit.getPointAtLength(len);
      prev = Math.max(prev, pt.y);
      ys.push(prev); lens.push(len);
    }
    ready = true;
  }

  function lengthAtY(y) {
    if (y <= ys[0]) return 0;
    var last = ys.length - 1;
    if (y >= ys[last]) return L;
    var lo = 0, hi = last;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (ys[mid] <= y) lo = mid; else hi = mid; }
    var span = ys[hi] - ys[lo] || 1;
    return U.lerp(lens[lo], lens[hi], (y - ys[lo]) / span);
  }

  /* ---------- animação ---------- */
  SV.frame(function (t, dt) {
    if (!ready) return;
    var r = list.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -300 || r.top > vh + 300) return;

    var focus = vh * 0.55 - r.top;
    var tgt = lengthAtY(focus);
    cur += (tgt - cur) * (SV.reduced() ? 1 : 1 - Math.exp(-dt * 8));
    lit.style.strokeDashoffset = (L - cur).toFixed(1);
    var pt = lit.getPointAtLength(cur);
    traveler.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
    traveler.style.opacity = cur > 3 ? 1 : 0;

    var active = -1;
    for (var i = 0; i < N; i++) {
      var on = pts[i][1] <= pt.y + 4 && cur > 3;
      var seen = pts[i][1] <= focus + vh * 0.3;
      if (on) active = i;
      if (nodeState[i] !== on) { nodeState[i] = on; nodes[i].classList.toggle('is-on', on); }
      if (itemState[i] !== seen) { itemState[i] = seen; items[i].classList.toggle('is-seen', seen); }
    }
    if (active !== activeIdx) {
      if (activeIdx >= 0) { nodes[activeIdx].classList.remove('is-active'); items[activeIdx].classList.remove('is-active'); }
      activeIdx = active;
      if (active >= 0) { nodes[active].classList.add('is-active'); items[active].classList.add('is-active'); }
      hudCount.textContent = U.pad2(active + 1) + ' / ' + U.pad2(N);
      hudEra.textContent = active >= 0 ? DATA.eras[TL[active].era].name : '—';
    }
    hudBar.style.transform = 'scaleX(' + (L ? U.clamp(cur / L, 0, 1) : 0).toFixed(4) + ')';
  });

  /* ---------- modal ---------- */
  function open(i) {
    var m = TL[i], era = DATA.eras[m.era];
    var html =
      '<span class="m-kicker mono">Checkpoint ' + U.pad2(i + 1) + ' / ' + U.pad2(N) + ' · ' + U.esc(era.name) + '</span>' +
      '<h3 class="m-title" id="modalTitle">' + U.esc(m.title) + '</h3>' +
      '<p class="m-sub m-mono">' + m.year + ' · ' + U.esc(m.place) + '</p>' +
      '<p class="m-text">' + U.esc(m.detail) + '</p>' +
      SV.html.facts(m.facts) +
      (m.people.length ? '<div class="m-people">' + m.people.map(function (n) { return '<span>' + U.esc(n) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="m-nav"><button type="button" class="btn" data-dir="-1"' + (i === 0 ? ' disabled' : '') + '>← Anterior</button>' +
      '<button type="button" class="btn" data-dir="1" data-autofocus' + (i === N - 1 ? ' disabled' : '') + '>Próximo →</button></div>';
    var go = function (d) { var k = i + d; if (k >= 0 && k < N) { open(k); items[k].scrollIntoView({ block: 'center', behavior: 'instant' }); } };
    SV.modal.open(html, { prev: function () { go(-1); }, next: function () { go(1); } });
    [].forEach.call(document.querySelectorAll('#modalBody [data-dir]'), function (b) {
      b.addEventListener('click', function () { go(parseInt(b.dataset.dir, 10)); });
    });
    nodes[i].classList.add('is-visited');
    SV.xp.mark('cp', i, 10, 'Checkpoint ' + U.pad2(i + 1) + ' aberto');
  }

  /* ---------- ciclo de vida ---------- */
  var rafId = 0;
  function scheduleBuild() { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(build); }
  if (window.ResizeObserver) new ResizeObserver(scheduleBuild).observe(list);
  window.addEventListener('resize', scheduleBuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleBuild);
  window.addEventListener('load', scheduleBuild);
  scheduleBuild();
})();
