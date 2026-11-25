# Pesquisa: repositórios de recursos/ferramentas de inglês para jogo idle

**Data da pesquisa:** 2026-11-24  
**Escopo:** 9 repositórios GitHub indicados pelo usuário.  
**Método:** leitura de READMEs/páginas dos repositórios via GitHub, consulta à API do GitHub para `cuixueshe/earthworm`, e consulta aos sites oficiais de Handy (`handy.computer`) e páginas de documentação/resultados de busca para confirmar funcionalidades.  
**Limitação:** metadados como “último commit” nem sempre aparecem completos no HTML do GitHub; quando usei API/busca, indiquei. Não inventei dados ausentes.

## Resumo executivo

| Repositório | Tipo | Conteúdo reutilizável? | Valor para jogo idle de inglês | Manutenção/licença (fatos observados) |
|---|---|---|---:|---|
| `hehonghui/awesome-english-ebooks` | Curadoria + arquivos de revistas/ebooks | Baixo para app; conteúdo textual existe, mas com risco legal/licença editorial | Baixo | 39.8k★, 3.3k forks, 313 commits, atualização “semanal” declarada; licença não visível no README. |
| `shelfom/free-english-learning-tools` | Coleção de ferramentas web educacionais (sites próprios) | Médio/Alto para inspiração e alguns datasets/formatos; código MIT, conteúdo CC BY-NC 4.0 | Médio | 55★, 3 forks, 7 commits; licença MIT (código) e CC BY-NC 4.0 (conteúdo original). |
| `GengDavid/Useful-websites-for-English-learners` | Lista curada de links | Baixo | Baixo | 24★, 4 forks, 11 commits; licença não visível. |
| `HappyHackingSpace/english-learning-resources` | Lista curada de links | Baixo | Baixo | 17★, 10 forks, 18 commits; licença não visível. |
| `mathiasfc/learning-english` | App web/PWA simples | Médio (código/referência de UI/áudio) | Médio-baixo | 29★, 14 forks, 107 commits, MIT; deploy em Vercel. |
| `cuixueshe/earthworm` | Aplicação web open-source completa (curso por frases) | Alto (arquitetura, modelo de conteúdo, mecânicas) | Alto como referência | 11.3k★, 1.4k forks, AGPL-3.0; API GitHub: criado 2024-01-11, pushed_at 2024-11-14, updated_at 2026-10-05. |
| `interaminense/learning-english` | Lista curada de links | Baixo | Baixo | 835★, 101 forks, 68 commits; licença não visível. |
| `jhonndabi/english-learning-tools` | Lista curada de ferramentas/links | Baixo | Baixo | 75★, 11 forks, 15 commits; GPL-3.0. |
| `cjpais/Handy` | App desktop de speech-to-text offline | Médio (inspiração de UX de voz/offline), não é dicionário | Médio para recurso de voz; baixo para dicionário/tradução nativa | 40.1k★, 3.8k forks, 969 commits, MIT; projeto ativo. |

## Análise por repositório

