/*
 * Herói: viagem pelo tempo desenhada em canvas 2D e guiada pelo scroll.
 * Um "tecido" horizontal com 7 cenários (um por era). A câmera desliza por eles
 * enquanto o dia passa do amanhecer à noite. Tudo é geometria desenhada à mão.
 *
 * Depuração: abra index.html?scene=0.5 para congelar a cena em p = 0.5 (0..1).
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var hero = document.getElementById('top');
  var canvas = document.getElementById('scene');
  if (!hero || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var N = DATA.eras.length, TAU = Math.PI * 2;
  var rnd = U.rnd, clamp = U.clamp, lerp = U.lerp, sstep = U.sstep;

  /* ---------- estado ---------- */
  var W = 0, H = 0, dpr = 1, u = 1, horizon = 0, ground = 0, SPACE = 0;
  var target = 0, p = 0, mx = 0, my = 0, tmx = 0, tmy = 0, T = 0;
  var tc = 0, camPx = 0, introShift = 0;
  var PL = null, night = 0, dim = 0, wl = 0;
  var NIGHT = [9, 13, 24];
  var notes = [];
  var forced = null;
  var m = /[?&]scene=([0-9.]+)/.exec(window.location.search);
  if (m) forced = clamp(parseFloat(m[1]), 0, 1);

  /* ---------- helpers de desenho ---------- */
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function lit(c, a) { return rgb(mix(c, NIGHT, dim), a); }
  function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function circ(x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); }
  function poly(pts, col) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function rrect(x, y, w, h, r, col) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    ctx.fillStyle = col; ctx.fill();
  }
  function glow(x, y, r, c, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgb(c, a)); g.addColorStop(1, rgb(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function note(text, x, y, tx, ty, i) {
    var a = (1 - clamp(Math.abs(tc - i) / 0.38, 0, 1)) * sstep(0.012, 0.05, p);
    if (a > 0.02) notes.push({ t: text, x: x, y: y, tx: tx, ty: ty, a: a * a * (3 - 2 * a) });
  }

  /* janelas: fração acesa cresce com a noite */
  function windows(x, y, w, h, cols, rows, seed, warm) {
    var cw = w / cols, ch = h / rows, ww = cw * 0.58, wh = ch * 0.52;
    var off = rgb(mix(PL.bot, [24, 32, 48], 0.55 + 0.4 * night), 0.7);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = rnd(seed, c, r);
        var on = v < 0.1 + 0.84 * wl;
        if (on) {
          var tw = 0.82 + 0.18 * Math.sin(T * 1.7 + v * 40);
          ctx.fillStyle = warm ? rgb([255, 208, 128], 0.9 * tw * (0.5 + 0.5 * wl)) : rgb([166, 226, 255], 0.85 * tw * (0.5 + 0.5 * wl));
        } else ctx.fillStyle = off;
        ctx.fillRect(x + c * cw + (cw - ww) / 2, y + r * ch + (ch - wh) / 2, ww, wh);
      }
    }
  }

  /* ---------- paleta do dia ---------- */
  var KN = [
    { p: 0.00, top: [26, 32, 62],  bot: [236, 150, 92],  gnd: [28, 24, 28] },
    { p: 0.18, top: [44, 78, 128], bot: [176, 196, 216], gnd: [22, 28, 30] },
    { p: 0.42, top: [36, 76, 140], bot: [160, 192, 222], gnd: [20, 30, 30] },
    { p: 0.62, top: [54, 64, 112], bot: [240, 172, 98],  gnd: [26, 24, 28] },
    { p: 0.76, top: [22, 22, 54],  bot: [206, 96, 92],   gnd: [16, 16, 24] },
    { p: 0.88, top: [7, 9, 24],    bot: [24, 36, 68],    gnd: [8, 10, 16] },
    { p: 1.00, top: [4, 6, 16],    bot: [12, 38, 54],    gnd: [6, 9, 13] }
  ];
  function palette(pp) {
    for (var i = 0; i < KN.length - 1; i++) {
      if (pp <= KN[i + 1].p) {
        var a = KN[i], b = KN[i + 1], t = (pp - a.p) / (b.p - a.p);
        t = t * t * (3 - 2 * t);
        return { top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t), gnd: mix(a.gnd, b.gnd, t) };
      }
    }
    var l = KN[KN.length - 1];
    return { top: l.top, bot: l.bot, gnd: l.gnd };
  }

  /* ---------- fundo: céu, astros, montanhas ---------- */
  var STARS = [];
  for (var s = 0; s < 150; s++) STARS.push({ x: rnd(s, 1), y: rnd(s, 2) * 0.56, r: 0.5 + rnd(s, 3) * 1.2, w: 0.8 + rnd(s, 4) * 2.4 });

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, rgb(PL.top)); g.addColorStop(1, rgb(PL.bot));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);

    var sa = sstep(0.64, 0.88, p);
    if (sa > 0.01) {
      for (var i = 0; i < STARS.length; i++) {
        var st = STARS[i];
        var x = ((st.x * W - camPx * 0.03 - mx * 6 * st.r) % W + W) % W;
        var a = sa * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T * st.w + i)));
        ctx.fillStyle = 'rgba(235,240,255,' + a.toFixed(3) + ')';
        ctx.fillRect(x, st.y * H, st.r, st.r);
      }
    }
    /* sol: cruza o céu durante a viagem */
    var sunT = p / 0.8;
    if (sunT < 1.18) {
      var ang = Math.PI * (1 - sunT);
      var sx = W * 0.5 + Math.cos(ang) * W * 0.44 - mx * 10 * u;
      var sy = horizon + 46 * u - Math.sin(ang) * H * 0.5;
      glow(sx, sy, 300 * u, [255, 190, 110], 0.5 * (1 - sstep(0.9, 1.18, sunT)));
      circ(sx, sy, 32 * u, rgb([255, 238, 205], 1 - sstep(0.95, 1.15, sunT)));
    }
    /* lua */
    var ma = sstep(0.66, 0.9, p);
    if (ma > 0.01) {
      var lx = W * 0.8 - mx * 14 * u, ly = H * 0.2 + (1 - ma) * 40 * u;
      glow(lx, ly, 120 * u, [180, 210, 255], 0.28 * ma);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(lx + 9 * u, ly - 4 * u, 20 * u, 0, TAU);
      ctx.clip('evenodd');
      circ(lx, ly, 22 * u, rgb([236, 242, 255], ma));
      ctx.restore();
    }
    /* brilho de aurora no horizonte para a era da IA */
    var aa = sstep(0.86, 1, p);
    if (aa > 0.01) {
      var ag = ctx.createRadialGradient(W * 0.5, horizon, 0, W * 0.5, horizon, W * 0.7);
      ag.addColorStop(0, rgb([79, 227, 200], 0.22 * aa)); ag.addColorStop(1, rgb([79, 227, 200], 0));
      ctx.fillStyle = ag; ctx.fillRect(0, 0, W, horizon);
    }
  }

  var HILLS = [
    { f: 0.0013, base: -88, amp: 120, par: 0.10, ph: [1.2, 4.1, 0.3], k: 0.40 },
    { f: 0.0019, base: -42, amp: 90,  par: 0.22, ph: [2.7, 0.9, 5.1], k: 0.58 },
    { f: 0.0027, base: -4,  amp: 56,  par: 0.42, ph: [5.2, 2.2, 1.7], k: 0.76 }
  ];
  function hillY(L, x) {
    var v = 0.5 * Math.sin(x * L.f + L.ph[0]) + 0.3 * Math.sin(x * L.f * 2.3 + L.ph[1]) + 0.2 * Math.sin(x * L.f * 5.1 + L.ph[2]);
    return horizon + (L.base - L.amp * (0.5 + 0.5 * v)) * u;
  }
  function drawHills() {
    for (var i = 0; i < HILLS.length; i++) {
      var L = HILLS[i], off = camPx * L.par + mx * (6 + i * 5) * u;
      ctx.beginPath(); ctx.moveTo(-10, H);
      for (var x = -10; x <= W + 10; x += 10) ctx.lineTo(x, hillY(L, x + off));
      ctx.lineTo(W + 10, H); ctx.closePath();
      ctx.fillStyle = rgb(mix(PL.bot, PL.gnd, L.k)); ctx.fill();
    }
  }

  function drawGround() {
    var g = ctx.createLinearGradient(0, horizon, 0, H);
    g.addColorStop(0, rgb(mix(PL.gnd, PL.bot, 0.14))); g.addColorStop(0.35, rgb(PL.gnd)); g.addColorStop(1, rgb(mix(PL.gnd, [0, 0, 0], 0.45)));
    ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);

    /* grade luminosa no chão (era da IA) */
    var ga = sstep(4.6, 6, tc) * 0.42;
    if (ga > 0.01) {
      ctx.lineWidth = 1; ctx.strokeStyle = rgb([79, 227, 200], ga * 0.9);
      ctx.beginPath();
      for (var k = 1; k <= 11; k++) {
        var yy = horizon + (H - horizon) * Math.pow(k / 11, 1.9);
        ctx.moveTo(0, yy); ctx.lineTo(W, yy);
      }
      var sp = 84 * u, shift = camPx % sp;
      for (var i = -18; i <= 18; i++) {
        var bx = W / 2 + i * sp - shift;
        ctx.moveTo(W / 2 + (bx - W / 2) * 0.1, horizon); ctx.lineTo(bx, H);
      }
      ctx.stroke();
    }
    /* estrada */
    var ry = ground + 24 * u, rh = 34 * u;
    rect(0, ry, W, rh, lit([46, 48, 56]));
    rect(0, ry, W, 1.5 * u, rgb([255, 255, 255], 0.1));
    var dash = 34 * u, gap = 34 * u, doff = camPx % (dash + gap);
    ctx.fillStyle = rgb([240, 232, 200], 0.55 - dim * 0.25);
    for (var x = -doff - dash; x < W; x += dash + gap) ctx.fillRect(x, ry + rh / 2 - 1.2 * u, dash, 2.4 * u);
  }

  /* ---------- cenário 0: pomares ---------- */
  function tree(x, y, sc, seed) {
    var sway = Math.sin(T * 1.1 + seed) * 1.6 * u * sc;
    rect(x - 3 * sc * u, y - 24 * sc * u, 6 * sc * u, 24 * sc * u, lit([92, 62, 40]));
    circ(x + sway, y - 42 * sc * u, 27 * sc * u, lit([54, 106, 64]));
    circ(x + sway - 9 * sc * u, y - 50 * sc * u, 15 * sc * u, lit([78, 134, 82]));
    circ(x + sway + 11 * sc * u, y - 36 * sc * u, 14 * sc * u, lit([46, 92, 58]));
    for (var k = 0; k < 5; k++) {
      circ(x + sway + (rnd(seed, k, 1) - 0.5) * 42 * sc * u, y - 42 * sc * u + (rnd(seed, k, 2) - 0.5) * 38 * sc * u, 2.4 * sc * u, lit([255, 150, 60]));
    }
  }
  function pOrchard(cx, g) {
    var wx = cx - 215 * u;
    poly([wx - 15 * u, g, wx + 15 * u, g, wx + 7 * u, g - 132 * u, wx - 7 * u, g - 132 * u], lit([138, 112, 84]));
    ctx.save(); ctx.translate(wx, g - 136 * u); ctx.rotate(T * 0.5);
    for (var k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = lit([200, 188, 164]); ctx.fillRect(4 * u, -4 * u, 66 * u, 8 * u);
      ctx.fillStyle = lit([140, 124, 100]); ctx.fillRect(10 * u, -1.2 * u, 56 * u, 2.4 * u);
    }
    ctx.restore(); circ(wx, g - 136 * u, 6 * u, lit([70, 56, 44]));

    var bx = cx + 150 * u;
    rect(bx, g - 72 * u, 130 * u, 72 * u, lit([152, 58, 48]));
    poly([bx - 8 * u, g - 70 * u, bx + 65 * u, g - 120 * u, bx + 138 * u, g - 70 * u], lit([82, 40, 38]));
    rect(bx + 46 * u, g - 46 * u, 38 * u, 46 * u, lit([228, 216, 192]));
    ctx.strokeStyle = lit([152, 58, 48]); ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.moveTo(bx + 46 * u, g - 46 * u); ctx.lineTo(bx + 84 * u, g); ctx.moveTo(bx + 84 * u, g - 46 * u); ctx.lineTo(bx + 46 * u, g); ctx.stroke();

    var i, x;
    for (i = -6; i <= 6; i++) {
      x = cx + i * 52 * u;
      if (x > bx - 22 * u && x < bx + 150 * u) continue;
      tree(x, g - 6 * u, 0.72, i + 10);
    }
    for (i = -4; i <= 4; i++) tree(cx + i * 84 * u + 22 * u, g + 28 * u, 1.05, i + 30);
    note('POMARES · VALE DE SANTA CLARA', cx + 20 * u, g - 205 * u, cx + 22 * u, g - 16 * u, 0);
  }

  /* ---------- cenário 1: garagem da HP, rádio e Torre Hoover ---------- */
  function figure(x, g, sc) {
    ctx.fillStyle = 'rgba(20,14,10,.85)';
    ctx.beginPath(); ctx.arc(x, g - 29 * u * sc, 4.6 * u * sc, 0, TAU); ctx.fill();
    ctx.fillRect(x - 4.5 * u * sc, g - 24 * u * sc, 9 * u * sc, 24 * u * sc);
  }
  function pGarage(cx, g) {
    var mastX = cx - 262 * u, top = g - 250 * u;
    ctx.strokeStyle = lit([140, 150, 164]); ctx.lineWidth = 2 * u; ctx.beginPath();
    ctx.moveTo(mastX - 18 * u, g); ctx.lineTo(mastX - 2.5 * u, top); ctx.moveTo(mastX + 18 * u, g); ctx.lineTo(mastX + 2.5 * u, top);
    for (var k = 0; k < 9; k++) {
      var y1 = g - k * 27.5 * u, y2 = g - (k + 1) * 27.5 * u, w1 = lerp(18, 2.5, k / 9) * u, w2 = lerp(18, 2.5, (k + 1) / 9) * u;
      ctx.moveTo(mastX - w1, y1); ctx.lineTo(mastX + w2, y2); ctx.moveTo(mastX + w1, y1); ctx.lineTo(mastX - w2, y2);
    }
    ctx.stroke();
    var on = Math.sin(T * 3.2) > 0.1;
    circ(mastX, top - 4 * u, 3.8 * u, on ? 'rgb(255,92,70)' : lit([90, 40, 36]));
    if (on) glow(mastX, top - 4 * u, 26 * u, [255, 90, 70], 0.6);
    for (k = 0; k < 3; k++) {
      var r = ((T * 38 + k * 42) % 126) * u, al = 1 - r / (126 * u);
      ctx.strokeStyle = rgb([255, 205, 130], al * 0.5); ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.arc(mastX, top - 4 * u, r, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    }

    /* Torre Hoover */
    var hx = cx + 222 * u;
    rect(hx - 60 * u, g - 58 * u, 120 * u, 58 * u, lit([188, 150, 110]));
    rect(hx - 22 * u, g - 252 * u, 44 * u, 196 * u, lit([204, 168, 126]));
    rect(hx + 8 * u, g - 252 * u, 14 * u, 196 * u, lit([176, 140, 102]));
    for (k = 0; k < 8; k++) rect(hx - 3 * u, g - 84 * u - k * 20 * u, 6 * u, 11 * u, lit([60, 40, 30]));
    rect(hx - 21 * u, g - 296 * u, 42 * u, 46 * u, lit([212, 178, 136]));
    for (k = -1; k <= 1; k++) {
      ctx.beginPath(); ctx.arc(hx + k * 12 * u, g - 268 * u, 4.4 * u, Math.PI, 0); ctx.lineTo(hx + k * 12 * u + 4.4 * u, g - 256 * u); ctx.lineTo(hx + k * 12 * u - 4.4 * u, g - 256 * u); ctx.closePath();
      ctx.fillStyle = rgb([255, 208, 130], 0.2 + 0.7 * wl); ctx.fill();
    }
    poly([hx - 17 * u, g - 296 * u, hx + 17 * u, g - 296 * u, hx, g - 350 * u], lit([150, 96, 78]));
    ctx.beginPath(); ctx.arc(hx, g - 40 * u, 14 * u, Math.PI, 0); ctx.lineTo(hx + 14 * u, g); ctx.lineTo(hx - 14 * u, g); ctx.closePath();
    ctx.fillStyle = lit([54, 36, 28]); ctx.fill();

    /* casa e garagem */
    var h0 = cx - 172 * u;
    rect(h0, g - 66 * u, 112 * u, 66 * u, lit([184, 170, 148]));
    poly([h0 - 10 * u, g - 66 * u, h0 + 56 * u, g - 110 * u, h0 + 122 * u, g - 66 * u], lit([98, 64, 56]));
    var wcol = rgb([255, 214, 140], 0.28 + 0.65 * wl);
    rect(h0 + 14 * u, g - 48 * u, 22 * u, 22 * u, wcol); rect(h0 + 50 * u, g - 48 * u, 22 * u, 22 * u, wcol);
    rect(h0 + 86 * u, g - 46 * u, 18 * u, 46 * u, lit([122, 86, 64]));
    var g0 = h0 + 112 * u;
    rect(g0, g - 54 * u, 80 * u, 54 * u, lit([172, 158, 136]));
    poly([g0 - 4 * u, g - 54 * u, g0 + 40 * u, g - 74 * u, g0 + 84 * u, g - 54 * u], lit([88, 58, 52]));
    var fl = 0.8 + 0.1 * Math.sin(T * 9) + 0.05 * Math.sin(T * 23);
    glow(g0 + 40 * u, g - 22 * u, 120 * u, [255, 190, 100], 0.26 * (0.5 + 0.5 * wl));
    rect(g0 + 8 * u, g - 44 * u, 64 * u, 44 * u, rgb([255, 192, 104], fl));
    rect(g0 + 14 * u, g - 14 * u, 52 * u, 4 * u, 'rgba(60,34,18,.85)');
    rect(g0 + 44 * u, g - 26 * u, 14 * u, 12 * u, 'rgba(60,34,18,.8)');
    figure(g0 + 26 * u, g, 1); figure(g0 + 52 * u, g, 0.92);
    ctx.fillStyle = lit([208, 204, 194]);
    for (var fx = h0 - 14 * u; fx < g0 + 84 * u; fx += 9 * u) ctx.fillRect(fx, g - 16 * u, 4 * u, 20 * u);
    ctx.fillRect(h0 - 14 * u, g - 11 * u, g0 + 98 * u - h0, 2.4 * u);
    note('367 ADDISON AVE · 1939 · US$ 538', cx - 30 * u, g - 178 * u, g0 + 40 * u, g - 76 * u, 1);
  }

  /* ---------- cenário 2: fábrica de chips, wafer, os oito ---------- */
  function wafer(x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.36);
    var gl = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.7);
    gl.addColorStop(0, rgb([120, 220, 255], 0.35)); gl.addColorStop(1, rgb([120, 220, 255], 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, TAU); ctx.fill();
    var a = T * 0.35, lg = ctx.createLinearGradient(Math.cos(a) * r, Math.sin(a) * r, -Math.cos(a) * r, -Math.sin(a) * r);
    lg.addColorStop(0, '#5b78d8'); lg.addColorStop(0.5, '#8a5fd0'); lg.addColorStop(1, '#37c6c0');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = lg; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; ctx.beginPath();
    var sp = 13 * u;
    for (var gx = -r; gx <= r; gx += sp) { ctx.moveTo(gx, -r); ctx.lineTo(gx, r); ctx.moveTo(-r, gx); ctx.lineTo(r, gx); }
    ctx.stroke();
    var sh = ctx.createLinearGradient(-r, -r, r, r);
    sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = sh; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function walker(x, y, sc, ph) {
    var b = Math.sin(T * 6 + ph) * 1.6 * u * sc;
    ctx.fillStyle = 'rgba(14,16,22,.9)';
    ctx.beginPath(); ctx.arc(x, y - 21 * u * sc + b * 0.4, 3.2 * u * sc, 0, TAU); ctx.fill();
    ctx.fillRect(x - 3 * u * sc, y - 17 * u * sc + b * 0.4, 6 * u * sc, 11 * u * sc);
    ctx.fillRect(x - 3 * u * sc, y - 7 * u * sc, 2.4 * u * sc, 7 * u * sc + b);
    ctx.fillRect(x + 0.6 * u * sc, y - 7 * u * sc, 2.4 * u * sc, 7 * u * sc - b);
  }
  function pFab(cx, g) {
    var x0 = cx - 205 * u, w = 340 * u, hgt = 84 * u, top = g - hgt;
    rect(x0, top, w, hgt, lit([132, 144, 158]));
    for (var k = 0; k < 5; k++) {
      var tx = x0 + k * 68 * u;
      poly([tx, top, tx, top - 30 * u, tx + 68 * u, top], lit([104, 116, 130]));
      rect(tx + 1 * u, top - 28 * u, 3 * u, 28 * u, rgb([170, 226, 255], 0.35 + 0.55 * wl));
    }
    windows(x0 + 10 * u, top + 14 * u, w - 20 * u, 40 * u, 14, 2, 21, false);
    rect(x0 + 140 * u, g - 28 * u, 60 * u, 28 * u, lit([60, 68, 80]));
    rect(x0 + 288 * u, top - 46 * u, 18 * u, 46 * u, lit([116, 126, 140]));
    rect(x0 + 20 * u, top - 14 * u, 34 * u, 14 * u, lit([116, 126, 140]));
    var wy = g - 256 * u + Math.sin(T * 0.9) * 6 * u;
    wafer(cx + 24 * u, wy, 108 * u);
    var base = cx + 150 * u;
    for (var j = 0; j < 8; j++) walker(base + ((T * 13 * u + j * 15 * u) % (240 * u)) - 120 * u, g + 36 * u, 1.1, j);
    note('WAFER DE SILÍCIO · FAIRCHILD 1957', cx + 24 * u, wy - 78 * u, cx + 24 * u, wy - 14 * u, 2);
  }

  /* ---------- cenário 3: computador pessoal ---------- */
  function officeBlock(x, g, w, h, cols, rows, seed) {
    rect(x, g - h, w, h, lit([128, 138, 152]));
    rect(x, g - h, w, 5 * u, lit([96, 104, 118]));
    windows(x + 8 * u, g - h + 14 * u, w - 16 * u, h - 24 * u, cols, rows, seed, true);
  }
  function dip(x, y) {
    rect(x - 12 * u, y - 26 * u, 24 * u, 52 * u, lit([30, 34, 42]));
    ctx.fillStyle = lit([200, 190, 160]);
    for (var k = 0; k < 8; k++) { ctx.fillRect(x - 17 * u, y - 23 * u + k * 6.4 * u, 6 * u, 2.6 * u); ctx.fillRect(x + 11 * u, y - 23 * u + k * 6.4 * u, 6 * u, 2.6 * u); }
    ctx.beginPath(); ctx.arc(x, y - 26 * u, 4 * u, 0, Math.PI); ctx.fillStyle = lit([60, 66, 78]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '600 ' + (7.5 * u) + 'px "Geist Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('4004', x, y + 2 * u); ctx.textAlign = 'start';
  }
  var BOOT = ['> LOAD "HELLO"', '> RUN', 'HELLO, VALLEY', '> _'];
  function pPC(cx, g) {
    officeBlock(cx - 296 * u, g, 150 * u, 118 * u, 8, 4, 31);
    officeBlock(cx + 156 * u, g, 134 * u, 92 * u, 7, 3, 32);

    var cw = 252 * u, c0 = cx - cw / 2, caseTop = g - 64 * u;
    rrect(c0, caseTop, cw, 48 * u, 6 * u, lit([214, 200, 168]));
    rect(c0 + 154 * u, caseTop + 14 * u, 70 * u, 5 * u, lit([60, 54, 46]));
    rect(c0 + 154 * u, caseTop + 27 * u, 70 * u, 5 * u, lit([60, 54, 46]));
    var mw = 170 * u, mh = 142 * u, mx0 = c0 + 18 * u, my0 = caseTop - mh + 4 * u;
    rrect(mx0, my0, mw, mh, 12 * u, lit([222, 208, 176]));
    var sx = mx0 + 14 * u, sy = my0 + 14 * u, sw = mw - 28 * u, sh = mh - 38 * u;
    glow(sx + sw / 2, sy + sh / 2, 190 * u, [90, 255, 150], 0.1 + 0.2 * night);
    rrect(sx, sy, sw, sh, 8 * u, 'rgb(8,26,14)');
    ctx.fillStyle = 'rgba(110,255,160,.92)'; ctx.font = '500 ' + (9.5 * u) + 'px "Geist Mono", ui-monospace, monospace'; ctx.textBaseline = 'top';
    var shown = Math.min(BOOT.length, 1 + Math.floor((T * 0.7) % 6));
    for (var k = 0; k < shown; k++) {
      var line = BOOT[k];
      if (k === BOOT.length - 1 && Math.sin(T * 6) < 0) line = '> ';
      ctx.fillText(line, sx + 9 * u, sy + 9 * u + k * 15 * u);
    }
    ctx.textBaseline = 'alphabetic';
    rect(mx0 + 14 * u, my0 + mh - 18 * u, 26 * u, 4 * u, lit([170, 156, 126]));
    poly([c0 + 14 * u, g - 16 * u, c0 + cw - 14 * u, g - 16 * u, c0 + cw + 6 * u, g + 18 * u, c0 - 6 * u, g + 18 * u], lit([190, 176, 148]));
    ctx.fillStyle = lit([92, 86, 74]);
    for (var r = 0; r < 3; r++) for (var c = 0; c < 15; c++) ctx.fillRect(c0 + 6 * u + c * 16 * u + r * 3 * u, g - 11 * u + r * 9 * u, 11 * u, 5 * u);
    dip(cx + 195 * u, g - 188 * u + Math.sin(T * 1.4) * 7 * u);
    note('APPLE II · 1977  ·  INTEL 4004 · 1971', cx, g - 252 * u, cx - 40 * u, g - 196 * u, 3);
  }

  /* ---------- cenário 4: internet ---------- */
  function pole(x, g, h) {
    rect(x - 3 * u, g - h, 6 * u, h, lit([100, 82, 62]));
    rect(x - 22 * u, g - h + 8 * u, 44 * u, 4 * u, lit([100, 82, 62]));
  }
  function catenary(x1, y1, x2, y2, sag, phase) {
    var cxm = (x1 + x2) / 2, ctrlY = (y1 + y2) / 2 + 2 * sag;
    ctx.strokeStyle = lit([30, 34, 42]); ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cxm, ctrlY, x2, y2); ctx.stroke();
    for (var k = 0; k < 4; k++) {
      var t = ((T * 0.45 + k / 4 + phase) % 1), it = 1 - t;
      var px = it * it * x1 + 2 * it * t * cxm + t * t * x2, py = it * it * y1 + 2 * it * t * ctrlY + t * t * y2;
      glow(px, py, 9 * u, [79, 227, 200], 0.8); circ(px, py, 2.2 * u, 'rgb(190,255,240)');
    }
  }
  function pNet(cx, g) {
    var hgt = 150 * u;
    pole(cx - 280 * u, g, hgt); pole(cx - 6 * u, g, hgt + 14 * u); pole(cx + 270 * u, g, hgt);
    catenary(cx - 280 * u, g - hgt + 10 * u, cx - 6 * u, g - hgt - 6 * u, 26 * u, 0);
    catenary(cx - 6 * u, g - hgt - 6 * u, cx + 270 * u, g - hgt + 10 * u, 26 * u, 0.4);
    catenary(cx - 280 * u, g - hgt + 20 * u, cx + 270 * u, g - hgt + 20 * u, 60 * u, 0.7);

    var bw = 270 * u, bh = 180 * u, bx = cx - bw / 2 - 30 * u, by = g - 312 * u;
    rect(bx + 30 * u, by + bh, 9 * u, 312 * u - bh - 3 * u, lit([70, 74, 84]));
    rect(bx + bw - 40 * u, by + bh, 9 * u, 312 * u - bh - 3 * u, lit([70, 74, 84]));
    glow(bx + bw / 2, by + bh / 2, 230 * u, [120, 190, 255], 0.14 + 0.16 * night);
    rrect(bx, by, bw, bh, 10 * u, lit([28, 34, 46]));
    rrect(bx + 6 * u, by + 6 * u, bw - 12 * u, bh - 12 * u, 6 * u, 'rgb(236,240,248)');
    rect(bx + 6 * u, by + 6 * u, bw - 12 * u, 24 * u, 'rgb(214,220,232)');
    circ(bx + 20 * u, by + 18 * u, 4 * u, '#ff6159'); circ(bx + 34 * u, by + 18 * u, 4 * u, '#ffbd2e'); circ(bx + 48 * u, by + 18 * u, 4 * u, '#28c940');
    rrect(bx + 66 * u, by + 11 * u, bw - 90 * u, 14 * u, 7 * u, 'rgb(250,251,254)');
    ctx.fillStyle = 'rgb(90,98,114)'; ctx.font = '500 ' + (8.5 * u) + 'px "Geist Mono", monospace'; ctx.textBaseline = 'middle';
    ctx.fillText('www', bx + 76 * u, by + 18.5 * u); ctx.textBaseline = 'alphabetic';
    rect(bx + 16 * u, by + 42 * u, bw - 32 * u, 54 * u, 'rgb(86,128,214)');
    var wob = (T * 0.4) % 1;
    rect(bx + 16 * u, by + 42 * u, (bw - 32 * u) * wob, 54 * u, 'rgb(112,150,232)');
    for (var k = 0; k < 4; k++) rect(bx + 16 * u, by + 108 * u + k * 12 * u, (bw - 32 * u) * (0.9 - k * 0.17), 5 * u, 'rgb(180,188,204)');
    var prog = (T * 0.33) % 1;
    rect(bx + 16 * u, by + bh - 20 * u, bw - 32 * u, 5 * u, 'rgb(214,220,232)');
    rect(bx + 16 * u, by + bh - 20 * u, (bw - 32 * u) * prog, 5 * u, '#3b7bf0');
    var cxp = bx + 70 * u + Math.sin(T * 0.9) * 60 * u, cyp = by + 74 * u + Math.cos(T * 1.3) * 22 * u;
    poly([cxp, cyp, cxp, cyp + 15 * u, cxp + 4 * u, cyp + 11.5 * u, cxp + 7.5 * u, cyp + 18 * u, cxp + 10 * u, cyp + 17 * u, cxp + 6.6 * u, cyp + 10.6 * u, cxp + 11 * u, cyp + 10 * u], 'rgb(20,22,30)');
    var dx = cx + 214 * u;
    rect(dx - 2 * u, g - 54 * u, 4 * u, 54 * u, lit([120, 126, 138]));
    ctx.save(); ctx.translate(dx, g - 62 * u); ctx.rotate(-0.5);
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 32 * u, 0, 0, TAU); ctx.fillStyle = lit([196, 202, 212]); ctx.fill();
    ctx.restore();
    note('NETSCAPE · IPO · 9 AGO 1995', bx + bw / 2, by - 34 * u, bx + bw / 2, by + 2 * u, 4);
  }

  /* ---------- cenário 5: plataformas e celular ---------- */
  function tower(x, g, w, h, seed) {
    var gr = ctx.createLinearGradient(0, g - h, 0, g);
    gr.addColorStop(0, lit(mix(PL.bot, [120, 150, 190], 0.4))); gr.addColorStop(1, lit([60, 76, 100]));
    ctx.fillStyle = gr; ctx.fillRect(x, g - h, w, h);
    rect(x + w - 6 * u, g - h, 6 * u, h, 'rgba(0,0,0,.22)');
    windows(x + 4 * u, g - h + 10 * u, w - 12 * u, h - 14 * u, Math.max(3, Math.round(w / 14 / u)), Math.round(h / 16 / u), seed, false);
  }
  function car(x, y) {
    glow(x + 32 * u, y - 4 * u, 70 * u, [255, 240, 190], 0.28 * night);
    rrect(x, y - 14 * u, 64 * u, 16 * u, 5 * u, lit([210, 214, 224]));
    poly([x + 12 * u, y - 14 * u, x + 20 * u, y - 25 * u, x + 46 * u, y - 25 * u, x + 54 * u, y - 14 * u], lit([196, 202, 214]));
    poly([x + 17 * u, y - 15 * u, x + 22 * u, y - 23 * u, x + 44 * u, y - 23 * u, x + 50 * u, y - 15 * u], 'rgba(30,44,66,.85)');
    circ(x + 14 * u, y + 2 * u, 5.5 * u, 'rgb(22,24,30)'); circ(x + 50 * u, y + 2 * u, 5.5 * u, 'rgb(22,24,30)');
    ctx.save(); ctx.translate(x + 33 * u, y - 29 * u);
    rect(-5 * u, 0, 10 * u, 5 * u, 'rgb(40,46,60)');
    var a = T * 5, sg = ctx.createLinearGradient(0, 0, Math.cos(a) * 90 * u, Math.sin(a) * 18 * u);
    sg.addColorStop(0, 'rgba(79,227,200,.5)'); sg.addColorStop(1, 'rgba(79,227,200,0)');
    ctx.strokeStyle = sg; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 90 * u, Math.sin(a) * 18 * u); ctx.stroke();
    ctx.restore();
  }
  function pPlat(cx, g) {
    tower(cx - 300 * u, g, 66 * u, 196 * u, 51); tower(cx - 224 * u, g, 56 * u, 252 * u, 52); tower(cx + 188 * u, g, 74 * u, 214 * u, 53); tower(cx + 150 * u, g, 36 * u, 140 * u, 54);

    var pw = 118 * u, ph = 232 * u, px = cx - pw / 2 + 4 * u, py = g - ph - 6 * u;
    glow(px + pw / 2, py + ph / 2, 240 * u, [140, 190, 255], 0.2 + 0.18 * night);
    rrect(px, py, pw, ph, 18 * u, 'rgb(14,16,22)');
    rrect(px + 1.5 * u, py + 1.5 * u, pw - 3 * u, ph - 3 * u, 17 * u, 'rgb(52,58,72)');
    var sg = ctx.createLinearGradient(0, py, 0, py + ph);
    sg.addColorStop(0, '#2f5bd8'); sg.addColorStop(1, '#a24ad0');
    ctx.fillStyle = sg; ctx.fillRect(px + 8 * u, py + 30 * u, pw - 16 * u, ph - 74 * u);
    rrect(px + pw / 2 - 12 * u, py + 13 * u, 24 * u, 4 * u, 2 * u, 'rgb(14,16,22)');
    circ(px + pw / 2, py + ph - 22 * u, 10 * u, 'rgb(14,16,22)');
    ctx.strokeStyle = 'rgba(200,205,220,.7)'; ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.arc(px + pw / 2, py + ph - 22 * u, 6.5 * u, 0, TAU); ctx.stroke();
    var ax = px + 15 * u, ay = py + 40 * u, cell = 24 * u;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 4; c++) {
        var wave = 0.5 + 0.5 * Math.sin(T * 2.4 - (r + c) * 0.8), s = (0.8 + 0.2 * wave) * 17 * u;
        rrect(ax + c * cell + (cell - s) / 2 - 1 * u, ay + r * cell * 1.08 + (cell - s) / 2, s, s, 4.5 * u, 'hsl(' + ((r * 4 + c) * 28 + 200) % 360 + ',75%,' + (58 + wave * 12) + '%)');
      }
    }
    for (var k = 0; k < 5; k++) {
      var t = ((T * 0.22 + k / 5) % 1), fx = px + pw + 10 * u + Math.sin(k * 7 + T) * 24 * u + (k % 2 ? -pw - 70 * u : 0), fy = py + ph - t * (ph + 70 * u);
      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9;
      rrect(fx, fy, 22 * u, 22 * u, 6 * u, 'hsl(' + (k * 71 + 20) % 360 + ',78%,62%)');
      ctx.globalAlpha = 1;
    }
    car(cx - 300 * u + ((T * 54 * u) % (640 * u)), ground + 46 * u);
    note('iPHONE · 9 JAN 2007', px + pw / 2, py - 36 * u, px + pw / 2, py + 4 * u, 5);
  }

  /* ---------- cenário 6: data centers, GPU e rede neural ---------- */
  var NET = [3, 5, 5, 3];
  function dataCenter(x, g, w, h, seed) {
    rect(x, g - h, w, h, lit([34, 40, 54]));
    rect(x, g - h, w, 4 * u, lit([62, 72, 90]));
    var cols = Math.max(4, Math.round(w / (14 * u))), rows = Math.max(3, Math.round(h / (16 * u)));
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = rnd(seed, c, r), pul = 0.35 + 0.65 * Math.max(0, Math.sin(T * (1.4 + v * 3) + v * 30));
        ctx.fillStyle = v > 0.82 ? rgb([255, 176, 36], 0.9 * pul) : rgb([79, 227, 200], 0.9 * pul);
        ctx.fillRect(x + 7 * u + c * ((w - 14 * u) / cols), g - h + 12 * u + r * ((h - 20 * u) / rows), 4 * u, 3 * u);
      }
    }
    for (var f = 0; f < 2; f++) {
      var fxp = x + w * (0.3 + f * 0.4), fyp = g - h - 6 * u;
      circ(fxp, fyp, 9 * u, lit([20, 24, 32]));
      ctx.save(); ctx.translate(fxp, fyp); ctx.rotate(T * 7 + f);
      ctx.fillStyle = lit([120, 134, 156]);
      for (var b = 0; b < 3; b++) { ctx.rotate(TAU / 3); ctx.fillRect(0, -1.6 * u, 7.5 * u, 3.2 * u); }
      ctx.restore();
    }
  }
  function pAI(cx, g) {
    var dcs = [[cx - 262 * u, 150 * u, 94 * u], [cx - 90 * u, 170 * u, 128 * u], [cx + 100 * u, 160 * u, 84 * u]];
    for (var i = 0; i < dcs.length; i++) dataCenter(dcs[i][0], g, dcs[i][1], dcs[i][2], 60 + i);

    var nx = cx - 150 * u, ny = g - 385 * u, lg = 100 * u, vg = 34 * u, pts = [], l, j;
    for (l = 0; l < NET.length; l++) {
      pts[l] = [];
      for (j = 0; j < NET[l]; j++) pts[l].push([nx + l * lg, ny + (j - (NET[l] - 1) / 2) * vg + Math.sin(T * 0.8 + l * 2 + j) * 2.4 * u]);
    }
    var ei = 0;
    ctx.lineWidth = 1;
    for (l = 0; l < NET.length - 1; l++) {
      for (var a = 0; a < pts[l].length; a++) {
        for (var b = 0; b < pts[l + 1].length; b++) {
          var A = pts[l][a], B = pts[l + 1][b], ph = rnd(ei, 7), t = (T * 0.55 + ph) % 1;
          ctx.strokeStyle = rgb([79, 227, 200], 0.14); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
          if (ph > 0.55) { var qx = lerp(A[0], B[0], t), qy = lerp(A[1], B[1], t); glow(qx, qy, 8 * u, [255, 190, 90], 0.8); circ(qx, qy, 1.8 * u, 'rgb(255,236,190)'); }
          ei++;
        }
      }
    }
    for (l = 0; l < pts.length; l++) for (j = 0; j < pts[l].length; j++) {
      var act = 0.5 + 0.5 * Math.sin(T * 1.6 + l * 1.7 + j * 2.1);
      glow(pts[l][j][0], pts[l][j][1], 14 * u, [79, 227, 200], 0.35 * act); circ(pts[l][j][0], pts[l][j][1], 4.4 * u, rgb([200, 255, 245], 0.65 + 0.35 * act));
    }

    var chx = cx + 30 * u, chy = g - 232 * u + Math.sin(T * 1.2) * 6 * u, cs = 78 * u;
    ctx.strokeStyle = rgb([79, 227, 200], 0.45); ctx.lineWidth = 1.4 * u;
    for (i = 0; i < dcs.length; i++) {
      var tx = dcs[i][0] + dcs[i][1] / 2, ty = g - dcs[i][2] - 10 * u;
      ctx.beginPath(); ctx.moveTo(chx, chy + cs / 2); ctx.lineTo(chx, chy + cs / 2 + 18 * u); ctx.lineTo(tx, ty - 8 * u); ctx.lineTo(tx, ty); ctx.stroke();
      var tt = (T * 0.8 + i * 0.33) % 1; glow(lerp(chx, tx, tt), lerp(chy + cs / 2 + 18 * u, ty - 8 * u, tt), 8 * u, [255, 190, 90], 0.85);
    }
    glow(chx, chy, 130 * u, [79, 227, 200], 0.28 + 0.12 * Math.sin(T * 2));
    ctx.fillStyle = 'rgb(214,176,72)';
    for (var pin = 0; pin < 9; pin++) {
      var o = -cs / 2 + 8 * u + pin * ((cs - 16 * u) / 8);
      ctx.fillRect(chx + o - 1.2 * u, chy - cs / 2 - 7 * u, 2.4 * u, 7 * u); ctx.fillRect(chx + o - 1.2 * u, chy + cs / 2, 2.4 * u, 7 * u);
      ctx.fillRect(chx - cs / 2 - 7 * u, chy + o - 1.2 * u, 7 * u, 2.4 * u); ctx.fillRect(chx + cs / 2, chy + o - 1.2 * u, 7 * u, 2.4 * u);
    }
    var cg = ctx.createLinearGradient(chx - cs / 2, chy - cs / 2, chx + cs / 2, chy + cs / 2);
    cg.addColorStop(0, '#2a3446'); cg.addColorStop(1, '#10151f');
    rrect(chx - cs / 2, chy - cs / 2, cs, cs, 8 * u, cg);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.2 * u; ctx.strokeRect(chx - cs / 2 + 0.5, chy - cs / 2 + 0.5, cs - 1, cs - 1);
    var ds = cs * 0.5, dg = ctx.createLinearGradient(chx - ds / 2, chy - ds / 2, chx + ds / 2, chy + ds / 2);
    dg.addColorStop(0, rgb([79, 227, 200], 0.95)); dg.addColorStop(1, rgb([40, 140, 180], 0.95));
    rrect(chx - ds / 2, chy - ds / 2, ds, ds, 4 * u, dg);
    ctx.strokeStyle = 'rgba(8,20,30,.55)'; ctx.lineWidth = 1 * u; ctx.beginPath();
    for (var q = 1; q < 4; q++) { ctx.moveTo(chx - ds / 2 + q * ds / 4, chy - ds / 2); ctx.lineTo(chx - ds / 2 + q * ds / 4, chy + ds / 2); ctx.moveTo(chx - ds / 2, chy - ds / 2 + q * ds / 4); ctx.lineTo(chx + ds / 2, chy - ds / 2 + q * ds / 4); }
    ctx.stroke();
    note('GPU + REDE NEURAL · A NOVA ERA', chx - 10 * u, ny - 62 * u, chx, chy - cs / 2 - 10 * u, 6);
  }

  var PIECES = [pOrchard, pGarage, pFab, pPC, pNet, pPlat, pAI];

  /* ---------- anotações ---------- */
  function drawNotes() {
    if (!notes.length) return;
    ctx.font = '500 10.5px "Geist Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i], w = ctx.measureText(n.t).width + 20, x = clamp(n.x, w / 2 + 12, W - w / 2 - 12);
      ctx.globalAlpha = n.a;
      ctx.strokeStyle = 'rgba(241,239,232,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, n.y + 11); ctx.lineTo(n.tx, n.ty); ctx.stroke();
      circ(n.tx, n.ty, 3, '#ffb224');
      glow(n.tx, n.ty, 12, [255, 178, 36], 0.5);
      rrect(x - w / 2, n.y - 11, w, 22, 6, 'rgba(6,8,12,.78)');
      ctx.strokeStyle = 'rgba(241,239,232,.28)'; ctx.strokeRect(x - w / 2 + 0.5, n.y - 10.5, w - 1, 21);
      ctx.fillStyle = '#f1efe8'; ctx.fillText(n.t, x, n.y + 0.5);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* ---------- quadro ---------- */
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    PL = palette(p);
    night = sstep(0.62, 0.88, p); dim = night * 0.8; wl = 0.1 + 0.9 * night;
    tc = clamp(p * N - 0.5, 0, N - 1);
    camPx = tc * SPACE;
    introShift = (1 - sstep(0, 0.07, p)) * W * 0.22;
    notes.length = 0;

    drawSky(); drawHills(); drawGround();
    for (var i = 0; i < N; i++) {
      var cx = W / 2 + (i - tc) * SPACE + introShift - mx * 8 * u;
      if (Math.abs(cx - W / 2) < W / 2 + 330 * u) PIECES[i](cx, ground);
    }
    drawNotes();
  }

  /* ---------- HUD (DOM) ---------- */
  function $(id) { return document.getElementById(id); }
  var elIntro = $('heroIntro'), elCard = $('heroCard'), elYear = $('heroYear'), elEra = $('heroEra'), elCap = $('heroCap');
  var elStage = $('heroStage'), elRange = $('heroRange'), elCue = $('heroCue'), elBar = $('heroBar'), elTicks = $('heroTicks');
  var elAuto = $('btnAuto'), elAutoIco = $('btnAutoIco'), elAutoTxt = $('btnAutoTxt');
  var elPlay = $('heroPlay'), elPlayIco = $('heroPlayIco'), elPlayTxt = $('heroPlayTxt'), playMode = '';
  var curEra = -1, curYear = -1, ticks = [];
  var dwell = [], dwellDone = [], dwellCount = 0;

  DATA.eras.forEach(function (era, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tick';
    b.setAttribute('aria-label', 'Ir para ' + era.name);
    b.innerHTML = '<span>' + era.code + ' · ' + U.esc(era.name) + '</span>';
    b.addEventListener('click', function () { goToEra(i); });
    elTicks.appendChild(b); ticks.push(b);
  });
  function goToEra(i) {
    var top = hero.offsetTop + ((i + 0.5) / N) * (hero.offsetHeight - window.innerHeight);
    SV.scrollTo(top);
  }
  SV.scene = { goToEra: goToEra, progress: function () { return p; } };

  function setEra(i) {
    var e = DATA.eras[i];
    curEra = i;
    elEra.textContent = e.name; elCap.textContent = e.text;
    elStage.textContent = 'ESTÁGIO ' + e.code + ' / ' + U.pad2(N); elRange.textContent = e.range;
    elCard.classList.remove('is-swap'); void elCard.offsetWidth; elCard.classList.add('is-swap');
    ticks.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.classList.toggle('is-past', k < i); });
  }
  setEra(0);

  function updateHud() {
    var intro = 1 - sstep(0.004, 0.034, p);
    elIntro.style.opacity = intro.toFixed(3);
    elIntro.style.transform = 'translateY(calc(-54% - ' + ((1 - intro) * 70).toFixed(1) + 'px))';
    elIntro.style.pointerEvents = intro < 0.3 ? 'none' : '';
    var c = sstep(0.026, 0.06, p);
    elCard.style.opacity = c.toFixed(3);
    elCard.style.transform = 'translateY(' + ((1 - c) * 16).toFixed(1) + 'px)';
    elYear.style.opacity = c.toFixed(3);
    elCue.style.opacity = (1 - sstep(0, 0.02, p)).toFixed(3);
    elBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    var pl = sstep(0.03, 0.06, p);
    elPlay.style.opacity = pl.toFixed(3);
    elPlay.style.pointerEvents = pl < 0.3 ? 'none' : 'auto';
    elPlay.tabIndex = pl < 0.3 ? -1 : 0;
    syncPlay();

    var ei = clamp(Math.floor(p * N), 0, N - 1);
    if (ei !== curEra) setEra(ei);
    var u7 = clamp(p * N, 0, N - 0.0001), i = Math.floor(u7);
    var yr = Math.floor(lerp(DATA.eraYears[i], DATA.eraYears[i + 1], u7 - i));
    if (yr !== curYear) { curYear = yr; elYear.textContent = yr; }
  }

  /* viagem automática: rola o herói sozinho, mais devagar perto do centro de cada era
   * (dá tempo de ler), e ao chegar ao fim segue suavemente para a seção "A travessia". */
  var auto = false, apos = 0, nextTimer = 0, elStart = $('btnStart');
  function heroRange() { var top = hero.offsetTop; return { top: top, end: top + hero.offsetHeight - window.innerHeight }; }
  function setAuto(on) {
    if (on === auto) return;
    auto = on;
    clearTimeout(nextTimer);
    [elAuto, elPlay].forEach(function (b) { b.classList.toggle('is-playing', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    syncPlay();
    if (on) {
      SV.cancelScroll();
      var R = heroRange();
      apos = window.scrollY;
      if (apos < R.top || apos >= R.end - 4) apos = R.top;
      SV.instantScroll(apos);
    } else {
      elAuto.style.removeProperty('--prog'); elPlay.style.removeProperty('--prog');
      SV.releaseScroll();
    }
  }
  /* rótulos dos dois controles: o do início (some quando a viagem começa) e o fixo no meio da viagem */
  function syncPlay() {
    var mode = auto ? 'on' : p > 0.99 ? 'end' : 'off';
    if (mode === playMode) return;
    playMode = mode;
    elAutoIco.textContent = auto ? '❚❚' : '▶'; elAutoTxt.textContent = auto ? 'Pausar viagem' : 'Viagem automática';
    elPlayIco.textContent = auto ? '❚❚' : mode === 'end' ? '↻' : '▶';
    elPlayTxt.textContent = auto ? 'Pausar viagem' : mode === 'end' ? 'Rever a viagem' : 'Retomar viagem';
  }
  function finishJourney() {
    setAuto(false);
    var next = document.getElementById('travessia');
    if (!next) return;
    nextTimer = setTimeout(function () { SV.scrollTo(next.getBoundingClientRect().top + window.scrollY, 2); }, 900);
  }
  elAuto.addEventListener('click', function () { setAuto(!auto); });
  elPlay.addEventListener('click', function () { setAuto(!auto); });
  /* qualquer gesto do usuário (roda, toque, teclado, barra de rolagem) assume o controle */
  SV.onUserScroll(function (e) {
    var onBtn = e.target && e.target.closest && e.target.closest('#btnAuto, #heroPlay');
    clearTimeout(nextTimer);
    if (auto && !onBtn) setAuto(false);
  });

  /* "Começar a travessia": desliza até a seção 02 */
  if (elStart) elStart.addEventListener('click', function (e) {
    e.preventDefault();
    var sec = document.getElementById('travessia');
    if (!sec) return;
    setAuto(false);
    SV.scrollTo(sec.getBoundingClientRect().top + window.scrollY, null, function (finished) {
      if (!finished) return;
      try { history.replaceState(null, '', '#travessia'); } catch (x) { /* file:// restrito */ }
      var h = sec.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
  });

  /* ---------- eventos ---------- */
  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width - 0.5) * 2; tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { tmx = 0; tmy = 0; });

  function resize() {
    var r = canvas.parentNode.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    u = clamp(H / 820, 0.5, 1.35);
    horizon = H * 0.64; ground = H * 0.775;
    SPACE = Math.max(W * 0.66, 560 * u);
  }
  window.addEventListener('resize', resize);
  resize();

  SV.frame(function (t, dt) {
    T = t;
    var r = hero.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -50 || r.top > vh + 50) return;
    var total = Math.max(1, hero.offsetHeight - vh);
    target = forced !== null ? forced : clamp(-r.top / total, 0, 1);
    if (auto) {
      if (Math.abs(window.scrollY - apos) > 6) setAuto(false);          /* o usuário puxou a barra de rolagem */
      else {
        var u7a = p * N, dc = Math.abs(u7a - (Math.floor(u7a) + 0.5)), speed = 270 * (0.32 + 0.68 * sstep(0, 0.3, dc));
        apos = Math.min(apos + speed * dt, heroRange().end + 2);
        SV.instantScroll(apos);
        elAuto.style.setProperty('--prog', p.toFixed(3)); elPlay.style.setProperty('--prog', p.toFixed(3));
        if (target >= 0.995) finishJourney();
      }
    }
    if (SV.reduced() || forced !== null) p = target;
    else { p += (target - p) * (1 - Math.exp(-dt * 7)); if (Math.abs(target - p) < 0.00008) p = target; }
    var k = 1 - Math.exp(-dt * 5);
    mx += (tmx - mx) * k; my += (tmy - my) * k;
    draw(); updateHud();
    /* "Viajante do tempo": exige ficar um instante em cada uma das 7 eras (pular direto não conta) */
    if (Math.abs(target - p) < 0.02) {
      var ei = clamp(Math.floor(p * N), 0, N - 1);
      dwell[ei] = (dwell[ei] || 0) + dt;
      if (dwell[ei] > 0.45 && !dwellDone[ei]) {
        dwellDone[ei] = true;
        if (++dwellCount >= N) SV.xp.mark('misc', 'journey', 20, 'Viagem concluída');
      }
    }
  });
})();
