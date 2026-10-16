/*
 * Holograma: transforma o retrato (96×120 em tons de cinza, embutido em people-assets.js)
 * em uma nuvem de pontos ciano. O brilho vira "profundidade", então o rosto ganha relevo
 * e gira com o mouse. Tem varredura luminosa, linhas de scan, glitch ocasional,
 * aberração cromática nas bordas e um projetor com feixe de luz.
 * Não lê pixels de <img>, então funciona também via file:// (sem canvas "sujo").
 *
 * SV.Holo.create(canvas, chave) → { start(), stop(), setYaw(-1..1) }
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};
  var U = SV.util, COLS = 96, ROWS = 120;
  var cache = {}, running = [];

  function decode(key) {
    if (cache[key]) return cache[key];
    var b64 = SV.holoData && SV.holoData[key];
    if (!b64) return null;
    var bin = atob(b64), n = COLS * ROWS, lum = new Float32Array(n), i, x, y;
    for (i = 0; i < n; i++) lum[i] = bin.charCodeAt(i) / 255;
    /* profundidade = brilho suavizado (caixa 3×3) */
    var depth = new Float32Array(n), edge = new Float32Array(n), mask = new Float32Array(n);
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var s = 0, c = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < COLS && yy >= 0 && yy < ROWS) { s += lum[yy * COLS + xx]; c++; }
      }
      depth[y * COLS + x] = s / c;
    }
    /* bordas (Sobel simplificado) */
    for (y = 1; y < ROWS - 1; y++) for (x = 1; x < COLS - 1; x++) {
      var gx = lum[y * COLS + x + 1] - lum[y * COLS + x - 1], gy = lum[(y + 1) * COLS + x] - lum[(y - 1) * COLS + x];
      edge[y * COLS + x] = Math.min(1, Math.hypot(gx, gy) * 2.4);
    }
    /* máscara: cabeça + ombros, com bordas suaves */
    function soft(e) { return U.clamp((1 - e) / 0.3, 0, 1); }
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var nx = x / COLS, ny = y / ROWS;
      var head = soft(Math.pow((nx - 0.5) / 0.31, 2) + Math.pow((ny - 0.4) / 0.33, 2));
      var sh = soft(Math.pow((nx - 0.5) / 0.6, 2) + Math.pow((ny - 1.0) / 0.34, 2));
      mask[y * COLS + x] = Math.max(head, sh * 0.85);
    }
    return (cache[key] = { lum: lum, depth: depth, edge: edge, mask: mask });
  }

  function Holo(canvas, key) {
    var ctx = canvas.getContext('2d'), data = decode(key);
    var W = 0, H = 0, dpr = 1, yaw = 0, target = 0, on = false, T0 = 0, seed = Math.random() * 100;
    var self = {};

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (r.width < 4) return;
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }

    function draw(T, dt) {
      if (!data || !W) return;
      var reduce = SV.reduced();
      yaw += (target - yaw) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
      var yw = yaw + (reduce ? 0 : Math.sin(T * 0.9 + seed) * 0.12);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var cx = W / 2, cy = H * 0.47, scale = Math.min(W / COLS * 0.98, H / ROWS * 0.98), amp = scale * COLS * 0.19;
      var baseY = cy + ROWS * 0.5 * scale + 6, cosY = Math.cos(yw), sinY = Math.sin(yw), F = scale * COLS * 2.6;
      var lum = data.lum, depth = data.depth, edge = data.edge, mask = data.mask;
      var flick = reduce ? 1 : 0.9 + 0.1 * Math.sin(T * 41) * Math.sin(T * 17 + seed);
      var glitch = !reduce && ((T * 0.9 + seed) % 4.2) < 0.14;
      var band = reduce ? -9 : (((T * 0.32 + seed * 0.1) % 1.35) - 0.2) * ROWS;
      var scanPhase = reduce ? 0 : Math.floor(T * 16);

      ctx.globalCompositeOperation = 'lighter';

      /* feixe do projetor */
      var bw = COLS * scale * 0.34, tw = COLS * scale * 0.5;
      var bg = ctx.createLinearGradient(0, baseY, 0, cy - ROWS * 0.5 * scale);
      bg.addColorStop(0, 'rgba(60,240,255,.20)'); bg.addColorStop(1, 'rgba(60,240,255,0)');
      ctx.fillStyle = bg; ctx.beginPath();
      ctx.moveTo(cx - bw, baseY); ctx.lineTo(cx + bw, baseY); ctx.lineTo(cx + tw, cy - ROWS * 0.5 * scale); ctx.lineTo(cx - tw, cy - ROWS * 0.5 * scale);
      ctx.closePath(); ctx.fill();

      /* base: discos de luz */
      for (var k = 0; k < 3; k++) {
        var rr = (bw * (1.05 + k * 0.28)), pulse = reduce ? 0.6 : 0.55 + 0.45 * Math.sin(T * 2.2 - k * 0.9);
        ctx.strokeStyle = 'rgba(70,250,255,' + (0.5 * pulse / (k + 1)).toFixed(3) + ')'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(cx, baseY, rr, rr * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
      }
      var bgl = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, bw * 1.5);
      bgl.addColorStop(0, 'rgba(90,255,250,.55)'); bgl.addColorStop(1, 'rgba(90,255,250,0)');
      ctx.fillStyle = bgl; ctx.beginPath(); ctx.ellipse(cx, baseY, bw * 1.5, bw * 0.34, 0, 0, Math.PI * 2); ctx.fill();

      /* nuvem de pontos: 3 passes por faixa de brilho (poucas trocas de estilo) */
      var styles = ['rgb(30,170,255)', 'rgb(80,245,255)', 'rgb(225,255,255)'];
      for (var pass = 0; pass < 3; pass++) {
        ctx.fillStyle = styles[pass];
        for (var j = 0; j < ROWS; j++) {
          var rowOff = glitch && ((j >> 3) % 3 === 0) ? (((j * 7.3 + T * 50) % 9) - 4.5) : 0;
          var scan = ((j + scanPhase) % 4 === 0) ? 0.45 : 1, bd = Math.exp(-Math.pow((j - band) / 3.5, 2));
          for (var i = 0; i < COLS; i++) {
            var idx = j * COLS + i, m = mask[idx];
            if (m < 0.07) continue;
            var v = lum[idx], tier = v < 0.38 ? 0 : v < 0.72 ? 1 : 2;
            if (tier !== pass) continue;
            var z = (depth[idx] - 0.5) * amp * 2 * m, X = (i - COLS / 2 + 0.5) * scale, Y = (j - ROWS * 0.5 + 0.5) * scale;
            var Xr = X * cosY + z * sinY, Zr = -X * sinY + z * cosY, f = 1 / (1 - Zr / F);
            var a = m * (0.16 + 0.82 * Math.pow(v, 1.1) + 0.8 * edge[idx]) * scan * flick + bd * 0.55 * m;
            if (a < 0.04) continue;
            var s = scale * 0.92 * f;
            ctx.globalAlpha = Math.min(1, a);
            ctx.fillRect(cx + Xr * f + rowOff - s / 2, cy + Y * f - s / 2, s, s);
          }
        }
      }

      /* aberração cromática nas bordas (magenta deslocado) */
      ctx.fillStyle = 'rgb(255,70,200)';
      for (j = 2; j < ROWS - 2; j += 1) for (i = 2; i < COLS - 2; i += 1) {
        idx = j * COLS + i;
        if (mask[idx] < 0.3 || edge[idx] < 0.55) continue;
        z = (depth[idx] - 0.5) * amp * 2 * mask[idx]; X = (i - COLS / 2 + 0.5) * scale; Y = (j - ROWS * 0.5 + 0.5) * scale;
        Xr = X * cosY + z * sinY; Zr = -X * sinY + z * cosY; f = 1 / (1 - Zr / F);
        ctx.globalAlpha = 0.16 * mask[idx] * flick; s = scale * 0.7 * f;
        ctx.fillRect(cx + Xr * f - 1.6 - s / 2, cy + Y * f - s / 2, s, s);
      }

      /* partículas subindo pelo feixe */
      if (!reduce) {
        ctx.fillStyle = 'rgb(160,255,255)';
        for (k = 0; k < 14; k++) {
          var pt = ((T * 0.18 + k * 0.071 + seed) % 1), px = cx + (U.rnd(k, 3, seed) - 0.5) * COLS * scale * 0.6 * (0.4 + pt * 0.8);
          ctx.globalAlpha = Math.sin(pt * Math.PI) * 0.7;
          ctx.fillRect(px, baseY - pt * (baseY - (cy - ROWS * 0.5 * scale)), 1.6, 1.6);
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    self.tick = function (t, dt) { if (on) { draw(t, dt); } };
    self.start = function () {
      if (on || !data) return;
      resize(); on = true;
      if (running.indexOf(self) === -1) running.push(self);
      if (SV.reduced()) draw(0, 1);
    };
    self.stop = function () { on = false; var k = running.indexOf(self); if (k > -1) running.splice(k, 1); };
    self.setYaw = function (v) { target = U.clamp(v, -1, 1) * 0.75; };
    self.resize = resize;
    return self;
  }

  SV.frame(function (t, dt) { for (var i = 0; i < running.length; i++) running[i].tick(t, dt); });
  SV.Holo = { create: Holo, has: function (key) { return !!(SV.holoData && SV.holoData[key]); } };
})();
