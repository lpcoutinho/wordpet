# Plano de implementação — fase 0 (wordpet web)

Objetivo: protótipo web no Linux que prova três coisas — o loop de recall com escolha pt-BR→EN, a persistência local entre recarregamentos e o agendamento FSRS-7 com log auditável. Nada de taskbar, Android, nuvem, contas ou telemetria.

## Pré-requisito bloqueante: Node 24

O ambiente atual tem `v22.20.0`, mas `ts-fsrs@6.0.1` declara `engines.node >=24`. Antes de instalar qualquer dependência, subir para Node `24.22.3` (ou `26.13.1`, também LTS e compatível) via nvm/fnm ou tarball oficial, e fixar em `.nvmrc` e no campo `engines` do `package.json`. `engines` é apenas aviso no npm, então conferir `node -v` na mão.

| Item | Versão fixada |
| --- | --- |
| Node.js | `24.22.3` |
| `@sqlite.org/sqlite-wasm` | `3.54.1-build1` |
| `ts-fsrs` | `6.0.1` |
| `vite` | `8.3.8` |
| `vitest` | `5.1.1` |

## Ordem de execução

Cada etapa bloqueia a seguinte. Não pular a etapa 0: ela decide se a persistência escolhida é viável neste navegador.

### 0. Smoke test de 30 minutos (go/no-go)

- Subir Vite com `server.headers` e `preview.headers`: `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`, mais `optimizeDeps.exclude: ['@sqlite.org/sqlite-wasm']`.
- Conferir `window.crossOriginIsolated === true` na página.
- Em um Worker, `sqlite3InitModule()`, abrir banco com `new sqlite3.oo1.OpfsDb('/wordpet-mvp.sqlite3')` quando `'OpfsDb' in sqlite3.oo1`; o check `'opfs' in sqlite3` do README está desatualizado na build `3.54.1-build1`.
- Recarregar a página e repetir o `SELECT`.
- Em paralelo, validar `DefaultScheduler` com FSRS-7: `newCard()` → `preview()` com quatro notas → `review()` com `Rating.Good`, conferindo que o cartão de entrada não é mutado.
- **Aceite:** linha presente após reload e `review()` devolvendo `{ card, revlog }`.
- **Fallback:** se houver erro de header/lock, trocar `opfs` por `opfs-sahpool` (`installOpfsSAHPoolVfs()` + `new OpfsSAHPoolDb('/wordpet-mvp.sqlite3')`) antes de mexer no scheduler; se ainda falhar, parar e decidir antes de continuar. `kvvfs` está fora (5 MB e só na thread principal).

### 1. Scaffold e contrato de pastas

- Vite + TypeScript com `strict: true`, Vitest e as versões fixadas acima.
- `src/core/`: TypeScript puro, sem DOM — `item.ts`, `scheduler.ts`, `rewards.ts`, `metrics.ts`.
- `src/content/`: pack gerado e consumido como dados, sem lógica de jogo.
- `src/platform/web/`: Worker SQLite e o adaptador de persistência.
- `src/ui/`: cartão e sprite.
- `scripts/build-content.mjs`: geração do pack.
- **Aceite:** `npm run dev`, `npm test`, `npm run build` rodando com app vazio.

### 2. Pipeline de conteúdo

- Ler `no-swears.txt` do `google-10000-english`; limitar às ~1000 primeiras palavras.
- Gerar um `word_sense` por palavra com `lemma`, `pos`, `sense_index`, `definition_en`, `translation_ptbr`, `source_id` e `license`.
- Curar manualmente as primeiras 200 traduções pt-BR; marcar as demais como pendentes e **não** exibi-las no MVP.
- Gravar `content_pack` com `version`, `checksum` e `built_at`. Nenhum item sem `source_id` e licença.
- **Aceite:** pack gerado de forma determinística (mesmo checksum em duas execuções) e 200 itens jogáveis.

### 3. Núcleo de domínio

- `item` como unidade, `word_sense` como único tipo implementado; `sentence` e `idiom` ficam como tipos previstos no modelo, sem código.
- Envolver `DefaultScheduler` com `version: 'FSRS-7'`, `desiredRetention: 0.9`, `learningSteps: ['1m','10m']`, `relearningSteps: ['10m']`, `enableFuzz: false`, `maximumInterval: 36500`.
- `review()` recebe um `now` injetado; persistir o cartão devolvido **e** o `revlog` (incluindo `reviewTime`, não `reviewAt`).
- `rewards.ts` concede XP somente quando a resposta veio antes da revelação; exposição passiva não chama `review()`.
- **Aceite:** testes com relógio falso cobrindo quatro notas, fila de revisão ordenada por `dueAt`, e nenhum XP em exposição.

### 4. Persistência local

