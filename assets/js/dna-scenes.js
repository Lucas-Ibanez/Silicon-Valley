/*
 * "Por que aqui?": as cinco cenas interativas (uma por ingrediente do Vale).
 * Cada cena expõe { html(), mount(root, ctx) → destroy }.
 *  uni  Stanford × Berkeley (torres desenhadas + empresas nascidas em cada campus)
 *  vc   simulador de portfólio de capital de risco
 *  mob  simulação de mobilidade de talentos (Califórnia × cláusula de não concorrência)
 *  def  linha do tempo da defesa e do governo (Ames, Lockheed, Sputnik, Apollo, Minuteman)
 *  gar  garagens: abra a porta de HP, Apple e Google
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};
  var U = SV.util, clamp = U.clamp, lerp = U.lerp, esc = U.esc;
  var S = SV.dnaScenes = {};
  var TAU = Math.PI * 2;

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pl(d, i) { return '<path pathLength="1" style="--i:' + i + '" d="' + d + '"/>'; }
  function inView(el, cb) {
    if (!window.IntersectionObserver) { cb(true); return function () {}; }
    var io = new IntersectionObserver(function (en) { cb(en[0].isIntersecting); }, { threshold: 0.15 });
    io.observe(el); return function () { io.disconnect(); };
  }

  /* =========================================================
     1 · Universidades
     ========================================================= */
  var HOOVER =
    pl('M6,292 H114', 0) + pl('M14,292 V238 H106 V292', 1) + pl('M52,292 V270 A8,8 0 0 1 68,270 V292', 2) +
    pl('M38,238 V88 H82 V238', 3) + pl('M56,112 V124 M64,112 V124 M56,142 V154 M64,142 V154 M56,172 V184 M64,172 V184 M56,202 V214 M64,202 V214', 4) +
    pl('M34,88 V52 H86 V88 Z', 5) + pl('M40,88 V70 A5,5 0 0 1 50,70 V88 M55,88 V70 A5,5 0 0 1 65,70 V88 M70,88 V70 A5,5 0 0 1 80,70 V88', 6) +
    pl('M32,52 L60,12 L88,52', 7) + pl('M60,12 V0', 8);
  var SATHER =
    pl('M6,292 H114', 0) + pl('M28,292 V252 H92 V292', 1) + pl('M54,292 V274 A6,6 0 0 1 66,274 V292', 2) +
    pl('M42,252 V78 H78 V252', 3) + pl('M56,112 V124 M64,112 V124 M56,142 V154 M64,142 V154 M56,172 V184 M64,172 V184 M56,202 V214 M64,202 V214 M56,230 V242 M64,230 V242', 4) +
    '<circle pathLength="1" style="--i:5" cx="60" cy="94" r="9"/>' + pl('M60,94 V87 M60,94 L66,97', 5) +
    pl('M38,78 V46 H82 V78 Z', 6) + pl('M44,78 V60 A4,4 0 0 1 52,60 V78 M56,78 V60 A4,4 0 0 1 64,60 V78 M68,78 V60 A4,4 0 0 1 76,60 V78', 7) +
    pl('M36,46 L60,14 L84,46', 8) + pl('M60,14 V2 M55,5 H65', 9);
  var STAN = [
    ['Hewlett-Packard', 'Bill Hewlett e Dave Packard abriram a HP em 1939, incentivados por Terman.'],
    ['Google', 'Larry Page e Sergey Brin criaram o PageRank como doutorandos (1998).'],
    ['Cisco', 'Len Bosack e Sandy Lerner ligaram as redes do campus (1984).'],
    ['Yahoo!', 'Jerry Yang e David Filo começaram um guia da web num trailer do campus (1994).'],
    ['Sun Microsystems', 'O nome vem de Stanford University Network (1982).'],
    ['Instagram', 'Kevin Systrom e Mike Krieger estudaram ali (2010).'],
    ['Snap', 'Evan Spiegel e Bobby Murphy, colegas de Stanford (2011).']
  ];
  var BERK = [
    ['Intel', 'Gordon Moore (graduação) e Andy Grove (doutorado) vieram de Berkeley.'],
    ['Apple', 'Steve Wozniak estudou em Berkeley antes de cofundar a empresa.'],
    ['Sun Microsystems', 'Bill Joy, cofundador, escreveu o BSD Unix em Berkeley.'],
    ['BSD Unix', 'O Unix de Berkeley virou base de sistemas como macOS e iOS.'],
    ['SPICE', 'Simulador de circuitos criado em Berkeley e usado até hoje para projetar chips.'],
    ['PostgreSQL', 'O banco de dados nasceu no projeto POSTGRES, de Michael Stonebraker.']
  ];
  function campus(cls, tower, logo, kicker, name, chips) {
    return '<article class="campus ' + cls + '">' +
      '<svg class="campus__tower" viewBox="0 0 120 300" aria-hidden="true">' + tower + '</svg>' +
      '<span class="logo campus__logo"><img src="assets/img/logos/' + logo + '.svg" alt="' + name + '"></span>' +
      '<div class="campus__head"><span class="mono">' + kicker + '</span><h4>' + name + '</h4></div>' +
      '<p class="campus__cap" aria-live="polite">' + (window.matchMedia('(hover: none)').matches ? 'Toque em uma empresa.' : 'Passe o mouse sobre uma empresa.') + '</p>' +
      '<div class="campus__chips">' + chips.map(function (c, i) { return '<button type="button" class="cchip" style="--i:' + i + '" data-t="' + esc(c[1]) + '">' + esc(c[0]) + '</button>'; }).join('') + '</div></article>';
  }
  S.uni = {
    html: function () {
      return '<div class="uni">' +
        campus('campus--stan', HOOVER, 'stanford-cardinal', 'Palo Alto · 1891', 'Stanford', STAN) +
        campus('campus--berk', SATHER, 'berkeley-logo', 'Berkeley · 1868', 'UC Berkeley', BERK) + '</div>';
    },
    mount: function (root, ctx) {
      [].forEach.call(root.querySelectorAll('.campus'), function (card) {
        var cap = card.querySelector('.campus__cap'), cur = null;
        function show(b) {
          if (cur) cur.classList.remove('is-on');
          cur = b; b.classList.add('is-on'); cap.textContent = b.dataset.t; cap.classList.add('is-on');
          ctx.award('dna-uni', 4, 'Campus explorado');
        }
        [].forEach.call(card.querySelectorAll('.cchip'), function (b) {
          b.addEventListener('pointerenter', function () { show(b); });
          b.addEventListener('focus', function () { show(b); });
          b.addEventListener('click', function () { show(b); });
        });
      });
      return function () {};
    }
  };

  /* =========================================================
     2 · Capital de risco
     ========================================================= */
  var VC_OUT = [0, 0, 0, 0, 0, 0, 1.5, 3, 10, 50];
  var VC_NAMES = ['App de fotos', 'Rede social', 'Hardware', 'Software B2B', 'Biotech', 'Games', 'Fintech', 'IA', 'Energia', 'Logística'];
  function fx(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
  S.vc = {
    html: function () {
      var cards = VC_NAMES.map(function (n, i) {
        return '<button type="button" class="su" data-i="' + i + '" aria-label="Investir em ' + esc(n) + '"><span class="su__in">' +
          '<span class="su__f"><i class="su__coin" aria-hidden="true">$</i><b>' + esc(n) + '</b><small class="mono">US$ 1 mi</small></span>' +
          '<span class="su__b"></span></span></button>';
      }).join('');
      return '<div class="vc"><div class="vc__bar"><span class="vc__sign mono">SAND HILL RD</span>' +
        '<span class="vc__fund">Fundo de <b>US$ 10 mi</b> · 10 apostas</span>' +
        '<button type="button" class="btn btn--primary vc__go">Investir nas 10</button></div>' +
        '<div class="vc__grid">' + cards + '</div>' +
        '<p class="vc__sum" aria-live="polite">Clique numa startup para ver o que aconteceu com ela, ou invista nas dez de uma vez. <em>Simulação ilustrativa.</em></p></div>';
    },
    mount: function (root, ctx) {
      var cards = [].slice.call(root.querySelectorAll('.su')), go = root.querySelector('.vc__go'), sum = root.querySelector('.vc__sum');
      var res = shuffle(VC_OUT.slice()), open = cards.map(function () { return false; }), timers = [];
      function tier(v) { return v === 0 ? 'fail' : v < 2 ? 'low' : v < 5 ? 'mid' : v < 20 ? 'high' : 'mega'; }
      function reveal(i) {
        if (open[i]) return;
        open[i] = true;
        var v = res[i], c = cards[i], back = c.querySelector('.su__b');
        back.innerHTML = v === 0 ? '<b>✕</b><small>quebrou</small>' : '<b>' + fx(v) + '×</b><small>' + (v >= 50 ? 'unicórnio' : 'retorno') + '</small>';
        c.classList.add('is-open', 'is-' + tier(v));
        refresh();
      }
      function refresh() {
        var n = 0, total = 0, fails = 0, best = 0;
        res.forEach(function (v, i) { if (open[i]) { n++; total += v; if (v === 0) fails++; if (v > best) best = v; } });
        if (n === 0) return;
        if (n < 10) { sum.innerHTML = 'Abertas <b>' + n + '/10</b> · retorno parcial: <b>' + fx(total / 10) + '×</b> o fundo'; return; }
        sum.innerHTML = 'Retorno do fundo: <b>' + fx(total / 10) + '×</b> (US$ ' + fx(total) + ' mi). <b>' + fails + ' de 10</b> quebraram, e uma única startup rendeu <b>' + Math.round(best / total * 100) + '%</b> do total. É por isso que o modelo aceita tantas apostas perdidas.';
        go.textContent = 'Sortear de novo'; go.dataset.again = '1';
        ctx.award('dna-vc', 4, 'Fundo simulado');
      }
      function reset() {
        timers.forEach(clearTimeout); timers = [];
        res = shuffle(VC_OUT.slice()); open = cards.map(function () { return false; });
        cards.forEach(function (c) { c.className = 'su'; });
        go.textContent = 'Investir nas 10'; delete go.dataset.again;
        sum.innerHTML = 'Clique numa startup para ver o que aconteceu com ela, ou invista nas dez de uma vez. <em>Simulação ilustrativa.</em>';
      }
      cards.forEach(function (c, i) { c.addEventListener('click', function () { reveal(i); }); });
      go.addEventListener('click', function () {
        if (go.dataset.again) { reset(); return; }
        cards.forEach(function (c, i) { if (!open[i]) timers.push(setTimeout(function () { reveal(i); }, i * 210)); });
      });
      return function () { timers.forEach(clearTimeout); };
    }
  };

  /* =========================================================
     3 · Mobilidade de talentos (canvas)
     ========================================================= */
  var SLOTS = [{ x: 320, y: 176, r: 62 }, { x: 116, y: 94, r: 38 }, { x: 524, y: 94, r: 38 }, { x: 104, y: 262, r: 38 }, { x: 536, y: 262, r: 38 }, { x: 320, y: 304, r: 30 }];
  var SLOTS_V = [{ x: 180, y: 206, r: 56 }, { x: 80, y: 84, r: 34 }, { x: 280, y: 84, r: 34 }, { x: 80, y: 328, r: 34 }, { x: 280, y: 328, r: 34 }, { x: 180, y: 380, r: 28 }];
var MNAMES = ['Fairchild', 'Amelco', 'Signetics', 'Intel', 'AMD', 'Kleiner Perkins'];
  S.mob = {
    html: function () {
      return '<div class="mob"><div class="mob__top"><div class="seg mob__seg" role="group" aria-label="Regra do estado">' +
        '<button type="button" data-m="ca" class="is-on">Califórnia · §&nbsp;16600</button><button type="button" data-m="ma">Com cláusula de não concorrência</button></div>' +
        '<div class="mob__count"><b>0</b><span>empresas criadas por ex-funcionários</span></div></div>' +
        '<div class="mob__stage"><canvas class="mob__cv" aria-label="Simulação: pessoas deixando uma empresa para criar outras"></canvas></div>' +
        '<p class="mob__cap">Na Califórnia, quem sai da Fairchild pode abrir uma concorrente. Foi assim que nasceram os "Fairchildren".</p></div>';
    },
    mount: function (root, ctx) {
      var comps = null, cv = root.querySelector('.mob__cv'), c = cv.getContext('2d'), cnt = root.querySelector('.mob__count b'), cap = root.querySelector('.mob__cap');
      var SL = SLOTS, ww = 640, wh = 360, vert = false, mode = 'ca', alive = true, vis = true, k = 1, ox = 0, oy = 0, dpr = 1, T = 0, dots, next, timer, hold, count, escT, flashes = [];
      function resize() { var r = cv.getBoundingClientRect(); if (r.width < 4) return; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); var v = r.width / r.height < 1.2; if (v !== vert || !comps) { vert = v; SL = v ? SLOTS_V : SLOTS; ww = v ? 360 : 640; wh = v ? 450 : 360; if (comps) reset(); }
        k = Math.min(r.width / ww, r.height / wh); ox = (r.width - ww * k) / 2; oy = (r.height - wh * k) / 2; }
      function reset() {
        comps = SL.map(function (s, i) { return { alive: i === 0 || false, pop: i === 0 ? 1 : 0 }; });
        dots = []; flashes = [];
        for (var i = 0; i < 18; i++) dots.push({ c: 0, a: Math.random() * TAU, rr: 0.18 + 0.66 * Math.random(), w: (0.35 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1), x: SL[0].x, y: SL[0].y, mv: null, esc: null });
        next = 1; timer = 1.3; hold = 0; count = 0; escT = 1.4; cnt.textContent = '0';
      }
      function pos(d, dt) {
        var s = SL[d.c];
        if (d.mv) {
          var m = d.mv; m.t += dt / m.dur;
          if (m.t < 0) return;
          var t = clamp(m.t, 0, 1), e = t * t * (3 - 2 * t), cx = (m.x0 + m.x1) / 2, cy = (m.y0 + m.y1) / 2 - 46 * Math.sin(Math.PI * e) * (m.x0 < m.x1 ? 1 : -1);
          d.x = (1 - e) * (1 - e) * m.x0 + 2 * (1 - e) * e * cx + e * e * m.x1; d.y = (1 - e) * (1 - e) * m.y0 + 2 * (1 - e) * e * cy + e * e * m.y1;
          if (m.t >= 1) {
            d.c = m.to; d.mv = null; d.a = Math.atan2(d.y - SL[m.to].y, d.x - SL[m.to].x);
            if (!comps[m.to].alive) { comps[m.to].alive = true; comps[m.to].pop = 0; count++; cnt.textContent = count; ctx.award('dna-mob', 4, 'Fairchildren criados'); }
          }
          return;
        }
        d.a += d.w * dt;
        var rad = d.rr * (s.r - 8), x = s.x + Math.cos(d.a) * rad, y = s.y + Math.sin(d.a) * rad;
        if (d.esc) {
          var e2 = d.esc; e2.t += dt / 1.5;
          var out = Math.sin(Math.PI * clamp(e2.t, 0, 1)), wall = SL[0].r + 14, dist = Math.min(rad + (wall + 22 - rad) * out, wall);
          if (!e2.hit && rad + (wall + 22 - rad) * out >= wall) { e2.hit = true; flashes.push({ x: s.x + Math.cos(d.a) * wall, y: s.y + Math.sin(d.a) * wall, t: 0 }); }
          x = s.x + Math.cos(d.a) * dist; y = s.y + Math.sin(d.a) * dist;
          if (e2.t >= 1) d.esc = null;
        }
        d.x = x; d.y = y;
      }
      function spawn() {
        var free = dots.filter(function (d) { return d.c === 0 && !d.mv; });
        var n = Math.min(free.length - 5, 2 + Math.floor(Math.random() * 2));
        if (n < 1) { next = 6; return; }
        var s = SL[next];
        shuffle(free).slice(0, n).forEach(function (d, i) { d.mv = { x0: d.x, y0: d.y, x1: s.x + (Math.random() - 0.5) * 24, y1: s.y + (Math.random() - 0.5) * 24, t: -i * 0.14, dur: 1.3, to: next }; });
        next++;
      }
      function step(dt) {
        if (mode === 'ca') {
          if (next <= 5) { timer -= dt; if (timer <= 0) { spawn(); timer = 1.7; } }
          else { hold += dt; if (hold > 4.5) reset(); }
        } else {
          escT -= dt;
          if (escT <= 0) { var f = dots.filter(function (d) { return !d.esc; }); if (f.length) f[Math.floor(Math.random() * f.length)].esc = { t: 0 }; escT = 1.1; }
        }
        for (var i = 0; i < dots.length; i++) pos(dots[i], dt);
        comps.forEach(function (q) { if (q.alive && q.pop < 1) q.pop = Math.min(1, q.pop + dt * 2.2); });
        for (i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt; if (flashes[i].t > 0.8) flashes.splice(i, 1); }
      }
      function draw() {
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
        c.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
        c.font = '500 10px "Geist Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        var i, s;
        if (mode === 'ca') {
          for (i = 1; i < SL.length; i++) if (!comps[i].alive) { s = SL[i]; c.setLineDash([4, 5]); c.strokeStyle = 'rgba(160,175,200,.18)'; c.lineWidth = 1; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.stroke(); c.setLineDash([]); }
        }
        for (i = 0; i < SL.length; i++) {
          if (!comps[i].alive) continue;
          s = SL[i]; var p = comps[i].pop, rr = s.r * (0.6 + 0.4 * (1 - Math.pow(1 - p, 3))), col = i === 0 ? '255,178,36' : '79,227,200';
          var g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
          g.addColorStop(0, 'rgba(' + col + ',.22)'); g.addColorStop(1, 'rgba(' + col + ',.05)');
          c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, rr, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(' + col + ',.75)'; c.lineWidth = 1.4; c.beginPath(); c.arc(s.x, s.y, rr, 0, TAU); c.stroke();
          c.fillStyle = 'rgba(235,240,250,' + (0.55 + 0.4 * p) + ')'; c.fillText(mode === 'ma' && i === 0 ? 'Empresa A' : MNAMES[i], s.x, s.y + rr + 13);
        }
        if (mode === 'ma') {
          var s0 = SL[0], wr = s0.r + 14;
          c.setLineDash([10, 7]); c.lineDashOffset = -T * 14; c.strokeStyle = 'rgba(255,93,77,.85)'; c.lineWidth = 2.2;
          c.beginPath(); c.arc(s0.x, s0.y, wr, 0, TAU); c.stroke(); c.setLineDash([]);
          c.fillStyle = 'rgba(255,93,77,.9)'; c.fillText('NÃO CONCORRÊNCIA', s0.x, s0.y - wr - 12);
        }
        for (i = 0; i < flashes.length; i++) {
          var f = flashes[i], a = 1 - f.t / 0.8;
          c.strokeStyle = 'rgba(255,93,77,' + a + ')'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(f.x - 6, f.y - 6); c.lineTo(f.x + 6, f.y + 6); c.moveTo(f.x + 6, f.y - 6); c.lineTo(f.x - 6, f.y + 6); c.stroke();
          c.strokeStyle = 'rgba(255,93,77,' + a * 0.5 + ')'; c.beginPath(); c.arc(f.x, f.y, 6 + f.t * 26, 0, TAU); c.stroke();
        }
        for (i = 0; i < dots.length; i++) {
          var d = dots[i]; if (d.mv && d.mv.t < 0) continue;
          var hot = d.mv || d.esc;
          var gg = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, hot ? 12 : 8);
          gg.addColorStop(0, hot ? 'rgba(255,230,160,.9)' : 'rgba(255,178,36,.55)'); gg.addColorStop(1, 'rgba(255,178,36,0)');
          c.fillStyle = gg; c.beginPath(); c.arc(d.x, d.y, hot ? 12 : 8, 0, TAU); c.fill();
          c.fillStyle = hot ? '#fff6d8' : '#ffb224'; c.beginPath(); c.arc(d.x, d.y, hot ? 3.4 : 2.8, 0, TAU); c.fill();
        }
      }
      function setMode(m) {
        mode = m; reset();
        [].forEach.call(root.querySelectorAll('.mob__seg button'), function (b) { b.classList.toggle('is-on', b.dataset.m === m); });
        cap.textContent = m === 'ca' ? 'Na Califórnia, quem sai da Fairchild pode abrir uma concorrente. Foi assim que nasceram os "Fairchildren".' : 'Em lugares onde a cláusula é aplicada, quem tenta sair esbarra no contrato. O conhecimento fica preso dentro da empresa. Saxenian comparou isso à Rota 128, em Boston.';
      }
      root.querySelector('.mob__seg').addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (b) setMode(b.dataset.m); });
      resize(); reset();
      var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(cv);
      var unv = inView(cv, function (v) { vis = v; });
      SV.frame(function (t, dt) {
        if (!alive || !vis) return;
        T = t; step(SV.reduced() ? dt * 0.4 : dt); draw();
      });
      return function () { alive = false; if (ro) ro.disconnect(); unv(); };
    }
  };

  /* =========================================================
     4 · Defesa e governo
     ========================================================= */
  var EVENTS = [
    { y: '1939', t: 'NACA Ames', d: 'Nasce o laboratório de pesquisa aeronáutica em Moffett Field, ao lado do Hangar One. A região passa a atrair engenheiros e contratos federais.' },
    { y: '1956', t: 'Lockheed em Sunnyvale', d: 'A Lockheed Missiles & Space se instala em Sunnyvale e vira uma das maiores empregadoras do Vale, criando demanda por eletrônica avançada.' },
    { y: '1957', t: 'Sputnik', d: 'O satélite soviético acende a corrida espacial. O governo dos EUA passa a investir pesado em ciência, eletrônica e miniaturização.' },
    { y: '1961', t: 'Programa Apollo', d: 'O computador de orientação da Apollo está entre os primeiros a usar circuitos integrados em escala. Grandes encomendas ajudam a derrubar o preço do chip.' },
    { y: 'Anos 60', t: 'Míssil Minuteman', d: 'A guiagem do Minuteman II também compra circuitos integrados em volume. Com a produção em massa, o custo cai e o chip chega ao mercado civil.' }
  ];
  var CURVE = 'M412,244 L440,250 L468,266 L520,296 L562,308 L606,314';
  S.def = {
    html: function () {
      var stars = '', i;
      for (i = 0; i < 46; i++) stars += '<circle cx="' + Math.round(U.rnd(i, 1) * 640) + '" cy="' + Math.round(U.rnd(i, 2) * 210) + '" r="' + (0.5 + U.rnd(i, 3) * 1.1).toFixed(1) + '" fill="#fff" opacity="' + (0.25 + U.rnd(i, 4) * 0.6).toFixed(2) + '"/>';
      var ribs = '';
      for (i = 1; i < 6; i++) ribs += '<path d="M' + (40 + i * 23) + ',300 Q' + (110 + (i - 3) * 8) + ',' + (222 + Math.abs(i - 3) * 20) + ' ' + (110 + (i - 3) * 26) + ',232" fill="none"/>';
      var svg = '<svg class="def__svg" viewBox="0 0 640 360" aria-hidden="true" data-step="0">' +
        '<defs><linearGradient id="dfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050813"/><stop offset="1" stop-color="#1b2745"/></linearGradient></defs>' +
        '<rect width="640" height="360" fill="url(#dfSky)"/>' + stars +
        '<g class="dg dg--moon" data-from="3"><circle cx="560" cy="66" r="34" fill="#d5dbea" opacity=".92"/><circle cx="548" cy="58" r="7" fill="#aeb7cc"/><circle cx="572" cy="78" r="9" fill="#aeb7cc"/><circle cx="566" cy="50" r="4" fill="#aeb7cc"/>' +
        '<path class="dg__arc" d="M330,300 Q430,80 520,84" fill="none" stroke="#4fe3c8" stroke-width="1.4" stroke-dasharray="4 5"/><g class="dg__cap"><path d="M-5,5 L0,-9 L5,5 Z" fill="#ffb224"/><rect x="-5" y="5" width="10" height="3" fill="#cfd6e0"/></g></g>' +
        '<g class="dg dg--sat" data-from="2"><ellipse cx="300" cy="118" rx="236" ry="52" transform="rotate(-9 300 118)" fill="none" stroke="#7fa8ff" stroke-opacity=".5" stroke-dasharray="3 5"/>' +
        '<g class="dg__sat"><circle r="5" fill="#e8ecf4"/><path d="M-4,-3 L-13,-9 M4,-3 L13,-9 M-4,3 L-13,9 M4,3 L13,9" stroke="#e8ecf4" stroke-width="1.2" fill="none"/></g></g>' +
        '<path d="M0,300 Q120,284 240,298 T480,296 T640,290 V360 H0 Z" fill="#0a0f1c"/>' +
        '<g class="dg dg--ames" data-from="0"><path d="M40,300 Q110,200 180,300" fill="#10192e" stroke="#9fb2d8" stroke-width="1.6"/>' + ribs + '<path d="M40,300 H180" stroke="#9fb2d8" stroke-width="1.6"/><text x="110" y="324" fill="#aab6d2" font-size="9" text-anchor="middle" font-family="Geist Mono, monospace" letter-spacing=".08em">HANGAR ONE · MOFFETT FIELD</text></g>' +
        '<g class="dg dg--rocket" data-from="1"><g class="dg__rk" transform="translate(344,300)"><path d="M-7,0 V-46 Q0,-66 7,-46 V0 Z" fill="#e8ecf4"/><path d="M-7,-8 L-16,6 L-7,0 M7,-8 L16,6 L7,0" fill="#ffb224"/><path class="dg__fl" d="M-4,0 Q0,26 4,0 Z" fill="#ff8a3d"/></g><text x="344" y="324" fill="#aab6d2" font-size="9" text-anchor="middle" font-family="Geist Mono, monospace" letter-spacing=".08em">LOCKHEED · SUNNYVALE</text></g>' +
        '<g class="dg dg--chart" data-from="3"><g transform="translate(12,0)"><rect x="396" y="214" width="228" height="122" rx="10" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.12)"/>' +
        '<path d="M410,326 H612 M410,326 V228" stroke="#7a879f" stroke-width="1" fill="none"/>' +
        '<text x="410" y="226" fill="#aab6d2" font-size="8.5" font-family="Geist Mono, monospace" letter-spacing=".06em">PREÇO DO CHIP · RELATIVO</text>' +
        '<path class="dg__curve" pathLength="1" d="' + CURVE + '" fill="none" stroke="#ffb224" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle class="dg__pt dg__pt--a" cx="468" cy="266" r="4" fill="#ffb224"/><circle class="dg__pt dg__pt--b" cx="562" cy="308" r="4" fill="#ffb224"/>' +
        '<text x="410" y="336" fill="#7a879f" font-size="8" font-family="Geist Mono, monospace">1956</text><text x="590" y="336" fill="#7a879f" font-size="8" font-family="Geist Mono, monospace">1969</text></g></g>' +
        '</svg>';
      return '<div class="def">' + svg + '<div class="def__ev" role="tablist" aria-label="Marcos">' +
        EVENTS.map(function (e, i) { return '<button type="button" class="ev' + (i === 0 ? ' is-on' : '') + '" data-i="' + i + '" role="tab"><b class="mono">' + e.y + '</b><span>' + esc(e.t) + '</span></button>'; }).join('') +
        '</div><p class="def__cap" aria-live="polite">' + esc(EVENTS[0].d) + '</p></div>';
    },
    mount: function (root, ctx) {
      var svg = root.querySelector('.def__svg'), cap = root.querySelector('.def__cap'), btns = [].slice.call(root.querySelectorAll('.ev'));
      var sat = svg.querySelector('.dg__sat'), capsule = svg.querySelector('.dg__cap'), arc = svg.querySelector('.dg__arc'), curve = svg.querySelector('.dg__curve'), rk = svg.querySelector('.dg__rk');
      var step = 0, alive = true, vis = true, idle = 0, auto = true, T = 0, seen = {}, ptA = svg.querySelector('.dg__pt--a'), ptB = svg.querySelector('.dg__pt--b');
      var arcLen = arc.getTotalLength ? arc.getTotalLength() : 0;
      function set(i, user) {
        step = i; svg.dataset.step = i; cap.textContent = EVENTS[i].d;
        btns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
        [].forEach.call(svg.querySelectorAll('.dg'), function (g) { var on = i >= parseInt(g.dataset.from, 10); g.classList.toggle('is-on', on); g.classList.toggle('is-cur', parseInt(g.dataset.from, 10) === i); });
        curve.style.strokeDashoffset = String(1 - (i < 3 ? 0 : i === 3 ? 0.62 : 1));
        ptA.style.opacity = i >= 3 ? 1 : 0; ptB.style.opacity = i >= 4 ? 1 : 0;
        if (i === 1 || i === 4) { rk.classList.remove('launch'); void rk.getBoundingClientRect(); rk.classList.add('launch'); }
        if (user) { auto = false; seen[i] = true; if (Object.keys(seen).length >= 3) ctx.award('dna-def', 4, 'Linha do tempo explorada'); }
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { set(i, true); }); });
      rk.addEventListener('animationend', function () { rk.classList.remove('launch'); });
      var unv = inView(svg, function (v) { vis = v; });
      set(0, false);
      SV.frame(function (t, dt) {
        if (!alive || !vis) return;
        T = t;
        var a = t * 0.55, px = 300 + Math.cos(a) * 236, py = 118 + Math.sin(a) * 52;
        var cr = -9 * Math.PI / 180, x = 300 + (px - 300) * Math.cos(cr) - (py - 118) * Math.sin(cr), y = 118 + (px - 300) * Math.sin(cr) + (py - 118) * Math.cos(cr);
        sat.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
        if (arcLen) { var q = arc.getPointAtLength(((t * 0.12) % 1) * arcLen); capsule.setAttribute('transform', 'translate(' + q.x.toFixed(1) + ',' + q.y.toFixed(1) + ') rotate(35)'); }
        if (auto && !SV.reduced()) { idle += dt; if (idle > 4.8) { idle = 0; set((step + 1) % EVENTS.length, false); } }
      });
      return function () { alive = false; unv(); };
    }
  };

  /* =========================================================
     5 · Garagens
     ========================================================= */
  var GARS = [
    { n: 'HP', y: '1939', plaque: '367 ADDISON AVE', cap: '367 Addison Avenue, Palo Alto (1939). Hewlett e Packard montaram o oscilador de áudio na garagem da casa onde Packard morava. Hoje é marco histórico da Califórnia.' },
    { n: 'Apple', y: '1976', plaque: '2066 CRIST DR', cap: '2066 Crist Drive, Los Altos (1976). Na casa da família Jobs, o Apple I foi montado em parte; a loja Byte Shop encomendou 50 unidades.' },
    { n: 'Google', y: '1998', plaque: '232 SANTA MARGARITA', cap: '232 Santa Margarita Avenue, Menlo Park (1998). Garagem de Susan Wojcicki; o Google funcionou ali por cerca de cinco meses antes de se mudar.' }
  ];
  function garageInteriors() {
    var hp = '<g class="gi" data-g="0">' +
      '<rect x="168" y="150" width="124" height="62" rx="3" fill="#2a2f3b" stroke="#566178"/><path d="M180,166 h22 v14 h-22z M212,160 l16,16 M240,164 a10,10 0 1 0 0.1,0 M262,160 v34" fill="none" stroke="#8c97ad" stroke-width="1.4"/>' +
      '<rect x="190" y="268" width="230" height="10" fill="#6a5a44"/><path d="M198,278 V310 M412,278 V310" stroke="#6a5a44" stroke-width="5"/>' +
      '<rect x="262" y="224" width="96" height="44" rx="3" fill="#cfd6e0" stroke="#7d8798"/><circle cx="282" cy="246" r="10" fill="#39404f"/><circle cx="282" cy="246" r="3" fill="#ffb224"/>' +
      '<rect x="304" y="232" width="44" height="26" rx="2" fill="#0b1810"/><path class="gi__wave" d="M308,245 q5,-12 10,0 t10,0 t10,0 t10,0" fill="none" stroke="#6dffa0" stroke-width="1.6"/>' +
      '<circle cx="372" cy="238" r="4" fill="#39404f"/><circle cx="372" cy="254" r="4" fill="#39404f"/>' +
      '<g fill="#10151f"><circle cx="212" cy="258" r="9"/><rect x="203" y="266" width="18" height="34" rx="6"/><circle cx="446" cy="262" r="9"/><rect x="437" y="270" width="18" height="30" rx="6"/></g></g>';
    var ap = '<g class="gi" data-g="1">' +
      '<rect x="172" y="164" width="76" height="56" rx="2" fill="#efe7d2" stroke="#b9ae92"/><path d="M180,176 h58 M180,186 h58 M180,196 h40 M180,206 h50" stroke="#7a705a" stroke-width="1.6" fill="none"/><text x="210" y="173" font-size="6.2" text-anchor="middle" fill="#5b4a2a" font-family="Geist Mono, monospace" font-weight="700">HOMEBREW</text>' +
      '<rect x="190" y="268" width="230" height="10" fill="#6a5a44"/><path d="M198,278 V310 M412,278 V310" stroke="#6a5a44" stroke-width="5"/>' +
      '<rect x="236" y="236" width="104" height="32" rx="2" fill="#1f6b45" stroke="#0e3a25"/><rect x="246" y="242" width="26" height="14" fill="#161a20"/><rect x="278" y="242" width="18" height="10" fill="#161a20"/><rect x="302" y="242" width="26" height="14" fill="#161a20"/><rect x="250" y="258" width="64" height="4" fill="#c9a248"/>' +
      '<circle class="gi__led" cx="332" cy="262" r="2.4" fill="#ff5d4d"/>' +
      '<rect x="352" y="198" width="74" height="58" rx="5" fill="#cfc6ae" stroke="#8c8368"/><rect x="360" y="206" width="58" height="38" rx="3" fill="#06150b"/><path d="M366,216 h24 M366,226 h38 M366,236 h18" stroke="#6dffa0" stroke-width="2" fill="none"/><rect class="gi__cur" x="388" y="233" width="7" height="6" fill="#6dffa0"/>' +
      '<rect x="346" y="260" width="84" height="8" rx="2" fill="#bdb299"/></g>';
    var gg = '<g class="gi" data-g="2">' +
      '<rect x="172" y="154" width="150" height="66" rx="3" fill="#eef1f5" stroke="#9aa4b4"/><g fill="none" stroke-width="1.6"><path d="M200,200 L236,170 L274,196 L300,166 M236,170 L222,206 M274,196 L246,210" stroke="#7a8498"/></g>' +
      '<circle cx="200" cy="200" r="6" fill="#4285f4"/><circle cx="236" cy="170" r="9" fill="#ea4335"/><circle cx="274" cy="196" r="6" fill="#fbbc05"/><circle cx="300" cy="166" r="6" fill="#34a853"/><circle cx="222" cy="206" r="5" fill="#4285f4"/><circle cx="246" cy="210" r="5" fill="#fbbc05"/>' +
      '<rect x="190" y="298" width="236" height="6" fill="#6a5a44"/>' +
      '<g class="gi__srv"><rect x="206" y="236" width="62" height="62" rx="3" fill="#d8d2c0" stroke="#8c8368"/><rect x="282" y="236" width="62" height="62" rx="3" fill="#d8d2c0" stroke="#8c8368"/><rect x="358" y="236" width="62" height="62" rx="3" fill="#d8d2c0" stroke="#8c8368"/>' +
      '<path d="M214,252 h46 M214,262 h46 M290,252 h46 M290,262 h46 M366,252 h46 M366,262 h46" stroke="#8c8368" stroke-width="1.4"/>' +
      '<circle class="gi__led" cx="218" cy="284" r="2.4" fill="#34a853"/><circle class="gi__led gi__led--b" cx="294" cy="284" r="2.4" fill="#fbbc05"/><circle class="gi__led" cx="370" cy="284" r="2.4" fill="#34a853"/></g></g>';
    return hp + ap + gg;
  }
  S.gar = {
    html: function () {
      var panels = '', i;
      for (i = 0; i < 5; i++) panels += '<rect x="150" y="' + (140 + i * 36) + '" width="340" height="36" fill="url(#gdDoor)" stroke="#1c2230" stroke-width="1.4"/>' +
        (i === 0 ? '<g fill="#10151f" stroke="#5a667f" stroke-width="1"><rect x="172" y="150" width="46" height="16" rx="2"/><rect x="236" y="150" width="46" height="16" rx="2"/><rect x="300" y="150" width="46" height="16" rx="2"/><rect x="364" y="150" width="46" height="16" rx="2"/><rect x="428" y="150" width="46" height="16" rx="2"/></g>' : '');
      var siding = '';
      for (i = 0; i < 12; i++) siding += '<path d="M64,' + (84 + i * 22) + ' H576" />';
      return '<div class="gar"><svg class="gar__svg" viewBox="0 0 640 360" aria-hidden="true">' +
        '<defs><linearGradient id="gdDoor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8dde8"/><stop offset="1" stop-color="#aeb6c6"/></linearGradient>' +
        '<linearGradient id="gdIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2c18"/><stop offset="1" stop-color="#7a5a2c"/></linearGradient>' +
        '<radialGradient id="gdGlow" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffd896" stop-opacity=".9"/><stop offset="1" stop-color="#ffb224" stop-opacity="0"/></radialGradient>' +
        '<clipPath id="gdOpen"><rect x="150" y="140" width="340" height="180"/></clipPath></defs>' +
        '<rect width="640" height="360" fill="#0b0e15"/><path d="M0,330 H640 V360 H0Z" fill="#06080d"/>' +
        '<path d="M40,80 L320,16 L600,80 Z" fill="#141a27" stroke="#2a3348" stroke-width="1.6"/><rect x="60" y="80" width="520" height="252" fill="#192131" stroke="#2a3348" stroke-width="1.6"/>' +
        '<g stroke="#212a3c" stroke-width="1">' + siding + '</g>' +
        '<rect x="140" y="130" width="360" height="12" fill="#0f1420" stroke="#2a3348"/>' +
        '<g clip-path="url(#gdOpen)"><rect x="150" y="140" width="340" height="180" fill="url(#gdIn)"/><rect class="gar__glow" x="150" y="140" width="340" height="180" fill="url(#gdGlow)"/>' + garageInteriors() + '</g>' +
        '<g clip-path="url(#gdOpen)"><g class="gar__door" style="transform:translateY(0px)">' + panels + '<rect x="302" y="298" width="36" height="8" rx="3" fill="#6c7790"/></g></g>' +
        '<path d="M150,140 V320 M490,140 V320" stroke="#3b455e" stroke-width="5"/>' +
        '<rect x="508" y="206" width="64" height="40" rx="4" fill="#10151f" stroke="#ffb224" stroke-opacity=".5"/><text class="gar__pl" x="540" y="224" text-anchor="middle" font-size="7" fill="#ffb224" font-family="Geist Mono, monospace" letter-spacing=".06em">367 ADDISON AVE</text><text x="540" y="236" text-anchor="middle" font-size="7" fill="#7a879f" font-family="Geist Mono, monospace">GARAGEM</text>' +
        '<g class="gar__hint"><rect x="226" y="212" width="188" height="24" rx="12" fill="rgba(0,0,0,.6)"/><text x="320" y="228" text-anchor="middle" font-size="9" fill="#ffd896" font-family="Geist Mono, monospace" letter-spacing=".1em">ARRASTE A PORTA PARA CIMA</text></g></svg>' +
        '<div class="gar__bar"><div class="gar__tabs" role="tablist" aria-label="Garagem">' +
        GARS.map(function (g, i) { return '<button type="button" role="tab" class="gtab' + (i === 0 ? ' is-on' : '') + '" data-g="' + i + '"><b>' + g.n + '</b><small class="mono">' + g.y + '</small></button>'; }).join('') +
        '</div><button type="button" class="btn gar__toggle">Abrir a garagem</button></div>' +
        '<p class="gar__cap" aria-live="polite">' + esc(GARS[0].cap) + '</p></div>';
    },
    mount: function (root, ctx) {
      var svg = root.querySelector('.gar__svg'), door = svg.querySelector('.gar__door'), glow = svg.querySelector('.gar__glow'), pl = svg.querySelector('.gar__pl');
      var tabs = [].slice.call(root.querySelectorAll('.gtab')), cap = root.querySelector('.gar__cap'), tog = root.querySelector('.gar__toggle'), hint = svg.querySelector('.gar__hint');
      var ints = [].slice.call(svg.querySelectorAll('.gi')), g = 0, open = 0, target = 0, drag = null, opened = {}, alive = true, vis = true;
      var H = 180;
      function apply() { door.style.transform = 'translateY(' + (-open * H).toFixed(1) + 'px)'; glow.style.opacity = String(0.35 + 0.65 * open); hint.style.opacity = open > 0.05 ? 0 : 1; }
      function setG(i) {
        g = i;
        tabs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
        ints.forEach(function (n, k) { n.classList.toggle('is-on', k === i); });
        cap.textContent = GARS[i].cap; pl.textContent = GARS[i].plaque;
        if (target > 0.5) mark();
      }
      function mark() { if (!opened[g]) { opened[g] = true; if (Object.keys(opened).length >= 1) ctx.award('dna-gar', 4, 'Garagem aberta'); } }
      function setTarget(v) { target = v; tog.textContent = v > 0.5 ? 'Fechar a garagem' : 'Abrir a garagem'; if (v > 0.5) mark(); }
      tabs.forEach(function (t, i) { t.addEventListener('click', function () { setG(i); if (target < 0.5) setTarget(1); }); });
      tog.addEventListener('click', function () { setTarget(target > 0.5 ? 0 : 1); });
      svg.addEventListener('pointerdown', function (e) {
        var r = svg.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * 360, x = (e.clientX - r.left) / r.width * 640;
        if (x < 150 || x > 490 || y < 140 || y > 320) return;
        drag = { y0: e.clientY, o0: open, moved: false, k: r.height / 360 };
        try { svg.setPointerCapture(e.pointerId); } catch (x2) { /* ok */ }
      });
      svg.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var dy = e.clientY - drag.y0;
        if (Math.abs(dy) > 4) drag.moved = true;
        if (drag.moved) { open = clamp(drag.o0 - dy / (H * drag.k), 0, 1); target = open; apply(); }
      });
      function end() {
        if (!drag) return;
        if (!drag.moved) setTarget(target > 0.5 ? 0 : 1); else setTarget(open > 0.45 ? 1 : 0);
        drag = null;
      }
      svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
      var unv = inView(svg, function (v) { vis = v; });
      setG(0); apply();
      SV.frame(function (t, dt) {
        if (!alive || !vis) return;
        if (!drag) { var d = target - open; if (Math.abs(d) > 0.001) { open += d * (SV.reduced() ? 1 : 1 - Math.exp(-dt * 7)); apply(); } }
      });
      return function () { alive = false; unv(); };
    }
  };
})();
