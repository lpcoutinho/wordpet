# wordpet

Jogo idle de aprendizado de inglês em que um personagem minúsculo acompanha o jogador enquanto palavras viram recompensas. Começa por vocabulário e evolui para frases, gramática e expressões idiomáticas.

## Conteúdo

**Item**:
A menor unidade de conteúdo que o jogo apresenta e revisa; pertence a um tipo, como `word_sense`, `sentence` ou `idiom`.
_Avoid_: palavra, cartão, flashcard

**Word sense**:
Um sentido específico de uma palavra, distinto dos outros pela classe gramatical e pelo número do sentido. "Banco" como instituição e "banco" como assento são dois word senses.
_Avoid_: palavra, entry, lemma

**Lemma**:
A forma canônica de uma palavra, usada para agrupar sentidos relacionados e ordenar a dificuldade inicial.
_Avoid_: word, termo, item

**Pack de conteúdo**:
Um conjunto fechado de itens que entra no jogo de uma vez, com a origem de cada item registrada.
_Avoid_: base, dicionário, corpus

## Aprendizagem

**Recall**:
Recuperação ativa: o jogador tenta lembrar antes de ver a resposta. É a única interação que concede progresso.
_Avoid_: revisão, leitura, exposição

**Exposição**:
Aparição passiva de um item sem tentativa de lembrar. Não altera o progresso nem rende recompensa.
_Avoid_: prática, treino, recall

**Fila de revisão**:
Conjunto de itens cuja recuperação está prevista para o momento atual conforme o estado de memória do jogador.
_Avoid_: lista, deck, fila de tarefas

**Retenção desejada**:
Probabilidade alvo de o jogador lembrar de um item na revisão; determina quando o item volta a aparecer.
_Avoid_: dificuldade, nível, maestria

**Recompensa**:
XP concedido ao jogador após um recall verificado; objetos cosméticos podem acompanhar o XP, mas tempo online e exposição não produzem nenhum dos dois.
_Avoid_: pontuação, nota, xp passivo

## Jogador

**Jogador**:
A pessoa que usa o wordpet, sem conta e sem identificação pessoal na primeira versão.
_Avoid_: usuário, aluno, conta