### 1) `hehonghui/awesome-english-ebooks`
- **URL:** https://github.com/hehonghui/awesome-english-ebooks
- **Propósito (fato):** distribuir/organizar downloads de revistas em inglês como *The Economist*, *New Yorker*, *The Atlantic*, *Wired*, em formatos `epub`, `mobi`, `pdf`, com atualização semanal declarada. O README também promove apps de leitura/idiomas. Fonte: [README do repo](https://github.com/hehonghui/awesome-english-ebooks).
- **Tipo de conteúdo (fato):** curadoria + arquivos/links organizados por diretórios (`01_economist`, `02_new_yorker`, `04_atlantic`, `05_wired`). Não é uma API nem dataset estruturado de vocabulário/gramática.
- **Estrutura (fato observado):** diretórios por publicação, README em chinês/inglês, arquivos auxiliares como `.gitignore`, `calibre_img.css`.
- **Licença (fato):** licença não visível no trecho/metadata do README capturado; não afirmar MIT/CC sem verificação adicional.
- **Tamanho/popularidade (fato):** ~39.8k stars, ~3.3k forks, 874 watching, 313 commits. Fonte: [página do repo](https://github.com/hehonghui/awesome-english-ebooks).
- **Manutenção (fato declarado/observado):** README diz “每周更新” (atualização semanal); há histórico de commits, mas a data exata do último commit não foi extraída com precisão pelo HTML. **Inferência cautelosa:** parece ativo pelo volume e promessa de atualização, mas confirmar pelo histórico de commits antes de depender.
- **Utilidade para jogo idle (opinião fundamentada):** **baixo valor direto**. Pode servir como fonte de leitura opcional externa, mas não oferece dados estruturados para mecânicas de jogo (vocabulário, quests, SRS, frases). Além disso, revistas possuem direitos autorais; integrar conteúdo desses arquivos em jogo exigiria avaliação legal.

### 2) `shelfom/free-english-learning-tools`
- **URL:** https://github.com/shelfom/free-english-learning-tools
- **Site:** https://shelfom.github.io/free-english-learning-tools/
- **Propósito (fato):** catálogo de 11 sites gratuitos para IELTS, Cambridge KET/PET/FCE e vocabulário acadêmico (AWL). Sem cadastro, funciona em celular, open source. Fonte: [README](https://github.com/shelfom/free-english-learning-tools).
- **Tipo de conteúdo (fato):** hub/landing page com links para ferramentas web interativas próprias (paráfrase de listening/reading, correção de frases, tradução reversa, writing band 6->8, speaking mock, writing, flashcards Cambridge, AWL 570). É mais que lista de links externos: aponta para aplicações/sites com exercícios.
- **Estrutura (fato observado):** `assets/`, `tools/`, `index.html`, `README.md`, `.nojekyll`, licença. Cada ferramenta também tem repositório/site próprio.
- **Licença (fato):** código MIT; conteúdo original de aprendizagem (ilustrações, gravações, explicações, frases, respostas modelo) sob CC BY-NC 4.0; listas/trechos de terceiros pertencem aos donos. Fonte: [README/licença](https://github.com/shelfom/free-english-learning-tools).
- **Tamanho/popularidade (fato):** 55 stars, 3 forks, 0 watching, 7 commits. Fonte: [página do repo](https://github.com/shelfom/free-english-learning-tools).
- **Manutenção (fato):** pouco movimento no repo hub (7 commits), mas projetos linkados podem ter ciclo próprio; não confirmado.
- **Utilidade para jogo idle (opinião fundamentada):** **médio**. Bom para inspiração de minigames (paráfrase, correção, flashcards, repetição espaçada visual) e para referências de UX educacional. Limitações: foco IELTS/Cambridge; conteúdo original é CC BY-NC 4.0, o que **pode restringir uso comercial** do conteúdo; código MIT ajuda na parte técnica.

### 3) `GengDavid/Useful-websites-for-English-learners`
- **URL:** https://github.com/GengDavid/Useful-websites-for-English-learners
- **Propósito (fato):** lista de sites úteis para aprendizes de inglês. Fonte: [README](https://github.com/GengDavid/Useful-websites-for-English-learners).
- **Tipo de conteúdo (fato):** curadoria simples de links, organizada em categorias como Dictionary, Learning Vocabulary, Community, Diary & journal, Practice.
- **Estrutura (fato observado):** basicamente `README.md`.
- **Licença (fato):** não visível.
- **Tamanho/popularidade (fato):** 24 stars, 4 forks, 1 watching, 11 commits. Fonte: [página do repo](https://github.com/GengDavid/Useful-websites-for-English-learners).
- **Manutenção (fato observado):** pequeno e aparentemente pouco ativo; data precisa não confirmada.
- **Utilidade para jogo idle (opinião fundamentada):** **baixo**. Pode servir apenas como lista de referência humana; não há dados estruturados, API ou conteúdo embutível.

### 4) `HappyHackingSpace/english-learning-resources`
- **URL:** https://github.com/HappyHackingSpace/english-learning-resources
- **Propósito (fato):** coleção curada de recursos, ferramentas e materiais para aprendizado de inglês. Fonte: [README](https://github.com/HappyHackingSpace/english-learning-resources).
- **Tipo de conteúdo (fato):** lista de links por categorias (dicionários/tradução, pronúncia/fala, leitura, ferramentas de aprendizado).
- **Estrutura (fato observado):** README e arquivos de governança (code of conduct, contributing, security policy) indicados pela página.
- **Licença (fato):** licença não visível na página capturada.
- **Tamanho/popularidade (fato):** 17 stars, 10 forks, 2 watching, 18 commits. Fonte: [página do repo](https://github.com/HappyHackingSpace/english-learning-resources).
- **Manutenção (fato observado):** pequeno; sem sinal forte de atividade recente na captura.
- **Utilidade para jogo idle (opinião fundamentada):** **baixo**. Útil só como mapa de sites externos; não traz dados jogáveis.

### 5) `mathiasfc/learning-english`
- **URL:** https://github.com/mathiasfc/learning-english
- **Demo:** https://learning-english.vercel.app/
- **Propósito (fato):** projeto simples para ajudar estudantes a praticar inglês por estímulos visuais e auditivos. Fonte: [README](https://github.com/mathiasfc/learning-english).
- **Tipo de conteúdo (fato):** aplicação web/PWA, não apenas lista. README cita Web Speech API, dark mode, auto play audio, open source.
- **Estrutura (fato observado):** projeto Next.js/TypeScript com `public/`, `src/`, `package.json`, `tsconfig.json`, lint/prettier, sitemap, licença MIT.
- **Licença (fato):** MIT. Fonte: [README/licença](https://github.com/mathiasfc/learning-english).
- **Tamanho/popularidade (fato):** 29 stars, 14 forks, 1 watching, 107 commits. Fonte: [página do repo](https://github.com/mathiasfc/learning-english).
- **Manutenção (fato observado):** criado há alguns anos; README menciona Hacktoberfest 2022. Não confirmei commits recentes; **inferência cautelosa:** pode estar estável/pouco ativo.
- **Utilidade para jogo idle (opinião fundamentada):** **médio-baixo**. Serve como referência de PWA simples com áudio/pronúncia via Web Speech API e UI leve. Não parece ter grande base de conteúdo, progressão profunda, ou backend de jogo.

### 6) `cuixueshe/earthworm`
- **URL:** https://github.com/cuixueshe/earthworm
- **Site relacionado citado pelo README:** https://julebu.co / https://julebu.ai (produto comercial derivado/evoluído). Fonte: [README](https://github.com/cuixueshe/earthworm).
- **Propósito (fato):** app open-source de aprendizado de inglês por digitação/ditado de frases completas e recordação ativa, estilo "aprender como jogo". O README atual também posiciona Earthworm como origem open-source do produto comercial Julebu.
- **Tipo de conteúdo (fato):** aplicação completa/monorepo, não lista. Inclui apps, packages, scripts, docker-compose, dados de inicialização Logto, banco Postgres/Redis. Possui cursos/pacotes de frases e mecânica de prática.
- **Estrutura (fato observado):** `.github`, `.vscode`, `apps`, `packages`, `scripts`, `assets/logo`, `docker-compose.yml`, `logto_db_init_data.zip`, `pnpm-workspace.yaml`, `tsconfig.json`, `README.md`, `README.zh-CN.md`.
- **Licença (fato):** AGPL-3.0. Fonte: [repo](https://github.com/cuixueshe/earthworm).
- **Tamanho/popularidade (fato):** 11.3k stars, 1.4k forks, 37 watching, 1.062 commits. Fonte: [página do repo](https://github.com/cuixueshe/earthworm).
- **Manutenção (fato via API GitHub):** `created_at: 2024-01-11T03:46:38Z`, `pushed_at: 2024-11-14T23:35:15Z`, `updated_at: 2026-10-05T23:38:50Z`, `open_issues: 11`, `archived: false`. Fonte: [API GitHub](https://api.github.com/repos/cuixueshe/earthworm). **Interpretação cautelosa:** houve atividade/metadata recente no GitHub, mas o último push no código é de 2024-11-14; o README indica foco comercial no Julebu. Tratar como projeto open-source útil, porém não assumir desenvolvimento ativo intenso no repo.
- **O que faz de diferente (fato + opinião):** diferente das listas, é um **produto/app** com mecânica de aprendizado: digitar frases completas, ditado, repetição ativa; o produto comercial relacionado adiciona FSRS, cursos, áudio/vídeo, IA etc. Para um jogo idle, é referência forte de loop de prática, progressão por frases e conteúdo estruturado.
- **Utilidade para jogo idle (opinião fundamentada):** **alto valor como referência**. Não por copiar direto (AGPL exige cuidado forte se incorporar código), mas para estudar mecânicas: sessões curtas, repetição, progressão por unidades/frases, feedback imediato. O modelo de “frases completas” pode virar quests/minigames idle.

### 7) `interaminense/learning-english`
- **URL:** https://github.com/interaminense/learning-english
- **Propósito (fato):** links úteis para aprender inglês pela internet. Fonte: [README](https://github.com/interaminense/learning-english).
- **Tipo de conteúdo (fato):** curadoria de links: blogs/sites, extensões Chrome, cursos, e-books, jogos, podcasts, rádios, tradutores, vídeos.
- **Estrutura (fato observado):** README único.
- **Licença (fato):** não visível.
- **Tamanho/popularidade (fato):** 835 stars, 101 forks, 11 watching, 68 commits. Fonte: [página do repo](https://github.com/interaminense/learning-english).
- **Manutenção (fato observado):** tem alguma tração histórica, mas parece lista madura/estável; atividade recente não confirmada.
- **Utilidade para jogo idle (opinião fundamentada):** **baixo** para integração direta; **baixo-médio** apenas como fonte de ideias de recursos externos.

### 8) `jhonndabi/english-learning-tools`
- **URL:** https://github.com/jhonndabi/english-learning-tools
- **Propósito (fato):** lista curada de ferramentas online para aprender inglês. Fonte: [README](https://github.com/jhonndabi/english-learning-tools).
- **Tipo de conteúdo (fato):** curadoria de links/ferramentas: sites, apps, canais YouTube, add-ons, flashcards, dicionários, podcasts.
- **Estrutura (fato observado):** README, LICENSE, `.github`.
- **Licença (fato):** GPL-3.0. Fonte: [página do repo](https://github.com/jhonndabi/english-learning-tools).
- **Tamanho/popularidade (fato):** 75 stars, 11 forks, 1 watching, 15 commits.
- **Manutenção (fato observado):** pequeno, aparentemente pouco ativo.
- **Utilidade para jogo idle (opinião fundamentada):** **baixo**. Lista de referência, sem dados estruturados.

### 9) `cjpais/Handy`
- **URL:** https://github.com/cjpais/Handy
- **Site oficial:** https://handy.computer
- **Propósito (fato):** aplicação desktop free/open-source/extensível de speech-to-text, totalmente offline. Pressiona atalho, fala, texto é transcrito e colado no campo ativo. Fonte: [README Handy](https://github.com/cjpais/Handy), [site](https://handy.computer).
- **Tipo de conteúdo (fato):** software/app (Tauri/Rust + frontend), não lista de aprendizado. Usa VAD (Silero) e modelos Whisper/Parakeet; roda localmente em Windows/macOS/Linux.
- **Estrutura (fato observado):** `src-tauri/`, `src/`, `docs/`, `scripts/`, `nix/`, `BUILD.md`, `CONTRIBUTING.md`, etc.
- **Licença (fato):** MIT para código; nome/logo/marca não são open-source. Fonte: [README](https://github.com/cjpais/Handy).
- **Tamanho/popularidade (fato):** 40.1k stars, 3.8k forks, 100 watching, 969 commits. Fonte: [página do repo](https://github.com/cjpais/Handy).
- **Manutenção (fato):** muito ativo; releases recentes e documentação/FAQ ativas. Busca web indicou release `v0.10.0` e atividade recente. Fonte: [releases GitHub](https://github.com/cjpais/Handy/releases), [repo](https://github.com/cjpais/Handy).
- **Confirmação sobre “dicionário nativo do dispositivo” (fato):** **não**. Handy é um app de **transcrição de fala para texto** (speech-to-text) offline, usando modelos como Whisper/Parakeet. Não é dicionário, não descreve uso de dicionário nativo do sistema, e não faz tradução. O que ele tem é seleção de modelos de transcrição, histórico, pós-processamento opcional e integração/extensibilidade. Fontes: [README](https://github.com/cjpais/Handy), [FAQ oficial](https://handy.computer/docs/faq), [site](https://handy.computer).
- **Como poderia inspirar “tradução sob demanda” no jogo (opinião):** não como dicionário nativo, mas como referência de UX: atalho rápido, feedback imediato, processamento local/offline, pipeline de áudio->texto, e pós-processamento opcional. Para “tradução sob demanda” em jogo idle, a inspiração útil seria: botão/atalho “ouvir/falar”, capturar fala do jogador, transcrever localmente e então consultar um serviço/dicionário de tradução ou glossário interno do jogo. Isso exigiria componente separado de tradução/dicionário; Handy sozinho não entrega isso.

## Respostas diretas às perguntas-chave

### Quais são apenas curadorias de links/ebooks (baixo valor para o jogo) e quais têm conteúdo estruturado reutilizável (alto valor)?
- **Baixo valor direto (curadoria/lista/arquivos sem API):** `awesome-english-ebooks`, `Useful-websites-for-English-learners`, `english-learning-resources` (HappyHackingSpace), `interaminense/learning-english`, `jhonndabi/english-learning-tools`.
- **Médio valor (apps/ferramentas ou código reutilizável, mas com restrições/foco):** `shelfom/free-english-learning-tools` (ferramentas reais, mas conteúdo CC BY-NC 4.0 e foco exame), `mathiasfc/learning-english` (PWA simples, MIT), `cjpais/Handy` (excelente app, mas domínio speech-to-text, não conteúdo de inglês).
- **Alto valor como referência de produto/mecânica/conteúdo estruturado:** `cuixueshe/earthworm` (app completo, modelo de frases, progressão; atenção à AGPL-3.0 e estado do repo).

### O que earthworm e mathiasfc/learning-english fazem de diferente?
- **`cuixueshe/earthworm` (fato):** é uma aplicação web open-source completa para aprender inglês construindo/digitando frases completas, com backend/frontend, Docker, Postgres, Redis, Logto e dados de curso. O README o descreve como origem open-source do Julebu. É mais próximo de um “curso/app gamificado”. Fonte: [Earthworm README](https://github.com/cuixueshe/earthworm).
- **`mathiasfc/learning-english` (fato):** é um projeto PWA simples com estímulos visuais e auditivos, Web Speech API, dark mode e auto play. É uma app pequena de prática, sem a complexidade de plataforma/curso completo do Earthworm. Fonte: [mathiasfc README](https://github.com/mathiasfc/learning-english).
- **Comparação (opinião):** Earthworm é referência de produto educacional e arquitetura; mathiasfc é referência leve de front/PWA e uso de áudio no navegador.

### Handy: ditado/transcrição? dicionário nativo? inspiração para “tradução sob demanda”?
- **Fato:** Handy é app de speech-to-text offline, cross-platform, que cola texto transcrito no app ativo. Usa Silero VAD e modelos Whisper/Parakeet. Não usa dicionário nativo do dispositivo; não é tradutor. Fontes: [Handy GitHub](https://github.com/cjpais/Handy), [Handy site](https://handy.computer), [Handy FAQ](https://handy.computer/docs/faq).
- **Opinião:** pode inspirar um recurso de entrada por voz no jogo (falar resposta/comando), mas “tradução sob demanda” precisaria de outro componente: dicionário/banco de glossário, API de tradução, ou modelo local de tradução. Handy cobre apenas a etapa áudio→texto.

## Relevância para um jogo idle de aprendizado de inglês

### Vale considerar integrar/reusar (com cautela)
1. **Earthworm (referência de design):** loops de frases, repetição ativa, progressão. **Cautela:** AGPL-3.0; incorporar código exige conformidade forte. Melhor usar como referência de mecânicas.
2. **Shelfom tools (inspiração/exercícios):** formatos de flashcard, paráfrase, correção. **Cautela:** CC BY-NC 4.0 para conteúdo original; verificar licença antes de uso comercial.
3. **Handy (inspiração UX de voz):** push-to-talk, offline, acessibilidade. **Cautela:** não é tradução; licença MIT, mas marca não.

### Provavelmente irrelevantes para integração direta
- **Awesome-english-ebooks:** risco de copyright editorial e baixa estrutura para gameplay.
- **Listas curadas (GengDavid, HappyHackingSpace, interaminense, jhonndabi):** boas para pesquisa manual, não para integração em jogo.

## Fontes

- https://github.com/hehonghui/awesome-english-ebooks
- https://github.com/shelfom/free-english-learning-tools
- https://shelfom.github.io/free-english-learning-tools/
- https://github.com/GengDavid/Useful-websites-for-English-learners
- https://github.com/HappyHackingSpace/english-learning-resources
- https://github.com/mathiasfc/learning-english
- https://learning-english.vercel.app/
- https://github.com/cuixueshe/earthworm
- https://api.github.com/repos/cuixueshe/earthworm
- https://github.com/interaminense/learning-english
- https://github.com/jhonndabi/english-learning-tools
- https://github.com/cjpais/Handy
- https://handy.computer
- https://handy.computer/docs/faq
