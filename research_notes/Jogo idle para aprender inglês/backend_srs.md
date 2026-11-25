# Back-end, repetição espaçada e arquitetura de dados para um jogo idle de inglês

Escopo desta nota: recomendar arquitetura de dados e back-end para vocabulário → gramática → frases → expressões idiomáticas, com progresso do jogador, funcionando offline (taskbar + screensaver Android) e sincronizando depois. Todo fato abaixo traz fonte inline; recomendações de projeto estão separadas em **Inferences**. Pesquisa feita em 24/11/2026.

## 1. Quais algoritmos de SRS usar (SM-2, Anki/FSRS, Leitner) e como integrar FSRS em JS/TS

### Takeaway
Use FSRS como agendador (não SM-2 puro nem Leitner): ele modela memória com estados **R**etrievability, **S**tability e **D**ifficulty, permite escolher retenção-alvo e lida melhor com atrasos. Em JS/TS, use `ts-fsrs` (MIT, suporta FSRS-3 a FSRS-7) e, quando quiser treinar parâmetros próprios, `@open-spaced-repetition/binding`. Leitner serve como baseline simples; SM-2 é legeado, mas ainda é o padrão do Anki em perfis novos.

### Cited Findings
- Anki passou a incluir dois algoritmos na versão 23.10: um derivado de SM-2 e o FSRS. FSRS usa o "Three Component Model of Memory": R = probabilidade de lembrar em um instante, S = dias para R cair de 100% para 90%, D = dificuldade inerente; D e S mudam só após revisão, e os parâmetros são ajustados por machine learning sobre o histórico de revisões. Maior retenção-alvo gera mais revisões; o usuário deve ajustar a retenção, não os parâmetros manualmente. — [Anki Manual: What spaced repetition algorithm does Anki use?](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)
- Diferenças práticas do algoritmo do Anki em relação ao SM-2 clássico: etapas de aprendizagem configuráveis (1 dia/6 dias no SM-2 original), 4 botões em vez de 6, revisões atrasadas aumentam o próximo intervalo, e falhas repetidas na fase de aprendizagem não causam "low interval hell". O FSRS dá intervalos iniciais mais longos que SM-2, mas é mais conservador para cartões maduros; funciona bem com apenas Again/Good; parâmetros devem ser reotimizados cerca de uma vez por mês ou a cada duplicação de revisões; analisar o histórico não exige mais 1000 revisões no Anki 24.06.3+. — [Anki FAQ: FSRS](https://docs.ankiweb.net/faqs/frequently-asked-questions-about-fsrs)
- O FSRS **não** usa tempo de revisão como input de agendamento (apenas intervals e notas); o tempo gasto entra no cálculo de retenção mínima recomendada. — [Anki FAQ: FSRS](https://docs.ankiweb.net/faqs/frequently-asked-questions-about-fsrs)
- A afirmação difundida de que FSRS gera "20–30% menos revisões" que SM-2 vem de simulações antigas; a própria wiki do projeto FSRS passou a alertar: "this figure is based on very old simulation results, take it with a grain of salt". — [Awesome FSRS wiki: ABC of FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS)
- Não existe experimento randomizado publicado comparando FSRS vs SM-2 em estudantes com retenção igualada; o benchmark mede **precisão de previsão**, não workload nem aprendizagem. Análise independente rastreou o número "20–30%" e não encontrou fonte primária; parte da redução observada por usuários vem de escolherem retenção-alvo de 90%, algo que o SM-2 não expõe. — [Yazu: Why FSRS means fewer reviews — and the number that isn't real](https://yazu.app/blog/why-fsrs-means-fewer-reviews/)
- Benchmark oficial: ~727 milhões de revisões de ~10 mil usuários do Anki (dataset `anki-revlogs-10k`); avaliação temporal (`TimeSeriesSplit`), métricas Log Loss (calibração), RMSE(bins) (calibração) e AUC (discriminação); 349.923.850 revisões usadas na avaliação sem same-day reviews. — [open-spaced-repetition/srs-benchmark](https://github.com/open-spaced-repetition/fsrs-benchmark)
- Números do snapshot de julho de 2025 do benchmark (conforme compilação secundária, com ressalvas): FSRS-6 otimizado por usuário Log Loss 0,346 / RMSE 0,065; FSRS-6 com parâmetros padrão 0,366 / 0,093; baseline de probabilidade média 0,395 / 0,103; SM-2 do Anki 0,616 / 0,172; SM-2 original 0,722 / 0,203. A mesma fonte alerta que SM-2 nunca foi desenhado para produzir probabilidades (foram adicionadas fórmulas para comparar) e que o benchmark é mantido pelos criadores do FSRS, não é independente. — [Kastoro: The science behind Kastoro's spaced repetition](https://kastoro.ai/blog/spaced-repetition-fsrs-vs-anki/)
- Leitner: cartões em caixas com intervalos fixos (ex.: 1, 3, 7, 15, 20 dias); acerto sobe de nível, erro volta ao primeiro. Estudo com 47 estudantes de direito randomizados entre Leitner e SM-2 encontrou SM-2 superior na prova teórica (média 38,11 vs 28,00; diferença 10,11%), sem diferença em avaliações práticas baseadas em habilidades; o efeito depende do tipo de tarefa. — [Colbran, Jones & Milburn, 2018, Comparing spaced repetition algorithms for legal digital flashcards](https://doi.org/10.14742/apubs.2018.1923)
- Em estudo da Duolingo (12,9 milhões de instâncias), Leitner era o algoritmo de produção na época; Half-Life Regression reduziu MAE em pelo menos 45% em relação a Leitner (com features lexicais) e aumentou engajamento diário em 12% num experimento operacional. — [Settles & Meeder, A Trainable Spaced Repetition Model for Language Learning](https://research.duolingo.com/papers/settles.acl16.pdf)
- `fsrs.js` (MIT) implementa FSRS em JS, mas seu próprio README recomenda migrar para `ts-fsrs`, mais ativamente mantido. — [open-spaced-repetition/fsrs.js](https://github.com/open-spaced-repetition/fsrs.js/)
- `ts-fsrs` é MIT, suporta ESM/CJS/UMD e FSRS-3 a FSRS-7 (a versão da lib e a versão do modelo são independentes); v6 exige Node.js >= 24; `DefaultScheduler()` usa FSRS-7 por padrão; `preview()` mostra os 4 desfechos (Again/Hard/Good/Easy) sem mutar o cartão, `review()` retorna novo cartão + review log; opções incluem `desiredRetention`, `learningSteps`, `relearningSteps`, `maximumInterval`, `enableFuzz`, policies de leech/estatísticas. O pacote separado `@open-spaced-repetition/binding` faz otimização de parâmetros e conversão de CSV de review logs. — [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs/) e [npm ts-fsrs](https://www.npmjs.com/package/ts-fsrs) e [Quick start](https://open-spaced-repetition.github.io/ts-fsrs/guide/quick-start)
- Existem implementações open source em várias linguagens: `py-fsrs` (Python, v6 + otimizador), `fsrs-rs` (Rust, v6–v7 + otimizador), `binding` (browser/Node/Cloudflare), `go-fsrs`, `dart-fsrs`, `swift-fsrs`, `FSRS-Kotlin`, entre outras. — [awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs)

### Inferences
- **Recomendação:** FSRS-7 via `ts-fsrs` com `desiredRetention` ≈ 0,9 no início (faixa "razoável" citada é 70–97%), `learningSteps` curtos (1m/10m) e `maximumInterval` configurável. Guarde no progresso do jogador: stability, difficulty, estado, reps, lapses, due_at, `fsrs_version`, `params_version`, `desired_retention`. Sempre persista o `review_log` devolvido por `review()`: ele é a evidência para reotimizar parâmetros depois e para auditar o agendamento.
- **Não prometa "20–30% menos revisões"** em material de produto; prometa "retenção-alvo configurável e agendamento calibrado". O número não tem fonte primária e o benchmark mede previsão, não aprendizagem.
- Use **Leitner apenas como fallback/baseline** de baixo custo (ex.: se precisar de algo determinístico e explicável para sprites do screensaver) e meça contra FSRS com os seus próprios dados. Use SM-2 apenas se precisar de compatibilidade com decks legados.
-Para conteúdo Idle, trate cada "card" como um item atômico distinto: `word sense`, `grammar point`, `sentence`, `idiom`. Um mesmo lemma pode ter vários itens com estados SRS independentes; o item é a unidade de revisão, não a palavra.
- **Fixe versões** de `ts-fsrs` e do modelo FSRS no lockfile: o projeto separa versão da lib e versão do modelo, e mudanças no número de parâmetros já aconteceram entre versões do Anki.

### Gaps
- Não encontrei estudo randomizado com pessoas comparando FSRS vs SM-2 em retenção igualada; toda comparação disponível é simulação/benchmark de previsão.
- Não verifiquei qual é a versão exata de FSRS suportada por cada binding em Android nativo/Kotlin no momento da escrita (a lista awesome-fsrs cita `FSRS-Kotlin` v6 e `android-fsrs` v4, sem detalhes de manutenção recente).
- Não há evidência específica sobre qual `desiredRetention` é ideal para sessões passivas de screensaver; 0,9 é o padrão do Anki citado na documentação, não resultado de estudo para este formato.

## 2. Back-end: Supabase, Firebase, PocketBase e local-first (SQLite + CRDT) — qual recomendado e como migrar

### Takeaway
Para um projeto pequeno/inicial com requisito offline rígido em taskbar e screensaver Android, comece **local-first com SQLite no cliente + FSRS no cliente + fila de sincronização (outbox)**, e use um servidor mínimo (PocketBase, com ressalvas) só como backup/sincronização. Migre para Supabase/Postgres quando precisar de RLS, consultas relacionais e escala. Evite CRDTs para progresso SRS: eles resolvem coedição, não invariantes nem autoridade de escrita.

### Cited Findings
- Supabase = Postgres (relacional, joins, transações ACID, RLS, PostgREST/GraphQL), auto-hospedável por Docker; **não tem cache offline nativo** — exige camada própria ou integrações como PowerSync/Zero/Electric. Firebase/Firestore = banco documental, sem joins nativos, com cache local que permite ler/escrever/ouvir offline em Android/iOS; mudanças conflitantes no mesmo documento usam **last-write-wins**; no web o offline vem desligado por padrão. — [Supabase: Supabase vs Firebase](https://supabase.com/alternatives/supabase-vs-firebase) e [Unico Connect: Supabase vs Firebase in 2026](https://unicoconnect.com/blogs/supabase-vs-firebase)
- Firestore tem persistência offline ligada por padrão em Android/Apple e resolve conflitos por last-write-wins; Supabase não tem cache embutido; sua página de parceiros lista PowerSync como camada Postgres→SQLite para apps local-first. Firebase não é auto-hospedável; Supabase é. — [AnyPoss: Best Mobile App Backend](https://anyposs.com/blog/best-backends-and-databases-for-vibe-coded-mobile-apps/) e [Unico Connect](https://unicoconnect.com/blogs/supabase-vs-firebase)
- PocketBase é um único binário Go (~12 MB) com SQLite embutido, API realtime via SSE, auth/OAuth2, storage local ou S3 e dashboard. **Não tem offline sync built-in**: clients precisam de storage local + camada de sincronização própria. O README avisa que compatibilidade total não é garantida antes da v1.0.0 e o FAQ diz que escala verticalmente em servidor único. — [SSD Nodes: Firebase alternatives you can self-host](https://www.ssdnodes.com/learn/self-hosted-firebase-alternatives) e [Archon: Supabase vs Firebase vs Appwrite vs PocketBase](https://archon.ayushjadaun.com/comparisons/supabase-vs-firebase)
- Nenhum dos quatro (Supabase, PocketBase, Appwrite, Firebase-Exceto Firestore SDK) oferece o mesmo offline sync nativo do Firestore; para Supabase/PocketBase é necessário implementar storage local + sync. — [SSD Nodes](https://www.ssdnodes.com/learn/self-hosted-firebase-alternatives)
- Electric faz **apenas read-path sync**: sincroniza subconjuntos ("Shapes") de Postgres para SQLite local via HTTP; "Electric does not do write-path sync" — escrita, autorização e resolução de conflitos ficam com a aplicação. A doc define Shapes como tabela raiz + filtro `where` + projeção de colunas; o plugin Electric para PGlite é alpha e não sincroniza writes locais. — [Electric docs: Alternatives](https://electric.ax/docs/sync/reference/alternatives) e [análise detalhada dos docs](https://stribog.com/blog/electricsql-powersync-automerge-local-first-sync-engine-sovereign)
- PowerSync mantém SQLite local no cliente e fila de uploads (`uploadData()`) para o backend do próprio usuário; Zero é server-authoritative e não aceita escritas offline. — [MechCrate: Local-First Sync Engines and CRDTs in Practice](https://mechcrate.dev/docs/corpus/architecture/local-first-sync-engines-crdts-in-practice/)
- A doc do Loro lista casos em que CRDT é a ferramenta errada: invariantes rígidos (saldo não negativo), posse exclusiva, unicidade, autorização que precisa ser aplicada no momento da escrita e integridade referencial; recomenda autoridade transacional/consenso/híbrido nesses casos. CRDTs "merge, não rejeitam". — [MechCrate](https://mechcrate.dev/docs/corpus/architecture/local-first-sync-engines-crdts-in-practice/)
- Automerge (MIT, núcleo em Rust) mantém histórico completo ("never deletes anything"); Loro (MIT, 1.0 com encoding estável desde 2024-10-23) oferece snapshots rasos e text/t rich; a comparação empírica de 6 engines (Zero, PowerSync, ElectricSQL, Yjs, Automerge, ShareDB) concluiu que nenhuma satisfaz todos os "Seven Ideals" local-first: engines relacionais são fortes para dados estruturados e fracos em edições concorrentes complexas; CRDTs são fortes em colaboração, com curva de aprendizado, memória e depuração mais difíceis. — [MechCrate](https://mechcrate.dev/docs/corpus/architecture/local-first-sync-engines-crdts-in-practice/) e [Shiferaw, Sync Engine Comparison for Local-First Web Applications](https://trepo.tuni.fi/handle/10024/237992)
- SQLCipher fornece criptografia AES-256 transparente de arquivos SQLite; edição Community tem license BSD-style e exige reproduzir aviso de copyright e texto da licença em local acessível ao usuário ( About/Licenses/README); SQLite em si é domínio público. — [Zetetic: SQLCipher License](https://www.zetetic.net/sqlcipher/license/) e [About SQLCipher](https://www.zetetic.net/sqlcipher/about/)

### Inferences
- **Arquitetura recomendada (Fase 0, ~0–3 meses):** SQLite local é a fonte da verdade no dispositivo (com SQLCipher se houver dados sensíveis ou dispositivos compartilhados; incluir a nota de licença). Todo cálculo FSRS (`ts-fsrs`) roda localmente. Escritas locais geram `event_id` estável (UUID) e entram numa tabela `outbox`. O screensaver Android e o taskbar leem o mesmo banco local; não precisam de rede, exceto para sincronizar. Isso evita pagar o custo de CRDT sem necessidade: há um único escritor por par (usuário, item), então conflito é resolvido por versão e timestamp + dedupe de event_id.
- **Fase 1 (sincronização simples):** PocketBase como binário único (backup, auth opcional, upload de eventos) aceitando eventos idempotentes por `event_id`; ou, se já houver Postgres/RLS, Supabase com a mesma tabela de eventos. Não depender de realtime para progresso: sincronizar em foreground/background ao reconectar.
- **Fase 2 (crescimento):** se o modelo virar consultas relacionais pesadas e multi-usuário, migrar para Supabase/Postgres com projetores server-side; se precisar de replicação contínua Postgres→SQLite, avaliar PowerSync (upload queue embutida) em vez de Electric (somente leitura; você escreve a write-path). CRDT (Loro/Automerge) só se surgir coedição real, ex.: jogo compartilhado entre dispositivos — mas ainda com servidor autoritativo para XP e retenção.
- **Firebase:** escolher apenas se offline SDK nativo + FCM forem decisivos e você aceitar last-write-wins e baixa portabilidade. Para este jogo, o offline do Firestore não elimina a necessidade de SQLite local no taskbar, então não justifica o lock-in.
- **Critério de migração:** manter um contrato de eventos versionado (`schema_version`, `event_type`, payload imutável) e tratar o servidor como *replayer* de eventos → o backend troca de PocketBase para Postgres sem reescrever a lógica de SRS. Guardar `device_id` e `client_seq` para ordenação/dedupe.

### Gaps
- Não encontrei benchmark independente de custo/latência entre PocketBase e Supabase para este caso de uso; as comparações são de features e documentação.
- Não verifiquei o status atual da versão 1.0 do PocketBase em 24/11/2026 (a ressalva "pre-1.0" vem de fontes de 2026, mas sem checagem direta do release).
- Não pesquisei APIs específicas de screensaver Android (Dreams) nem ciclo de vida de taskbar desktop; restrictions de bateria/rede nesses modos precisam de pesquisa separada.

## 3. Modelagem de dados: palavras, progresso, eventos, índices e versionamento de conteúdo

### Takeaway
Separe **conteúdo imutável e reconstruível** de **estado durável do jogador**. Use `item` como unidade atômica (sense/frase/idioma), `user_progress` com carteira SRS por (usuário, item), `gameplay_events` como log append-only com `event_id` para idempotência, e `outbox` para sincronização. Versione conteúdo por pack imutável + checksum e schema por `PRAGMA user_version` com migrações forward-only.

### Cited Findings
- Um padrão documentado de schema SQLite separa claramente o "índice reconstruível" (cache de catálogo, descartável e reescaneável) do "estado durável" (progresso, bookmarks, histórico) — IDs internos do índice nunca devem aparecer na API ou no estado do usuário. O estado durável usa PK composta e `version` monotônica para desempatar `updated_at`; a reconciliação é last-write-wins dentro de uma única transação de escrita; eventos têm `UNIQUE (user_id, event_id)` para dedupe de replay, índice por `(user_id, change_seq)` para paginação, `change_seq` de contador monotonicamente crescente e retenção explícita (ex.: 120 dias) para o log de eventos. — [AudioSilo: Data model](https://docs.audiosilo.app/developers/server/data-model)
- Padrão de índices em schema SQLite real: `CREATE INDEX idx_events_session_id ON events(session_id)`, `UNIQUE (session_id, batch_id)` para idempotência de entrega, `idx_sessions_started_at ON (started_at DESC)`, FK com `ON DELETE CASCADE`; coluna `duration_ms` gerada para não ser escrita diretamente. — [TinyReplay: SQLite Schema](https://tinyreplay.hane.studio/docs/architecture/sqlite-schema)
- Migrações devem usar `PRAGMA user_version` como contador monotônico no header do banco, atualizado atomicamente dentro de transação; **nunca escrever migrações que pulam versões** (1→2→3→4), aplicar cada passo sequencialmente; migrações são forward-only em dispositivos móveis (não há rollback: corrija com uma migração nova). — [Satheez: From Offline-First to Local-First — Schema Migrations on Distributed SQLite Databases](https://satheez.dev/writing/offline-first-to-local-first-sqlite/)
- A tabela `outbox` é a parte mais crítica de um app local-first: se uma migração altera colunas usadas por mutações pendentes, é preciso migrar também os payloads serializados na `mutation_outbox`, senão o sincronizador quebra ao voltar online; usar padrão de 3 fases (criar tabela nova, copiar com defaults, trocar atomicamente e recriar índices). — [Satheez](https://satheez.dev/writing/offline-first-to-local-first-sqlite/)
- Erros comuns listados em guia de evolução de schema: o mesmo dispositivo pode aplicar a mesma migração mais de uma vez após reconexão parcial; cada migração deve ser transacional; fazer backup antes de migrar no servidor. — [Agentic Developer Cookbook: Schema evolution and migrations](https://agenticdevelopercookbook.com/guidelines/implementing/data/schema-evolution)

### Inferences
Esquema mínimo proposto (derivado dos padrões citados; é desenho, não fato externo):

```sql
-- Conteúdo: reconstruível, versionado, nunca apontado por FK do estado do jogador
CREATE TABLE content_pack (
  version       TEXT PRIMARY KEY,      -- ex.: "2026.11.1"
  checksum      TEXT NOT NULL,
  source_notice TEXT NOT NULL,
  built_at      INTEGER NOT NULL
);

CREATE TABLE item (
  item_id        TEXT PRIMARY KEY,     -- UUID estável entre versões de conteúdo
  pack_version   TEXT NOT NULL REFERENCES content_pack(version),
  kind           TEXT NOT NULL,        -- word_sense | grammar | sentence | idiom
  lemma          TEXT,                 -- para word_sense
  pos            TEXT,
  sense_index    INTEGER,
  freq_band      INTEGER,              -- faixa de frequência (ex.: COCA/BNC)
  cefr           TEXT,
  definition_en  TEXT,
  translation_ptbr TEXT,
  example_id     TEXT REFERENCES item(item_id),
  audio_ref      TEXT,                 -- arquivo local/URI; não depender de rede
  source_id      TEXT,                 -- wiktionary/tatoeba/... 
  license        TEXT,
  attribution    TEXT,
  is_current     INTEGER NOT NULL DEFAULT 1,
  content_hash   TEXT NOT NULL
);
CREATE INDEX idx_item_lemma ON item(lemma, kind);
CREATE INDEX idx_item_kind_freq ON item(kind, freq_band);
CREATE INDEX idx_item_pack ON item(pack_version);

-- Estado durável do jogador (1 linha por par usuário/item)
CREATE TABLE user_progress (
  user_id       TEXT NOT NULL,
  item_id       TEXT NOT NULL REFERENCES item(item_id),
  fsrs_state    TEXT NOT NULL,         -- new/learning/review/relearning
  stability     REAL NOT NULL DEFAULT 0,
  difficulty    REAL NOT NULL DEFAULT 0,
  due_at        INTEGER NOT NULL,
  last_review_at INTEGER,
  reps          INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  fsrs_version  TEXT NOT NULL,
  params_version TEXT NOT NULL,
  desired_retention REAL NOT NULL,
  version       INTEGER NOT NULL DEFAULT 0,  -- desempata updated_at
  updated_at    INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX idx_progress_due ON user_progress(user_id, due_at);   -- fila de revisões
CREATE INDEX idx_progress_sync ON user_progress(user_id, updated_at);

CREATE TABLE user_stats (
  user_id TEXT NOT NULL,
  day     TEXT NOT NULL,               -- YYYY-MM-DD (timezone do usuário)
  xp      INTEGER NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Log append-only; fonte para métricas, auditoria e re-treinamento FSRS
CREATE TABLE gameplay_event (
  event_id      TEXT PRIMARY KEY,      -- UUID gerado no cliente => idempotência
  user_id       TEXT NOT NULL,
  item_id       TEXT,
  kind          TEXT NOT NULL,         -- review | exposure | answer | xp_award | sync
  grade         TEXT,                  -- Again/Hard/Good/Easy
  elapsed_ms    INTEGER,
  occurred_at   INTEGER NOT NULL,      -- relógio do dispositivo
  received_at   INTEGER,
  pack_version  TEXT,
  schema_version INTEGER NOT NULL,
  device_id     TEXT,
  client_seq    INTEGER,
  payload_json  TEXT
);
CREATE INDEX idx_event_user_time ON gameplay_event(user_id, occurred_at DESC);
CREATE INDEX idx_event_kind_time ON gameplay_event(kind, occurred_at);

-- Fila de sincronização local
CREATE TABLE outbox (
  event_id TEXT PRIMARY KEY REFERENCES gameplay_event(event_id),
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER
);
CREATE INDEX idx_outbox_pending ON outbox(synced_at, created_at);
```

- **Por que `item_id` estável + `content_hash`:** revisões passam por várias versões do pack sem perder SRS; quando o conteúdo muda, você cria uma nova revisão do item (novo `content_hash`, mesmo `item_id`) e decide explicitamente se o progresso é mantido (definição equivalente) ou reiniciado (tradução/exemplo trocado). `is_current` evita que o agendador veja duplicatas.
- **Índices quentes:** a fila de "o que revisar agora" é `(user_id, due_at)`; dedupe de replay é `event_id`; sincronização incremental é `(user_id, updated_at)` e `idx_outbox_pending`. Índices por `lemma` e `kind/freq_band` servem à seleção de novo conteúdo por frequência.
- **Versionamento em duas camadas:** (1) `content_pack.version` (semver-like + checksum + notices de licença) para o corpus; (2) `PRAGMA user_version` + migrações 1→2→3 para o schema local. Nunca editar migração já publicada — adicionar nova. Ao alterar colunas que o outbox usa, migrar também os payloads pendentes.
- **Estratégia de sync:** eventos são a fonte; `user_progress` é projeção local. No servidor, reprocessar eventos com `event_id` único; `version`/`client_seq` desempatam gravações concorrentes do mesmo item. Isso evita depender de CRDT para invariantes de XP e retenção.

### Gaps
- Não encontrei documentação canônica (SQLite/Postgres) com um "schema oficial" para SRS; o DDL acima é síntese de padrões de terceiros citados, não uma referência normativa.
- Não validei o custo de índices em dispositivos Android de baixo desempenho com milhões de eventos; pode ser necessário particionar/prunar `gameplay_event` por retenção (ex.: manter agregados diários + eventos recentes).

## 4. De onde obter definições, traduções pt-BR, áudio (TTS) e exemplos, com licença adequada

### Takeaway
Use Wiktionary via `kaikki.org`/wiktextract (CC BY-SA 4.0 + GFDL) para definições/pos/frequência/IPA, Tatoeba (CC BY 2.0 FR; parte CC0) para frases pareadas, Wikidata structured data (CC0) para metadados, e synthase local (Web Speech API / Android TTS) para áudio offline. **Atenção:** ECDICT é MIT, mas é inglês→chinês — não serve como fonte de tradução pt-BR; é útil só para frequência/marcadores de exame.

### Cited Findings
- Wiktionary: textos das entradas sob CC BY-SA 4.0 e GFDL (dual license); derivados precisam manter atribuição e compartilhar sob licença compatível; entries podem incluir material de terceiros com termos distintos (ex.: citações sob fair use), que exigem verificação separada. — [Wiktionary: Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)
- Dados Wiktionary em formato legível por máquina são disponibilizados por kaikki.org (wiktextract): definitions, POS, formas, pronúncia, traduções por sentido e exemplos; projetos que os usam publicam notice CC BY-SA 4.0 e distribuem o dataset compilado sob a mesma licença. — [Krumeto: Sources](https://krumeto.com/sources) e [TurkishDictionary: Dictionary Data Sources & Licences](https://turkishdictionary.co.uk/about/sources)
- Wikidata: todo dado estruturado (namespaces principal, Property, Lexeme, EntitySchema) é CC0 / domínio público; texto em outros namespaces é CC BY-SA 4.0. — [Wikidata:Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)
- ECDICT (skywind3000) é MIT e contém ~770 mil entradas com definições em inglês e chinês, marcadores de exames (CET, IELTS, TOEFL), estrelas Collins, Oxford 3000 e frequências BNC/COCA, além de formas flexionadas (`exchange`). Útil para frequência, **não para pt-BR**. — [Open Source Offline Dictionaries](https://wiloon.com/open-source-dictionaries/) e [Yanko: Open Source Licenses](https://yanko.qqatt.com/licenses)
- Tatoeba: frases sob CC BY 2.0 FR (parte CC0 1.0); arquivos de download incluem ID, lang e texto; arquivo de áudio traz ID, usuário, licença e URL de atribuição — se o campo de licença estiver vazio, **não reutilizar** o áudio fora do Tatoeba. A licença do áudio é escolhida por contribuidor e pode diferir da licença da frase. — [Tatoeba: Download sentences](https://tatoeba.org/en/downloads) e [Using the Tatoeba Corpus](https://en.wiki.tatoeba.org/articles/show/using-the-tatoeba-corpus)
- Pronúncia humana: Wikimedia Commons/Lingua Libre traz gravações sob CC0, CC BY ou CC BY-SA, com autor/licença por arquivo; alguns projetos as reproduzem diretamente do Commons, sem copiar para seu servidor. — [TurkishDictionary: sources](https://turkishdictionary.co.uk/about/sources) e [16Word: Audio Credits](https://www.16word.com/credits)
- Web Speech API (`speechSynthesis` + `SpeechSynthesisUtterance`): usa o sintetizador do dispositivo, é gratuito e funciona offline com voices instaladas; `getVoices()` expõe flag `localService` para filtrar voices locais; não é possível gravar/baixar o áudio produzido — a página recebe só eventos, nunca samples. Vozes e qualidade variam por OS/browser; em Chrome `getVoices()` pode vir vazio na primeira chamada e disparar `voiceschanged`. Android Chrome tem conhecidas inconsistências na lista de voices/idiomas. — [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) e [Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) e [Micdrop: TTS in JavaScript](https://micdrop.dev/blog/text-to-speech-javascript) e [Readium: speechSynthesis in browsers and OSes](https://readium.org/speech/docs/WebSpeech.html)
- Android `TextToSpeech`: sintetiza para playback imediato **ou para criar arquivo de som**; exige `OnInitListener`; apps targeting Android 11 precisam declarar `TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE` no bloco `<queries>` do manifest. Voices locais podem ser verificadas por flag do engine (`isNetworkConnectionRequired`) em APIs nativas; no web não há como provar localidade. — [Android Developers: TextToSpeech](https://developer.android.com/reference/android/speech/tts/TextToSpeech) e [IndeRun: voices and privacy](https://inderun.dev/docs/guides/speech)
- Modelos TTS locais citados como alternativa: `kokoro-js` (Kokoro via Transformers.js, WebGPU/WASM, ~92 MB de download); modelo Kokoro-82M sob Apache 2.0 com `kokoro-onnx` MIT; `phonon-tts` (Rust→WASM, modelo inglês 65 MB, Apache 2.0, 102 vozes); Piper via builds comunitários (`piper-tts-web`) sobre onnxruntime-web. São modelos grandes na primeira visita, após isso ficam em cache e funcionam offline. — [Micdrop](https://micdrop.dev/blog/text-to-speech-javascript) e [Lingaku: Acknowledgements](https://lingaku.com/eng/acknowledgements)

### Inferences
- **Pipeline sugerido:** (1) importar Wiktionary via kaikki.org → tabela `item` (lemma, POS, definition_en, IPA, exemplo, traduções da seção Portuguese); (2) enriquecer com Tatoeba pareadas `en ↔ pt-BR` para frases e idiomas; (3) marcar frequência com BNC/COCA do ECDICT (MIT), descartando as definições chinesas; (4) gerar áudio com TTS local e guardar `audio_ref` + `voice_provider` + `license`; (5) gravar por item `source_id`, `license`, `attribution`, `content_hash`.
- Para pt-BR, a opção mais segura juridicamente é **curadoria própria das traduções da Wiktionary** (CC BY-SA 4.0, com notice e share-alike do dataset compilado) ou tradução humana própria. Machine translation de definições é prática comum, mas a licença da tradução derivada segue a do texto-fonte — trate como área de incerteza e mantenha revisão humana para itens de alta frequência.
- Use TTS do dispositivo (flag `localService` / `isNetworkConnectionRequired == false`) para o funcionamento offline imediato; só pré-gere arquivos de áudio se precisar de voz consistente entre plataformas — nesse caso, escolha um modelo com licença explícita (ex.: Apache 2.0) e armazene a licença no pack de conteúdo.
- Nunca copie áudio do Tatoeba sem conferir licença por arquivo; campo vazio = não reutilizar.

### Gaps
- Não encontrei um dataset open-source grande e confiável de **definições inglês→pt-BR** com licença clara; ECDICT resolve inglês→chinês e o Wiktionary tem cobertura irregular de tradução para português em termos técnicos.
- Não verifiquei se as traduções pt-BR da Wiktionary via kaikki.org vêm estruturadas com confiabilidade suficiente para todo o corpus (cobertura/qualidade exigem amostragem).
- Não validei a licença exata dos pesos de todos os modelos TTS citados (a fonte cita Apache 2.0 para Kokoro-82M e phonon; Piper é citado apenas como build comunitário).

## 5. Como medir eficácia pedagógica num jogo idle e evitar "falso aprendizado"

### Takeaway
Meça **recall diferido** e calibração, não exposição/XP. XP e tempo de sessão são sinais de engajamento, não de aprendizagem: correlacionam negativamente com acurácia quando mais conteúdo novo é introduzido. Use testes de retenção em 1/7/30 dias, curvas de calibração da probabilidade prevista pelo FSRS e métricas de esquecimento empírico; apenas recompense recall verificado.

### Cited Findings
- O benchmark SRS mede calibração (Log Loss, RMSE(bins)) e discriminação (AUC): "se o modelo diz 90%, o usuário acerta 90% das vezes?"; prever bem é pré-condição para agendar bem, mas **não** é evidência de aprendizagem superior em trial randomizado. — [srs-benchmark](https://github.com/open-spaced-repetition/fsrs-benchmark) e [Kastoro](https://kastoro.ai/blog/spaced-repetition-fsrs-vs-anki/)
- Em dados Duolingo (~12,9 milhões de sessões, 115 mil learners, 19 mil lexemas), HLR reduziu erro de previsão em 45%+ vs baselines e aumentou engajamento diário em 12%; a métrica de acerto por sessão é a fração de palavras lembradas corretamente nas frases daquela sessão. — [Settles & Meeder, ACL 2016](https://research.duolingo.com/papers/settles.acl16.pdf) e [Revisiting Half-Life Regression, 2026](https://lirias.kuleuven.be/handle/20.500.12942/792006)
- Duolingo usava "strength meters" = probabilidade média de recall de um skill; 4 barras = "golden". A prática targeting escolhe palavras "due" segundo o student model. — [Settles & Meeder](https://research.duolingo.com/papers/settles.acl16.pdf)
- Heurísticas de "mastery" encontradas em literatura: 17 exposições para aprender uma palavra nova (Chen et al.), ou 4 sessões consecutivas com recall correto (Schuetze, citado em trabalho de 2026) — são heurísticas, não verdades universais. — [Chen, Hauff & Houben, Feature Engineering for Second Language Acquisition Modeling](https://aclanthology.org/W18-0543.pdf) e [Revisiting Half-Life Regression, 2026](https://lirias.kuleuven.be/handle/20.500.12942/792006)
- O mesmo estudo de feature engineering definiu métricas: Student-Acc, Exercise-Acc, Word-Acc e Mastered Words; observou **correlação negativa consistente entre acurácia e engajamento** (mais engajamento = mais exposição a vocabulário novo), enquanto maior engajamento levou a mais palavras dominadas. — [Chen et al.](https://aclanthology.org/W18-0543.pdf)
- O algoritmo MEMORIZE (PNAS 2019) usa como qualidade "empirical forgetting rate" = −log(recall empírico)/(intervalo desde a revisão anterior), estimado a partir da última revisão, independente do modelo de memória escolhido; mostrou vantagem sobre schedules uniforme e threshold em dados Duolingo (~5,2 milhões de pares usuário-palavra após filtros). — [Tabibian et al., PNAS 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6410796/)
- Estudo com 48 learners adultos usando Duolingo por ~27 horas encontrou melhorias significantes em todas as habilidades receptivas e produtivas (effect sizes r≈0,55–0,62 em provas; d 0,69–1,11 nas medidas linguísticas) — aponta que apps gamificados podem gerar ganho real, mas não isola o mecanismo. — [Smith, The effectiveness of Duolingo...](https://cdnprodwpv2.avantassessment.com/wp-content/uploads/The-effectiveness-of-Duolingo-in-developing-receptive-and-productive-language-knowledge-and-proficiency.pdf)

### Inferences
- **Painel mínimo de eficácia:** (a) `delayed_recall_1d/7d/30d` por item e por tipo (word/grammar/sentence/idiom), calculado só de revisões agendadas, nunca de exposições passivas; (b) calibração FSRS: comparar R previsto no momento da revisão com acerto real, em bins; (c) `forgetting_rate` empírico; (d) taxa de "falso domínio": itens marcados como mastered que falham em teste diferido em 7/30 dias; (e) engajamento separado (sessões, duração, XP) — **nunca** usar XP como KPI de aprendizagem.
- **Anti-falso-aprendizado no idle:** o screensaver pode exibir passivamente, mas XP/estrelas só são concedidos após uma resposta ativa (mesmo que de 1 toque: "lembra / não lembra" ou escolha de tradução). Exposição passiva entra no log como `kind=exposure` e **não** atualiza SRS nem XP.
- Faça "testes frios" periódicos: sortear itens já considerados maduros e medir recall sem pista; se a calibração estiver torta (previsto 0,9, observado 0,6), reotimizar parâmetros com `@open-spaced-repetition/binding` e/ou ajustar `desiredRetention`.
- Reporte a retenção por coorte de conteúdo (`pack_version`) e por tipo de item: expressões idiomáticas e gramática tendem a precisar de mais contexto do que palavras isoladas — meça separadamente antes de generalizar.
- Cuidado com conclusões fortes: as evidências citadas são de apps de flashcards/duolingo, não de idle games; o desenho do seu jogo pode mudar o resultado.

### Gaps
- Não encontrei estudo sobre eficácia pedagógica de **idle games/screensavers** para vocabulário; toda evidência vem de flashcards e apps gamificados com prática ativa.
- Não há consenso no material consultado sobre número ideal de exposições ou limiar de "mastery" (17 exposições vs 4 sessões corretas são heurísticas distintas).

## 6. Privacidade e conformidade: menores, LGPD/GDPR, telemetry mínima e por que local-first ajuda

### Takeaway
Local-first é uma vantagem estrutural de privacidade: os dados de progresso ficam no dispositivo e o que sai são eventos mínimos e agregados, com consentimento granular. Para menores, LGPD exige consentimento específico e destacado de responsável e não pode condicionar o jogo a dados além do estritamente necessário; GDPR exige minimização por padrão e limitação de finalidade/armazenamento.

### Cited Findings
- LGPD (Lei 13.709/2018) art. 14: dados de crianças e adolescentes devem ser tratados no melhor interesse; consentimento específico e destacado de pelo menos um responsável, com esforços razoáveis de verificação; controladores não podem condicionar participação em jogos/aplicativos online ao fornecimento de dados além do estritamente necessário. O paper que resume a LGPD nota que, pelo ECA brasileiro, criança = até 12 anos e adolescente = 13 a 18 anos, e que a LGPD exige consentimento parental para todas as operações com dados de crianças (com exceções limitadas, ex.: contato com responsável/proteção da criança, uso único e sem armazenamento). — [CIPL, International Issues And Compliance Challenges](https://www.informationpolicycentre.com/wp-content/uploads/2023/10/cipl_childrens_privacy_policy_paper_i_-_international_issues___compliance_challenges__21_oct_2022_.pdf)
- GDPR art. 5(1)(c): dados devem ser "adequados, relevantes e limitados ao necessário" (minimização); art. 25 aplica isso por padrão a cada finalidade; art. 5(1)(b) limita a finalidade e 5(1)(e) limita retenção ao necessário. O ICO's Children's Code recomenda coletar o mínimo para o elemento do serviço que a criança está usando, dar escolhas separadas para elementos opcionais e coletar dados apenas quando a criança está ativa e ciente daquele elemento — sem "bundlar" coleta para personalização no core do serviço. — [ICO: Age Appropriate Design Code — Data minimisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/8-data-minimisation)
- WP29 (opinião sobre apps em dispositivos móveis): consentimento é a base legal principal para apps; deve ser livre, específico e informado — clicar em "instalar" não é consentimento válido para todo tipo de processamento; devs devem ser ainda mais rigorosos com minimização e limitação de finalidade quando o público é infantil, e não processar dados de crianças para publicidade comportamental. — [WP29 opinion on apps on mobile devices (2013)](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2013/wp202_en.pdf)
- Exemplo concreto de EdTech offline: onebillion/onecourse opera sem login pessoal e coleta apenas dados anônimos em nível de tablet (duração da sessão, uso ao longo do tempo, progresso geral não vinculado a criança), com justificativa explícita para cada dado; recusa coletar dados pessoais de crianças onde consentimento padrão não é obtido. — [onebillion: onecourse data policy](https://onebillion.org/onecourse/data-policy/)
- UNICEF Innocenti recomenda que políticas de compras de EdTech exijam governança de dados, proteção de dados, direitos da criança, acessibilidade, capacidade offline e salvaguardas para learners vulneráveis; que "EdTech gratuito" seja examinado quanto a práticas exploratórias de dados. — [UNICEF Innocenti, Data Governance for EdTech (2025)](https://www.unicef.org/innocenti/media/11621/file/UNICEF-Innocenti-Data-Governance-Education-Technology-Policy_Recommendations-2025.pdf)
- Princípios UNESCO: finalidade especificada, proporcionalidade/necessidade e retenção apenas pelo tempo necessário. — [UNESCO: Principles on Personal Data Protection and Privacy](https://www.unesco.org/en/privacy-policy)
- SQLCipher Community (BSD-style) permite uso em software open source ou comercial fechado desde que aviso de copyright, condições e disclaimer sejam reproduzidos em local acessível ao usuário. — [Zetetic: SQLCipher Community](https://www.zetetic.net/sqlcipher/community/)

### Inferences
- **Telemetria mínima proposta:** (1) apenas no opt-in: contadores agregados por dia (`reviews`, `acertos`, `duração`, `pack_version`, `app_version`), sem texto digitado pelo usuário, sem localização, sem identificador de publicidade; (2) o log detalhado de `gameplay_event` fica no dispositivo e só é enviado se o usuário ativar "sincronizar progresso"; (3) `user_id` pode ser um pseudônimo local (UUID aleatório), não e-mail/nome, se não houver login; (4) retenção explícita (ex.: 90–120 dias para eventos brutos, agregados por mais tempo) e política de exclusão simples.
- **Crianças:** se o produto for voltado a menores de 12 no Brasil, assumir consentimento parental específico e destacado antes de qualquer sincronização de dados identificáveis; oferecer modo totalmente offline/sem conta como padrão — isso evita o consentimento e reduz risco. Não condicionar o jogo a coleta extra (ex.: e-mail, push, analytics de terceiros).
- **Local-first ajuda** porque o estado sensível (_progresso, erros, tempo de tela_) permanece no dispositivo e a sincronização pode ser seletiva: o servidor recebe só o necessário para backup/restauração. A criptografia do banco local (SQLCipher) protege dispositivos compartilhados, lembrando de incluir o aviso de licença.
- **Arquitetura de consentimento:** separar finalidades em switches independentes (backup na nuvem / telemetria agregada / personalização), cada um com seu próprio `enabled_at`, `scope` e `revoked_at` no banco local; revogação para de enviar eventos imediatamente.

### Gaps
- Não foi feita revisão jurídica: a interpretação de "melhor interesse", verificação de consentimento parental e idade exacta variam por jurisdição e exigem advogado.
- Não encontrei fonte sobre como a LGPD trata especificamente telemetry de apps educacionais offline no Brasil (ex.: necessidade de DPIA para menores); a orientação acima é inferida dos princípios gerais citados.

## Resumo das recomendações (síntese para o redator)

1. **SRS:** FSRS-7 via `ts-fsrs` (MIT) no cliente; guardar DSR + review logs; retenção-alvo configurável; não repetir o mito dos 20–30%.
2. **Back-end:** SQLite local (opcionalmente SQLCipher) como fonte da verdade + outbox idempotente; PocketBase no início, Supabase/Postgres depois; CRDTs apenas para coedição real, não para progresso.
3. **Dados:** `content_pack` versionado + `item` imutável por revisão + `user_progress` por (user,item) + `gameplay_event` append-only + `outbox`; índices `(user_id,due_at)`, `(user_id,updated_at)`, `UNIQUE(event_id)`, `PRAGMA user_version` com migrações forward-only.
4. **Conteúdo:** Wiktionary/kaikki (CC BY-SA 4.0 + GFDL) + Tatoeba (CC BY 2.0 FR / CC0) + Wikidata (CC0) + frequência ECDICT (MIT) + TTS local; **pt-BR é o principal gap de fonte**.
5. **Pedagogia:** recall diferido, calibração e forgetting rate; XP só por recall ativo; medir separadamente por tipo de item.
6. **Privacidade:** local-first + telemetria agregada opt-in + consentimento granular; menores exigem consentimento parental sob LGPD e minimização por padrão sob GDPR.
