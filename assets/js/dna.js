/*
 * DNA do Vale: abas acessíveis (setas do teclado) com painel animado e contagem.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var tabsEl = document.getElementById('dnaTabs'), panel = document.getElementById('dnaPanel');
  if (!tabsEl || !panel) return;
  var D = DATA.dna, tabs = [], cur = -1, tween = 0;

  D.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dna__tab'; b.id = 'dnaTab' + i;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'dnaPanel');
    b.innerHTML = '<span class="mono">' + U.pad2(i + 1) + '</span><b>' + U.esc(d.name) + '</b>';
    b.addEventListener('click', function () { select(i, true); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, n = -1;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % D.length;
      else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i + D.length - 1) % D.length;
      else if (k === 'Home') n = 0; else if (k === 'End') n = D.length - 1;
      if (n >= 0) { e.preventDefault(); select(n, true); tabs[n].focus(); }
    });
    tabsEl.appendChild(b); tabs.push(b);
    if (SV.xp.has('dna', d.id)) b.classList.add('is-seen');
  });

  function select(i, user) {
    if (i === cur) return;
    cur = i;
    var d = D[i];
    tabs.forEach(function (t, k) {
      t.classList.toggle('is-on', k === i);
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      t.tabIndex = k === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'dnaTab' + i);
    panel.innerHTML =
      '<div><div class="dna__stat" id="dnaStat">' + U.esc(d.stat) + '</div><div class="dna__label mono">' + U.esc(d.statLabel) + '</div></div>' +
      '<p class="dna__text">' + U.esc(d.text) + '</p>' +
      '<p class="dna__ex"><b>Na prática:</b> ' + U.esc(d.ex) + '</p>';
    panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');

    /* contagem para estatísticas que são anos */
    var el = document.getElementById('dnaStat'), target = /^\d{4}$/.test(d.stat) ? parseInt(d.stat, 10) : null;
    cancelAnimationFrame(tween);
    if (target && !SV.reduced()) {
      var from = target - 60, t0 = performance.now();
      (function step(now) {
        var k = U.clamp((now - t0) / 800, 0, 1);
        el.textContent = Math.round(from + (target - from) * U.easeOut(k));
        if (k < 1) tween = requestAnimationFrame(step);
      })(t0);
    }
    if (user && SV.xp.mark('dna', d.id, 4, 'Ingrediente: ' + d.name)) tabs[i].classList.add('is-seen');
  }
  select(0, false);
})();
