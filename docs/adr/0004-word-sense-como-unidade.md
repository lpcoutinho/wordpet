# Word sense como unidade de revisão

Uma mesma grafia pode carregar sentidos distintos: "bank" como instituição e "bank" como margem de rio não competem entre si na memória. Decidimos que a unidade de conteúdo é o `item` e que o primeiro tipo é `word_sense`, com classe gramatical e número de sentido; `sentence` e `idiom` entram nas fases seguintes com o mesmo modelo.

## Considered Options

- Palavra como unidade: descartado porque a resposta correta dependeria de contexto e o agendamento misturaria memórias diferentes.

## Consequences

Um lemma pode ter vários itens com estados independentes; conteúdo novo precisa dizer explicitamente qual sentido está sendo treinado.
