/*
 * Retratos dos processadores em SVG (gerados por código).
 * Cada chip é mostrado como era o "produto": encapsulamento visto de cima
 * (DIP, PGA, cartucho, tampa metálica, módulo) e, ao lado, o die com o
 * floorplan dos blocos (núcleos, caches, GPU…). São ilustrações estilizadas,
 * não fotografias; as proporções do die seguem a área real de forma comprimida.
 *
 * SV.chipArt(chip) → string <svg viewBox="0 0 260 190">.
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};
  var uid = 0, P = '';

  var BC = { core: '#ffb224', cache: '#4fe3c8', gpu: '#a78bfa', io: '#8b98ab', mem: '#60a5fa', ne: '#f472b6', ctl: '#fb923c' };

  /* ---------- primitivas ---------- */
  function R(x, y, w, h, r, fill, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }
  function Tx(x, y, t, size, fill, anchor, w) {
    return '<text x="' + x + '" y="' + y + '" font-family="Geist Mono, ui-monospace, monospace" font-size="' + size + '" font-weight="' + (w || 500) + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" letter-spacing=".06em">' + t + '</text>';
  }
  function defs() {
    return '<defs>' +
      '<linearGradient id="' + P + 'cer" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4eedd"/><stop offset="1" stop-color="#c9bfa5"/></linearGradient>' +
      '<linearGradient id="' + P + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7de8f"/><stop offset=".5" stop-color="#cfa233"/><stop offset="1" stop-color="#8d6a17"/></linearGradient>' +
      '<linearGradient id="' + P + 'ag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9edf1"/><stop offset=".5" stop-color="#a9b2bc"/><stop offset="1" stop-color="#eef1f4"/></linearGradient>' +
      '<linearGradient id="' + P + 'ihs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset=".45" stop-color="#b9c1cb"/><stop offset=".7" stop-color="#e3e8ee"/><stop offset="1" stop-color="#9aa4b0"/></linearGradient>' +
      '<linearGradient id="' + P + 'si" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34407e"/><stop offset=".55" stop-color="#5b44a8"/><stop offset="1" stop-color="#23808f"/></linearGradient>' +
      '<linearGradient id="' + P + 'blk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34363c"/><stop offset="1" stop-color="#121317"/></linearGradient>' +
      '<linearGradient id="' + P + 'grn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f7050"/><stop offset="1" stop-color="#17432f"/></linearGradient>' +
      '<linearGradient id="' + P + 'brn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a47b45"/><stop offset="1" stop-color="#6a4a27"/></linearGradient>' +
      '<linearGradient id="' + P + 'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + P + 'bg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#1d2635"/><stop offset="1" stop-color="#0a0d13"/></radialGradient>' +
      '<filter id="' + P + 'blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>' + R(0, 0, 260, 190, 0, 'url(#' + P + 'bg)') +
      '<g opacity=".16" stroke="#7d8da6" stroke-width=".5">' + grid() + '</g>';
  }
  function grid() {
    var s = '', k;
    for (k = 20; k < 260; k += 20) s += '<path d="M' + k + ',0 V190"/>';
    for (k = 20; k < 190; k += 20) s += '<path d="M0,' + k + ' H260"/>';
    return s;
  }
  function shadow(x, y, w, h) { return '<rect x="' + x + '" y="' + (y + 6) + '" width="' + w + '" height="' + h + '" rx="6" fill="#000" opacity=".55" filter="url(#' + P + 'blur)"/>'; }
  function shine(x, y, w, h, r) {
    return '<clipPath id="' + P + 'c' + x + y + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/></clipPath>' +
      '<g clip-path="url(#' + P + 'c' + x + y + ')"><rect class="shine" x="' + (x - 30) + '" y="' + (y - 10) + '" width="30" height="' + (h + 20) + '" fill="url(#' + P + 'sh)"/></g>';
  }
  function pin(x, y, w, h) { return R(x, y, w, h, 1, 'url(#' + P + 'ag)'); }
  function zoom(ax, ay, bx, by, cx, cy, dx, dy) {
    return '<g stroke="#4fe3c8" stroke-opacity=".55" stroke-width=".8" stroke-dasharray="3 3" fill="none"><path d="M' + ax + ',' + ay + ' L' + bx + ',' + by + ' M' + cx + ',' + cy + ' L' + dx + ',' + dy + '"/></g>';
  }
  function cap(x, y, w, h) { return R(x, y, w, h, 1, '#c9b37e') + R(x, y, w * 0.2, h, 1, '#6b5a35') + R(x + w * 0.8, y, w * 0.2, h, 1, '#6b5a35'); }

  /* ---------- die + floorplan ---------- */
  function die(x, y, w, h, blocks, o) {
    o = o || {};
    var s = R(x - 2.5, y - 2.5, w + 5, h + 5, 2, '#222b3b') + R(x, y, w, h, 1.5, 'url(#' + P + 'si)');
    blocks.forEach(function (b) {
      var bx = x + b[0] * w, by = y + b[1] * h, bw = b[2] * w, bh = b[3] * h;
      s += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1" fill="' + BC[b[4]] + '" fill-opacity=".8" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/>';
      var fs = b[5] ? Math.min(6, bw / (b[5].length * 0.66)) : 0;
      if (fs >= 3.3 && bh > fs * 1.4) s += Tx((bx + bw / 2).toFixed(1), (by + bh / 2 + fs * 0.35).toFixed(1), b[5], fs.toFixed(2), 'rgba(8,10,16,.82)', 'middle', 700);
    });
    if (o.pads) {
      var pc = '#d8b64a', i, n;
      for (i = 0; i < o.pads[0]; i++) s += R((x + (i + 0.5) * w / o.pads[0] - 1.3).toFixed(1), y - 6, 2.6, 2.6, 0.4, pc);
      for (i = 0; i < o.pads[1]; i++) s += R((x + (i + 0.5) * w / o.pads[1] - 1.3).toFixed(1), y + h + 3.4, 2.6, 2.6, 0.4, pc);
      for (i = 0; i < o.pads[2]; i++) s += R(x - 6, (y + (i + 0.5) * h / o.pads[2] - 1.3).toFixed(1), 2.6, 2.6, 0.4, pc);
      for (i = 0; i < o.pads[3]; i++) s += R(x + w + 3.4, (y + (i + 0.5) * h / o.pads[3] - 1.3).toFixed(1), 2.6, 2.6, 0.4, pc);
    }
    return s + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="url(#' + P + 'sh)" opacity=".12"/>';
  }
  function plate(x, y, w, h, cap) {
    return R(x, y, w, h, 8, '#0d1219', 'stroke="#2b3545" stroke-width="1"') + (cap ? Tx(x + w / 2, y + h - 7, cap, 6.5, '#8b98ab') : '');
  }
  function dieSize(mm) { return 22 + mm * 2.6; }
  function dieBox(cx, cy, mm, aspect) {
    var s = Math.min(dieSize(mm), 78), w = s * (aspect || 1) > 78 ? 78 : s * (aspect || 1), h = s;
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
  }

  /* ---------- encapsulamentos ---------- */
  function dip(n, bx, by, bw, bh, label) {
    var per = n / 2, pitch = (bw - 26) / (per - 1), s = '', i;
    for (i = 0; i < per; i++) { var x = bx + 13 + i * pitch; s += pin(x - 2.6, by - 11, 5.2, 17) + pin(x - 2.6, by + bh - 6, 5.2, 17); }
    s += shadow(bx, by, bw, bh) + R(bx, by, bw, bh, 3, 'url(#' + P + 'cer)', 'stroke="#8c8368" stroke-width=".6"');
    s += R(bx + 8, by + 7, bw - 16, bh - 14, 2, 'url(#' + P + 'gold)', 'stroke="#7a5b12" stroke-width=".6"');
    s += '<path d="M' + bx + ',' + (by + bh / 2 - 5) + ' a5,5 0 0 1 0,10" fill="#a89d80"/>';
    s += Tx(bx + bw / 2, by + bh / 2 + 3.5, label, 10, '#5b4310', 'middle', 700);
    s += shine(bx, by, bw, bh, 3);
    return s;
  }
  function pga(bx, by, bw, bh, n, label) {
    var s = '', i, th = 9, step = (bw - 16) / (n - 1);
    for (i = 0; i < n; i++) s += R((bx + 8 + i * step - 1.1).toFixed(1), by + bh + th - 1, 2.2, 13, 0.6, 'url(#' + P + 'ag)');
    s += shadow(bx, by, bw, bh + th) + R(bx, by + bh - 4, bw, th + 4, 3, '#a89d80') + R(bx, by, bw, bh, 3, 'url(#' + P + 'cer)', 'stroke="#8c8368" stroke-width=".6"');
    s += R(bx + 11, by + 11, bw - 22, bh - 22, 3, 'url(#' + P + 'gold)', 'stroke="#7a5b12" stroke-width=".6"');
    s += '<path d="M' + bx + ',' + by + ' H' + (bx + 15) + ' L' + bx + ',' + (by + 15) + ' Z" fill="#2b3545"/>';
    s += Tx(bx + bw / 2, by + bh / 2 + 3.5, label, 10, '#5b4310', 'middle', 700) + shine(bx, by, bw, bh, 3);
    return s;
  }
  function ihs(sx, sy, sw, sh, m, sub) {
    var s = shadow(sx, sy, sw, sh) + R(sx, sy, sw, sh, 4, 'url(#' + P + sub + ')', 'stroke="#0b0f14" stroke-opacity=".6" stroke-width=".8"'), i;
    for (i = 0; i < 5; i++) { s += cap(sx + 6 + i * 6, sy + 3.5, 5, 3) + cap(sx + sw - 34 + i * 6, sy + sh - 6.5, 5, 3); }
    for (i = 0; i < 4; i++) { s += cap(sx + 3.5, sy + sh - 26 + i * 6, 3, 5) + cap(sx + sw - 6.5, sy + 8 + i * 6, 3, 5); }
    var x = sx + m, y = sy + m, w = sw - 2 * m, h = sh - 2 * m, c = 6;
    s += '<path d="M' + (x + c) + ',' + y + ' H' + (x + w - c) + ' L' + (x + w) + ',' + (y + c) + ' V' + (y + h - c) + ' L' + (x + w - c) + ',' + (y + h) + ' H' + (x + c) + ' L' + x + ',' + (y + h - c) + ' V' + (y + c) + ' Z" fill="url(#' + P + 'ihs)" stroke="#6b7480" stroke-width=".6"/>';
    s += '<path d="M' + (x + 8) + ',' + (y + 8) + ' H' + (x + w - 8) + ' V' + (y + h - 8) + ' H' + (x + 8) + ' Z" fill="none" stroke="#6b7480" stroke-opacity=".4" stroke-width=".5"/>';
    return s + shine(x, y, w, h, 4);
  }
  function hbm(x, y, w, h) {
    var s = R(x, y, w, h, 2, '#0f1620', 'stroke="#2b3545" stroke-width=".6"'), k, lh = (h - 8) / 5;
    for (k = 0; k < 5; k++) s += R(x + 3, y + 3 + k * lh, w - 6, lh - 1.4, 0.8, BC.mem, 'fill-opacity="' + (0.55 + k * 0.08) + '"');
    return s;
  }

  /* ---------- floorplans ---------- */
  var FP = {
    '4004': [[.06, .05, .88, .17, 'io', 'BUS'], [.06, .26, .56, .26, 'core', 'ALU'], [.66, .26, .28, .26, 'ctl', 'CTL'], [.06, .56, .88, .38, 'cache', 'REGISTROS']],
    '8086': [[.06, .05, .88, .26, 'io', 'BIU'], [.06, .35, .42, .28, 'core', 'ALU'], [.52, .35, .42, .28, 'cache', 'REG'], [.06, .67, .88, .27, 'ctl', 'MICROCÓDIGO']],
    '286': [[.06, .05, .88, .18, 'io', 'BIU'], [.06, .27, .4, .3, 'ctl', 'MMU'], [.5, .27, .44, .3, 'core', 'EXEC'], [.06, .61, .88, .33, 'cache', 'DECODIFICAÇÃO']],
    '386': [[.06, .05, .88, .14, 'io', 'BARRAMENTO'], [.06, .23, .4, .24, 'ctl', 'SEG'], [.5, .23, .44, .24, 'ctl', 'PAGINAÇÃO'], [.06, .51, .56, .43, 'core', 'DATAPATH 32 BITS'], [.66, .51, .28, .43, 'cache', 'DECOD.']],
    '486': [[.06, .05, .88, .12, 'io', 'BUS'], [.06, .21, .5, .3, 'cache', 'CACHE L1 8 KB'], [.6, .21, .34, .3, 'ne', 'FPU'], [.06, .55, .5, .39, 'core', 'INTEIROS'], [.6, .55, .34, .39, 'ctl', 'MMU']],
    'p5': [[.06, .05, .88, .1, 'io', 'BUS'], [.06, .19, .42, .22, 'cache', 'I-CACHE 8 KB'], [.52, .19, .42, .22, 'cache', 'D-CACHE 8 KB'], [.06, .45, .27, .26, 'core', 'PIPE U'], [.36, .45, .27, .26, 'core', 'PIPE V'], [.66, .45, .28, .26, 'ne', 'FPU'], [.06, .75, .88, .19, 'ctl', 'PREDIÇÃO DE DESVIO']],
    'p3core': [[.06, .06, .88, .14, 'io', 'FSB'], [.06, .24, .5, .34, 'core', 'NÚCLEO'], [.6, .24, .34, .34, 'ne', 'SSE'], [.06, .62, .88, .32, 'cache', 'L1 + CTL']],
    'p4': [[.06, .05, .88, .1, 'io', 'FSB'], [.06, .19, .4, .22, 'ctl', 'FRONT-END'], [.5, .19, .44, .22, 'cache', 'TRACE CACHE'], [.06, .45, .5, .22, 'core', 'ALUs 2×'], [.6, .45, .34, .22, 'ne', 'SSE2'], [.06, .71, .88, .23, 'cache', 'L2 256 KB']],
    'c2d': [[.05, .05, .42, .4, 'core', 'NÚCLEO 1'], [.53, .05, .42, .4, 'core', 'NÚCLEO 2'], [.05, .49, .9, .38, 'cache', 'L2 COMPARTILHADO 4 MB'], [.05, .9, .9, .06, 'io', '']],
    'i7': [[.05, .05, .21, .38, 'core', 'N1'], [.28, .05, .21, .38, 'core', 'N2'], [.51, .05, .21, .38, 'core', 'N3'], [.74, .05, .21, .38, 'core', 'N4'], [.05, .46, .9, .24, 'cache', 'L3 8 MB'], [.05, .73, .5, .22, 'ctl', 'MEM CTRL'], [.58, .73, .37, .22, 'io', 'QPI']],
    'a7': [[.07, .07, .2, .26, 'core', 'CPU'], [.29, .07, .2, .26, 'core', 'CPU'], [.07, .35, .42, .12, 'cache', 'L2'], [.54, .07, .19, .19, 'gpu', 'GPU'], [.75, .07, .19, .19, 'gpu', 'GPU'], [.54, .28, .19, .19, 'gpu', 'GPU'], [.75, .28, .19, .19, 'gpu', 'GPU'], [.07, .51, .3, .21, 'ne', 'ISP'], [.4, .51, .2, .21, 'cache', 'L3'], [.63, .51, .31, .21, 'io', 'MEM'], [.07, .76, .87, .17, 'io', 'E/S']],
    'a11': [[.06, .06, .2, .24, 'core', 'P'], [.28, .06, .2, .24, 'core', 'P'], [.52, .06, .1, .11, 'core', ''], [.64, .06, .1, .11, 'core', ''], [.52, .19, .1, .11, 'core', ''], [.64, .19, .1, .11, 'core', ''], [.78, .06, .16, .24, 'cache', 'L2'], [.06, .34, .5, .26, 'gpu', 'GPU 3 NÚCLEOS'], [.6, .34, .34, .26, 'ne', 'NEURAL'], [.06, .64, .5, .3, 'io', 'ISP · MÍDIA'], [.6, .64, .34, .3, 'cache', 'SLC']],
    'm1': [[.06, .06, .18, .17, 'core', 'P'], [.26, .06, .18, .17, 'core', 'P'], [.06, .25, .18, .17, 'core', 'P'], [.26, .25, .18, .17, 'core', 'P'], [.06, .44, .38, .07, 'cache', 'L2'], [.5, .06, .09, .1, 'core', ''], [.61, .06, .09, .1, 'core', ''], [.5, .18, .09, .1, 'core', ''], [.61, .18, .09, .1, 'core', ''], [.74, .06, .2, .22, 'cache', 'L2'],
      [.5, .31, .11, .14, 'gpu', ''], [.62, .31, .11, .14, 'gpu', ''], [.74, .31, .11, .14, 'gpu', ''], [.86, .31, .08, .14, 'gpu', ''], [.5, .47, .11, .14, 'gpu', ''], [.62, .47, .11, .14, 'gpu', ''], [.74, .47, .11, .14, 'gpu', ''], [.86, .47, .08, .14, 'gpu', 'GPU'],
      [.06, .55, .38, .2, 'ne', 'NEURAL 16'], [.5, .65, .44, .12, 'cache', 'SLC'], [.06, .8, .88, .14, 'io', 'MEMÓRIA UNIFICADA']]
  };
  function sm() {
    var b = [], i, j;
    for (j = 0; j < 6; j++) for (i = 0; i < 3; i++) { b.push([.05 + i * .14, .05 + j * .15, .12, .13, 'core', '']); b.push([.57 + i * .14, .05 + j * .15, .12, .13, 'core', '']); }
    b.push([.47, .05, .06, .88, 'cache', '']);
    return b;
  }

  /* ---------- composições ---------- */
  function classic(chip, pkg, planKey, mm, aspect) {
    var s = pkg + plate(150, 28, 100, 112, 'DIE · ~' + mm + ' mm²');
    var b = dieBox(200, 82, mm, aspect);
    return s + die(b.x, b.y, b.w, b.h, FP[planKey], { pads: [5, 5, 5, 5] });
  }

  var ART = {
    '4004': function (c) {
      var s = dip(16, 22, 24, 170, 46, '4004');
      s += zoom(80, 70, 92, 104, 134, 70, 168, 104) + plate(72, 104, 116, 82, 'DIE · ~12 mm²');
      var b = { x: 110, y: 113, w: 40, h: 52 };
      return s + die(b.x, b.y, b.w, b.h, FP['4004'], { pads: [4, 4, 4, 4] });
    },
    '8086': function (c) {
      var s = dip(40, 14, 22, 232, 44, '8086');
      s += zoom(80, 66, 92, 102, 180, 66, 168, 102) + plate(72, 102, 116, 84, 'DIE · ~33 mm²');
      return s + die(104, 112, 52, 52, FP['8086'], { pads: [6, 6, 6, 6] });
    },
    '286': function () { return classic(null, pga(20, 28, 100, 82, 11, '80286'), '286', 49); },
    '386': function () { return classic(null, pga(20, 28, 100, 82, 14, '80386'), '386', 104); },
    '486': function () { return classic(null, pga(20, 28, 100, 82, 17, '80486'), '486', 173); },
    'p5': function () { return classic(null, pga(20, 28, 100, 82, 21, 'PENTIUM'), 'p5', 294); },
    'p3': function () {
      var s = shadow(14, 16, 232, 78) + R(14, 16, 232, 78, 10, 'url(#' + P + 'blk)', 'stroke="#4a4d55" stroke-width=".8"'), i;
      for (i = 0; i < 6; i++) s += R(24, 24 + i * 5, 212, 1.4, 0.7, '#0a0b0e');
      s += R(36, 40, 120, 40, 4, '#1c1e24', 'stroke="#5a5e68" stroke-width=".7"') + R(164, 40, 64, 40, 4, '#1c1e24', 'stroke="#5a5e68" stroke-width=".7"');
      s += Tx(96, 64, 'PENTIUM III', 9, '#b9c1cb', 'middle', 700) + Tx(196, 64, '450 MHz', 7, '#8b98ab', 'middle');
      for (i = 0; i < 31; i++) s += R(34 + i * 6, 94, 3.2, 14, 0.6, 'url(#' + P + 'gold)');
      s += R(124, 92, 12, 18, 0, '#0a0d13');
      s += zoom(70, 110, 56, 128, 190, 110, 204, 128) + plate(40, 126, 180, 60, 'NÚCLEO + 2 CHIPS DE CACHE L2');
      s += die(104, 134, 40, 30, FP.p3core, {}) + R(52, 138, 40, 26, 1.5, 'url(#' + P + 'si)') + R(156, 138, 40, 26, 1.5, 'url(#' + P + 'si)');
      s += '<rect x="52" y="138" width="40" height="26" rx="1.5" fill="' + BC.cache + '" fill-opacity=".7"/><rect x="156" y="138" width="40" height="26" rx="1.5" fill="' + BC.cache + '" fill-opacity=".7"/>';
      return s + shine(14, 16, 232, 78, 10);
    },
    'p4': function () {
      var s = ihs(18, 22, 120, 120, 16, 'brn') + zoom(134, 44, 148, 34, 134, 120, 148, 138) + plate(148, 28, 100, 112, 'DIE · ~217 mm²');
      var b = dieBox(198, 82, 217, 1);
      return s + Tx(78, 87, 'PENTIUM 4', 8, '#3a4048', 'middle', 700) + die(b.x, b.y, b.w, b.h, FP.p4, { pads: [6, 6, 6, 6] });
    },
    'c2d': function () {
      var s = ihs(18, 22, 120, 120, 16, 'grn') + zoom(134, 44, 148, 34, 134, 120, 148, 138) + plate(148, 28, 100, 112, 'DIE · ~143 mm²');
      var b = dieBox(198, 82, 143, 1);
      return s + Tx(78, 87, 'CORE 2 DUO', 8, '#3a4048', 'middle', 700) + die(b.x, b.y, b.w, b.h, FP.c2d, { pads: [6, 6, 6, 6] });
    },
    'i7': function () {
      var s = ihs(14, 14, 128, 140, 16, 'grn') + zoom(138, 38, 152, 30, 138, 130, 152, 142) + plate(152, 28, 98, 114, 'DIE · ~263 mm²');
      var b = dieBox(201, 83, 263, 1);
      return s + Tx(78, 87, 'CORE i7', 8, '#3a4048', 'middle', 700) + die(b.x, b.y, b.w, b.h, FP.i7, { pads: [7, 7, 7, 7] });
    },
    'a7': function () {
      return plate(14, 10, 232, 156, '') + die(60, 20, 140, 134, FP.a7, {}) + Tx(130, 180, 'DIE · ~102 mm² · 28 nm', 7, '#8b98ab');
    },
    'a11': function () {
      return plate(14, 10, 232, 156, '') + die(64, 20, 132, 134, FP.a11, {}) + Tx(130, 180, 'DIE · ~88 mm² · 10 nm', 7, '#8b98ab');
    },
    'm1': function () {
      var s = shadow(14, 20, 232, 140) + R(14, 20, 232, 140, 6, 'url(#' + P + 'grn)', 'stroke="#0b0f14" stroke-opacity=".6" stroke-width=".8"');
      s += die(30, 32, 112, 116, FP.m1, {});
      s += R(156, 34, 74, 50, 2, '#0f1318', 'stroke="#3a4350" stroke-width=".7"') + R(156, 94, 74, 50, 2, '#0f1318', 'stroke="#3a4350" stroke-width=".7"');
      s += Tx(193, 62, 'LPDDR4X', 7, '#8b98ab') + Tx(193, 72, '8 GB', 7, '#8b98ab') + Tx(193, 122, 'LPDDR4X', 7, '#8b98ab') + Tx(193, 132, '8 GB', 7, '#8b98ab');
      return s + Tx(130, 178, 'M1 · DIE ~119 mm² · 5 nm', 7, '#8b98ab') + shine(14, 20, 232, 140, 6);
    },
    'h100': function () {
      var s = shadow(10, 18, 240, 146) + R(10, 18, 240, 146, 6, 'url(#' + P + 'blk)', 'stroke="#4a4d55" stroke-width=".8"');
      s += hbm(22, 30, 52, 36) + hbm(22, 76, 52, 36) + hbm(22, 122, 52, 36) + hbm(186, 30, 52, 36) + hbm(186, 76, 52, 36) + hbm(186, 122, 52, 36);
      s += die(82, 36, 96, 112, sm(), {});
      return s + Tx(130, 178, 'H100 · DIE ~814 mm² · 6 HBM3 · 80 GB', 7, '#8b98ab') + shine(10, 18, 240, 146, 6);
    }
  };

  SV.chipArt = function (chip) {
    P = 'ca' + (++uid) + '-';
    var fn = ART[chip.id];
    var inner = fn ? fn(chip) : '';
    return '<svg class="chipart" viewBox="0 0 260 190" role="img" aria-label="Ilustração do ' + chip.n + '" focusable="false">' + defs() + inner + '</svg>';
  };
})();
