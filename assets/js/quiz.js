/*
 * Quiz final: seis perguntas, feedback imediato, resultado e XP.
 * A tela de resultado mostra os acertos, o XP desta tentativa e o total do passaporte
 * (o mesmo número do chip do topo); só um novo recorde rende XP.
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

  /* leva o topo do cartão para logo abaixo do header fixo; sem "force", só rola se o cartão não couber na tela */
  function bringIntoView(force) {
    var gap = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 78) + 16;
    var r = box.getBoundingClientRect();
    if (!force && r.top >= gap - 4 && r.bottom <= window.innerHeight) return;
    SV.scrollTo(window.scrollY + r.top - gap);
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

  function restart() {
    idx = 0; score = 0; marks = [];
    render();
    bringIntoView(true);
    box.querySelector('.opt').focus({ preventScroll: true });
  }

  function result() {
    var xp = SV.xp.quizDone(score);
    var msg = score === N ? 'Perfeito! Você é um verdadeiro Gênio do Vale.' :
      score >= N - 2 ? 'Muito bom! Você guardou o essencial da viagem.' :
      score >= N / 2 ? 'Bom começo. Que tal revisitar a travessia e tentar de novo?' :
      'A jornada está só começando. Volte à travessia e tente outra vez!';
    var note = xp.gain > 0 ? '' : '<p class="quiz__note">Só um novo recorde rende XP' +
      (score === N ? ', e a sua marca já é a máxima.' : '. Supere sua melhor marca para ganhar mais.') + '</p>';
    /* resumo para leitor de tela: o foco vai para o "Refazer", que o anuncia como descrição */
    var sum = 'Você acertou ' + score + ' de ' + N + '. Nesta tentativa: +' + xp.gain + ' XP' +
      (xp.gain > 0 ? '' : ', porque só um novo recorde rende XP') + '. No passaporte: ' + xp.total + ' XP.';
    box.innerHTML =
      '<div class="quiz__result"><div class="quiz__head"><p class="eyebrow mono">Resultado</p>' +
      '<div class="quiz__score" id="quizScore">' + score + '<span>/' + N + '</span><span class="sr"> acertos</span></div>' +
      '<p class="quiz__msg">' + msg + '</p></div><div class="quiz__body">' +
      '<dl class="quiz__xp">' +
      '<div class="quiz__stat' + (xp.gain > 0 ? ' is-gain' : '') + '"><dt>Nesta tentativa</dt><dd id="quizGain">+' + xp.gain + ' XP</dd></div>' +
      '<div class="quiz__stat"><dt>No passaporte</dt><dd id="quizTotal">' + xp.total + ' XP</dd></div>' +
      '</dl>' + note +
      '<p id="quizSum" hidden>' + sum + '</p>' +
      '<div class="actions actions--center">' +
      '<button type="button" class="btn btn--primary" id="quizAgain" aria-describedby="quizSum">Refazer</button>' +
      '<button type="button" class="btn" id="quizPass">Ver passaporte</button></div></div></div>';
    document.getElementById('quizAgain').addEventListener('click', restart);
    document.getElementById('quizPass').addEventListener('click', function () { document.getElementById('xpChip').click(); });
    bringIntoView(false);
    document.getElementById('quizAgain').focus({ preventScroll: true });
  }

  render();
})();
