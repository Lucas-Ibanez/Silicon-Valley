# Vale do Silício — Do pomar ao silício

Landing page interativa sobre a história do Vale do Silício. HTML, CSS e JavaScript puros, sem dependências nem etapa de build (só as fontes do Google Fonts, com fallback do sistema).

## Como abrir

Abra `index.html` no navegador, ou sirva a pasta com qualquer servidor estático (`npx serve`, `python -m http.server`).

## Estrutura

```
index.html              marcação de todas as seções
assets/css/styles.css   tokens (tema claro/escuro), layout e componentes
assets/js/
  data.js               TODO o conteúdo: eras, checkpoints, estações, chips, pessoas, quiz…
  main.js               núcleo: laço de animação único, tema, nav, XP/conquistas, modal, toasts
  scene.js              herói: cena em canvas 2D guiada pelo scroll (7 eras, ciclo dia/noite)
  timeline.js           "A travessia": trilha SVG que se acende com o scroll
  valley.js             "Linha do Vale": mapa esquemático clicável
  moore.js              gráfico logarítmico arrastável (Lei de Moore)
  people.js             cartões de fundadores com inclinação 3D
  dna.js                abas "por que aqui?"
  quiz.js               quiz final
```

Os scripts são clássicos (sem módulos ES), então funcionam também via `file://`. Eles se comunicam pelo namespace global `SV`.

## Onde mexer

- **Textos e datas:** `assets/js/data.js`.
- **Cores e tema:** variáveis em `:root` e `:root[data-theme="light"]` no CSS. A cena do herói usa a paleta própria em `scene.js` (`KN`).
- **Depuração da cena:** `index.html?scene=0.5` congela o herói em 50% da viagem (0 a 1).
- **Progresso salvo:** XP, conquistas e checkpoints visitados ficam no `localStorage` (`sv-state`); o tema em `sv-theme`.

## Acessibilidade e desempenho

- Respeita `prefers-reduced-motion` (sem animações contínuas, rolagem sem suavização).
- Modais com `<dialog>`, navegação por teclado (setas nos modais e nas abas), `skip link` e rótulos ARIA.
- Um único `requestAnimationFrame` serve todos os módulos; cada um só desenha quando está visível.
