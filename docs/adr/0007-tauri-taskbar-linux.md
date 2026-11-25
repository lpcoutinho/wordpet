# Tauri 2 para a versão taskbar no Linux

A versão desktop reusa o front-end Vite existente dentro de uma janela Tauri 2 pequena, sem decoração, transparente, sempre no topo e fora da lista de janelas do sistema. No Linux/X11 ela fica ancorada no canto inferior direito; a bandeja expõe `Mostrar / ocultar` e `Sair`.

## Considered Options

- Electron: descartado pelo tamanho do bundle e consumo de memória para um jogo que fica o tempo todo aberto.
- Reescrever o front-end em Rust nativo: descartado porque duplicaria a interface e a regra de jogo já validadas no navegador.
- Webview do sistema via Tauri: escolhido porque mantém um único código-base web, permite bandeja e janela taskbar com dependências GTK/WebKitGTK já presentes na máquina.

## Consequences

A janela não é um widget literal da GNOME Shell: é uma janela compacta que imita a taskbar. Cliques na bandeja em Linux não entregam eventos de mouse; a interação usa menu de contexto. Wayland ainda precisa de validação específica.
