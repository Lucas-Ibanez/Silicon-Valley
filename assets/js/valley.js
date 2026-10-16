/*
 * A Linha do Vale: mapa esquemático (estilo placa de circuito / metrô) de
 * San Francisco a San José. Dois layouts (horizontal e vertical) compartilham
 * os mesmos dados; as estações são botões HTML posicionados em porcentagem
 * sobre um SVG, e um "trem" de luz percorre o tronco até a parada escolhida.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var mapEl = document.getElementById('vMap');
  if (!mapEl) return;
  var svg = document.getElementById('vSvg'), pinsEl = document.getElementById('vPins');
  var panel = document.getElementById('vPanel'), filtersEl = document.getElementById('vFilters');
  var ST = DATA.stations, CATS = DATA.cats;
  var byId = {};
  ST.forEach(function (s) { byId[s.id] = s; });
  var mq = window.matchMedia('(max-width: 920px)');

  /* [id, fração do tronco, lado do rótulo]; stubs: [id, pai, direção, comprimento, lado] */
  var LAYOUTS = {
    wide: {
      vb: [1000, 470],
      trunk: 'M 74 120 C 280 120 330 250 520 256 S 780 346 926 346',
      st: [['sf', 0, 't'], ['rc', 0.15, 'b'], ['mp', 0.30, 't'], ['pa', 0.46, 'b'], ['mv', 0.62, 't'], ['sv', 0.77, 't'], ['sc', 0.89, 'b'], ['sj', 1, 't']],
      stubs: [['st', 'pa', 'u', 88, 't'], ['cu', 'sv', 'd', 88, 'b']]
    },
    tall: {
      vb: [360, 760],
      trunk: 'M 90 34 C 90 190 215 205 215 370 S 250 590 250 726',
      st: [['sf', 0, 'r'], ['rc', 0.14, 'r'], ['mp', 0.29, 'r'], ['pa', 0.44, 'r'], ['mv', 0.58, 'l'], ['sv', 0.72, 'r'], ['sc', 0.86, 'l'], ['sj', 1, 'l']],
      stubs: [['st', 'pa', 'l', 78, 'l'], ['cu', 'sv', 'l', 78, 'l']]
    }
  };
  var DIR = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

  var trunk = null, lit = null, train = null, packets = [], L = 0;
  var pins = {}, pos = {}, selected = null, flt = 'all';
  var curLen = 0, tgtLen = 0;

  /* ---------- filtros ---------- */
  function buildFilters() {
    var html = '<span class="seg__k mono">Destacar</span><button type="button" class="chipbtn is-on" data-f="all">Tudo</button>';
    Object.keys(CATS).forEach(function (k) { html += '<button type="button" class="chipbtn" data-f="' + k + '">' + U.esc(CATS[k]) + '</button>'; });
    filtersEl.innerHTML = html;
    filtersEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]');
      if (!b) return;
      flt = b.dataset.f;
      [].forEach.call(filtersEl.querySelectorAll('.chipbtn'), function (x) { x.classList.toggle('is-on', x === b); });
      applyFilter();
    });
  }
  function matches(it) { return flt === 'all' || it.c === flt; }
  function applyFilter() {
    ST.forEach(function (s) {
      var pin = pins[s.id]; if (!pin) return;
      var any = s.items.some(matches);
      pin.classList.toggle('is-dim', flt !== 'all' && !any);
      pin.classList.toggle('is-match', flt !== 'all' && any);
    });
    [].forEach.call(panel.querySelectorAll('.vp__item'), function (el) {
      el.classList.toggle('is-dim', !(flt === 'all' || el.dataset.c === flt));
    });
  }

  /* ---------- construção ---------- */
  function build() {
    var cfg = LAYOUTS[mq.matches ? 'tall' : 'wide'], vbW = cfg.vb[0], vbH = cfg.vb[1];
    mapEl.classList.toggle('is-tall', mq.matches);
    mapEl.style.aspectRatio = vbW + ' / ' + vbH;
    svg.setAttribute('viewBox', '0 0 ' + vbW + ' ' + vbH);
    svg.innerHTML = '<path class="v-trunk" id="vTrunk" d="' + cfg.trunk + '"/>' +
      '<g id="vBranches"></g>' +
      '<path class="v-trunk-in" d="' + cfg.trunk + '"/>' +
      '<path class="v-glow" id="vLit" d="' + cfg.trunk + '"/>' +
      '<g id="vPackets"></g>' +
      '<g class="v-train" id="vTrain"><circle class="v-halo" r="13"/><circle r="4.5"/></g>';
    trunk = svg.querySelector('#vTrunk'); lit = svg.querySelector('#vLit'); train = svg.querySelector('#vTrain');
    L = trunk.getTotalLength();
    lit.style.strokeDasharray = L + ' ' + L;
    var pk = svg.querySelector('#vPackets'); packets = [];
    for (var k = 0; k < 4; k++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', '2.6'); c.setAttribute('fill', 'currentColor'); c.setAttribute('class', 'v-packet');
      c.style.color = 'var(--accent2)'; pk.appendChild(c); packets.push(c);
    }

    pos = {};
    var branches = svg.querySelector('#vBranches'), html = '';
    cfg.st.forEach(function (s) {
      var pt = trunk.getPointAtLength(L * s[1]);
      pos[s[0]] = { x: pt.x, y: pt.y, f: s[1], side: s[2] };
    });
    cfg.stubs.forEach(function (b) {
      var par = pos[b[1]], d = DIR[b[2]];
      var x = par.x + d[0] * b[3], y = par.y + d[1] * b[3];
      pos[b[0]] = { x: x, y: y, f: par.f, side: b[4] };
      html += '<path class="v-branch" d="M' + par.x.toFixed(1) + ',' + par.y.toFixed(1) + ' L' + x.toFixed(1) + ',' + y.toFixed(1) + '"/>';
    });
    branches.innerHTML = html;

    pinsEl.innerHTML = ''; pins = {};
    ST.forEach(function (s) {
      var p = pos[s.id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stn stn--' + p.side + (SV.xp.has('st', s.id) ? ' is-visited' : '');
      b.style.left = (p.x / vbW * 100) + '%'; b.style.top = (p.y / vbH * 100) + '%';
      b.setAttribute('aria-label', s.name + ': ' + s.tag);
      b.innerHTML = '<i class="stn__dot"></i><span class="stn__lbl">' + U.esc(s.name) + '</span>';
      b.addEventListener('click', function () { select(s.id, true); });
      pinsEl.appendChild(b); pins[s.id] = b;
    });
    if (selected) { pins[selected].classList.add('is-on'); tgtLen = L * pos[selected].f; curLen = tgtLen; }
    applyFilter();
  }

  /* ---------- painel ---------- */
  function render(s) {
    var rows = s.items.slice().sort(function (a, b) { return a.y - b.y; }).map(function (it) {
      return '<div class="vp__item' + (matches(it) ? '' : ' is-dim') + '" data-c="' + it.c + '"><span class="vp__y">' + it.y + '</span><div>' +
        '<div class="vp__n">' + U.esc(it.n) + ' <span class="vp__c">' + U.esc(CATS[it.c]) + '</span></div>' +
        '<p class="vp__t">' + U.esc(it.t) + '</p></div></div>';
    }).join('');
    panel.innerHTML = '<div class="vp__head vp__enter"><span class="vp__tag mono">' + U.esc(s.tag) + '</span>' +
      '<h3 class="vp__name">' + U.esc(s.name) + '</h3><p class="vp__fact">' + U.esc(s.fact) + '</p>' +
      '<p class="vp__hint mono">' + SV.xp.count('st') + ' / ' + ST.length + ' paradas visitadas</p></div>' +
      '<div class="vp__list vp__enter">' + rows + '</div>';
  }
  function select(id, user) {
    selected = id;
    Object.keys(pins).forEach(function (k) { pins[k].classList.toggle('is-on', k === id); });
    render(byId[id]);
    tgtLen = L * pos[id].f;
    if (user) {
      if (SV.xp.mark('st', id, 8, byId[id].name + ' visitada')) pins[id].classList.add('is-visited');
      var hint = panel.querySelector('.vp__hint');
      if (hint) hint.textContent = SV.xp.count('st') + ' / ' + ST.length + ' paradas visitadas';
    }
  }

  /* ---------- animação ---------- */
  var visible = false;
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(mapEl);
  SV.frame(function (t, dt) {
    if (!visible || !L) return;
    curLen += (tgtLen - curLen) * (SV.reduced() ? 1 : 1 - Math.exp(-dt * 3.2));
    lit.style.strokeDashoffset = (L - curLen).toFixed(1);
    var pt = trunk.getPointAtLength(curLen);
    train.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
    if (!SV.reduced()) {
      for (var i = 0; i < packets.length; i++) {
        var q = trunk.getPointAtLength(((t * 0.06 + i / packets.length) % 1) * L);
        packets[i].setAttribute('cx', q.x.toFixed(1)); packets[i].setAttribute('cy', q.y.toFixed(1));
      }
    }
  });

  buildFilters();
  selected = 'pa';
  build();
  render(byId[selected]);
  pins[selected].classList.add('is-on');
  tgtLen = curLen = L * pos[selected].f;
  if (mq.addEventListener) mq.addEventListener('change', function () { build(); render(byId[selected]); }); else mq.addListener(function () { build(); render(byId[selected]); });
})();