- Mesmo esquema previsto para o desktop, criado já na fase 0: `content_pack`, `item`, `user_progress`, `gameplay_event`, `outbox`.
- `user_progress` por `(user_id, item_id)` com `state`, `stability`, `stabilityFast`, `difficulty`, `dueAt`, `lastReviewAt`, `reps`, `lapses`, `fsrs_version` e `params_version` — FSRS-7 exige o campo `stabilityFast`.
- `gameplay_event` append-only com `event_id` único; `outbox` criada agora, mesmo sem servidor.
- Migrações com `PRAGMA user_version`, sequenciais e forward-only; nunca editar migração publicada.
- Todo acesso ao banco passa pelo adaptador (`getDue`, `saveReview`, `appendEvent`), nunca pelo componente de tela.
- **Aceite:** revisão gravada, reload, próxima revisão coerente; nenhuma query SQLite fora de `src/platform/web/`.

### 5. Interface do protótipo

- Cartão minimalista com a palavra em inglês e o sprite pequeno com três estados (neutro, feliz, dormindo).
- Uma pergunta: escolher a tradução pt-BR entre alternativas;uma resposta por interação.
- Feedback corretivo imediato: acerto rende XP; erro mostra a tradução e devolve o item à fila sem punição.
- Som desligado por padrão.
- **Aceite:** uma sessão de 20 respostas completa sem travar e sem usar nenhum item ainda não curado.

### 6. Métricas desde o primeiro dia

- Registrar `review`, `answer`, `exposure`, `xp_award` em `gameplay_event`, com `schema_version` e `pack_version`.
- `metrics.ts` calcula `delayed_recall_1d` e `delayed_recall_7d` apenas sobre revisões agendadas; XP e duração ficam em campos separados.
- **Aceite:** relatório simples mostrando recall por item e por dia, com dados fabricados por relógio falso nos testes.

### 7. Verificação final

- `npm test`, `npm run build`, `npm run preview` com os mesmos headers.
- Conferir no Chromium do Linux: reload preserva progresso, FSRS agenda a próxima revisão, e o build de produção não perde a persistência.
- **Aceite:** todos os comandos passam e o critério de sucesso do `docs/escopo.md` é calculável a partir dos logs.

## Resultado das etapas 1-7 (validado em 25/11/2026)

- `src/core/`: `item.ts`, `scheduler.ts`, `rewards.ts` e `metrics.ts`, sem DOM. FSRS-7 com retenção-alvo `0,9`, `learningSteps: ['1m','10m']`, `relearningSteps: ['10m']`, `enableFuzz: false` e `maximumInterval: 36500`; `review()` usa `now` injetado e devolve cartão + `revlog`.
- `src/content/`: pack gerado da Wiktionary em inglês (`CC-BY-SA-4.0`) a partir das 1000 palavras mais frequentes de `google-10000-english-no-swears.txt`; 998/1000 lemas cacheados, 60 subpáginas de tradução detectadas e 9716 exemplos `ux/usex` encontrados no cache.
- Pack final: 200 itens jogáveis, checksum `a7de7602d346ba81ed419fdc35195a6e2949f169d2a5703b4416332c7dea25e9`, reproduzível em duas execuções. Cada item traz `definition_en` e `example_en`; tradução em português é metadado opcional e não aparece no cartão.
- Filtro de qualidade do gerador: lema com pelo menos duas letras, definição com 3+ palavras e 12+ caracteres sem começar com `.` ou `;`, e exemplo com 3+ palavras e 10+ caracteres. Sentidos reprovados ficam em `content/review-queue.json`; créditos em `content/CREDITS.md`.
- Curadoria manual mínima aplicada no gerador: `page`, `new`, `see` e `can` receberam definição e exemplo revisados; artigos, pronomes e preposições marcados como pendentes.
- `src/db.worker.ts` + `src/platform/web/persistence.ts`: esquema `content_pack`, `item`, `user_progress`, `gameplay_event` e `outbox`, com `PRAGMA user_version = 1`, migração forward-only para colunas adicionais e nenhuma query fora da camada web.
- `src/ui/`: cartão com definição em inglês, quatro alternativas em inglês, frase de exemplo apenas como feedback, sprite neutro/feliz/dormindo, XP, sequência e recall 1d; som desligado.
- `src/main.ts`: exposição gera evento passivo sem XP; resposta antes da revelação gera `review`, `answer` e `xp_award`, e XP somente em acerto ativo.
- Testes: `npm test` com 12 testes passando (alternativas, fila por `dueAt`, XP, quatro notas FSRS-7, métricas 1d/7d e extração de exemplos); `npm run build` passando.
- Verificação no Chromium headless: `crossOriginIsolated === true`; em dev e preview, um acerto rendeu 10 XP e o valor persistiu após reload. Verificação Tauri: janela 360x297 ancorada no canto inferior direito, `isolamento=true`, cartão em inglês e 200 sentidos carregados. O 404 restante é apenas `favicon.ico`.

## Resultado da etapa 0 (validado em 25/11/2026)

