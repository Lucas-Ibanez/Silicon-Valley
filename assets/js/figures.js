/*
 * Ilustrações da travessia: uma cena em SVG (line-art) para cada checkpoint.
 * Cada função devolve uma string <svg>. As formas com classe "d" se desenham
 * quando o item entra na tela (stroke-dashoffset via pathLength=1); as demais
 * classes (pu, wv, blink, bob…) são animações ambientes definidas no CSS.
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};

  /* ---------- primitivas ---------- */
  function st(i) { return i ? ' style="--i:' + i + '"' : ''; }
  function P(d, c, i) { return '<path class="' + (c || 'l') + ' d" pathLength="1" d="' + d + '"' + st(i) + '/>'; }
  function Pn(d, c, extra) { return '<path class="' + c + '" d="' + d + '"' + (extra || '') + '/>'; }
  function R(x, y, w, h, r, c, i) { return '<rect class="' + (c || 'l') + ' d" pathLength="1" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '"' + st(i) + '/>'; }
  function C(x, y, r, c, i) { return '<circle class="' + (c || 'l') + ' d" pathLength="1" cx="' + x + '" cy="' + y + '" r="' + r + '"' + st(i) + '/>'; }
  function Ln(x1, y1, x2, y2, c, i) { return P('M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2, c, i); }
  function E(cx, cy, rx, ry, c, i) { return P('M' + (cx - rx) + ',' + cy + ' A' + rx + ',' + ry + ' 0 1 0 ' + (cx + rx) + ',' + cy + ' A' + rx + ',' + ry + ' 0 1 0 ' + (cx - rx) + ',' + cy, c, i); }
  function T(x, y, t, c, anchor, size) {
    return '<text class="tx ' + (c || '') + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'start') + '"' + (size ? ' style="font-size:' + size + 'px"' : '') + '>' + t + '</text>';
  }
  /* ponto de luz que percorre um caminho */
  function Pu(d, delay, c) { return '<path class="pu ' + (c || '') + '" pathLength="1" d="' + d + '" style="animation-delay:-' + (delay || 0) + 's"/>'; }
  function G() { return P('M10,200 H310', 'l', 0); }
  function svg(inner) { return '<svg class="fig" viewBox="0 0 320 240" focusable="false" aria-hidden="true">' + inner + '</svg>'; }
  function loop(n, fn) { var s = ''; for (var k = 0; k < n; k++) s += fn(k); return s; }
  function pol(pts, c) { return '<polygon class="' + c + '" points="' + pts + '"/>'; }

  /* ---------- 1 · 1891 Stanford ---------- */
  function palm(x, dir) {
    var d = dir;
    return P('M' + x + ',200 Q' + (x - 4 * d) + ',164 ' + (x + 2 * d) + ',128', 'l', 2) +
      P('M' + (x + 2 * d) + ',128 Q' + (x - 14 * d) + ',112 ' + (x - 22 * d) + ',126', 'a', 3) +
      P('M' + (x + 2 * d) + ',128 Q' + (x + 18 * d) + ',112 ' + (x + 28 * d) + ',124', 'a', 3) +
      P('M' + (x + 2 * d) + ',128 Q' + (x - 8 * d) + ',106 ' + (x - 16 * d) + ',102', 'a', 4) +
      P('M' + (x + 2 * d) + ',128 Q' + (x + 12 * d) + ',104 ' + (x + 22 * d) + ',100', 'a', 4) +
      P('M' + (x + 2 * d) + ',128 Q' + (x + 2 * d) + ',110 ' + (x + 2 * d) + ',98', 'a', 4);
  }
  function f1() {
    var rays = loop(8, function (k) {
      var a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      return Pn('M' + (252 + c * 20) + ',' + (50 + s * 20) + ' L' + (252 + c * 27) + ',' + (50 + s * 27), 'a');
    });
    return svg(
      G() + '<g class="spin" style="transform-origin:252px 50px">' + rays + '</g>' + C(252, 50, 12, 'a', 2) +
      P('M60,200 V148 H260 V200', 'l', 1) + P('M54,148 H266', 'l', 2) + P('M54,148 L66,136 H254 L266,148', 'l', 3) +
      loop(5, function (k) { var x = 70 + k * 38; return P('M' + x + ',200 V172 A18,18 0 0 1 ' + (x + 36) + ',172 V200', 'l', 3 + k); }) +
      P('M126,136 V92 L160,58 L194,92 V136', 'l', 5) + C(160, 96, 10, 'a', 6) + Pn('M160,86 V106 M150,96 H170', 'a') +
      P('M152,136 V116 A8,8 0 0 1 168,116 V136', 'l', 6) + P('M160,58 V44 M154,50 H166', 'a', 7) +
      palm(26, 1) + palm(294, -1));
  }

  /* ---------- 2 · 1909 Federal Telegraph ---------- */
  function f2() {
    var waves = loop(4, function (k) {
      var r = 18 + k * 15;
      return '<path class="a wv" d="M' + (160 - r) + ',38 A' + r + ',' + r + ' 0 0 1 ' + (160 + r) + ',38" style="animation-delay:' + (k * 0.75) + 's"/>';
    });
    return svg(
      G() + P('M141,200 L160,44 L179,200', 'l', 1) + P('M143,186 L177,152 L147,152 L173,114 L152,114 L168,82 L156,82', 'l', 2) +
      C(160, 38, 5, 'a', 3) + waves +
      R(30, 170, 72, 30, 3, 'l', 3) + P('M54,170 V150 M78,170 V150', 'l', 4) +
      Pn('M54,148 L60,141 L63,152 L69,143 L72,150 L78,148', 'a sp') + P('M102,186 H141', 'l', 5) + Pu('M102,186 H141 L160,60', 0.4, '') +
      T(66, 218, 'ARCO DE POULSEN', '', 'middle', 9) + T(160, 218, 'RÁDIO · 1909', 'dim', 'middle', 9));
  }

  /* ---------- 3 · 1939 Garagem da HP ---------- */
  function f3() {
    return svg(
      G() + '<rect class="glow" x="96" y="134" width="128" height="66"/>' +
      P('M44,200 V116 H276 V200', 'l', 1) + P('M32,118 L160,56 L288,118', 'l', 2) + P('M92,200 V132 H228 V200', 'l', 3) +
      P('M96,138 H224 M96,144 H224', 'l', 4) + P('M104,184 H216 M110,184 V200 M210,184 V200', 'l', 4) +
      R(128, 158, 64, 26, 3, 'a', 5) + C(144, 171, 6, 'l', 6) + R(158, 163, 28, 16, 2, 'l', 6) +
      P('M160,171 q4,-8 8,0 t8,0 t8,0', 'b', 7) + Pu('M160,171 q4,-8 8,0 t8,0 t8,0', 0.2, '') +
      R(242, 150, 24, 16, 2, 'l', 5) + T(254, 162, '367', '', 'middle', 9) +
      P('M198,30 H268 L280,42 L268,54 H198 Z', 'a', 6) + C(207, 42, 2.4, 'a', 7) + T(218, 45.5, 'US$ 538', 'acc', 'start', 9.5));
  }

  /* ---------- 4 · 1951 Parque industrial de Stanford ---------- */
  function f4() {
    var wins = '';
    for (var r = 0; r < 2; r++) for (var c = 0; c < 5; c++) wins += R(42 + c * 20, 142 + r * 28, 12, 14, 1, 'l', 3);
    return svg(
      G() + P('M262,200 V86 H284 V200', 'l', 1) + R(260, 62, 26, 24, 0, 'l', 2) + P('M260,62 L273,28 L286,62', 'a', 3) +
      Pn('M273,100 V108 M273,120 V128 M273,140 V148 M273,160 V168', 'l') +
      R(30, 128, 112, 72, 0, 'l', 2) + wins + R(156, 150, 86, 50, 0, 'l', 3) + P('M164,168 H234 M164,182 H234', 'l', 4) +
      '<g transform="rotate(-8 56 62)">' + P('M24,26 H70 L84,40 V92 H24 Z', 'l', 3) + P('M70,26 V40 H84', 'l', 4) + P('M32,48 H62 M32,58 H76 M32,68 H76', 'l', 5) +
      C(60, 82, 7, 'a', 6) + '</g>' +
      T(160, 222, 'ARRENDAMENTO · NÃO VENDA', 'dim', 'middle', 9));
  }

  /* ---------- 5 · 1956 Transistor ---------- */
  function f5() {
    return svg(
      C(110, 118, 46, 'l', 1) + P('M30,118 H94', 'l', 2) + P('M94,94 V142', 'a', 2) + P('M94,106 L128,80 V40', 'l', 3) + P('M94,130 L128,156 V200', 'l', 3) +
      pol('122,151.4 111.6,148.5 116.5,142.2', 'fa') + Pu('M128,40 V80 L96,106 V130 L128,156 V200', 0, '') +
      E(236, 92, 34, 9, 'l', 2) + P('M202,92 V140 M270,92 V140', 'l', 3) + P('M202,140 A34,9 0 0 0 270,140', 'l', 3) + P('M196,140 H276', 'l', 4) +
      P('M222,148 V232 M236,150 V232 M250,148 V232', 'l', 5) +
      C(286, 34, 12, 'a', 4) + C(286, 34, 6, 'l', 5) + P('M278,24 L272,6 M294,24 L300,6', 'l', 5) +
      T(110, 218, 'TRANSISTOR · NOBEL 1956', 'dim', 'middle', 9));
  }

  /* ---------- 6 · 1957 Os Oito Traidores ---------- */
  function person(x, k) {
    return '<g class="bob" style="animation-delay:-' + (k * 0.18) + 's">' + C(x, 150, 7, 'a', 3 + k) +
      P('M' + x + ',158 V184 M' + (x - 8) + ',176 L' + x + ',164 L' + (x + 8) + ',176 M' + x + ',184 L' + (x - 7) + ',200 M' + x + ',184 L' + (x + 7) + ',200', 'l', 3 + k) + '</g>';
  }
  function f6() {
    return svg(
      G() + R(14, 104, 44, 96, 0, 'l', 1) + P('M28,200 V140 H48 V200', 'l', 2) + P('M48,140 L58,148 V200', 'l', 2) +
      loop(8, function (k) { return person(88 + k * 30, k); }) +
      P('M70,222 H292 M282,216 L292,222 L282,228', 'a', 4) +
      T(190, 94, '8 PESQUISADORES SAEM JUNTOS', 'acc', 'middle', 9.5) + T(190, 110, 'E FUNDAM A FAIRCHILD', 'dim', 'middle', 9));
  }

  /* ---------- 7 · 1959 Circuito integrado planar ---------- */
  function f7() {
    var tr = ['M130,78 H110', 'M130,94 H110', 'M130,110 H110', 'M190,78 H210', 'M190,94 H210', 'M190,110 H210', 'M146,64 V44', 'M160,64 V44', 'M174,64 V44', 'M146,124 V144', 'M160,124 V144', 'M174,124 V144'];
    return svg(
      R(100, 34, 120, 120, 6, 'l', 1) + R(130, 64, 60, 60, 3, 'a', 2) + P('M130,94 H190 M160,64 V124', 'a', 3) +
      tr.map(function (d, k) { return P(d, 'l', 3 + (k % 4)); }).join('') +
      Pu('M110,94 H130 L160,94 V64 V44', 0.3, '') + Pu('M210,110 H190 L160,110 V124 V144', 1.2, '') +
      R(80, 206, 160, 22, 0, 'l', 4) + P('M80,206 V200 H128 M152,200 H178 M202,200 H240', 'l', 5) +
      R(128, 206, 24, 10, 2, 'a', 6) + R(178, 206, 24, 10, 2, 'a', 6) + P('M124,197 H156 M174,197 H206', 'b', 7) +
      T(248, 203, 'SiO₂', '', 'start', 9) + T(248, 222, 'Si', '', 'start', 9));
  }

  /* ---------- 8 · 1968 Intel · memória de 64 bits ---------- */
  function f8() {
    var s = '', k, r, c, n = 0;
    for (k = 0; k <= 8; k++) s += P('M' + (72 + k * 22) + ',36 V212', 'l', 1) + P('M72,' + (36 + k * 22) + ' H248', 'l', 1);
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
      var v = ((r * 7 + c * 13 + r * c) % 9);
      if (v < 3) s += '<rect class="fa cell" x="' + (75 + c * 22) + '" y="' + (39 + r * 22) + '" width="16" height="16" style="animation-delay:-' + ((n++ % 9) * 0.31).toFixed(2) + 's"/>';
    }
    return svg(s + Pu('M40,124 H72', 0.1, '') + P('M40,124 H72', 'a', 2) + T(40, 114, 'BUS', 'dim', 'middle', 9) + T(284, 124, '64', 'acc', 'middle', 18) + T(284, 140, 'bits', 'dim', 'middle', 9));
  }

  /* ---------- 9 · 1969 ARPANET ---------- */
  function f9() {
    return svg(
      R(14, 40, 112, 80, 6, 'l', 1) + R(194, 40, 112, 80, 6, 'l', 1) +
      '<text class="tx acc" x="26" y="74" style="font-size:13px">&gt; LO<tspan class="dimt">GIN</tspan></text>' +
      T(206, 74, '&gt; LO', 'acc', 'start', 13) + '<rect class="blink" x="256" y="63" width="8" height="13" fill="var(--accent)"/>' +
      T(70, 138, 'UCLA', '', 'middle', 10) + T(250, 138, 'SRI · MENLO PARK', '', 'middle', 9) +
      P('M126,80 C150,60 170,100 194,80', 'b', 3) + Pu('M126,80 C150,60 170,100 194,80', 0, '') + Pu('M126,80 C150,60 170,100 194,80', 1.3, '') +
      P('M80,188 L140,220 L200,196 L250,222 M80,188 L200,196', 'l', 4) +
      C(80, 188, 7, 'a nf', 5) + C(140, 220, 5, 'l nf', 5) + C(200, 196, 7, 'a nf', 5) + C(250, 222, 5, 'l nf', 5) +
      T(80, 174, 'UCLA', 'dim', 'middle', 8.5) + T(204, 182, 'SRI', 'dim', 'middle', 8.5));
  }

  /* ---------- 10 · 1971 "Silicon Valley" + 4004 ---------- */
  function f10() {
    var cols = '';
    for (var c = 0; c < 3; c++) for (var r = 0; r < 5; r++) cols += P('M' + (34 + c * 46) + ',' + (88 + r * 14) + ' h36', 'l', 3);
    return svg(
      '<g transform="rotate(-6 100 110)">' + R(24, 34, 152, 144, 3, 'l', 1) + T(100, 56, 'SILICON VALLEY', 'acc', 'middle', 11) + T(100, 71, 'U.S.A.', 'acc', 'middle', 11) + P('M32,78 H168', 'l', 2) + cols + '</g>' +
      R(196, 54, 56, 124, 4, 'l', 2) + P('M214,54 A10,10 0 0 0 234,54', 'a', 3) +
      loop(8, function (k) { var y = 70 + k * 14; return P('M186,' + y + ' H196 M252,' + y + ' H262', 'l', 4); }) +
      T(224, 118, '4004', 'acc', 'middle', 14) + T(224, 136, 'CPU', 'dim', 'middle', 9) + T(224, 205, '2.300 transistores', 'dim', 'middle', 8.5) +
      Pu('M186,70 H196 H252 H262', 0.2, ''));
  }

  /* ---------- 11 · 1972 Sand Hill Road / capital de risco ---------- */
  function f11() {
    var hs = [18, 30, 46, 70, 104];
    return svg(
      G() + P('M10,200 Q60,150 120,176 T210,166', 'l', 1) + P('M30,236 C60,204 110,214 140,184 S178,152 192,128', 'l', 2) + P('M72,236 C96,208 140,220 170,190 S204,160 214,130', 'l', 2) +
      R(30, 40, 104, 30, 3, 'a', 2) + T(82, 59, 'SAND HILL RD', '', 'middle', 10) + P('M82,70 V150', 'l', 3) +
      hs.map(function (h, k) { return '<rect class="fa grow" x="' + (196 + k * 22) + '" y="' + (200 - h) + '" width="14" height="' + h + '" style="--i:' + (k + 3) + '"/>'; }).join('') +
      P('M196,170 L238,140 L260,150 L304,82', 'b', 6) + pol('304,82 292,86 300,94', 'fb') +
      T(250, 222, 'CAPITAL EM TROCA DE PARTICIPAÇÃO', 'dim', 'middle', 8.5));
  }

  /* ---------- 12 · 1973 Xerox Alto ---------- */
  function f12() {
    return svg(
      R(104, 26, 96, 128, 8, 'l', 1) + R(112, 34, 80, 112, 4, 'l', 2) +
      R(118, 42, 44, 34, 2, 'a', 3) + P('M118,50 H162', 'a', 3) + R(142, 68, 44, 40, 2, 'l', 4) + P('M142,76 H186', 'l', 4) + P('M150,88 H178 M150,96 H170', 'l', 5) +
      '<g class="cursor"><path d="M0,0 L0,14 L4,11 L7,18 L10,17 L7,10 L12,10 Z" fill="var(--text)" stroke="var(--bg)" stroke-width="1"/></g>' +
      P('M138,154 V166 H166 V154 M124,166 H180', 'l', 4) +
      R(70, 178, 130, 22, 3, 'l', 5) + P('M80,185 H190 M80,193 H190', 'l', 6) +
      '<g class="jit">' + R(226, 160, 28, 38, 12, 'a', 5) + P('M226,172 H254 M240,160 V172', 'a', 6) + '</g>' +
      P('M240,198 C240,216 214,216 200,192', 'l', 6) +
      T(160, 224, 'ALTO · XEROX PARC · 1973', 'dim', 'middle', 9));
  }

  /* ---------- 13 · 1976 Apple (placa + maçã) ---------- */
  function f13() {
    return svg(
      R(24, 56, 150, 112, 6, 'l', 1) + R(40, 72, 36, 22, 2, 'a', 2) + R(88, 72, 26, 16, 2, 'l', 3) + R(124, 72, 36, 22, 2, 'l', 3) +
      R(40, 110, 50, 24, 2, 'l', 4) + R(104, 112, 22, 22, 2, 'a', 4) + R(138, 112, 24, 22, 2, 'l', 4) +
      P('M76,83 H88 M114,80 H124 M90,122 H104 M126,123 H138 M58,94 V110 M144,94 V112', 'l', 5) +
      Pu('M76,83 H88 L106,80 H124 L144,94 V112', 0, '') +
      '<circle class="fa blink" cx="160" cy="152" r="3"/>' + P('M44,168 V184 M56,168 V184 M68,168 V184 M80,168 V184 M92,168 V184', 'l', 6) +
      T(24, 214, 'US$ 666,66', 'acc', 'start', 12) + T(24, 228, 'APPLE I', 'dim', 'start', 9) +
      P('M250,80 C222,66 196,92 204,128 C210,160 232,180 250,172 C268,180 290,160 296,128 C304,92 278,66 250,80 Z', 'a', 3) +
      P('M250,80 Q248,64 256,54', 'l', 5) + P('M256,60 Q274,46 288,54 Q278,70 256,60', 'b', 6));
  }

  /* ---------- 14 · 1984 Macintosh ---------- */
  function f14() {
    return svg(
      R(96, 26, 128, 164, 14, 'l', 1) + R(114, 44, 92, 76, 6, 'l', 2) +
      '<g class="blinkeye">' + C(148, 74, 2.6, 'fa', 3) + C(172, 74, 2.6, 'fa', 3) + '</g>' + P('M130,96 Q160,114 190,96', 'a', 4) + P('M160,78 V90 H166', 'a', 4) +
      R(130, 144, 60, 6, 3, 'l', 4) + R(92, 190, 136, 10, 4, 'l', 5) +
      '<g class="float">' + R(244, 74, 44, 44, 3, 'l', 4) + R(254, 74, 24, 15, 1, 'a', 5) + R(250, 98, 32, 20, 1, 'l', 5) + '</g>' +
      T(160, 224, 'MACINTOSH · 24 JAN 1984', 'acc', 'middle', 9.5));
  }

  /* ---------- 15 · 1995 Netscape IPO ---------- */
  function f15() {
    var candles = loop(7, function (k) {
      var x = 50 + k * 25, mid = 138 - k * 10 - (k % 2) * 6, h = 14 + (k % 3) * 4;
      return P('M' + x + ',' + (mid - h) + ' V' + (mid + h), 'l', 4 + k) + '<rect class="fa grow" x="' + (x - 5) + '" y="' + (mid - h / 2) + '" width="10" height="' + h + '" style="--i:' + (k + 4) + '"/>';
    });
    return svg(
      R(24, 36, 214, 130, 8, 'l', 1) + P('M24,60 H238', 'l', 2) + C(40, 48, 3, 'l', 2) + C(52, 48, 3, 'l', 2) + C(64, 48, 3, 'l', 2) + R(80, 42, 130, 12, 6, 'l', 3) +
      candles + P('M40,150 L66,140 L92,128 L116,124 L140,108 L166,96 L194,82 L222,74', 'b', 6) + Pu('M40,150 L66,140 L92,128 L116,124 L140,108 L166,96 L194,82 L222,74', 0, '') +
      P('M258,122 C258,98 266,86 282,86 C298,86 306,98 306,122 Z', 'a', 4) + P('M252,122 H312', 'l', 5) + P('M282,86 V76', 'l', 5) + C(282, 72, 3, 'l', 6) + C(282, 130, 5, 'fa', 6) +
      '<path class="a wv2" d="M314,102 q8,8 0,18"/><path class="a wv2" d="M320,96 q12,14 0,30" style="animation-delay:.3s"/>' +
      '<path class="a wv2" d="M250,102 q-8,8 0,18"/>' +
      T(282, 150, 'IPO', 'acc', 'middle', 12) + T(282, 164, '9 AGO 1995', 'dim', 'middle', 8.5));
  }

  /* ---------- 16 · 1998 Google (PageRank) ---------- */
  function f16() {
    var inside = [[120, 88], [182, 82], [150, 128], [110, 138], [190, 140]], out = [[40, 56], [56, 176], [262, 58], [276, 112]];
    var edges = [[0, 2], [1, 2], [3, 2], [4, 2], [0, 1]], s = '', k;
    s += C(150, 112, 62, 'l', 1) + P('M194,156 L242,204', 'a thick', 2);
    var oe = [[0, 0], [1, 3], [2, 1], [3, 4]];
    for (k = 0; k < oe.length; k++) s += P('M' + out[oe[k][0]][0] + ',' + out[oe[k][0]][1] + ' L' + inside[oe[k][1]][0] + ',' + inside[oe[k][1]][1], 'l dash', 3);
    for (k = 0; k < edges.length; k++) s += P('M' + inside[edges[k][0]][0] + ',' + inside[edges[k][0]][1] + ' L' + inside[edges[k][1]][0] + ',' + inside[edges[k][1]][1], 'l', 4);
    for (k = 0; k < out.length; k++) s += C(out[k][0], out[k][1], 5, 'l nf', 4);
    for (k = 0; k < inside.length; k++) s += C(inside[k][0], inside[k][1], k === 2 ? 15 : 7, k === 2 ? 'a nf' : 'l nf', 5);
    s += '<circle class="fa halo" cx="150" cy="128" r="9"/>';
    s += Pu('M120,88 L150,128', 0, '') + Pu('M182,82 L150,128', 0.8, '') + Pu('M110,138 L150,128', 1.4, '') + Pu('M190,140 L150,128', 0.4, '');
    s += T(150, 218, 'PAGERANK · 1998', 'dim', 'middle', 9);
    return svg(s);
  }

  /* ---------- 17 · 2000 Estouro da bolha ---------- */
  function f17() {
    var rays = loop(10, function (k) {
      var a = k * Math.PI / 5, c = Math.cos(a), s = Math.sin(a);
      return Pn('M' + (86 + c * 56) + ',' + (104 + s * 56) + ' L' + (86 + c * 70) + ',' + (104 + s * 70), 'a');
    });
    return svg(
      G() + '<g class="bubble" style="transform-origin:86px 104px">' + C(86, 104, 48, 'l', 1) + P('M58,86 A34,34 0 0 1 80,64', 'a', 2) + '</g>' +
      '<g class="rays">' + rays + '</g>' +
      P('M152,188 L176,170 L198,134 L222,86 L238,58', 'b', 3) + P('M238,58 L256,108 L276,150 L300,178', 'bad', 5) +
      C(238, 58, 4, 'fa', 4) + T(238, 44, '5.000', '', 'middle', 10) + T(292, 194, '-78%', 'badt', 'middle', 12) +
      T(86, 224, 'BOLHA PONTO-COM', 'dim', 'middle', 9) + T(226, 224, 'NASDAQ · 2000–2002', 'dim', 'middle', 9));
  }

  /* ---------- 18 · 2004 Redes sociais ---------- */
  function avatar(x, y, r, c, i) {
    return C(x, y, r, c + ' nf', i) + C(x, y - r * 0.2, r * 0.3, 'l', i + 1) +
      P('M' + (x - r * 0.6) + ',' + (y + r * 0.66) + ' Q' + x + ',' + (y + r * 0.08) + ' ' + (x + r * 0.6) + ',' + (y + r * 0.66), 'l', i + 1);
  }
  function f18() {
    var nodes = [[60, 62], [252, 58], [54, 166], [266, 164], [160, 198]], s = '', k;
    for (k = 0; k < nodes.length; k++) s += P('M160,112 L' + nodes[k][0] + ',' + nodes[k][1], 'l', 2);
    s += P('M60,62 L54,166 M252,58 L266,164', 'l dash', 3);
    s += Pu('M160,112 L60,62', 0, '') + Pu('M160,112 L266,164', 1.1, '') + Pu('M160,112 L160,198', 0.6, '') + Pu('M160,112 L252,58', 1.7, '');
    for (k = 0; k < nodes.length; k++) s += avatar(nodes[k][0], nodes[k][1], 20, 'l', 3);
    s += avatar(160, 112, 30, 'a', 3);
    var heart = 'M0,7 C-9,-2 -5,-11 0,-4 C5,-11 9,-2 0,7 Z';
    s += '<g transform="translate(212,86)"><path class="fa heart" d="' + heart + '"/></g><g transform="translate(112,86)"><path class="fa heart h2" d="' + heart + '"/></g>';
    return svg(s + T(160, 232, 'THEFACEBOOK · PALO ALTO · 2004', 'dim', 'middle', 9));
  }

  /* ---------- 19 · 2007 iPhone ---------- */
  function f19() {
    var apps = '', cls = ['a', 'l', 'b', 'l'];
    for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) apps += R(127 + c * 24, 46 + r * 24, 17, 17, 5, cls[(r + c) % 4], 3);
    return svg(
      R(110, 14, 100, 196, 16, 'l', 1) + R(118, 38, 84, 140, 3, 'l', 2) + P('M148,26 H172', 'l', 2) + C(160, 194, 8, 'l', 2) + apps +
      '<g class="pinch1"><circle class="a" cx="64" cy="150" r="14"/><circle class="fa" cx="64" cy="150" r="4"/></g>' +
      '<g class="pinch2"><circle class="a" cx="256" cy="86" r="14"/><circle class="fa" cx="256" cy="86" r="4"/></g>' +
      P('M82,134 L96,120 M238,102 L224,116', 'a', 4) +
      T(160, 232, 'IPHONE · 9 JAN 2007', 'dim', 'middle', 9));
  }

  /* ---------- 20 · 2022 IA generativa ---------- */
  function f20() {
    var L = [3, 5, 5, 3], pts = [], l, j, k, s = '';
    for (l = 0; l < L.length; l++) { pts[l] = []; for (j = 0; j < L[l]; j++) pts[l].push([36 + l * 44, 112 + (j - (L[l] - 1) / 2) * 28]); }
    for (l = 0; l < L.length - 1; l++) for (j = 0; j < pts[l].length; j++) for (k = 0; k < pts[l + 1].length; k++)
      s += '<path class="l net" d="M' + pts[l][j][0] + ',' + pts[l][j][1] + ' L' + pts[l + 1][k][0] + ',' + pts[l + 1][k][1] + '"/>';
    for (l = 0; l < L.length; l++) for (j = 0; j < pts[l].length; j++) s += '<circle class="' + ((l + j) % 3 === 0 ? 'fa' : 'nd') + ' neur" cx="' + pts[l][j][0] + '" cy="' + pts[l][j][1] + '" r="5" style="animation-delay:-' + ((l * 3 + j) * 0.37).toFixed(2) + 's"/>';
    s += Pu('M36,84 L80,98 L124,112 L168,112', 0, '') + Pu('M36,140 L80,126 L124,98 L168,84', 1, '') + Pu('M36,112 L80,70 L124,154 L168,140', 1.8, '');
    s += P('M174,112 H204', 'b', 3);
    s += R(204, 44, 100, 70, 12, 'l', 2) + P('M216,114 L210,130 L236,114', 'l', 3) +
      '<circle class="fa dot1" cx="234" cy="79" r="4"/><circle class="fa dot2" cx="254" cy="79" r="4"/><circle class="fa dot3" cx="274" cy="79" r="4"/>';
    s += R(228, 152, 56, 46, 5, 'a', 4) + R(240, 164, 32, 22, 3, 'l', 5) + T(256, 179, 'GPU', '', 'middle', 9) +
      loop(5, function (n) { var o = 236 + n * 10; return P('M' + o + ',152 V146 M' + o + ',198 V204', 'a', 6); });
    s += T(110, 224, 'REDES NEURAIS + CHIPS · 2022', 'dim', 'middle', 9);
    return svg(s);
  }

  SV.figures = [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15, f16, f17, f18, f19, f20].map(function (fn) { return fn(); });
})();
