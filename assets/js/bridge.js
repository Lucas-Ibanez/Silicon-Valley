/*
 * Golden Gate em Canvas 2D (pseudo-3D).
 *
 * A ponte é descrita em metros (x ao longo do vão, y para cima, z lateral),
 * projetada por uma câmera em perspectiva e desenhada com o algoritmo do
 * pintor: cada peça (torre, trecho do tabuleiro, cabo, bolha de neblina)
 * tem uma profundidade, e o quadro é pintado do fundo para a frente.
 * Sem WebGL nem modelos 3D. O céu, o mar e as colinas são desenhados em
 * espaço de tela. A paleta evolui do fim de tarde ao crepúsculo (t: 0 → 1).
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};
  var U = SV.util;
  var clamp = U.clamp, lerp = U.lerp, sstep = U.sstep, rnd = U.rnd;
  var TAU = Math.PI * 2;

  var G = {
    SADDLE: 224, DECK_Y: 67, DECK_T: 7.6, DECK_HW: 13.5, CABLE_Z: 14.2,
    SPAN: 1280, SIDE: 343, CABLE_LOW: 74
  };
  G.X0 = -G.SIDE - 760;
  G.X1 = G.SPAN + G.SIDE + 760;

  function cableY(x) {
    if (x >= 0 && x <= G.SPAN) {
      var t = (x - G.SPAN / 2) / (G.SPAN / 2);
      return G.CABLE_LOW + (G.SADDLE - G.CABLE_LOW) * t * t;
    }
    var u = x < 0 ? clamp(-x / G.SIDE, 0, 1) : clamp((x - G.SPAN) / G.SIDE, 0, 1);
    return lerp(G.SADDLE, G.DECK_Y + 6, u) - 12 * Math.sin(Math.PI * u);
  }

  /* ---------- paleta ao longo do tempo (fim de tarde → crepúsculo) ---------- */
  var PK = [
    { t: 0,   top: [46, 72, 126], hor: [255, 178, 108], fog: [242, 190, 148], sun: [255, 200, 126], wf: [216, 140, 102], wn: [30, 40, 68], h0: [152, 114, 114], h1: [108, 82, 94], h2: [70, 58, 72], amb: 0.66, dif: 0.8 },
    { t: 0.5, top: [34, 40, 98], hor: [244, 114, 90], fog: [214, 124, 116], sun: [255, 152, 98], wf: [172, 90, 98], wn: [22, 26, 54], h0: [122, 82, 102], h1: [82, 62, 86], h2: [50, 44, 66], amb: 0.52, dif: 0.58 },
    { t: 1,   top: [8, 11, 34],  hor: [72, 64, 120],  fog: [74, 70, 120],  sun: [170, 158, 224], wf: [52, 50, 98],  wn: [10, 12, 32], h0: [54, 50, 92],  h1: [34, 34, 68],  h2: [22, 22, 46], amb: 0.34, dif: 0.22 }
  ];
  var KEYS = ['top', 'hor', 'fog', 'sun', 'wf', 'wn', 'h0', 'h1', 'h2'];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function paletteAt(t) {
    var i = t < PK[1].t ? 0 : 1, a = PK[i], b = PK[i + 1], k = (t - a.t) / (b.t - a.t);
    k = k * k * (3 - 2 * k);
    var o = { amb: lerp(a.amb, b.amb, k), dif: lerp(a.dif, b.dif, k) };
    KEYS.forEach(function (key) { o[key] = mix(a[key], b[key], k); });
    return o;
  }

  var ORANGE = [194, 56, 44], STRUT = [178, 48, 40], ASPHALT = [44, 46, 54], CONC = [104, 94, 94];

  function Bridge(canvas) {
    var ctx = canvas.getContext('2d');
    var W = 1, H = 1, dpr = 1;
    var cam = { p: [0, 0, 0], f: [1, 0, 0], r: [0, 0, 1], u: [0, 1, 0], focal: 900, hy: 0, cy: 0 };
    var S = null, T = 0, night = 0, sunDir = [1, 0, 0], sunUp = 1, sunSX = null;
    var NEAR = 1.5;
    var items = [], water = [], stars = [];
    var cc = [0, 0, 0];

    /* ---------- geometria estática ---------- */
    function box(kind, x0, x1, y0, y1, z0, z1, base) {
      items.push({ k: 'box', kind: kind, x0: x0, x1: x1, y0: y0, y1: y1, z0: z0, z1: z1, base: base,
        cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2,
        rad: Math.max(x1 - x0, y1 - y0, z1 - z0) * 0.75 });
    }
    function build() {
      var i, s, x;
      [0, G.SPAN].forEach(function (tx) {
        [-1, 1].forEach(function (side) {
          var z = side * G.CABLE_Z;
          [[0, 20, 9.5, 5.6], [20, 96, 6.4, 3.7], [96, 136, 5.8, 3.4], [136, 176, 5.2, 3.1], [176, 212, 4.6, 2.8], [212, G.SADDLE + 4, 4.1, 2.5]].forEach(function (sg) {
            box('tower', tx - sg[2], tx + sg[2], sg[0], sg[1], z - sg[3], z + sg[3], ORANGE);
          });
          items.push({ k: 'beacon', x: tx, y: G.SADDLE + 9, z: z, cx: tx, cy: G.SADDLE, cz: z, rad: 12, ph: tx * 0.01 + side });
        });
        [[96, 109], [136, 147], [176, 187], [205, 221]].forEach(function (st) {
          box('strut', tx - 4.4, tx + 4.4, st[0], st[1], -G.CABLE_Z + 3, G.CABLE_Z - 3, STRUT);
        });
      });
      /* ancoragens de concreto */
      [-G.SIDE - 20, G.SPAN + G.SIDE - 20].forEach(function (ax) {
        box('conc', ax, ax + 46, 0, G.DECK_Y + 24, -G.CABLE_Z - 12, G.CABLE_Z + 12, CONC);
      });
      /* tabuleiro em trechos de 40 m */
      for (x = G.X0; x < G.X1; x += 40) {
        items.push({ k: 'deck', x0: x, x1: x + 40, cx: x + 20, cy: G.DECK_Y, cz: 0, rad: 40 });
      }
      /* pilares do viaduto de acesso */
      for (x = G.X0; x < G.X1; x += 120) {
        if (x > -G.SIDE - 30 && x < G.SPAN + G.SIDE + 30) continue;
        box('conc', x + 52, x + 60, 0, G.DECK_Y - G.DECK_T, -9, 9, CONC);
      }
      /* cabos principais + pendurais */
      [-1, 1].forEach(function (side) {
        for (x = -G.SIDE; x < G.SPAN + G.SIDE; x += 20) {
          var x1 = Math.min(x + 20, G.SPAN + G.SIDE);
          items.push({ k: 'cable', x0: x, x1: x1, z: side * G.CABLE_Z, cx: (x + x1) / 2, cy: cableY((x + x1) / 2), cz: side * G.CABLE_Z, rad: 24,
            sus: x > -G.SIDE + 12 && x < G.SPAN + G.SIDE - 12 && cableY(x) > G.DECK_Y + 5 });
        }
      });
      /* bolhas de neblina */
      for (i = 0; i < 16; i++) {
        items.push({ k: 'fog', bx: lerp(-500, 1900, rnd(i, 1)), y: lerp(14, 150, rnd(i, 2)), z0: lerp(-330, 330, rnd(i, 3)), r: lerp(130, 290, rnd(i, 4)),
          a: lerp(0.18, 0.34, rnd(i, 5)), sp: lerp(0.4, 1.2, rnd(i, 6)) * (rnd(i, 7) > 0.5 ? 1 : -1), ph: rnd(i, 8) * TAU, cx: 0, cy: 0, cz: 0, rad: 0 });
      }
      /* pontinhos de brilho no mar */
      for (i = 0; i < 900; i++) {
        water.push({ x: lerp(G.X0 - 300, G.X1 + 300, rnd(i, 11)), z: lerp(-1100, 1100, rnd(i, 12)), l: 5 + rnd(i, 13) * 15, ph: rnd(i, 14) * TAU, sp: 0.6 + rnd(i, 15) * 1.2 });
      }
      for (i = 0; i < 130; i++) stars.push({ x: rnd(i, 21), y: rnd(i, 22), r: 0.5 + rnd(i, 23) * 1.2, w: 0.8 + rnd(i, 24) * 2.2 });
    }
    build();

    /* ---------- câmera ---------- */
    function setCamera(pos, tgt, fov) {
      var f = [tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]], l = Math.hypot(f[0], f[1], f[2]) || 1;
      f = [f[0] / l, f[1] / l, f[2] / l];
      var r = [-f[2], 0, f[0]], rl = Math.hypot(r[0], r[2]) || 1;   // cross(f, up)
      r = [r[0] / rl, 0, r[2] / rl];
      var u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
      cam.p = pos; cam.f = f; cam.r = r; cam.u = u;
      cam.focal = (H / 2) / Math.tan(fov * Math.PI / 360);
      cam.hy = cam.cy + (f[1] / Math.max(0.05, Math.hypot(f[0], f[2]))) * cam.focal;
    }
    function toCam(x, y, z, o) {
      var dx = x - cam.p[0], dy = y - cam.p[1], dz = z - cam.p[2], r = cam.r, u = cam.u, f = cam.f;
      o[0] = dx * r[0] + dy * r[1] + dz * r[2];
      o[1] = dx * u[0] + dy * u[1] + dz * u[2];
      o[2] = dx * f[0] + dy * f[1] + dz * f[2];
      return o;
    }
    function project(p) {
      toCam(p[0], p[1], p[2], cc);
      if (cc[2] < NEAR) return null;
      return { x: W / 2 + cc[0] / cc[2] * cam.focal, y: cam.cy - cc[1] / cc[2] * cam.focal, z: cc[2] };
    }

    /* ---------- cor / névoa ---------- */
    function fogK(d, y) {
      var k = clamp((d - 380) / 3000, 0, 1) * 0.9;
      var low = 0.36 * (1 - sstep(30, 175, y));
      return Math.min(0.95, k + low * (1 - k));
    }
    function shade(base, ndl, d, y, extra) {
      var k = S.amb + S.dif * Math.max(0, ndl) * (extra == null ? 1 : extra);
      var c = [base[0] * k, base[1] * k, base[2] * k];
      var w = Math.max(0, ndl) * (1 - night) * 0.22;
      c = mix(c, S.sun, w);
      return mix(c, S.fog, fogK(d, y));
    }

    /* ---------- primitivas 3D ---------- */
    function clipNear(poly) {
      var out = [], n = poly.length;
      for (var i = 0; i < n; i++) {
        var a = poly[i], b = poly[(i + 1) % n], ina = a[2] >= NEAR, inb = b[2] >= NEAR;
        if (ina) out.push(a);
        if (ina !== inb) {
          var t = (NEAR - a[2]) / (b[2] - a[2]);
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
        }
      }
      return out;
    }
    function fillPoly(pts, col) {
      var c = [], i, f = cam.focal;
      for (i = 0; i < pts.length; i += 3) c.push(toCam(pts[i], pts[i + 1], pts[i + 2], [0, 0, 0]));
      c = clipNear(c);
      if (c.length < 3) return;
      ctx.beginPath();
      for (i = 0; i < c.length; i++) {
        var sx = W / 2 + c[i][0] / c[i][2] * f, sy = cam.cy - c[i][1] / c[i][2] * f;
        if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
      }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    /* segmento 3D com largura em metros (convertida para pixels) */
    function line3(x0, y0, z0, x1, y1, z1, wMeters, col, minW) {
      var a = toCam(x0, y0, z0, [0, 0, 0]), b = toCam(x1, y1, z1, [0, 0, 0]);
      if (a[2] < NEAR && b[2] < NEAR) return;
      if (a[2] < NEAR) { var t = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]; }
      else if (b[2] < NEAR) { var t2 = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * t2, b[1] + (a[1] - b[1]) * t2, NEAR]; }
      var f = cam.focal, zm = (a[2] + b[2]) / 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 + a[0] / a[2] * f, cam.cy - a[1] / a[2] * f);
      ctx.lineTo(W / 2 + b[0] / b[2] * f, cam.cy - b[1] / b[2] * f);
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(minW || 0.5, wMeters * f / zm);
      ctx.stroke();
    }
    function drawBox(b, d) {
      var p = cam.p, x0 = b.x0, x1 = b.x1, y0 = b.y0, y1 = b.y1, z0 = b.z0, z1 = b.z1, base = b.base, L = sunDir;
      var top = b.kind === 'deck' ? ASPHALT : base;
      if (p[0] < x0) fillPoly([x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0], rgb(shade(base, -L[0], d, b.cy)));
      else if (p[0] > x1) fillPoly([x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1], rgb(shade(base, L[0], d, b.cy)));
      if (p[2] < z0) fillPoly([x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0], rgb(shade(base, -L[2], d, b.cy)));
      else if (p[2] > z1) fillPoly([x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1], rgb(shade(base, L[2], d, b.cy)));
      if (p[1] > y1) fillPoly([x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1], rgb(shade(top, L[1] + 0.25, d, y1, 0.6)));
    }

    /* ---------- peças ---------- */
    function drawDeck(it, d) {
      var x0 = it.x0, x1 = it.x1, yT = G.DECK_Y, HW = G.DECK_HW, T = G.DECK_T;
      drawBox({ kind: 'deck', x0: x0, x1: x1, y0: yT - T, y1: yT, z0: -HW, z1: HW, base: ORANGE, cy: yT - T / 2 }, d);
      var lamp = rgb([255, 210, 140], 0.95), fogc = fogK(d, yT);
      /* faixas */
      line3(x0, yT + 0.03, 0, x1, yT + 0.03, 0, 0.34, rgb(mix([232, 196, 78], S.fog, fogc), 0.95), 0.5);
      [-5, 5].forEach(function (zz) {
        for (var k = 0; k < 4; k++) line3(x0 + k * 10, yT + 0.03, zz, x0 + k * 10 + 5, yT + 0.03, zz, 0.2, rgb(mix([230, 226, 214], S.fog, fogc), 0.7), 0.4);
      });
      [-HW + 2.4, HW - 2.4].forEach(function (zz) { line3(x0, yT + 0.03, zz, x1, yT + 0.03, zz, 0.22, rgb(mix([230, 226, 214], S.fog, fogc), 0.8), 0.4); });
      /* guarda-corpo e postes de luz */
      [-1, 1].forEach(function (sd) {
        var zz = sd * (HW - 0.4);
        line3(x0, yT + 1.4, zz, x1, yT + 1.4, zz, 0.3, rgb(mix([226, 150, 130], S.fog, fogc), 0.85), 0.5);
        var lx = x0 + 20 + sd * 10;
        line3(lx, yT, zz, lx, yT + 10, zz, 0.3, rgb(mix([40, 40, 50], S.fog, fogc), 0.9), 0.5);
        if (night > 0.04) {
          var c = toCam(lx, yT + 10.4, zz, [0, 0, 0]);
          if (c[2] > NEAR) {
            var sx = W / 2 + c[0] / c[2] * cam.focal, sy = cam.cy - c[1] / c[2] * cam.focal, r = clamp(1.3 * cam.focal / c[2], 0.9, 5);
            ctx.fillStyle = rgb([255, 190, 110], 0.12 * night * (1 - fogc * 0.6)); ctx.beginPath(); ctx.arc(sx, sy, r * 2.6, 0, TAU); ctx.fill();
            ctx.fillStyle = lamp; ctx.globalAlpha = night * (1 - fogc * 0.5); ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
          }
        }
      });
    }
    function drawCable(it, d) {
      var y0 = cableY(it.x0), y1 = cableY(it.x1), z = it.z;
      var col = rgb(shade(ORANGE, 0.5, d, it.cy));
      line3(it.x0, y0, z, it.x1, y1, z, 1.0, col, 0.9);
      if (it.sus) line3(it.x0, y0, z, it.x0, G.DECK_Y + 1.4, z, 0.2, rgb(shade(ORANGE, 0.3, d, it.cy), 0.75), 0.5);
    }
    function drawBeacon(it, d) {
      var c = toCam(it.x, it.y, it.z, [0, 0, 0]);
      if (c[2] < NEAR) return;
      var on = Math.sin(T * 2.4 + it.ph * 5) > -0.15, a = (0.35 + 0.65 * night) * (on ? 1 : 0.15) * (1 - fogK(d, it.y) * 0.6);
      var sx = W / 2 + c[0] / c[2] * cam.focal, sy = cam.cy - c[1] / c[2] * cam.focal, r = clamp(2.6 * cam.focal / c[2], 1.4, 12);
      ctx.fillStyle = rgb([255, 80, 66], a * 0.3); ctx.beginPath(); ctx.arc(sx, sy, r * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = rgb([255, 110, 90], a); ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    }
    function drawFog(it) {
      var c = toCam(it.cx, it.cy, it.cz, [0, 0, 0]), z = c[2];
      if (z < 30 || z > 3600) return;
      var rx = it.r * cam.focal / z;
      if (rx < 6) return;
      var sx = W / 2 + c[0] / z * cam.focal, sy = cam.cy - c[1] / z * cam.focal;
      var a = it.a * sstep(30, 300, z) * (1 - sstep(2300, 3600, z)) * (1 - night * 0.45);
      if (a < 0.01) return;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.34);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, rgb(S.fog, a)); g.addColorStop(0.55, rgb(S.fog, a * 0.55)); g.addColorStop(1, rgb(S.fog, 0));
      ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
    }

    /* ---------- fundo em espaço de tela ---------- */
    function dirToScreen(d) {
      var r = cam.r, u = cam.u, f = cam.f;
      var cx = d[0] * r[0] + d[1] * r[1] + d[2] * r[2], cy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2], cz = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
      if (cz < 0.05) return null;
      return { x: W / 2 + cx / cz * cam.focal, y: cam.cy - cy / cz * cam.focal };
    }
    function drawSky() {
      var hy = cam.hy;
      if (hy > 0) {
        var g = ctx.createLinearGradient(0, 0, 0, hy);
        g.addColorStop(0, rgb(S.top)); g.addColorStop(0.72, rgb(mix(S.top, S.hor, 0.55))); g.addColorStop(1, rgb(S.hor));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.min(H, hy + 1));
        if (night > 0.05) {
          for (var i = 0; i < stars.length; i++) {
            var st = stars[i], a = night * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(T * st.w + i))) * (1 - st.y * 0.7);
            ctx.fillStyle = 'rgba(235,240,255,' + a.toFixed(3) + ')';
            ctx.fillRect(st.x * W, st.y * hy * 0.85, st.r, st.r);
          }
        }
      }
      var sp = dirToScreen(sunDir);
      sunSX = sp ? sp.x : null;
      if (sp && sunUp > 0.001) {
        var rr = H * 0.7, gg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, rr);
        gg.addColorStop(0, rgb(S.sun, 0.55 * sunUp)); gg.addColorStop(0.25, rgb(S.sun, 0.2 * sunUp)); gg.addColorStop(1, rgb(S.sun, 0));
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = rgb(mix(S.sun, [255, 250, 236], 0.55), 0.95 * sunUp);
        ctx.beginPath(); ctx.arc(sp.x, sp.y, H * 0.035, 0, TAU); ctx.fill();
      }
    }
    function ridge(az, seed) {
      return 0.5 * Math.sin(az * 3.1 + seed) + 0.3 * Math.sin(az * 7.7 + seed * 2.3) + 0.2 * Math.sin(az * 16.3 + seed * 4.1);
    }
    function drawHills() {
      var hy = cam.hy;
      if (hy < 0) return;
      var cols = [S.h0, S.h1, S.h2], amp = [0.075, 0.055, 0.035], base = [0.02, 0.008, 0], seeds = [1.3, 3.7, 6.1];
      for (var L = 0; L < 3; L++) {
        ctx.beginPath(); ctx.moveTo(-4, hy + 40);
        for (var x = -4; x <= W + 4; x += 8) {
          var k = (x - W / 2) / cam.focal;
          var az = Math.atan2(cam.f[2] + cam.r[2] * k, cam.f[0] + cam.r[0] * k);
          var e = base[L] + amp[L] * (0.5 + 0.5 * ridge(az, seeds[L]));
          ctx.lineTo(x, hy - e * cam.focal);
        }
        ctx.lineTo(W + 4, hy + 40); ctx.closePath();
        ctx.fillStyle = rgb(mix(cols[L], S.fog, 0.12 + 0.06 * (2 - L))); ctx.fill();
      }
    }
    function drawWater() {
      var hy = clamp(cam.hy, 0, H);
      var g = ctx.createLinearGradient(0, hy, 0, H);
      g.addColorStop(0, rgb(S.wf)); g.addColorStop(0.45, rgb(mix(S.wf, S.wn, 0.7))); g.addColorStop(1, rgb(S.wn));
      ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
      var glit = [255, 220, 170], pa = cam.p, n = water.length, sx0 = sunSX, i;
      ctx.lineCap = 'round';
      for (i = 0; i < n; i++) {
        var w = water[i], dx = w.x - pa[0];
        if (dx < 14 || dx > 2800) continue;
        var c0 = toCam(w.x, 0, w.z - w.l / 2, [0, 0, 0]), c1 = toCam(w.x, 0, w.z + w.l / 2, [0, 0, 0]);
        if (c0[2] < NEAR || c1[2] < NEAR) continue;
        var f = cam.focal, ax = W / 2 + c0[0] / c0[2] * f, ay = cam.cy - c0[1] / c0[2] * f, bx = W / 2 + c1[0] / c1[2] * f, by = cam.cy - c1[1] / c1[2] * f;
        if (ay < hy || ay > H + 4 || bx < -20 || ax > W + 20) continue;
        var tw = 0.5 + 0.5 * Math.sin(T * w.sp + w.ph), d = c0[2];
        var glint = 0;
        if (sx0 !== null && sunUp > 0.02) glint = Math.exp(-Math.pow((ax - sx0) / (W * 0.07), 2)) * sunUp * tw;
        var a = (0.05 + 0.1 * tw) * (1 - clamp(d / 2800, 0, 1)) + glint * 0.9;
        ctx.strokeStyle = glint > 0.05 ? rgb(glit, clamp(a, 0, 1)) : rgb(mix(S.hor, [255, 255, 255], 0.35), clamp(a, 0, 1));
        ctx.lineWidth = clamp(2.2 * f / d, 0.6, 2.4);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      /* faixa de névoa sobre o horizonte */
      var fg = ctx.createLinearGradient(0, hy - H * 0.07, 0, hy + H * 0.14);
      fg.addColorStop(0, rgb(S.fog, 0)); fg.addColorStop(0.4, rgb(S.fog, 0.62)); fg.addColorStop(1, rgb(S.fog, 0));
      ctx.fillStyle = fg; ctx.fillRect(0, hy - H * 0.07, W, H * 0.21);
    }

    /* ---------- faróis das paradas ---------- */
    function drawMarkers(markers) {
      if (!markers) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i], b = project([m.x, G.DECK_Y + 1.5, 0]), tp = project([m.x, G.DECK_Y + 135, 0]);
        if (!b || !tp) continue;
        var fk = fogK(b.z, G.DECK_Y), vis = 1 - fk * 0.55, col = m.mode === 0 ? [150, 172, 220] : [255, 182, 52];
        var a = (m.mode === 2 ? 0.95 : m.mode === 1 ? 0.55 : 0.28) * vis;
        var g = ctx.createLinearGradient(0, b.y, 0, tp.y);
        g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
        ctx.strokeStyle = g; ctx.lineWidth = clamp((m.mode === 2 ? 5 : 3) * cam.focal / b.z, 1, m.mode === 2 ? 5 : 3);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
        if (m.mode === 2) {
          var pulse = (T * 0.55) % 1;
          for (var k = 0; k < 2; k++) {
            var R = 5 + ((pulse + k * 0.5) % 1) * 16, al = (1 - ((pulse + k * 0.5) % 1)) * 0.5 * vis, first = true;
            ctx.beginPath();
            for (var q = 0; q <= 28; q++) {
              var an = q / 28 * TAU, pp = project([m.x + Math.cos(an) * R, G.DECK_Y + 0.15, Math.sin(an) * R * 0.9]);
              if (!pp) continue;
              if (first) { ctx.moveTo(pp.x, pp.y); first = false; } else ctx.lineTo(pp.x, pp.y);
            }
            ctx.strokeStyle = rgb([255, 182, 52], al); ctx.lineWidth = 1.6; ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    /* ---------- quadro ---------- */
    function render(camera, state) {
      T = state.time || 0;
      var t = clamp(state.t, 0, 1);
      S = paletteAt(t);
      night = sstep(0.42, 0.92, t);
      var el = lerp(9, -5, sstep(0.04, 0.92, t)) * Math.PI / 180, az = 27 * Math.PI / 180;
      sunDir = [Math.cos(az) * Math.cos(el), Math.sin(el), -Math.sin(az) * Math.cos(el)];
      sunUp = clamp((el * 180 / Math.PI + 4) / 8, 0, 1);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cam.cy = H * (camera.cy == null ? 0.5 : camera.cy);
      setCamera(camera.pos, camera.tgt, camera.fov);

      drawSky(); drawHills(); drawWater();

      var px = cam.p[0], py = cam.p[1], pz = cam.p[2], f = cam.f, order = [], i, it, d;
      for (i = 0; i < items.length; i++) {
        it = items[i];
        if (it.k === 'fog') {
          it.cx = it.bx + Math.sin(T * 0.05 * it.sp + it.ph) * 140; it.cy = it.y; it.cz = it.z0 + Math.cos(T * 0.04 * it.sp + it.ph) * 120;
        }
        d = (it.cx - px) * f[0] + (it.cy - py) * f[1] + (it.cz - pz) * f[2];
        if (d + (it.rad || 0) < NEAR || d > 3700) continue;
        it.d = d; order.push(it);
      }
      order.sort(function (a, b) { return b.d - a.d; });
      ctx.lineCap = 'butt';
      for (i = 0; i < order.length; i++) {
        it = order[i];
        switch (it.k) {
          case 'box': drawBox(it, it.d); break;
          case 'deck': drawDeck(it, it.d); break;
          case 'cable': drawCable(it, it.d); break;
          case 'beacon': drawBeacon(it, it.d); break;
          case 'fog': drawFog(it); break;
        }
      }
      drawMarkers(state.markers);
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    resize();

    return { render: render, resize: resize, project: project, size: function () { return [W, H]; }, fogK: fogK };
  }

  SV.Bridge = Bridge;
  SV.GG = G;
})();
