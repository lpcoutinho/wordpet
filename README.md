# wordpet

Um jogo idle/incremental para praticar inglês que vive na taskbar. Um pet compacto mostra definitions curtas em inglês, você responde e o FSRS-7 agenda a próxima revisão. Tudo roda localmente com SQLite/WASM (OPFS), sem servidor e sem coleta de dados.

> Status: protótipo/Fase 0 — versão `0.1.0`.

## O que já existe

- Cartão com o pet, quatro alternativas em inglês e feedback com XP e sequência.
- FSRS-7 com retenção-alvo `0,9`, fila por `dueAt` e métricas de recall 1d/7d.
- Persistência local em SQLite/WASM sobre OPFS; progresso sobrevive ao fechamento do app.
- Janela sempre no topo, ancorada no canto inferior direito, ícone do pet na bandeja.
- Splash de carregamento e dicionário carregado como asset separado (o bundle inicial do JS tem ~67 kB).
- Instaladores para Linux (`.deb`, `.rpm`, `.AppImage`) e Windows (`.exe` NSIS, `.msi` WiX).

## Requisitos

- Node `24.22.3` (fixado em `.nvmrc`; `engines >= 24`).
- Rust `1.95.0` ou superior (ver `rust-version` em `src-tauri/Cargo.toml`).
- Pré-requisitos do Tauri 2 para o seu sistema: <https://v2.tauri.app/start/prerequisites>.

## Rodando em desenvolvimento

```bash
nvm use        # Windows: nvm use 24.22.3
npm install
npm run tauri dev
```

Testes e build do front-end:

```bash
npm test
npm run build
```

## Builds de distribuição

- Linux: [docs/release-linux.md](docs/release-linux.md) — atalho `npm run release:linux -- 0.2.0`.
- Windows: [docs/build-windows.md](docs/build-windows.md) — `npm run tauri build -- --bundles nsis,msi`.

Os artefatos ficam em `releases/` (Linux) e `src-tauri/target/release/bundle/` (Windows); ambos são locais e não versionados.

## Estrutura

- `src/core/`: lógica pura do domínio (FSRS-7, recompensas, métricas), sem DOM.
- `src/content/`: pack de conteúdo usado pelo app (`pack.json`版本ado para o build funcionar sem regeneração).
- `src/db.worker.ts` e `src/platform/web/persistence.ts`: worker SQLite e persistência OPFS.
- `src/ui/`: cartão, sprite do pet e estilos.
- `src-tauri/`: configuração e código Rust do Tauri (janela, bandeja, empacotamento).
- `docs/`: escopo, ADRs, plano da Fase 0 e guias de build.
- `scripts/`: geração do dicionário e release Linux.

## Dados e licença

O código está sob a licença MIT ([LICENSE](LICENSE)). Os dados linguísticos derivados da Wiktionary estão sob CC BY-SA 4.0; veja [NOTICE.md](NOTICE.md). Nenhuma credencial ou dado pessoal é necessário para rodar o projeto.
