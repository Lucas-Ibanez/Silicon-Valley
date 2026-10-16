/*
 * Lei de Moore, versão "painel de instrumentos".
 *  - Gráfico em canvas (escala log) com eras, cometa, bits flutuantes, brilho por marca
 *    e cursor arrastável (mouse, toque e teclado), com ímã nos chips e modo "reproduzir".
 *  - Cockpit com retrato do chip, logo, odômetro de transistores e especificações.
 *  - Dobras desde o 4004 e régua de escala (do fio de cabelo ao DNA).
 *  - Cards de chips com prévia flutuante ao passar o mouse.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var wrap = document.getElementById('mChart'), cv = document.getElementById('mCanvas');
  if (!wrap || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var chips = DATA.chips, NC = chips.length;
  var $ = function (id) { return document.getElementById(id); };
  var elYear = $('mYear'), elChip = $('mChip'), elBlurb = $('mBlurb'), elRel = $('mRel'), elSpecs = $('mSpecs');
  var elArt = $('mArt'), elLogo = $('mLogo'), elOdo = $('mOdo'), slider = $('mSlider'), list = $('mList');
  var elPlay = $('mPlay'), elPlayIco = $('mPlayIco'), elPlayTxt = $('mPlayTxt'), seg = document.querySelector('.moore__bar .seg');
  var elDbl = $('dbl'), elDblN = $('insDn'), elDblT = $('insDt'), elRuler = $('ruler'), elRulerT = $('insSt');

  var X0 = 1969, X1 = 2024.5, E0 = 3, E1 = 11.7, YMIN = chips[0].y, YMAX = chips[NC - 1].y;
  var W = 0, H = 0, dpr = 1, pad = { l: 66, r: 24, t: 54, b: 38 };
  var year = YMIN, yearTarget = YMIN, reveal = 0, started = false, visible = false;
  var period = 2, showMoore = true, dirty = true, touched = false, curIdx = -1;
  var playing = false, hold = 0, hoverX = null, T = 0;
  var C = {}, TAU = Math.PI * 2;

  var ERAS = [[1969, 1985, 'Microprocessadores'], [1985, 1995, 'Era do PC'], [1995, 2007, 'Internet e GHz'], [2007, 2020, 'Mobile e multinúcleo'], [2020, 2024.5, 'IA']];
  var BRAND = { Intel: '#3d9bff', Apple: '#e7e9ee', NVIDIA: '#7ac70c' };

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    ['text', 'muted', 'dim', 'line', 'line2', 'accent', 'accent2', 'surface', 'bg'].forEach(function (k) { C[k] = cs.getPropertyValue('--' + k).trim() || '#888'; });
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    C.light = light;
    BRAND.Apple = light ? '#2b2d33' : '#e7e9ee';
    BRAND.Intel = light ? '#0a6fd0' : '#3d9bff';
    BRAND.NVIDIA = light ? '#5a9400' : '#7ac70c';
    dirty = true;
  }
  document.addEventListener('sv:theme', function () { setTimeout(readColors, 30); });
  readColors();

  /* ---------- formatação e contas ---------- */
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
  function xp(yr) { return pad.l + (yr - X0) / (X1 - X0) * (W - pad.l - pad.r); }
  function yp(n) { return pad.t + (1 - (Math.log10(n) - E0) / (E1 - E0)) * (H - pad.t - pad.b); }
  function yrAt(px) { return X0 + (px - pad.l) / (W - pad.l - pad.r) * (X1 - X0); }
  function currentIdx(yr) { var k = 0; for (var i = 0; i < NC; i++) if (chips[i].y <= yr + 0.001) k = i; return k; }
  function bcol(c) { return BRAND[c.brand] || C.accent; }
  function logoSrc(c) { return 'assets/img/logos/' + c.logo + '.svg'; }

  /* ---------- bits flutuantes ---------- */
  var BITS = [];
  for (var bi = 0; bi < 56; bi++) BITS.push({ x: U.rnd(bi, 1), y: U.rnd(bi, 2), s: 0.012 + U.rnd(bi, 3) * 0.03, c: U.rnd(bi, 4) > 0.5 ? '1' : '0', a: 0.08 + U.rnd(bi, 5) * 0.12 });

  /* ---------- gráfico ---------- */
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function dataY(yr) {
    if (yr <= chips[0].y) return chips[0].t;
    for (var i = 1; i < NC; i++) if (yr <= chips[i].y) {
      var a = chips[i - 1], b = chips[i], k = (yr - a.y) / (b.y - a.y);
      return Math.pow(10, Math.log10(a.t) + (Math.log10(b.t) - Math.log10(a.t)) * k);
    }
    return chips[NC - 1].t;
  }

  function draw(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var i, e, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    ctx.font = '500 10.5px "Geist Mono", ui-monospace, Menlo, Consolas, monospace';
    var revealYear = X0 + reveal * (X1 - X0);

    /* faixas de eras */
    for (i = 0; i < ERAS.length; i++) {
      var ex0 = xp(ERAS[i][0]), ex1 = xp(ERAS[i][1]);
      ctx.fillStyle = i % 2 ? (C.light ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.028)') : 'rgba(0,0,0,0)';
      ctx.fillRect(ex0, pad.t, ex1 - ex0, ph);
      if (ex1 - ex0 > 70) { ctx.fillStyle = C.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ERAS[i][2].toUpperCase(), (ex0 + ex1) / 2, pad.t - 12); }
    }
    /* bits flutuantes (mais densos conforme o chip evolui) */
    if (!SV.reduced()) {
      var active = 12 + Math.floor(44 * U.clamp((Math.log10(chips[curIdx < 0 ? 0 : curIdx].t) - 3) / 8, 0, 1));
      ctx.textAlign = 'center'; ctx.fillStyle = C.accent2;
      for (i = 0; i < active; i++) {
        var b = BITS[i];
        b.y -= b.s * dt; if (b.y < 0) { b.y += 1; b.x = Math.random(); }
        ctx.globalAlpha = b.a * Math.sin(Math.PI * b.y);
        ctx.fillText(b.c, pad.l + b.x * pw, pad.t + b.y * ph);
      }
      ctx.globalAlpha = 1;
    }

    /* grade */
    ctx.lineWidth = 1; ctx.textBaseline = 'middle';
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

    /* título e legenda */
    var narrow = W < 600;
    ctx.textAlign = 'left'; ctx.fillStyle = C.muted;
    ctx.fillText(narrow ? 'TRANSISTORES POR CHIP · LOG' : 'TRANSISTORES POR CHIP · ESCALA LOGARÍTMICA', pad.l, 14);
    var lx = narrow ? pad.l : W - pad.r, ly = narrow ? 30 : 14;
    (narrow ? ['Intel', 'Apple', 'NVIDIA'] : ['NVIDIA', 'Apple', 'Intel']).forEach(function (n) {
      var tw = ctx.measureText(n).width;
      if (narrow) {
        ctx.fillStyle = BRAND[n]; ctx.beginPath(); ctx.arc(lx + 4, ly, 4, 0, TAU); ctx.fill();
        ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.fillText(n, lx + 13, ly);
        lx += tw + 30;
      } else {
        ctx.textAlign = 'right'; ctx.fillStyle = C.muted; ctx.fillText(n, lx, ly);
        ctx.fillStyle = BRAND[n]; ctx.beginPath(); ctx.arc(lx - tw - 9, ly, 4, 0, TAU); ctx.fill();
        lx -= tw + 26;
      }
    });

    /* previsão de Moore (uma reta em escala log) e a "folga" entre ela e a realidade */
    var yMoore0 = chips[0].y, yEnd = Math.min(X1, revealYear), mpx;
    if (showMoore && yEnd > yMoore0) {
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t - 4, pw, ph + 8); ctx.clip();
      ctx.beginPath(); ctx.moveTo(xp(yMoore0), yp(moore(yMoore0)));
      for (mpx = yMoore0; mpx <= Math.min(yEnd, YMAX); mpx += 0.5) ctx.lineTo(xp(mpx), yp(moore(mpx)));
      for (mpx = Math.min(yEnd, YMAX); mpx >= yMoore0; mpx -= 0.5) ctx.lineTo(xp(mpx), yp(dataY(mpx)));
      ctx.closePath(); ctx.fillStyle = C.accent2; ctx.globalAlpha = 0.09; ctx.fill(); ctx.globalAlpha = 1;
      ctx.setLineDash([7, 7]); ctx.lineWidth = 2; ctx.strokeStyle = C.accent2; ctx.globalAlpha = 0.95;
      ctx.beginPath();
      for (mpx = yMoore0; mpx <= yEnd; mpx += 0.5) { var px = xp(mpx), py = yp(moore(mpx)); if (mpx === yMoore0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.restore();
    }

    /* pontos em coordenadas de tela */
    var pts = [];
    for (i = 0; i < NC; i++) pts.push({ x: xp(chips[i].y), y: yp(chips[i].t), c: chips[i] });
    var ci = curIdx < 0 ? 0 : curIdx, cx = xp(year);

    /* área sob a curva real */
    var last = -1;
    for (i = 0; i < NC; i++) if (chips[i].y <= revealYear) last = i;
    if (last > 0) {
      var ag = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
      ag.addColorStop(0, C.accent); ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.moveTo(pts[0].x, H - pad.b);
      for (i = 0; i <= last; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[last].x, H - pad.b); ctx.closePath();
      ctx.globalAlpha = 0.16; ctx.fillStyle = ag; ctx.fill(); ctx.globalAlpha = 1;

      /* linha real: trecho já percorrido em destaque, o restante esmaecido */
      for (var pass = 0; pass < 2; pass++) {
        ctx.beginPath(); ctx.lineJoin = 'round';
        var started2 = false;
        for (i = 0; i <= last; i++) {
          var inPast = pts[i].c.y <= year + 0.001;
          if (pass === 0 ? inPast : true) { if (!started2) { ctx.moveTo(pts[i].x, pts[i].y); started2 = true; } else ctx.lineTo(pts[i].x, pts[i].y); }
        }
        if (pass === 0 && ci < NC - 1 && last > ci) { var nx = pts[ci + 1], k = U.clamp((year - chips[ci].y) / (chips[ci + 1].y - chips[ci].y), 0, 1); ctx.lineTo(U.lerp(pts[ci].x, nx.x, k), U.lerp(pts[ci].y, nx.y, k)); }
        ctx.lineWidth = pass === 0 ? 3 : 1.6; ctx.strokeStyle = C.accent; ctx.globalAlpha = pass === 0 ? 1 : 0.3; ctx.stroke();
      }
      ctx.globalAlpha = 1;

      /* cometa percorrendo a curva */
      if (!SV.reduced() && reveal >= 1) {
        var segs = [], tot = 0;
        for (i = 0; i < last; i++) { var L = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y); segs.push(L); tot += L; }
        var pos = ((T * 0.11) % 1) * tot;
        for (var tl = 0; tl < 14; tl++) {
          var d = pos - tl * 7, s2 = 0;
          if (d < 0) break;
          for (i = 0; i < segs.length; i++) { if (d <= s2 + segs[i]) { var kk = (d - s2) / (segs[i] || 1); ctx.globalAlpha = (1 - tl / 14) * 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(U.lerp(pts[i].x, pts[i + 1].x, kk), U.lerp(pts[i].y, pts[i + 1].y, kk), 3.2 - tl * 0.18, 0, TAU); ctx.fill(); break; } s2 += segs[i]; }
        }
        ctx.globalAlpha = 1;
      }
    }

    /* pontos com brilho da marca */
    for (i = 0; i < NC; i++) {
      var p = pts[i], c = p.c;
      if (c.y > revealYear) continue;
      var kk2 = U.easeOut(U.clamp((revealYear - c.y) / 3, 0, 1)), future = c.y > year + 0.001, col = bcol(c);
      var isHover = hoverX !== null && Math.abs(hoverX - p.x) < 14;
      ctx.globalAlpha = (future ? 0.38 : 1) * kk2;
      var hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 17);
      hg.addColorStop(0, col); hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha *= 0.4; ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, TAU); ctx.fill();
      ctx.globalAlpha = (future ? 0.5 : 1) * kk2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, ((i === ci ? 6.5 : 4.6) + (isHover ? 1.8 : 0)) * kk2, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.bg; ctx.lineWidth = 1.4; ctx.stroke();
      if (i === ci) {
        var pr = 11 + 3.5 * Math.sin(T * 3.2);
        ctx.globalAlpha = 0.9; ctx.strokeStyle = C.text; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, pr, 0, TAU); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    /* cursor com brilho + etiqueta de ano */
    var cg = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    cg.addColorStop(0, C.accent); cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = cg; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(cx, pad.t); ctx.lineTo(cx, H - pad.b); ctx.stroke(); ctx.globalAlpha = 1;
    var yl = String(Math.floor(year + 0.001));
    ctx.font = '600 11px "Geist Mono", ui-monospace, monospace';
    var yw = ctx.measureText(yl).width + 16, yx = U.clamp(cx - yw / 2, pad.l - 4, W - pad.r - yw + 4);
    rr(yx, H - pad.b + 5, yw, 20, 10); ctx.fillStyle = C.accent; ctx.fill();
    ctx.fillStyle = C.light ? '#fff8ee' : '#1b1204'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(yl, yx + yw / 2, H - pad.b + 15.5);
    if (showMoore && year >= YMIN) {
      var mp = moore(year);
      if (Math.log10(mp) <= E1) { ctx.strokeStyle = C.accent2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, yp(mp), 5.5, 0, TAU); ctx.stroke(); }
    }

    /* etiqueta do chip atual */
    if (reveal > 0.2) {
      var cc = chips[ci], px2 = xp(cc.y), py2 = yp(cc.t), label = cc.n + ' · ' + words(cc.t);
      ctx.font = '600 11px "Geist Mono", ui-monospace, monospace';
      var tw2 = ctx.measureText(label).width + 22, left = px2 > W * 0.6, bx = left ? px2 - tw2 - 18 : px2 + 18, by2 = U.clamp(py2 - 36, pad.t + 6, H - pad.b - 34);
      bx = U.clamp(bx, pad.l + 4, W - pad.r - tw2 - 4);
      rr(bx, by2, tw2, 26, 8); ctx.fillStyle = C.surface; ctx.fill(); ctx.strokeStyle = bcol(cc); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = bcol(cc); rr(bx, by2, 4, 26, 2); ctx.fill();
      ctx.fillStyle = C.text; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, bx + 13, by2 + 13.5);
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* ---------- odômetro ---------- */
  var odoKey = '';
  function setOdo(n) {
    var s = U.fmt(n), key = s.replace(/\d/g, '#');
    if (key !== odoKey) {
      odoKey = key; elOdo.innerHTML = '';
      for (var i = 0; i < s.length; i++) {
        var el = document.createElement('span');
        if (/\d/.test(s[i])) { el.className = 'odo__d'; el.innerHTML = '<span class="odo__r">' + '0123456789'.split('').map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</span>'; }
        else { el.className = 'odo__s'; el.textContent = s[i]; }
        elOdo.appendChild(el);
      }
      void elOdo.offsetWidth;
    }
    var ds = elOdo.querySelectorAll('.odo__r'), k = 0;
    for (var j = 0; j < s.length; j++) if (/\d/.test(s[j])) { ds[k++].style.transform = 'translateY(-' + (parseInt(s[j], 10) * 1.12) + 'em)'; }
    elOdo.setAttribute('aria-label', s + ' transistores');
  }

  /* ---------- dobras e régua ---------- */
  var MAXD = Math.floor(Math.log2(chips[NC - 1].t / chips[0].t));
  for (var di = 0; di < MAXD; di++) { var dc = document.createElement('i'); dc.textContent = '×2'; elDbl.appendChild(dc); }
  var REFS = [[70000, 'Fio de cabelo', '70 µm'], [7000, 'Glóbulo vermelho', '7 µm'], [1000, 'Bactéria', '1 µm'], [100, 'Vírus', '100 nm'], [2, 'DNA (largura)', '2 nm']];
  var RMAX = Math.log10(300000);
  function rpos(nm) { return U.clamp((RMAX - Math.log10(nm)) / RMAX * 100, 0, 100); }
  elRuler.innerHTML = '<span class="ruler__line"></span>' + REFS.map(function (r, k) {
    return '<span class="rt ' + (k % 2 ? 'rt--lo' : 'rt--hi') + '" style="left:' + rpos(r[0]).toFixed(2) + '%"><i></i><em>' + r[1] + '</em><small>' + r[2] + '</small></span>';
  }).join('') + '<span class="rm" id="rm"><b class="rm__l mono" id="rmL"></b><i></i></span>';
  var elRm = $('rm'), elRmL = $('rmL');

  function updateInsights(c) {
    var k = Math.floor(Math.log2(c.t / chips[0].t) + 1e-6), ratio = c.t / chips[0].t;
    [].forEach.call(elDbl.children, function (cell, i) { cell.classList.toggle('on', i < k); });
    elDblN.textContent = k;
    elDblT.textContent = k === 0 ? 'Ponto de partida: 2.300 transistores.' : '≈ ' + words(ratio) + (ratio >= 1000 ? ' de vezes' : '×') + ' mais transistores que o 4004.';
    elRm.style.left = rpos(c.nm).toFixed(2) + '%';
    elRmL.textContent = c.node;
    var thin = 70000 / c.nm;
    elRulerT.textContent = thin < 1.01 ? 'Mais fino que um fio de cabelo.' : '≈ ' + U.fmt(thin) + '× mais fino que um fio de cabelo (70 µm).';
  }

  /* ---------- leitura e cockpit ---------- */
  function setChip(i, first) {
    curIdx = i;
    var c = chips[i];
    elLogo.innerHTML = '<img src="' + logoSrc(c) + '" alt="' + c.brand + '">';
    elArt.innerHTML = SV.chipArt ? SV.chipArt(c) : '';
    elArt.classList.remove('is-swap'); void elArt.offsetWidth; if (!first) elArt.classList.add('is-swap');
    elChip.textContent = c.n; elBlurb.textContent = c.blurb;
    elSpecs.innerHTML = [['Clock', c.clock], ['Processo', c.node], ['Pacote', c.pkg], ['Densidade', words(c.t / c.die) + ' /mm²']].map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd>' + U.esc(r[1]) + '</dd></div>';
    }).join('');
    setOdo(c.t); updateInsights(c);
    [].forEach.call(list.children, function (li, k) { li.firstChild.classList.toggle('is-on', k === i); li.firstChild.classList.toggle('is-future', k > i); });
  }
  function updateReadout() {
    var ci = currentIdx(year);
    if (ci !== curIdx) setChip(ci, curIdx < 0);
    elYear.textContent = Math.floor(year + 0.001);
    elRel.textContent = (ci === 0 ? '1× o Intel 4004' : (chips[ci].t / chips[0].t >= 1000 ? words(chips[ci].t / chips[0].t) + ' de vezes o 4004' : U.fmt(chips[ci].t / chips[0].t) + '× o 4004')) + ' · Moore previa ' + words(moore(year));
    slider.style.setProperty('--fill', ((year - YMIN) / (YMAX - YMIN) * 100).toFixed(1) + '%');
    if (!slider.matches(':active')) slider.value = year;
  }

  function touch() { if (!touched) { touched = true; SV.xp.mark('misc', 'moore', 15, 'Lei de Moore explorada'); } }
  function setTarget(v, user) { yearTarget = U.clamp(v, YMIN, YMAX); if (user) { touch(); setPlay(false); } }

  /* ---------- reproduzir ---------- */
  function setPlay(on) {
    if (on === playing) return;
    playing = on; hold = 0;
    elPlayIco.textContent = on ? '❚❚' : '▶'; elPlayTxt.textContent = on ? 'Pausar' : 'Reproduzir 50 anos';
    elPlay.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { touch(); if (year >= YMAX - 0.2) { year = yearTarget = YMIN; } }
  }
  elPlay.addEventListener('click', function () { setPlay(!playing); });

  /* ---------- interação no gráfico ---------- */
  function snap(px) {
    for (var i = 0; i < NC; i++) if (Math.abs(px - xp(chips[i].y)) < 13) return chips[i].y;
    return null;
  }
  function pointerYear(e) {
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, s = snap(x);
    setTarget(s !== null ? s : yrAt(x), true);
  }
  var dragging = false;
  wrap.addEventListener('pointerdown', function (e) { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } pointerYear(e); });
  wrap.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect(); hoverX = e.clientX - r.left; dirty = true;
    if (dragging || e.pointerType === 'mouse') pointerYear(e);
  });
  wrap.addEventListener('pointerleave', function () { hoverX = null; dirty = true; });
  wrap.addEventListener('pointerup', function () { dragging = false; });
  wrap.addEventListener('pointercancel', function () { dragging = false; });
  wrap.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowRight') { e.preventDefault(); setTarget(Math.floor(yearTarget + 0.001) + step, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setTarget(Math.ceil(yearTarget - 0.001) - step, true); }
    else if (e.key === 'Home') { e.preventDefault(); setTarget(YMIN, true); }
    else if (e.key === 'End') { e.preventDefault(); setTarget(YMAX, true); }
    else if (e.key === ' ') { e.preventDefault(); setPlay(!playing); }
  });
  slider.addEventListener('input', function () { setTarget(parseFloat(slider.value), true); });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]');
    if (!b) return;
    var t = parseFloat(b.dataset.t);
    [].forEach.call(seg.querySelectorAll('button'), function (x) { x.classList.toggle('is-on', x === b); });
    if (t === 0) showMoore = false; else { showMoore = true; period = t; }
    dirty = true; touch();
  });

  /* ---------- cards com prévia ---------- */
  var pop = document.createElement('div');
  pop.className = 'chippop'; pop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pop);
  var popT = 0;
  function showPop(i, card) {
    clearTimeout(popT);
    var c = chips[i];
    pop.innerHTML = '<div class="chippop__art">' + SV.chipArt(c) + '</div><div class="chippop__body">' +
      '<div class="chippop__top"><span class="logo"><img src="' + logoSrc(c) + '" alt=""></span><span class="mono chippop__yr">' + c.y + '</span></div>' +
      '<h4>' + U.esc(c.n) + '</h4><p>' + U.esc(c.blurb) + '</p>' +
      '<dl class="specs specs--sm"><div><dt>Transistores</dt><dd>' + words(c.t) + '</dd></div><div><dt>Processo</dt><dd>' + U.esc(c.node) + '</dd></div><div><dt>Clock</dt><dd>' + U.esc(c.clock) + '</dd></div><div><dt>Pacote</dt><dd>' + U.esc(c.pkg) + '</dd></div></dl></div>';
    var r = card.getBoundingClientRect(), w = Math.min(310, window.innerWidth - 24), ph = pop.offsetHeight || 380;
    pop.style.width = w + 'px';
    var left = U.clamp(r.left + r.width / 2 - w / 2, 12, window.innerWidth - w - 12);
    var above = r.top > ph + 20, top = above ? r.top - ph - 12 : Math.min(r.bottom + 12, window.innerHeight - ph - 12);
    pop.style.left = left + 'px'; pop.style.top = Math.max(12, top) + 'px';
    pop.classList.add('is-on');
  }
  function hidePop() { popT = setTimeout(function () { pop.classList.remove('is-on'); }, 60); }

  chips.forEach(function (c, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" class="chipcard"><span class="logo logo--sm"><img src="' + logoSrc(c) + '" alt="' + c.brand + '" loading="lazy"></span>' +
      '<span class="chipcard__n">' + U.esc(c.n) + '</span><span class="chipcard__m mono">' + c.y + ' · ' + words(c.t) + '</span></button>';
    var b = li.firstChild;
    b.addEventListener('click', function (e) {
      setTarget(c.y, true);
      if (window.matchMedia('(hover: none)').matches) { showPop(i, b); setTimeout(hidePop, 2600); }
    });
    b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showPop(i, b); });
    b.addEventListener('pointerleave', hidePop);
    b.addEventListener('focus', function () { showPop(i, b); });
    b.addEventListener('blur', hidePop);
    list.appendChild(li);
  });
  window.addEventListener('scroll', function () { if (pop.classList.contains('is-on')) pop.classList.remove('is-on'); }, { passive: true });

  /* ---------- ciclo de vida ---------- */
  function resize() {
    var r = wrap.getBoundingClientRect();
    if (r.width < 10) return;
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    pad.l = W < 520 ? 52 : 66; pad.r = W < 520 ? 14 : 24;
    dirty = true;
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);
  resize();

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !started) started = true;
    }, { threshold: 0.2 }).observe(wrap);
  } else { visible = true; started = true; }

  var SPEED = 4.2;
  SV.frame(function (t, dt) {
    T = t;
    if (!visible || !W) return;
    if (playing) {
      if (hold > 0) hold -= dt;
      else {
        var prev = yearTarget;
        yearTarget = Math.min(YMAX, yearTarget + SPEED * dt);
        for (var i = 0; i < NC; i++) if (chips[i].y > prev + 0.0001 && chips[i].y <= yearTarget) { yearTarget = chips[i].y; hold = 1.1; break; }
        year = yearTarget;
        if (yearTarget >= YMAX && hold <= 0) setPlay(false);
      }
    } else {
      var moved = Math.abs(yearTarget - year) > 0.002;
      if (moved) year += (yearTarget - year) * (SV.reduced() ? 1 : 1 - Math.exp(-dt * 10)); else year = yearTarget;
    }
    if (started && reveal < 1) reveal = SV.reduced() ? 1 : Math.min(1, reveal + dt / 2.4);
    draw(dt);
    updateReadout();
  });
  updateReadout();
})();
