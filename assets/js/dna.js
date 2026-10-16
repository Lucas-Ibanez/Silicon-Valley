/*
 * "Por que aqui?": hub com os 5 ingredientes + cena interativa e painel de cada um.
 * As cenas vivem em dna-scenes.js. Aqui ficam o diagrama radial, a navegação
 * (clique, setas, botões) e o texto de cada etapa.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var box = document.getElementById('dnaBox');
  if (!box) return;
  var D = DATA.dna, N = D.length;
  var hub = document.getElementById('dnaHub'), sceneEl = document.getElementById('dScene'), info = document.getElementById('dInfo');
  var SCENE_KEYS = ['uni', 'vc', 'mob', 'def', 'gar'];
  var ICONS = [
    '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
    '<path d="M4 20v-6M10 20v-10M16 20V6"/><path d="m3 8 6-4 4 3 8-5"/>',
    '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
    '<path d="M12 2c3 3 4 7 4 11l-4 4-4-4c0-4 1-8 4-11z"/><path d="M8 13l-4 4h4M16 13l4 4h-4M12 17v5"/>',
    '<path d="M3 21V10l9-6 9 6v11"/><path d="M7 21v-9h10v9M7 15h10M7 18h10"/>'
  ];
  var CX = 180, CY = 180, R = 124, cur = -1, destroy = null, tween = 0, seen = {};
  var nodes = [];

  /* ---------- hub ---------- */
  var svgLines = '', i;
  for (i = 0; i < N; i++) {
    var a = (-90 + i * 72) * Math.PI / 180, x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
    svgLines += '<path class="hub__ln" id="hubLn' + i + '" pathLength="1" d="M' + x.toFixed(1) + ',' + y.toFixed(1) + ' L' + CX + ',' + CY + '"/>' +
      '<path class="hub__pu" pathLength="1" style="animation-delay:-' + (i * 0.55).toFixed(2) + 's" d="M' + x.toFixed(1) + ',' + y.toFixed(1) + ' L' + CX + ',' + CY + '"/>';
  }
  hub.innerHTML =
    '<svg class="hub__svg" viewBox="0 0 360 360" aria-hidden="true"><defs><radialGradient id="hubG"><stop offset="0" stop-color="var(--accent)" stop-opacity=".5"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>' +
    '<circle class="hub__glow" cx="180" cy="180" r="118" fill="url(#hubG)"/><circle class="hub__orbit" cx="180" cy="180" r="' + R + '"/>' + svgLines + '</svg>' +
    '<div class="hub__core"><span class="mono">Ecossistema</span><b>VALE</b><small class="mono" id="hubCount">0 / ' + N + '</small></div>';
  D.forEach(function (d, k) {
    var a2 = (-90 + k * 72) * Math.PI / 180, b = document.createElement('button');
    b.type = 'button'; b.className = 'hnode hnode--' + (k === 0 ? 't' : 'b');
    b.style.left = ((CX + R * Math.cos(a2)) / 360 * 100).toFixed(2) + '%'; b.style.top = ((CY + R * Math.sin(a2)) / 360 * 100).toFixed(2) + '%';
    b.setAttribute('role', 'tab'); b.setAttribute('aria-label', d.name);
    b.innerHTML = '<span class="hnode__ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg></span><span class="hnode__n mono">' + U.pad2(k + 1) + '</span><span class="hnode__lbl">' + U.esc(d.name) + '</span>';
    b.addEventListener('click', function () { select(k, true); });
    b.addEventListener('keydown', function (e) {
      var n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (k + 1) % N;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (k + N - 1) % N;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = N - 1;
      if (n >= 0) { e.preventDefault(); select(n, true); nodes[n].focus(); }
    });
    hub.appendChild(b); nodes.push(b);
    if (SV.xp.has('dna', d.id)) seen[k] = true;
  });
  var elCount = document.getElementById('hubCount');

  function refreshHub() {
    var n = 0;
    nodes.forEach(function (b, k) {
      var on = k === cur, sn = !!seen[k];
      if (sn) n++;
      b.classList.toggle('is-on', on); b.classList.toggle('is-seen', sn);
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      var ln = document.getElementById('hubLn' + k); if (ln) ln.classList.toggle('is-on', on || sn);
    });
    elCount.textContent = n + ' / ' + N;
    hub.classList.toggle('is-full', n === N);
    hub.style.setProperty('--fill', (n / N).toFixed(2));
  }

  /* ---------- painel de texto ---------- */
  function renderInfo(i) {
    var d = D[i];
    info.innerHTML =
      '<div class="dinfo__top"><span class="dinfo__step mono">Ingrediente ' + U.pad2(i + 1) + ' / ' + U.pad2(N) + '</span><span class="dinfo__hint mono">' + U.esc(d.hint) + '</span></div>' +
      '<h3 class="dinfo__title">' + U.esc(d.name) + '</h3>' +
      '<div class="dinfo__row"><div class="dinfo__stat"><b id="dnaStat">' + U.esc(d.stat) + '</b><small class="mono">' + U.esc(d.statLabel) + '</small></div>' +
      '<dl class="dinfo__facts">' + d.facts.map(function (f) { return '<div><dt>' + U.esc(f[0]) + '</dt><dd>' + U.esc(f[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
      '<p class="dinfo__text">' + U.esc(d.text) + '</p>' +
      '<p class="dna__ex"><b>Na prática:</b> ' + U.esc(d.ex) + '</p>' +
      '<div class="dinfo__nav"><button type="button" class="btn" data-d="-1">← ' + U.esc(D[(i + N - 1) % N].name) + '</button><button type="button" class="btn btn--primary" data-d="1">' + U.esc(D[(i + 1) % N].name) + ' →</button></div>';
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
    [].forEach.call(info.querySelectorAll('[data-d]'), function (b) { b.addEventListener('click', function () { select((cur + parseInt(b.dataset.d, 10) + N) % N, true); }); });
    var el = document.getElementById('dnaStat'), target = /^\d{4}$/.test(d.stat) ? parseInt(d.stat, 10) : null;
    cancelAnimationFrame(tween);
    if (target && !SV.reduced()) {
      var from = target - 60, t0 = performance.now();
      (function step(now) { var k = U.clamp((now - t0) / 800, 0, 1); el.textContent = Math.round(from + (target - from) * U.easeOut(k)); if (k < 1) tween = requestAnimationFrame(step); })(t0);
    }
  }

  /* ---------- seleção ---------- */
  var ctx = { award: function (id, xp, label) { SV.xp.mark('misc', id, xp, label); } };
  function select(i, user) {
    if (i === cur) return;
    cur = i;
    if (destroy) { destroy(); destroy = null; }
    var d = D[i], sc = SV.dnaScenes && SV.dnaScenes[SCENE_KEYS[i]];
    sceneEl.innerHTML = '<div class="dscene__in is-swap"></div>';
    var root = sceneEl.firstChild;
    if (sc) { root.innerHTML = sc.html(); destroy = sc.mount(root, ctx); }
    sceneEl.dataset.k = SCENE_KEYS[i];
    renderInfo(i);
    if (user) { seen[i] = true; SV.xp.mark('dna', d.id, 4, 'Ingrediente: ' + d.name); }
    refreshHub();
  }
  select(0, false);

  /* quem chega à seção e fica um instante já viu o primeiro ingrediente */
  new IntersectionObserver(function (en, ob) {
    if (!en[0].isIntersecting) return;
    ob.disconnect();
    setTimeout(function () { seen[cur] = true; SV.xp.mark('dna', D[cur].id, 4, 'Ingrediente: ' + D[cur].name); refreshHub(); }, 1500);
  }, { threshold: 0.4 }).observe(box);
})();
