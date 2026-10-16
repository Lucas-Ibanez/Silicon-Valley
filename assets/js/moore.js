/*
 * Lei de Moore: gráfico em canvas (escala logarítmica) com cursor arrastável.
 * Os pontos são chips reais; a linha tracejada é a previsão "dobra a cada T anos".
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var wrap = document.getElementById('mChart'), cv = document.getElementById('mCanvas');
  if (!wrap || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var chips = DATA.chips;
  var elYear = document.getElementById('mYear'), elChip = document.getElementById('mChip'), elCount = document.getElementById('mCount');
  var elRel = document.getElementById('mRel'), slider = document.getElementById('mSlider'), list = document.getElementById('mList');
  var seg = document.querySelector('.seg');

  var X0 = 1969, X1 = 2024.5, E0 = 3, E1 = 11.7, YMIN = 1971, YMAX = 2022;
  var W = 0, H = 0, dpr = 1, pad = { l: 66, r: 20, t: 38, b: 36 };
  var year = YMIN, yearTarget = YMIN, reveal = 0, started = false, visible = false;
  var period = 2, showMoore = true, dirty = true, touched = false, lastShown = -1;
  var C = {};
  var TAU = Math.PI * 2;

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    ['text', 'muted', 'dim', 'line', 'line2', 'accent', 'accent2', 'surface'].forEach(function (k) { C[k] = cs.getPropertyValue('--' + k).trim() || '#888'; });
    dirty = true;
  }
  document.addEventListener('sv:theme', function () { setTimeout(readColors, 30); });
  readColors();

  /* ---------- formatação ---------- */
  function words(n) {
    function f(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
    if (n < 1e3) return U.fmt(n);
    if (n < 1e6) return f(n / 1e3) + ' mil';
    if (n < 1e9) return f(n / 1e6) + (n / 1e6 >= 2 ? ' milhões' : ' milhão');
    if (n < 1e12) return f(n / 1e9) + (n / 1e9 >= 2 ? ' bilhões' : ' bilhão');
    return f(n / 1e12) + ' trilhões';
  }
  function moore(yr) { return chips[0].t * Math.pow(2, (yr - chips[0].y) / period); }
  var EXP_LBL = { 3: '1 mil', 4: '10 mil', 5: '100 mil', 6: '1 mi', 7: '10 mi', 8: '100 mi', 9: '1 bi', 10: '10 bi', 11: '100 bi' };

  /* ---------- escalas ---------- */
  function xp(yr) { return pad.l + (yr - X0) / (X1 - X0) * (W - pad.l - pad.r); }
  function yp(n) { return pad.t + (1 - (Math.log10(n) - E0) / (E1 - E0)) * (H - pad.t - pad.b); }
  function yrAt(px) { return X0 + (px - pad.l) / (W - pad.l - pad.r) * (X1 - X0); }
  function currentIdx(yr) { var k = 0; for (var i = 0; i < chips.length; i++) if (chips[i].y <= yr + 0.001) k = i; return k; }

  /* ---------- desenho ---------- */
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var i, e;
    ctx.font = '500 10.5px "Geist Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 1;
    for (e = E0; e <= 11; e++) {
      var gy = yp(Math.pow(10, e));
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r, gy); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.fillText(EXP_LBL[e], pad.l - 10, gy);
    }
    ctx.textAlign = 'center';
    for (var yr = 1970; yr <= 2020; yr += 10) {
      var gx = xp(yr);
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, H - pad.b); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.fillText(String(yr), gx, H - pad.b + 18);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = C.muted;
    ctx.fillText('TRANSISTORES POR CHIP · ESCALA LOGARÍTMICA', pad.l, 16);
    /* legenda */
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(pad.l + 8, pad.t + 12, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = C.text; ctx.fillText('Chips reais', pad.l + 20, pad.t + 12.5);
    if (showMoore) {
      ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = C.accent2;
      ctx.beginPath(); ctx.moveTo(pad.l + 2, pad.t + 32); ctx.lineTo(pad.l + 16, pad.t + 32); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.text; ctx.fillText('Previsão: dobra a cada ' + String(period).replace('.', ',') + (period > 1 ? ' anos' : ' ano'), pad.l + 20, pad.t + 32.5);
    }

    var revealYear = X0 + reveal * (X1 - X0);

    /* previsão */
    if (showMoore) {
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t - 6, W - pad.l - pad.r, H - pad.t - pad.b + 12); ctx.clip();
      ctx.setLineDash([7, 7]); ctx.lineWidth = 2; ctx.strokeStyle = C.accent2; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      var started2 = false;
      for (var y2 = chips[0].y; y2 <= Math.min(X1, revealYear); y2 += 0.5) {
        var px = xp(y2), py = yp(moore(y2));
        if (!started2) { ctx.moveTo(px, py); started2 = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
    }

    /* linha e pontos reais */
    var ci = currentIdx(year);
    ctx.lineWidth = 2; ctx.strokeStyle = C.accent; ctx.globalAlpha = 0.55; ctx.beginPath();
    var first = true;
    for (i = 0; i < chips.length; i++) {
      if (chips[i].y > revealYear) break;
      var cxp = xp(chips[i].y), cyp = yp(chips[i].t);
      if (first) { ctx.moveTo(cxp, cyp); first = false; } else ctx.lineTo(cxp, cyp);
    }
    ctx.stroke(); ctx.globalAlpha = 1;

    for (i = 0; i < chips.length; i++) {
      var c = chips[i];
      if (c.y > revealYear) continue;
      var k = U.easeOut(U.clamp((revealYear - c.y) / 3, 0, 1));
      var x = xp(c.y), y = yp(c.t), future = c.y > year + 0.001;
      ctx.globalAlpha = (future ? 0.35 : 1) * k;
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(x, y, (i === ci ? 6.5 : 4.5) * k, 0, TAU); ctx.fill();
      if (i === ci) {
        ctx.globalAlpha = 0.28 * k; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = C.text; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    /* cursor */
    var cx = xp(year);
    ctx.setLineDash([3, 5]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, pad.t); ctx.lineTo(cx, H - pad.b); ctx.stroke(); ctx.setLineDash([]);
    if (showMoore && year >= YMIN) {
      var mp = moore(year);
      if (Math.log10(mp) <= E1) {
        ctx.strokeStyle = C.accent2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, yp(mp), 5, 0, TAU); ctx.stroke();
      }
    }

    /* rótulo do chip atual */
    if (reveal > 0.2) {
      var cc = chips[ci], lx = xp(cc.y), ly2 = yp(cc.t);
      var label = cc.n + ' · ' + words(cc.t);
      ctx.font = '600 11px "Geist Mono", ui-monospace, monospace';
      var tw = ctx.measureText(label).width + 18, left = lx > W * 0.62;
      var bx = left ? lx - tw - 16 : lx + 16, by = ly2 - 34;
      by = U.clamp(by, pad.t + 4, H - pad.b - 30);
      bx = U.clamp(bx, pad.l + 4, W - pad.r - tw - 4);
      ctx.fillStyle = C.surface; ctx.strokeStyle = C.accent; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, tw, 24, 7); else ctx.rect(bx, by, tw, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.text; ctx.textAlign = 'left'; ctx.fillText(label, bx + 9, by + 12.5);
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* ---------- leitura ---------- */
  function updateReadout() {
    var ci = currentIdx(year), c = chips[ci], yr = Math.floor(year + 0.001);
    elYear.textContent = yr;
    elChip.textContent = c.n + ' · ' + c.node;
    elCount.textContent = U.fmt(c.t);
    var ratio = c.t / chips[0].t;
    elRel.textContent = (ci === 0 ? '1× o Intel 4004' : (ratio >= 1000 ? words(ratio) + ' de vezes o Intel 4004' : U.fmt(ratio) + '× o Intel 4004')) + ' · Moore previa ' + words(moore(year));
    slider.style.setProperty('--fill', ((year - YMIN) / (YMAX - YMIN) * 100).toFixed(1) + '%');
    if (!slider.matches(':active')) slider.value = year;
    if (ci !== lastShown) {
      lastShown = ci;
      [].forEach.call(list.children, function (li, i) {
        var b = li.firstChild;
        b.classList.toggle('is-on', i === ci);
        b.classList.toggle('is-future', i > ci);
      });
    }
  }

  function touch() {
    if (touched) return;
    touched = true;
    SV.xp.mark('misc', 'moore', 15, 'Lei de Moore explorada');
  }
  function setTarget(v, user) { yearTarget = U.clamp(v, YMIN, YMAX); if (user) touch(); }

  /* ---------- interação ---------- */
  function pointerYear(e) {
    var r = cv.getBoundingClientRect();
    setTarget(yrAt(e.clientX - r.left), true);
  }
  var dragging = false;
  wrap.addEventListener('pointerdown', function (e) { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } pointerYear(e); });
  wrap.addEventListener('pointermove', function (e) { if (dragging || e.pointerType === 'mouse') pointerYear(e); });
  wrap.addEventListener('pointerup', function () { dragging = false; });
  wrap.addEventListener('pointercancel', function () { dragging = false; });
  slider.addEventListener('input', function () { setTarget(parseFloat(slider.value), true); });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]');
    if (!b) return;
    var t = parseFloat(b.dataset.t);
    [].forEach.call(seg.querySelectorAll('button'), function (x) { x.classList.toggle('is-on', x === b); });
    if (t === 0) showMoore = false; else { showMoore = true; period = t; }
    dirty = true; touch();
  });

  chips.forEach(function (c) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button"><b>' + U.esc(c.n) + '</b><small>' + c.y + ' · ' + words(c.t) + '</small></button>';
    li.firstChild.addEventListener('click', function () { setTarget(c.y, true); });
    list.appendChild(li);
  });

  /* ---------- ciclo de vida ---------- */
  function resize() {
    var r = wrap.getBoundingClientRect();
    if (r.width < 10) return;
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    pad.l = W < 520 ? 52 : 66; pad.r = W < 520 ? 12 : 20;
    dirty = true;
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);
  resize();

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !started) started = true;
    }, { threshold: 0.25 }).observe(wrap);
  } else { visible = true; started = true; }

  SV.frame(function (t, dt) {
    if (!visible || !W) return;
    var moved = Math.abs(yearTarget - year) > 0.002;
    if (moved) year += (yearTarget - year) * (SV.reduced() ? 1 : 1 - Math.exp(-dt * 10)); else year = yearTarget;
    if (started && reveal < 1) { reveal = SV.reduced() ? 1 : Math.min(1, reveal + dt / 2.6); dirty = true; }
    if (moved || dirty) { draw(); updateReadout(); dirty = false; }
  });
  updateReadout();
})();
