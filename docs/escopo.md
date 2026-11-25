# Escopo do wordpet

Jogo idle de aprendizado de inglês que começa como protótipo web no Linux, vira app de desktop e, depois, proteção de tela no Android. A premissa é que tempo ocioso pode gerar convite para revisar, mas nunca substitui a tentativa ativa de lembrar.

## Decisões fechadas

- Jogador adulto, sem conta e sem telemetria na primeira versão.
- Unidade de conteúdo: `item`; primeiro tipo: `word_sense`; `sentence` e `idiom` vêm depois.
- Primeira entrega: protótipo web com Vite e TypeScript no navegador Linux; Tauri depois.
- SQLite local como fonte da verdade, com o mesmo esquema previsto para o desktop.
- FSRS para agendar revisões, com retenção-alvo 0,9.
- XP somente por recall verificado; exposição passiva não conta.

Os motivos estão nos ADRs: [0001](./adr/0001-sqlite-local.md), [0002](./adr/0002-fsrs.md), [0003](./adr/0003-prototipo-web-primeiro.md), [0004](./adr/0004-word-sense-como-unidade.md), [0005](./adr/0005-xp-so-por-recall.md), [0006](./adr/0006-conteudo-em-ingles-sem-traducao.md), [0008](./adr/0008-english-dictionary-como-fonte-principal.md).

## MVP (fase 0)

- Protótipo web em Vite + TypeScript, aberto no navegador Linux.
- Uma tela: cartão minimalista com a palavra em inglês e um sprite pequeno com poucos estados visuais.
- Interação principal: escolher a palavra em inglês que corresponde a uma definição em inglês, entre alternativas.
- Feedback corretivo imediato: acerto rende XP; erro devolve o item sem punição.
- Pack de conteúdo: 102.104 entradas do `EnglishDictionary`, com sentidos limpos e amostragem ponderada por frequência.
- Cada item com estado de memória próprio, agendado por FSRS.
- Persistência em SQLite no navegador, com o mesmo esquema do desktop, atrás de um adaptador.
- Log de revisões gravado desde o primeiro dia, sem conta e sem telemetria.

### Critério de sucesso

Recall diferido em 1 e 7 dias, calculado apenas sobre revisões agendadas. XP, duração de sessão e número de revisões são sinais de engajamento, nunca prova de aprendizagem.

### Fora de escopo do MVP

Android, nuvem, contas, telemetria, digitação, escuta, frases, gramática, expressões idiomáticas e animação elaborada.

### Status

Protótipo web e versão taskbar Tauri implementados e validados. O pack agora usa `EnglishDictionary` como fonte principal: 102.104 entradas lidas, 99.237 cartões jogáveis e 2.867 itens em revisão. Persistência OPFS, FSRS-7, caderno de palavras tocadas e métricas de recall diferido. Ver `docs/plano-fase-0.md` e `docs/adr/0008-english-dictionary-como-fonte-principal.md`.

## Releases

- Procedimento e atalho para gerar uma nova versão Linux: [release-linux.md](./release-linux.md).
- Build manual no Windows e relatório de insights: [build-windows.md](./build-windows.md).

## Fases seguintes

1. **Desktop**: Tauri 2 no Linux com ícone de bandeja e janela transparente já implementado em X11; Wayland e sobreposição da taskbar seguem como feature flag.
2. **Conteúdo expandido**: digitação e escuta, depois `sentence`, `grammar` e `idiom` como itens com estados independentes, inspirados no fluxo de frases completas do `earthworm`.
3. **Android**: `DreamService` ativado manualmente pelo usuário nas configurações; plano B de `WallpaperService` ou widget de lockscreen; sem `SYSTEM_ALERT_WINDOW` no início.
4. **Nuvem**: Postgres auto-hospedado recebe eventos idempotentes da fila local; manter o contrato de eventos versionado para trocar de backend sem reescrever a regra do jogo.

## Riscos conhecidos

- **pt-BR manual**: traduções ficam em template separado e não aparecem no jogo; não existe dataset aberto grande que reúna definição, tradução, áudio e nível.
- **Licenças**: a lista do Google tem ressalva da LDC para uso comercial; o conteúdo do `shelfom` é CC BY-NC; Wiktionary é CC BY-SA/GFDL e o áudio do Tatoeba precisa de checagem por arquivo. O repo é privado e nenhum crédito é exibido.
- **Taskbar**: não há API suportada para desenhar dentro da taskbar do Windows 11; no Linux, Wayland limita posicionamento de janelas.
- **Screensaver Android**: o aplicativo não pode iniciar o dream programaticamente e fabricantes podem esconder a opção.
- **Evidência pedagógica**: não há ensaio controlado sobre jogos idle para vocabulário; a eficácia é hipótese a medir desde a primeira versão.

## Base de pesquisa

Plano da fase 0: `docs/plano-fase-0.md`. Relatório: `reports/Jogo idle para aprender inglês.md`. Notas: `research_notes/Jogo idle para aprender inglês/`.
