/*
 * Perguntas frequentes: cada pergunta abre e fecha a própria resposta.
 * O conteúdo fica no index.html (visível mesmo sem JS); aqui só o acordeão.
 */
(function () {
  'use strict';
  var box = document.getElementById('faqBox');
  if (!box) return;
  [].forEach.call(box.querySelectorAll('.faq__q'), function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', String(open));
      q.closest('.faq__item').classList.toggle('is-open', open);
    });
  });
})();
