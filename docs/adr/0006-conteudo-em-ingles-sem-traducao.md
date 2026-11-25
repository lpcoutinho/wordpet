# Conteúdo em inglês, sem tradução

O objetivo do jogo é construir vocabulário em inglês usando inglês como língua de instrução. Decidimos que o cartão de `word_sense` mostra uma definição em inglês e pede a palavra em inglês correspondente; traduções em português são metadados separados, preenchidos à mão e nunca exibidos.

## Considered Options

- Manter o par pergunta em português / resposta em inglês: descartado porque treina tradução, não vocabulário em inglês.
- Mostrar a palavra e pedir a tradução: descartado pelo mesmo motivo e por reforçar dependência da língua materna.
- Definição em inglês → palavra em inglês, com gloss curto no toque e exemplo opcional após a resposta: escolhido porque mantém a recuperação ativa dentro do inglês e fornece contexto sem entregar a resposta.

## Consequences

O pack exige `definition_en` com os sentidos completos, `prompt_en` com uma versão curta usada como pergunta e `gloss_en` para o toque. `example_en` é opcional: uma palavra sem exemplo continua jogável. `translation_ptbr` fica em arquivo separado, não participa da interface nem das alternativas. A Wiktionary valida e complementa, mas a fonte principal é `EnglishDictionary`.

## Fontes e licenças revisadas em 2026-11-25

- `EnglishDictionary`: texto local validado, sem crédito exibido no app; repo privado.
- English Wiktionary: usada para validação e lacunas de exemplo; nenhum attribution é renderizado.
- Lista de frequência `google-10000-english`: usada apenas como peso de amostragem, não como definição.
