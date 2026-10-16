# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Landing page interativa em pt-BR sobre a história do Vale do Silício ("Do pomar ao silício"). HTML, CSS e JavaScript puros: **sem build, sem gerenciador de pacotes, sem framework e sem suíte de testes**. Quase todo o texto do site e todos os comentários do código estão em português; mantenha isso. O README.md descreve a estrutura e as seções.

## Comandos

- **Rodar:** abra `index.html` direto no navegador (funciona via `file://`, porque os scripts são clássicos, sem módulos ES) ou sirva a pasta com `python -m http.server`. As fontes vêm do Google Fonts e precisam de internet; sem rede cai nas fontes do sistema.
- **Checar sintaxe de um arquivo:** `node --check assets/js/<arquivo>.js`.
- **Validar o conteúdo:** `node -e "global.window={};require('./assets/js/data.js');console.log(Object.keys(window.SV.data))"`. Depois de qualquer edição em massa no `data.js`, confira as contagens (20 checkpoints, 10 estações, 14 chips, 12 pessoas, 5 ingredientes, 6 perguntas): um recorte errado já apagou datasets inteiros.
- **Depurar cenas de scroll:** `index.html?scene=0.5` congela o herói em 50% da viagem; `index.html?cross=0.5` faz o mesmo na travessia da ponte (valores de 0 a 1).
- **Verificação visual:** não há testes. As mudanças foram verificadas com o Edge headless dirigido pelo Chrome DevTools Protocol (rolar, clicar com eventos reais de mouse, capturar tela, ler erros de console). Esses scripts não estão no repositório; ao testar, olhe `ERRORS` do console e a tela em 1440×900, 1366×768 e 390×844 (celular), nos temas claro e escuro.

## Arquitetura

**Namespace único `window.SV`, scripts clássicos carregados em ordem fixa** no fim do `index.html`: `data` → `main` → módulos de seção → `dna-scenes` → `dna` → `quiz`. A ordem importa: `people-assets.js` e `holo.js` precisam vir antes de `people.js`; `dna-scenes.js` antes de `dna.js`; `chipart.js` antes de `moore.js`; `bridge.js` antes de `valley.js`. Ao criar um módulo, registre a tag `<script>` na ordem certa.

- `data.js` é a **única fonte de conteúdo** (eras, 20 checkpoints, estações, chips, pessoas, ingredientes do DNA, quiz, conquistas, níveis). Os módulos só renderizam; não coloque texto histórico dentro deles. Exceções: `figures.js` (20 ilustrações SVG, indexadas pela ordem de `timeline`), `chipart.js` (retratos de chips, indexados por `chip.id`) e `dna-scenes.js` (textos das cenas).
- `main.js` é o núcleo e expõe: `SV.util` (clamp, lerp, sstep, rnd determinístico…), `SV.frame(fn)`, `SV.reduced()`, `SV.xp` (XP e conquistas, salvos no `localStorage` em `sv-state`; o tema em `sv-theme`), `SV.modal`, `SV.toast`, `SV.scrollTo`/`instantScroll`/`cancelScroll`/`onUserScroll` e `SV.html.facts`. Também cuida do tema, do header, das revelações (`.reveal`), dos contadores e do ticker.
- **Um único laço `requestAnimationFrame`** (`SV.frame`) atende todos os módulos. Cada módulo registra seu callback e dá `return` cedo quando não está visível (checagem por `getBoundingClientRect` ou `IntersectionObserver`). Não crie laços próprios.
- **Seções guiadas por scroll** (herói em `scene.js`, 760vh; travessia da ponte em `valley.js` + `bridge.js`, 640vh): um contêiner alto com um palco `position: sticky`; o progresso 0→1 vem de `-rect.top / (altura - viewport)` e é suavizado com `lerp`. O herói é um canvas 2D com 7 cenários que deslizam lateralmente e um ciclo dia/noite; `bridge.js` é um renderizador pseudo-3D (projeção em perspectiva + algoritmo do pintor) sem WebGL.
- **A trilha da seção 02** (`timeline.js`) lê a posição real dos `<li>` do DOM, traça um SVG (Catmull-Rom → Bézier) por eles e mapeia "altura na tela → comprimento do caminho" para acender o traço.
- **Fundadores:** `people-assets.js` é **gerado** (dados 96×120 em tons de cinza dos hologramas, lista do mural e créditos); não edite à mão. Ele sai de um pipeline em Python (Pillow, NumPy, OpenCV) que baixa fotos livres do Wikimedia Commons, recorta o rosto e gera `assets/img/people/cards/*.webp` e `bg/*.webp` (desenhos P&B). Esse pipeline não está no repositório; se pessoas mudarem, é preciso refazê-lo e atualizar `assets/img/people/CREDITS.md` junto.
- **Cores:** os tokens do tema claro/escuro ficam em `:root` e `:root[data-theme="light"]` no CSS. Canvas e SVG que leem cores fazem isso por `getComputedStyle` e reagem ao evento `sv:theme` (ver `moore.js`). O herói, a travessia da ponte e as cenas do DNA têm **paleta escura própria e ignoram o tema**, de propósito.

