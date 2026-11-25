# Protótipo web antes do empacotamento desktop

A primeira entrega precisa responder se o loop de recall é divertido, antes de enfrentar integração com sistema operacional. Decidimos validar no navegador Linux com Vite e TypeScript e só depois empacotar em Tauri.

## Considered Options

- Tauri desde o primeiro dia: descartado porque antecipa WebKitGTK, transparência e posicionamento de janela antes de sabermos se o jogo prende o jogador.
- Engine de jogo completa: descartada porque o MVP é texto, cartões e um sprite minúsculo.

## Consequences

A regra de negócio fica em TypeScript sem DOM, atrás de um adaptador de superfície, para que desktop e Android reaproveitem o mesmo núcleo.
