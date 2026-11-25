# Stack MVP web: SQLite WASM no navegador + ts-fsrs + Vite/Vitest

Pesquisa feita em 24/11/2026. Priorizei documentação oficial, READMEs oficiais e metadados oficiais do registry npm. "Incerteza" marca ponto sem fonte primária suficiente ou não validado nesta rodada.

## 1. `@sqlite.org/sqlite-wasm`: OPFS, headers COOP/COEP, Vite, versão/status e alternativas

### Takeaway
Para o protótipo, use `@sqlite.org/sqlite-wasm@3.54.1-build1` em um Worker. Comece com `opfs-sahpool` se o objetivo for provar persistência rapidamente em uma única aba sem depender de headers; use `opfs` ou `opfs-wl` quando multaba/concorrência for requisito. OPFS não funciona na thread principal. Node.js suporta apenas bancos em memória, sem persistência, neste pacote.

### Cited Findings
- Versão atual publicada: `3.54.1-build1`; `engines.node: >=22`; licença Apache-2.0; `dist-tags.latest=3.54.1-build1` e `dist-tags.build1=3.49.2-build1`; pacote com trusted publisher via GitHub Actions e attestation SLSA. — [registry npm `@sqlite.org/sqlite-wasm/latest`](https://registry.npmjs.org/@sqlite.org/sqlite-wasm/latest), [dist-tags](https://registry.npmjs.org/-/package/@sqlite.org/sqlite-wasm/dist-tags)
- O README oficial diz que o pacote embrulha o SQLite Wasm sem alterações, exceto tipos TypeScript; issues do SQLite subjacente devem ir para o bug tracker do SQLite, não para o wrapper. Diz também que Node.js tem suporte apenas a bancos em memória, sem persistência. — [README oficial de `sqlite-wasm`](https://raw.githubusercontent.com/sqlite/sqlite-wasm/main/README.md)
- Persistência em OPFS exige Worker: "OPFS is only available in Worker-thread contexts, not the main UI thread". — [SQLite WASM: Persistent Storage Options](https://sqlite.org/wasm/doc/trunk/persistence.md)
- O VFS `opfs` exige `SharedArrayBuffer`, que só está disponível com headers de cross-origin isolation: `Cross-Origin-Embedder-Policy: require-corp` e `Cross-Origin-Opener-Policy: same-origin`. COEP também pode ser `credentialless`, dependendo dos recursos remotos usados. — [SQLite WASM: COOP/COEP HTTP Headers](https://sqlite.org/wasm/doc/trunk/persistence.md), [MDN: `Window.crossOriginIsolated`](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated)
- Para clientes que não conseguem definir COOP/COEP ou priorizam performance sobre concorrência, a doc oficial recomenda `opfs-sahpool`; para concorrência entre abas, `opfs` ou `opfs-wl`. — [SQLite WASM: OPFS](https://sqlite.org/wasm/doc/trunk/persistence.md)
- `opfs-sahpool` "does not require COOP/COEP HTTP headers", costuma ter a maior performance OPFS, mas não suporta múltiplas conexões simultâneas ao mesmo banco e exige caminhos absolutos. Versões anteriores à 3.54 tinham bug de locking que podia causar corrupção quando usado em múltiplas conexões na mesma thread. — [SQLite WASM: OPFS SyncAccessHandle Pool VFS](https://sqlite.org/wasm/doc/trunk/persistence.md)
- `opfs-wl` foi adicionado na 3.53.0; usa Web Locks e exige `Atomics.waitAsync()`, disponível amplamente apenas desde 2025, portanto é menos portátil que `opfs`. — [SQLite WASM: OPFS with Web Locks](https://sqlite.org/wasm/doc/trunk/persistence.md)
- `kvvfs` usa `localStorage`/`sessionStorage`, funciona apenas na UI thread, permite no máximo um banco por storage object e tem limite típico de 5 MB (menor na prática por codificação JS de dois bytes). — [SQLite WASM: kvvfs](https://sqlite.org/wasm/doc/trunk/persistence.md)
- Browsers listados pela doc SQLite (snapshot de julho de 2023): Chromium derivados desde aproximadamente meados de 2022; mudanças de API OPFS na v108/nov-2022; Firefox v111+; Safari 16.4+. A doc alerta que Safari < 17 é incompatível com o VFS `opfs` atual por bug do browser sem workaround; `sahpool` e WASMFS são alternativas para Safari 16.4+. — [SQLite WASM: OPFS e Safari < 17](https://sqlite.org/wasm/doc/trunk/persistence.md)
- Concorrência OPFS é limitada: um arquivo bloqueado por um sync access handle não pode ser aberto por outra aba/thread do mesmo origin; o cliente deve tratar `SQLITE_BUSY`, manter transações curtas e não usar dois handles para o mesmo arquivo na mesma thread. — [SQLite WASM: Concurrency and File Locking](https://sqlite.org/wasm/doc/trunk/persistence.md)
- Modos incógnito/convidado podem reduzir ou eliminar persistência; browsers dificultam detecção confiável desses modos. A doc também registra desaparecimento de bancos OPFS por fatores externos (antivírus, limpeza, permissões, limpeza interna do browser). — [SQLite WASM: Incognito/Guest e Mysterious Disappearance](https://sqlite.org/wasm/doc/trunk/persistence.md)
- Worker1 e Promiser1 APIs estão deprecados desde 2026-04-15: não serão removidos, mas não serão estendidos e seu uso é ativamente desaconselhado. — [README oficial de `sqlite-wasm`](https://raw.githubusercontent.com/sqlite/sqlite-wasm/main/README.md)
- Config oficial do README para Vite em dev: `server.headers` com COOP/COEP e `optimizeDeps.exclude: ['@sqlite.org/sqlite-wasm']`. Os demos oficiais também usam plugin `configureServer` com `res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')` e `res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')`. — [README oficial de `sqlite-wasm`](https://raw.githubusercontent.com/sqlite/sqlite-wasm/main/README.md), [demo OPFS `vite.config.ts`](https://raw.githubusercontent.com/sqlite/sqlite-wasm/main/demos/opfs-demo/vite.config.ts), [demo SAHPool `vite.config.ts`](https://raw.githubusercontent.com/sqlite/sqlite-wasm/main/demos/sahpool-demo/vite.config.ts)
- Vite expõe `server.headers` para responses do dev server e `preview.headers` para o preview server; ambos aceitam `OutgoingHttpHeaders`. — [Vite Server Options](https://vite.dev/config/server-options.html#server-headers), [Vite Preview Options](https://vite.dev/config/preview-options.html#preview-headers)
- Build Vite gera assets estáticos; quem define headers em produção é o host. Cloudflare Pages usa arquivo `_headers` no diretório de assets (normalmente `public/`) e copia para o output; headers não se aplicam a responses geradas por Pages Functions/SSR. — [Cloudflare Pages: Headers](https://developers.cloudflare.com/pages/configuration/headers/)
- Alternativa `sql.js@1.17.0`: SQLite compilado via Emscripten para WASM, roda totalmente no browser, mas usa banco virtual em memória e não persiste mudanças; permite importar arquivo SQLite e exportar banco como typed array. MIT. — [registry npm `sql.js/latest`](https://registry.npmjs.org/sql.js/latest), [README oficial de `sql.js`](https://raw.githubusercontent.com/sql-js/sql.js/master/README.md)
- Alternativa `wa-sqlite@1.0.0`: WASM de SQLite com VFS escritas em JavaScript (IndexedDB, OPFS etc.) e builds sync/async via Asyncify/JSPI; exemplos de VFS são descritos como prova de conceito e a tabela de comparação é mantida no repositório. MIT desde 2023-02-10. — [registry npm `wa-sqlite/latest`](https://registry.npmjs.org/wa-sqlite/latest), [README oficial de `wa-sqlite`](https://raw.githubusercontent.com/rhashimoto/wa-sqlite/master/README.md), [comparação de VFS](https://github.com/rhashimoto/wa-sqlite/tree/master/src/examples#vfs-comparison)

### Inferences
- Para o MVP com uma aba, recomendação prática: `opfs-sahpool`, habilitado explicitamente no Worker com `await sqlite3.installOpfsSAHPoolVfs()` e `new poolUtil.OpfsSAHPoolDb('/mvp.sqlite3')`; caminho deve ser absoluto. Isso evita dependência de COOP/COEP e resolve o caso "um escritor" do protótipo.
- Mesmo usando `opfs-sahpool`, configure headers em dev/preview desde o início para poder trocar para `opfs`/`opfs-wl` sem mudar o servidor:

```ts
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  server: { headers },
  preview: { headers },
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
});
```

- Para Cloudflare Pages, escrever `public/_headers`:

```txt
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

- `sql.js` serve apenas se o protótipo aceitar serializar `db.export()` para storage própria; `wa-sqlite` só se for necessário um VFS customizado. Para um MVP de validação, ambos adicionam trabalho sem necessidade imediata.
- Não usar `kvvfs` para o jogo: 5 MB e main-thread-only são limites duros para um dicionário com progresso.

### Gaps
- A lista de browsers da doc SQLite é de julho de 2023; testar Chromium, Firefox e Safari reais antes de prometer suporte.
- Não executei `npm install`, `npm run dev`, `npm run build` nem teste de reload nesta rodada; as recomendações vêm de docs/metadados, não de execução local.
- O pacote npm `wa-sqlite@1.0.0` aparenta defasado em relação ao master do GitHub; não usei o GitHub master como versão fixada.

## 2. `ts-fsrs`: versão atual, Node mínimo e uso mínimo FSRS-7 no browser

### Takeaway
Use `ts-fsrs@6.0.1` com FSRS-7 via `DefaultScheduler()` (caminho rápido) ou `defineScheduler({ model: FSRS7Model, chrono: dateChrono })` (controle explícito). `preview()` não aplica a revisão; `review()` devolve novo cartão e revlog, que devem ser persistidos juntos. A versão da biblioteca e a versão do modelo FSRS são independentes.

### Cited Findings
- Versão atual publicada: `6.0.1`; `engines.node: >=24.0.0`; `dist-tags.latest=6.0.1` e `dist-tags.beta=6.0.0-beta.15`. — [registry npm `ts-fsrs/latest`](https://registry.npmjs.org/ts-fsrs/latest), [dist-tags](https://registry.npmjs.org/-/package/ts-fsrs/dist-tags)
- Release `ts-fsrs@6.0.1`: `tag_name=v6.0.1`, publicado em `2026-11-22T12:43:14Z`, `prerelease=false`. — [GitHub Releases API](https://api.github.com/repos/open-spaced-repetition/ts-fsrs/releases?per_page=5)
- README e docs oficiais: `ts-fsrs` v6 requer Node.js `>=24.0.0`; `@open-spaced-repetition/binding` só é necessário separadamente para treinar parâmetros ou converter review logs CSV. — [README oficial](https://raw.githubusercontent.com/open-spaced-repetition/ts-fsrs/main/README.md), [Quick start](https://open-spaced-repetition.github.io/ts-fsrs/guide/quick-start.md)
- `FSRS7Model` é o modelo atual; FSRS-3 a FSRS-6 permanecem disponíveis para históricos antigos. `DefaultScheduler()` usa FSRS-7 por padrão e inclui políticas de retenção, estatísticas, learning steps, maximum interval, monotonic interval e scheduled days; fuzzing é opcional. — [Introdução da doc](https://open-spaced-repetition.github.io/ts-fsrs/guide/index.md), [Quick start](https://open-spaced-repetition.github.io/ts-fsrs/guide/quick-start.md)
- Uso mínimo documentado: `await DefaultScheduler({ version: 'FSRS-7', desiredRetention: 0.9, enableShortTerm: true, learningSteps: ['1m', '10m'], relearningSteps: ['10m'], enableFuzz: false, maximumInterval: 36_500 })`, `scheduler.newCard({ cardId: 'quick-start', now })`, `scheduler.review({ card, grade: Rating.Good, now })`. — [Quick start](https://open-spaced-repetition.github.io/ts-fsrs/guide/quick-start.md)
- `preview({ card, now })` retorna um iterável lazy de `{ grade, card, revlog }` para os quatro grades; selecionar por `candidate.grade`, não por índice de objeto. `review({ card, grade, now })` retorna `{ card, revlog }` e não muta o cartão de entrada. — [Doc completa `llms-full.txt`](https://open-spaced-repetition.github.io/ts-fsrs/llms-full.txt), [README oficial](https://raw.githubusercontent.com/open-spaced-repetition/ts-fsrs/main/README.md)
- FSRS-7 usa 34 pesos e estado com `stability` (componente lenta), `stabilityFast` (componente rápida) e `difficulty`; ambos os valores de estabilidade são medidos em dias. Não reutilizar pesos FSRS-6 nem inventar `stabilityFast = 0.8 * stability` para cartão já aprendido. — [Doc FSRS-7](https://open-spaced-repetition.github.io/ts-fsrs/guide/model/fsrs-7.md), [Guia de migração](https://open-spaced-repetition.github.io/ts-fsrs/guide/migration.md)
- Cartão v6 contém `cardId`, `dueAt`, `lastReviewAt`, `state`, `scheduleStatus`, `scheduledDays`, `learningStep`, `reps`, `lapses` e o memory state; para FSRS-7, `stabilityFast` também. Revlog v6 contém `rating`, `lastReviewAt`, `dueAt` e `reviewTime`; o campo é `reviewTime`, não `reviewAt`. — [Guia de migração](https://open-spaced-repetition.github.io/ts-fsrs/guide/migration.md)
- A migração v6 proíbe APIs legadas em código migrado: `fsrs()`, `FSRS`, `createEmptyCard`, `generatorParameters`, classes/estratégias antigas e tipos legados exportados da raiz. Use `defineScheduler` e entry points explícitos de modelo. — [Guia de migração](https://open-spaced-repetition.github.io/ts-fsrs/guide/migration.md)
- Roadmap v6: release estável planejada para 28/10 junto com Node.js 26 LTS; issue marcada como concluída em 22/10/2026. — [Issue #373: TS-FSRS v6 Roadmap](https://github.com/open-spaced-repetition/ts-fsrs/issues/373)

### Inferences
- Código mínimo para protótipo:

```ts
import { DefaultScheduler, Rating } from 'ts-fsrs';

const now = new Date();
const scheduler = await DefaultScheduler({
  version: 'FSRS-7',
  desiredRetention: 0.9,
  enableShortTerm: true,
  learningSteps: ['1m', '10m'],
  relearningSteps: ['10m'],
  enableFuzz: false,
  maximumInterval: 36_500,
});

const card = scheduler.newCard({ cardId: 'word-sense-1', now });
for (const candidate of scheduler.preview({ card, now })) {
  console.log(candidate.grade, candidate.card.dueAt);
}

const result = scheduler.review({ card, grade: Rating.Good, now });
```

- Persistir `result.card` e `result.revlog`, incluindo `stability`, `stabilityFast`, `difficulty`, `dueAt`, `lastReviewAt`, `state`, `reps`, `lapses` e `reviewTime`. O SQLite local deve ser a fonte da verdade; o scheduler não persiste nada sozinho.
- Não instalar `@open-spaced-repetition/binding` no primeiro protótipo: ele só entra quando houver treino de parâmetros/conversão de CSV.
- Compatibilidade Node: não encontrei declaração oficial de incompatibilidade funcional do `ts-fsrs@6.0.1` com Node 24; Node 24 é justamente o mínimo declarado. Para Node 22, a evidência oficial é apenas "fora do suporte declarado".

### Gaps
- Não executei o código acima com as versões fixadas nesta rodada.
- Não verifiquei versão fixada de `@open-spaced-repetition/binding`; fora do escopo do MVP inicial.

## 3. Vite, Vitest e Node: versões estáveis, mínimos e compatibilidade com `ts-fsrs`

### Takeaway
Fixar Node `24.22.3`, Vite `8.3.8` e Vitest `5.1.1`. Esse conjunto atende simultaneamente a `ts-fsrs@6.0.1` (`>=24`), Vite (`>=22.12`) e Vitest (`^24`). Node 22 não deve ser usado, mesmo que a instalação com npm ainda passe com aviso.

### Cited Findings
- Vite: `8.3.8`; `engines.node: ^20.19.0 || >=22.12.0`; registry com provenance. — [registry npm `vite/latest`](https://registry.npmjs.org/vite/latest)
- Vitest: `5.1.1`; `engines.node: ^22.12.0 || ^24.0.0 || >=26.0.0`; registry com provenance. — [registry npm `vitest/latest`](https://registry.npmjs.org/vitest/latest)
- Docs Vite exibem `v8.3.7` no cabeçalho do site no momento da consulta, enquanto o registry aponta `8.3.8` como `latest`; tratar como defasagem de docs e fixar a versão do registry. — [Vite Server Options](https://vite.dev/config/server-options.html), [registry npm `vite/latest`](https://registry.npmjs.org/vite/latest)
- Node releases (24/11/2026): v26 "Lithium" é LTS e é a versão LTS mais recente (`26.13.1` no rodapé); v24 "Krypton" está como LTS; v22 "Jod" está como LTS; v20 e v25 estão EOL. A página recomenda produção apenas em Active LTS ou Maintenance LTS. — [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- Último tarball da linha v24 listado no diretório oficial: `node-v24.22.3-*`, datado de 11/11/2026. — [Node.js dist latest-v24.x](https://nodejs.org/dist/latest-v24.x/)
- `engines` em `package.json` é advisory: por padrão gera warnings. `engine-strict` tem default `false` e, quando `true`, npm recusa instalar pacote incompatível com a versão atual de Node (com `--force` como escape). — [npm docs: `package.json#engines`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#engines), [npm docs: `engine-strict`](https://docs.npmjs.com/cli/v11/using-npm/config#engine-strict)

### Inferences
- Pacote fixado recomendado para o protótipo:

| Item | Versão fixada |
| --- | --- |
| Node.js | `24.22.3` |
| `@sqlite.org/sqlite-wasm` | `3.54.1-build1` |
| `ts-fsrs` | `6.0.1` |
| `vite` | `8.3.8` |
| `vitest` | `5.1.1` |
| `sql.js` (alternativa) | `1.17.0` |
| `wa-sqlite` (alternativa) | `1.0.0` |

- Se a equipe padronizar a LTS mais recente, Node `26.13.1` também satisfaz todos os `engines` acima; a recomendação `24.22.3` é a menor linha LTS compatível com `ts-fsrs@6`.
- Node 22 atende Vite e Vitest, mas não `ts-fsrs@6.0.1`. Com npm padrão isso deve virar aviso, não erro; com `engine-strict=true`, erro. Não usar Node 22 no protótipo.

### Gaps
- "Incompatibilidade conhecida" foi interpretada como declaração oficial de suporte/engines; não há nota oficial dizendo que `ts-fsrs@6` quebra funcionalmente em Node 22.
- Versão de TypeScript não foi pesquisada nesta rodada; fixar no lockdown real do projeto quando o scaffold for criado.

## 4. Riscos práticos e ordem de validação do protótipo de 30 minutos

### Takeaway
Ordem recomendada: Node/deps → headers em dev/preview → Worker SQLite → persistência após reload → FSRS-7 smoke → build/preview do host. Se qualquer etapa falhar, troque `opfs` por `opfs-sahpool` antes de mexer no scheduler.

### Cited Findings
- Riscos SQLite: OPFS apenas em Worker; `opfs` exige headers e SharedArrayBuffer; `opfs-sahpool` não suporta conexões simultâneas; o locking OPFS pode gerar `SQLITE_BUSY` ou I/O error; incógnito pode eliminar persistência; Safari <17 tem bug sem workaround no VFS `opfs`. — [SQLite WASM: Persistent Storage Options](https://sqlite.org/wasm/doc/trunk/persistence.md)
- Risco de cross-origin isolation: `window.crossOriginIsolated` só é `true` se `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp|credentialless` estiverem presentes e Permissions-Policy não bloquear; sem isso, `SharedArrayBuffer` não fica disponível com menos restrições. — [MDN: `Window.crossOriginIsolated`](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated)
- Risco de produção: `_headers` do Cloudflare Pages cobre apenas assets estáticos; Pages Functions/SSR precisam emitir headers no código da Response. — [Cloudflare Pages: Headers](https://developers.cloudflare.com/pages/configuration/headers/)

### Inferences
Ordem concreta de validação:

1. Verificar `node -v` = `v24.22.3`; instalar exatamente `@sqlite.org/sqlite-wasm@3.54.1-build1`, `ts-fsrs@6.0.1`, `vite@8.3.8`, `vitest@5.1.1`.
2. Subir Vite com a config de `server.headers` e `preview.headers` acima; checar `window.crossOriginIsolated === true` na página e no Worker.
3. Em `worker.ts`, importar `@sqlite.org/sqlite-wasm`, chamar `sqlite3InitModule()`, abrir banco OPFS, criar tabela, inserir linha, selecionar linha.
4. Recarregar a página e repetir o `SELECT`; sem reload persistente, parar e corrigir storage antes de seguir.
5. Se houver erro de headers/lock ou browser alvo não suportado, trocar para `installOpfsSAHPoolVfs()` + `OpfsSAHPoolDb('/mvp.sqlite3')` e repetir o reload.
6. Em paralelo curto, validar `DefaultScheduler` FSRS-7: `newCard` → `preview()` com quatro candidatos → `review()` com `Rating.Good` → gravar card+revlog no SQLite → reload → próxima revisão continua coerente.
7. Rodar `npm run build && npm run preview`, confirmar os mesmos headers e conferir o `_headers` do host antes de considerar o MVP pronto.

### Gaps
- Não validei o tempo real dessa sequência em 30 minutos nem a execução em Android WebView/screensaver; isso é plano, não resultado.


## Validação local (25/11/2026)

- Check `'opfs' in sqlite3` do README **não funciona** em `@sqlite.org/sqlite-wasm@3.54.1-build1`: o módulo expõe `oo1.OpfsDb`, `oo1.OpfsWlDb` e `installOpfsSAHPoolVfs`, mas não a chave `opfs`. Usar `'OpfsDb' in sqlite3.oo1`.
- Com `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp`, `window.crossOriginIsolated` foi `true` no Chrome headless e `OpfsDb` persistiu uma linha entre duas navegações.
- `ts-fsrs@6.0.1` com `DefaultScheduler({ version: 'FSRS-7', ... })` rodou no browser: `preview()` devolve as quatro notas `[1,2,3,4]` e `review()` devolve card com `stability`, `stabilityFast`, `difficulty` e `reps`.
- Node 24.22.3, Vite 8.3.8, Vitest 5.1.1, TypeScript 7.0.2 e `@types/node` 24.19.2 instalados e com build/test passando.