## Armadilhas já encontradas

- **Cliques interceptados por camadas invisíveis.** Elementos com `opacity: 0` continuam recebendo cliques. O `.hero__card` já cobriu os botões do herói em 1366×768. Camadas só de leitura devem ter `pointer-events: none`. Se um elemento ligar e desligar o clique por JS e o CSS já definir `pointer-events: none`, o inline precisa ser `'auto'`, não `''`.
- **`scroll-behavior: smooth` global.** Chamadas repetidas a `window.scrollTo` quebram a rolagem. Para animar a rolagem use `SV.scrollTo` (suave, cancelável por roda, toque ou teclado) ou `SV.instantScroll` (a classe `html.no-smooth` desliga o smooth enquanto roda).
- **Header `.nav` é `position: fixed` com filhos também `fixed`** (o menu mobile em tela cheia). Uma animação com `translate` ou `transform` no `.nav` o torna *containing block* desses filhos, e `justify-self` do grid encolhe um filho fixo. Por isso a entrada usa `fill-mode: backwards` e o overlay tem `justify-self: stretch`.
- **`.reveal` só aparece com a classe `js` no `<html>`**, adicionada pelo script inline do `<head>`. O mesmo script aplica o tema salvo antes da primeira pintura.
- **`--nav-h` (78px)** alimenta os `top` dos elementos `sticky` (HUD da trilha, cockpit da Lei de Moore, hub do DNA) e do herói. Mude-o em um lugar só.
- **Fim de linha:** no Windows os arquivos podem ter CRLF. Ao reescrever arquivos por script, abra e grave com `newline=''` (Python) para não misturar finais de linha.
- **Logos e fotos são de terceiros.** `assets/img/logos/` (Intel, Pentium, Apple, NVIDIA, Stanford, UC Berkeley) são marcas registradas usadas só para identificação histórica, com aviso no rodapé. Qualquer foto nova de pessoa precisa de licença livre e entrada em `CREDITS.md`.

## Convenções

- Respeite `prefers-reduced-motion` (`SV.reduced()`): sem animação contínua e sem rolagem suave.
- Cada módulo de seção é uma IIFE com `'use strict'`, estilo ES5 com `var`, e escreve no namespace `SV` (por exemplo `SV.chipArt`, `SV.Holo`, `SV.Bridge`, `SV.dnaScenes`).
- Dar XP: `SV.xp.mark(grupo, id, xp, rótulo)` só concede na primeira vez por `grupo+id`. Novas conquistas entram em `data.achievements` e em `CHECKS` no `main.js`.
- Os fatos históricos vieram de fontes públicas e em parte da memória; valores aproximados levam "~". Revise `data.js` e `dna-scenes.js` antes de afirmar algo novo.