- Node `24.22.3` instalado via nvm e fixado em `.nvmrc` e `package.json`.
- `npm install`, `npm test` e `npm run build` passaram com as versões fixadas.
- Chrome headless: `crossOriginIsolated === true`, headers presentes em dev, SQLite `3.54.1` com `OpfsDb` persistindo entre duas navegações (`n` de 2 para 3), e FSRS-7 devolvendo quatro notas e `review()` com `stabilityFast > 0`.
- O README do pacote usa `'opfs' in sqlite3`; na versão instalada o módulo expõe `oo1.OpfsDb` e `installOpfsSAHPoolVfs`, então o check correto é `'OpfsDb' in sqlite3.oo1`.
- `npm run preview` (build de produção) também manteve os headers e persistiu entre duas navegações (`n` de 1 para 2); o primeiro preview havia servido um build antigo, então o teste foi refeito após rebuild.

## Como alterar o tamanho da janela Tauri

- Dimensão inicial: `src-tauri/tauri.conf.json:17-18` (`width` e `height`). A janela também está com `resizable: false` em `:19`; mude para `true` se o usuário puder redimensionar.
- Ancoragem: `src-tauri/src/lib.rs:14-15` usa `outer_size()` e margens de `16px` à direita e `56px` acima da base; não há largura/altura fixa nesse arquivo. Ajuste esses números para mudar a margem da taskbar.
- Conteúdo: `src/style.css:25-29` define `width: min(100% - 2rem, 34rem)`, `padding` e `gap`; `:41-43` e `:76` definem sprite e cartão. WebKitGTK mantém uma altura mínima de conteúdo, então reduzir apenas `height` pode não surtir efeito; para janelas menores, reduza paddings/gaps/fontes nesse CSS.
- Redimensionamento em runtime: importe `PhysicalSize` junto com `PhysicalPosition` em `src-tauri/src/lib.rs:1-5` e chame:

```rust
let _ = window.set_size(PhysicalSize::new(largura, altura));
position_window(&window);
```

- Redimensionamento em uso: a janela está com `resizable: true`, então a borda pode ser arrastada; o menu da bandeja também tem `Aumentar` (+80×40), `Diminuir` (-80×40) e `Tamanho inicial` (560×260), Implementados em `src-tauri/src/lib.rs`.
- O rótulo de status abaixo do mascote usa quebra de linha no layout compacto (`src/style.css:117`), evitando cortes como “200 sentidos no...”.
- Após editar `tauri.conf.json`, reinicie `npm run tauri:dev`; para o `.deb`, rode `npm run tauri:build` e reinstale o pacote em `src-tauri/target/release/bundle/deb/wordpet_0.0.0_amd64.deb`.

## Fora da fase 0

Android, nuvem, contas, telemetria, digitação, escuta, frases, gramática, expressões idiomáticas e animação elaborada.

## Riscos e fallback

- **Node 22 → 24:** bloqueante; sem a atualização, `ts-fsrs@6` não é suportado.
- **OPFS em Worker:** sem persistência após reload, usar `opfs-sahpool`; se ainda falhar, parar.
- **Navegador:** a lista de suporte da documentação SQLite é de 2023; validar no Chromium Linux real antes de prometer Firefox/Safari.
- **pt-BR:** só 200 itens curados entram no MVP; o restante fica pendente e fora da rotação.
- **Dados derivados de LLM:** nenhuma chamada em runtime; qualquer enriquecimento acontece no `scripts/build-content.mjs`.

## Fase 1 — dicionário completo (validado em 25/11/2026)

- `npm run dictionary:build` le `references/dictionary_arrays.json`, valida 102.104 entradas e grava `content/generated/EnglishDictionary.json` com os mesmos valores do arquivo de referência, inclusive a duplicação em `zythum`.
- `src/content/pack.json` passa a ter 99.237 cartoes jogaveis com ID `EnglishDictionary|<lemma>`, todos os sentidos limpos em `definition_en`, prompt curto em `prompt_en` e gloss curto em `gloss_en`; 2.867 entradas que continham apenas `See X` ficam em `content/review-queue.json`.
- `npm run content:build` agora chama o gerador do dicionário; o gerador anterior da Wiktionary segue disponível como `npm run content:build:wiktionary` para validação e lacunas de exemplo.
- Ordem de perguntas: aleatória ponderada por frequência; palavras fora da lista-base recebem peso 0,05. Alternativas vem do universo aprovado, com preferência por mesmo `pos` e comprimento parecido.
- Toque em palavra da definicao: gloss curto em ingles e inclusao imediata em `notebook`; palavras flexionadas sao reduzidas ao lema; alternativas so respondem ao toque depois da resposta. Nenhum XP e nenhuma penalidade FSRS.
- UI totalmente em ingles: “Which word matches this meaning?”, “Add to my words”, “Remove from my words”, “Not available yet”, “Ready to play.” e “All caught up.”. Status tecnico de isolamento e contagem de itens nao aparecem.
- SQLite reaproveita o esquema atual, cria a tabela `notebook` e ignora a reinsercao quando checksum e contagem ja estao persistidos.
- Testes: `npm test` com 23 testes passando; `npm run build` passando. Ver `docs/adr/0008-english-dictionary-como-fonte-principal.md`.
