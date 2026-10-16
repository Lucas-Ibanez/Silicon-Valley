/*
 * Quiz final: seis perguntas, feedback imediato, resultado e XP.
 */
(function () {
  'use strict';
  var SV = window.SV, U = SV.util, DATA = SV.data;
  var box = document.getElementById('quizBox');
  if (!box) return;
  var Q = DATA.quiz, N = Q.length, idx = 0, score = 0, marks = [];
  var LET = ['A', 'B', 'C', 'D'];

  function dots() {
    var h = '';
    for (var i = 0; i < N; i++) h += '<i class="' + (marks[i] === 1 ? 'is-ok' : marks[i] === 0 ? 'is-no' : i === idx ? 'is-now' : '') + '"></i>';
    return h;
  }

  function render() {
    if (idx >= N) return result();
    var q = Q[idx];
    box.innerHTML =
      '<div class="quiz__top mono"><span>Pergunta ' + (idx + 1) + ' / ' + N + '</span><span class="quiz__dots" aria-hidden="true">' + dots() + '</span></div>' +
      '<h3 class="quiz__q">' + U.esc(q.q) + '</h3>' +
      '<div class="quiz__opts">' + q.o.map(function (o, i) {
        return '<button type="button" class="opt" data-i="' + i + '"><span class="mono">' + LET[i] + '</span>' + U.esc(o) + '</button>';
      }).join('') + '</div>' +
      '<div id="quizFb" aria-live="polite"></div><div class="quiz__nav" id="quizNav"></div>';
    [].forEach.call(box.querySelectorAll('.opt'), function (b) {
      b.addEventListener('click', function () { answer(parseInt(b.dataset.i, 10)); });
    });
  }

  function answer(i) {
    var q = Q[idx], ok = i === q.a;
    if (ok) score++;
    marks[idx] = ok ? 1 : 0;
    [].forEach.call(box.querySelectorAll('.opt'), function (b, k) {
      b.disabled = true;
      if (k === q.a) b.classList.add('is-ok');
      else if (k === i) b.classList.add('is-no');
      else b.classList.add('is-dim');
    });
    box.querySelector('.quiz__dots').innerHTML = dots();
    document.getElementById('quizFb').innerHTML = '<p class="quiz__fb"><b>' + (ok ? 'Certo!' : 'Quase.') + '</b> ' + U.esc(q.e) + '</p>';
    var nav = document.getElementById('quizNav');
    nav.innerHTML = '<button type="button" class="btn btn--primary">' + (idx === N - 1 ? 'Ver resultado' : 'Próxima →') + '</button>';
    var nb = nav.firstChild;
    nb.addEventListener('click', function () { idx++; render(); });
    nb.focus({ preventScroll: true });
  }

  function result() {
    SV.xp.quizDone(score);
    var msg = score === N ? 'Perfeito! Você é um verdadeiro Gênio do Vale.' :
      score >= N - 2 ? 'Muito bom! Você guardou o essencial da viagem.' :
      score >= N / 2 ? 'Bom começo. Que tal revisitar a travessia e tentar de novo?' :
      'A jornada está só começando. Volte à travessia e tente outra vez!';
    box.innerHTML =
      '<div class="quiz__result"><p class="eyebrow mono">Resultado</p>' +
      '<div class="quiz__score">' + score + '<span style="opacity:.35">/' + N + '</span></div>' +
      '<p class="quiz__msg">' + msg + '</p>' +
      '<div class="actions actions--center" style="margin-top:0">' +
      '<button type="button" class="btn btn--primary" id="quizAgain">Refazer</button>' +
      '<button type="button" class="btn" id="quizPass">Ver passaporte</button></div></div>';
    document.getElementById('quizAgain').addEventListener('click', function () { idx = 0; score = 0; marks = []; render(); });
    document.getElementById('quizPass').addEventListener('click', function () { document.getElementById('xpChip').click(); });
  }

  render();
})();
