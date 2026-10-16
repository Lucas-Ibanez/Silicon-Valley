/*
 * A Linha do Vale: travessia da Golden Gate guiada pelo scroll.
 * O renderizador (bridge.js) desenha a ponte; aqui ficam a câmera, as 10 paradas
 * (faróis no tabuleiro, pinos HTML, régua inferior) e o painel de cada parada.
 * A câmera avança em x de forma linear com o scroll; cada parada fica ~170 m
 * à frente da câmera quando está "ativa".
 *
 * Depuração: index.html?cross=0.5 congela a travessia em 50% (0..1).
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var cross = document.getElementById('cross');
  if (!cross || !SV.Bridge) return;
  var clamp = U.clamp, lerp = U.lerp, sstep = U.sstep;
  var G = SV.GG, ST = DATA.stations, CATS = DATA.cats, N = ST.length;

  var canvas = document.getElementById('bCanvas'), pinsEl = document.getElementById('bPins'), ticksEl = document.getElementById('bTicks');
  var panel = document.getElementById('vPanel'), stage = cross.querySelector('.cross__stick');
  var hudStop = document.getElementById('bStop'), hudDist = document.getElementById('bDist'), hudBar = document.getElementById('bBar'), hint = document.getElementById('bHint');
  var bridge = SV.Bridge(canvas);

  /* ---------- paradas ao longo do tabuleiro ---------- */
  var PAD = 0.12, SA = -G.SIDE + 80, SB = G.SPAN + G.SIDE - 60, AHEAD = 170;
  function stationX(k) { return SA + (SB - SA) * k / (N - 1); }
  function pOf(k) { return PAD + (1 - 2 * PAD) * k / (N - 1); }
  function xCam(p) { return (SA - AHEAD) + (SB - SA) * ((p - PAD) / (1 - 2 * PAD)); }
  var X_START = xCam(0);

  /* ---------- câmera: desce e avança pela ponte, com um leve arco ---------- */
  var Y_KEYS = [[-800, 194], [-330, 150], [0, 122], [420, 110], [1280, 86], [1800, 82]];
  function camY(x) {
    for (var i = 0; i < Y_KEYS.length - 1; i++) {
      var a = Y_KEYS[i], b = Y_KEYS[i + 1];
      if (x <= b[0]) return lerp(a[1], b[1], sstep(a[0], b[0], x));
    }
    return Y_KEYS[Y_KEYS.length - 1][1];
  }
  function cameraAt(p, mx, my, tall) {
    var x = xCam(p), arc = Math.sin(p * Math.PI);
    var z = (tall ? 700 : 560) * (1 - sstep(X_START, -230, x)) + mx * 9;
    var y = camY(x) - arc * 6 - my * 5;
    var tx = x + lerp(820, 1000, sstep(X_START, 0, x)), ty = lerp(100, 70, sstep(X_START, 100, x)) + my * 10;
    return { pos: [x, y, z], tgt: [tx, ty, mx * 55], fov: tall ? 72 : 56, cy: tall ? 0.3 : 0.5 };
  }

  /* ---------- DOM: pinos e régua ---------- */
  var pins = [], ticks = [];
  ST.forEach(function (s, k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'bpin is-hidden';
    b.setAttribute('aria-label', 'Parada ' + U.pad2(k + 1) + ': ' + s.name);
    b.innerHTML = '<i class="bpin__dot"></i><span class="bpin__lbl">' + U.esc(s.name) + '</span>';
    b.addEventListener('click', function () { goTo(k); });
    pinsEl.appendChild(b); pins.push(b);

    var t = document.createElement('button');
    t.type = 'button'; t.className = 'btick';
    t.setAttribute('aria-label', 'Ir para ' + s.name);
    t.innerHTML = '<span class="mono">' + U.pad2(k + 1) + '</span><b>' + U.esc(s.name) + '</b>';
    t.addEventListener('click', function () { goTo(k); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); var n = clamp(k + d, 0, N - 1); goTo(n); ticks[n].focus(); }
    });
    ticksEl.appendChild(t); ticks.push(t);
  });

  function goTo(k) {
    var top = cross.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + pOf(k) * (cross.offsetHeight - window.innerHeight), behavior: SV.reduced() ? 'auto' : 'smooth' });
  }

  /* ---------- painel ---------- */
  var activeIdx = -1;
  function renderPanel(k) {
    var s = ST[k];
    var rows = s.items.slice().sort(function (a, b) { return a.y - b.y; }).map(function (it) {
      return '<div class="vp__item"><span class="vp__y">' + it.y + '</span><div>' +
        '<div class="vp__n">' + U.esc(it.n) + ' <span class="vp__c">' + U.esc(CATS[it.c]) + '</span></div>' +
        '<p class="vp__t">' + U.esc(it.t) + '</p></div></div>';
    }).join('');
    panel.innerHTML = '<div class="vp__enter"><span class="vp__tag mono">Parada ' + U.pad2(k + 1) + ' / ' + U.pad2(N) + ' · ' + U.esc(s.tag) + '</span>' +
      '<h3 class="vp__name">' + U.esc(s.name) + '</h3><p class="vp__fact">' + U.esc(s.fact) + '</p>' +
      '<div class="vp__list">' + rows + '</div></div>';
    panel.scrollTop = 0;
  }

  function setActive(k) {
    activeIdx = k;
    renderPanel(k);
    hudStop.textContent = 'PARADA ' + U.pad2(k + 1) + ' / ' + U.pad2(N);
    ticks.forEach(function (t, i) {
      t.classList.toggle('is-on', i === k);
      t.classList.toggle('is-past', i < k);
      if (i === k) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  /* ---------- laço ---------- */
  var pS = 0, mx = 0, my = 0, tmx = 0, tmy = 0, dwell = 0, wasActive = -1, tall = false;
  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width - 0.5) * 2; tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { tmx = 0; tmy = 0; });

  function resize() { bridge.resize(); var s = bridge.size(); tall = s[1] > s[0]; }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();

  var markers = ST.map(function (s, k) { return { x: stationX(k), mode: 0 }; });
  var forced = (/[?&]cross=([0-9.]+)/.exec(window.location.search) || [])[1];
  forced = forced === undefined ? null : clamp(parseFloat(forced), 0, 1);

  SV.frame(function (t, dt) {
    var r = cross.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < -80 || r.top > vh + 80) return;
    var total = Math.max(1, cross.offsetHeight - vh);
    var target = forced !== null ? forced : clamp(-r.top / total, 0, 1);
    if (SV.reduced() || forced !== null) pS = target; else pS += (target - pS) * (1 - Math.exp(-dt * 4.5));
    var k = 1 - Math.exp(-dt * 3);
    mx += (tmx - mx) * k; my += (tmy - my) * k;

    var act = clamp(Math.round((pS - PAD) / (1 - 2 * PAD) * (N - 1)), 0, N - 1);
    if (act !== activeIdx) setActive(act);
    for (var i = 0; i < N; i++) markers[i].mode = i === act ? 2 : i < act ? 1 : 0;

    bridge.render(cameraAt(pS, mx, my, tall), { t: pS, time: t, markers: markers });

    /* pinos */
    var size = bridge.size(), W = size[0], H = size[1];
    for (i = 0; i < N; i++) {
      var pr = bridge.project([stationX(i), G.DECK_Y + 1.5, 0]), pin = pins[i];
      var off = !pr || pr.z > 2400 || pr.x < -30 || pr.x > W + 30 || pr.y < 0 || pr.y > H;
      pin.classList.toggle('is-hidden', off);
      if (off) continue;
      pin.style.transform = 'translate(' + (pr.x - 17).toFixed(1) + 'px,' + (pr.y - 17).toFixed(1) + 'px)';
      pin.style.setProperty('--s', clamp(320 / pr.z, 0.55, 1.3).toFixed(2));
      pin.style.zIndex = Math.max(1, 3000 - Math.round(pr.z));
      pin.classList.toggle('is-active', i === act);
      pin.classList.toggle('is-past', i < act);
      if (i === act) {
        var lw = pin.lastChild.offsetWidth / 2 + 10, dx = 0;
        if (pr.x - lw < 0) dx = lw - pr.x; else if (pr.x + lw > W) dx = W - pr.x - lw;
        pin.style.setProperty('--dx', dx.toFixed(1) + 'px');
      }
    }

    /* HUD */
    hudDist.textContent = U.fmt(Math.max(0, xCam(pS) - X_START)) + ' m';
    hudBar.style.transform = 'scaleX(' + pS.toFixed(4) + ')';
    hint.style.opacity = (1 - sstep(0.01, 0.05, pS)).toFixed(3);
    var po = sstep(0.025, 0.075, pS);
    panel.style.opacity = po.toFixed(3);
    panel.style.pointerEvents = po < 0.3 ? 'none' : '';
    panel.style.transform = 'translateY(' + ((1 - po) * 14).toFixed(1) + 'px)';

    /* XP: parar um instante numa estação conta como visita */
    if (act === wasActive && Math.abs(target - pS) < 0.012 && pS > PAD * 0.6) {
      dwell += dt;
      if (dwell > 0.9) SV.xp.mark('st', ST[act].id, 8, ST[act].name + ' visitada');
    } else { dwell = 0; wasActive = act; }
  });
  setActive(0);
})();
