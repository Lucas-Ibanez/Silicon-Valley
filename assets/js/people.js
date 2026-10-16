/*
 * Fundadores: cartões com inclinação 3D que segue o ponteiro e modal de biografia.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var grid = document.getElementById('people');
  if (!grid) return;
  var P = DATA.people, N = P.length, cards = [];
  var canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  P.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pcard reveal' + (SV.xp.has('pe', p.id) ? ' is-met' : '');
    b.style.setProperty('--h', p.hue);
    b.style.setProperty('--d', (i % 4) * 0.08 + 's');
    b.innerHTML =
      '<div class="pcard__in">' +
        '<div class="pcard__art"><span class="pcard__ini">' + U.esc(p.ini) + '</span><span class="pcard__yrs mono">' + U.esc(p.years) + '</span></div>' +
        '<div class="pcard__txt">' +
          '<span class="pcard__role mono">' + U.esc(p.role) + '</span>' +
          '<span class="pcard__name">' + U.esc(p.name) + '</span>' +
          '<span class="pcard__short">' + U.esc(p.short) + '</span>' +
          '<span class="pcard__go mono">Ler a história →</span>' +
        '</div>' +
      '</div>';
    b.addEventListener('click', function () { open(i); });

    if (canTilt) {
      b.addEventListener('pointermove', function (e) {
        if (SV.reduced()) return;
        var r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        b.classList.add('is-tilting');
        b.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
        b.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
        b.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        b.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      b.addEventListener('pointerleave', function () {
        b.classList.remove('is-tilting');
        b.style.setProperty('--rx', '0deg'); b.style.setProperty('--ry', '0deg');
      });
    }
    grid.appendChild(b); cards.push(b);
    new IntersectionObserver(function (en, ob) {
      if (en[0].isIntersecting) { b.classList.add('is-in'); ob.disconnect(); }
    }, { threshold: 0.12 }).observe(b);
  });

  function open(i) {
    var p = P[i];
    var html =
      '<div class="m-art" style="--h:' + p.hue + '" aria-hidden="true">' + U.esc(p.ini) + '</div>' +
      '<span class="m-kicker mono">' + U.esc(p.role) + '</span>' +
      '<h3 class="m-title" id="modalTitle">' + U.esc(p.name) + '</h3>' +
      '<p class="m-sub m-mono">' + U.esc(p.years) + '</p>' +
      '<p class="m-text">' + U.esc(p.bio) + '</p>' +
      '<div class="m-nav"><button type="button" class="btn" data-dir="-1">← ' + U.esc(P[(i + N - 1) % N].name.split(' ')[0]) + '</button>' +
      '<button type="button" class="btn" data-dir="1" data-autofocus>' + U.esc(P[(i + 1) % N].name.split(' ')[0]) + ' →</button></div>';
    var go = function (d) { open((i + d + N) % N); };
    SV.modal.open(html, { prev: function () { go(-1); }, next: function () { go(1); } });
    [].forEach.call(document.querySelectorAll('#modalBody [data-dir]'), function (b) {
      b.addEventListener('click', function () { go(parseInt(b.dataset.dir, 10)); });
    });
    cards[i].classList.add('is-met');
    SV.xp.mark('pe', p.id, 10, p.name.split(' e ')[0] + ' conhecido');
  }
})();
