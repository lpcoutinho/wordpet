# EnglishDictionary como fonte principal

`EnglishDictionary` passa a ser a fonte principal de definições do `wordpet`. A Wiktionary continua como validação e fonte adicional, mas não sobrescreve uma definição aceita; divergências ficam em `content/review-queue.json`.

## Considered Options

- Manter a Wiktionary como fonte principal e tratar o dicionário local como fallback: descartado porque o dicionário local tem cobertura de 102.104 entradas e passou a ser a fonte validada pelo usuário.
- Usar apenas as 200 palavras curadas do pack anterior: descartado porque o usuário pediu todas as entradas do dicionário.
- Gerar um pack do dicionário completo com limpeza automática, revisão das exceções e ponderação por frequência: escolhido porque preserva todos os sentidos legíveis sem exigir reescrita manual de cada significado.

## Decision

- `references/EnglishDictionary.txt` e `references/dictionary_arrays.json` ficam como entradas privadas, fora do bundle.
- `npm run dictionary:build` gera `content/generated/EnglishDictionary.json`, `src/content/pack.json`, `content/review-queue.json` e um template vazio de traduções.
- O JSON gerado preserva os valores do arquivo de referência, inclusive a duplicação em `zythum`; nenhum crédito é exibido.
- Cada entrada vira um cartão com ID `EnglishDictionary|<lemma>`. `definition_en` contém todos os sentidos limpos, `prompt_en` é a primeira oração curta mostrada como pergunta e `gloss_en` é usado no toque.
- Limpeza remove `Defn:`, numeração, citações como `T. Burnet`, `Pope` e `Sir W. Scott`, rótulos e referências `See X`, mas mantém todos os sentidos restantes.
- Entradas que ficam sem sentido após a limpeza —principalmente `See X` — vão para a fila de revisão e não entram na rotação.
- Multiword, hifenadas e obsoletas entram na rotação quando possuem sentido limpo.
- `pos` é inferido da definição; quando a inferência é insegura, o valor é `unknown`.
- A amostragem é aleatória ponderada por frequência; palavras fora da lista-base recebem peso baixo uniforme.
- Alternativas vêm das entradas aprovadas, preferindo mesmo `pos` e comprimento parecido.
- Toque em palavra do prompt mostra gloss curto e adiciona ao caderno; palavras flexionadas são reduzidas ao lema; alternativas só são tocáveis após a resposta.
- O esquema SQLite atual é reaproveitado; sentidos completos ficam em `definition_en`/`payload`, e `notebook` registra palavras marcadas.

## Consequences

O pack passou a ter 102.104 entradas lidas, 99.237 cartões jogáveis e 2.867 itens em revisão. O build gera um bundle maior; a inicialização reaproveita o pack quando checksum e contagem já estão no SQLite. Traduções pt-BR continuam separadas, incrementais e invisíveis. Frases e expressões usarão a mesma política de amostragem quando forem adicionadas.
