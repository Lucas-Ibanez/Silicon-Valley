# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- Não há testes nem build: a verificação é Edge headless via DevTools Protocol (scripts fora do repo), com cliques reais, erros de console, 1440×900, 1366×768 e 390×844, temas claro e escuro. Só dê por pronto depois disso.
- `opacity: 0` não bloqueia clique: o `.hero__card` invisível já engoliu os botões do herói em 1366×768. Camada só de leitura leva `pointer-events: none`; se o CSS já o define, o inline para reativar é `'auto'`, nunca `''`.
- O `scroll-behavior: smooth` global quebra `window.scrollTo` repetido por quadro: use `SV.scrollTo` ou `SV.instantScroll` (a classe `html.no-smooth` desliga o smooth).
- O `.nav` é `fixed` e o menu mobile também: animação com `translate`/`transform` no `.nav` o vira *containing block* e o overlay encolhe. A entrada usa `fill-mode: backwards` e o overlay precisa de `justify-self: stretch`.
- `people-assets.js` e `assets/img/people/{cards,bg}` saem de um pipeline Python (Pillow/OpenCV + fotos do Wikimedia) que NÃO está no repo: não edite à mão; mudar pessoas exige refazê-lo e atualizar `CREDITS.md`.
- Foto de pessoa só com licença livre e linha no `CREDITS.md`; logos são marcas registradas usadas só para identificação (o rodapé avisa).
- Edição em bloco do `data.js` por script já apagou datasets: depois, carregue com node e confira 20 checkpoints, 10 estações, 14 chips, 12 pessoas, 5 DNA, 6 quiz. No Windows os arquivos são CRLF; regrave com `newline=''`.
- É de propósito que herói, ponte e cenas do DNA ignorem o tema claro (paleta escura fixa), e parte dos fatos históricos veio de memória, não de fonte checada: revise antes de afirmar algo novo.
