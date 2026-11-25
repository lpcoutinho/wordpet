# SQLite local como fonte da verdade

O jogo precisa funcionar na taskbar e no descanso de tela sem rede, e o estado de memória do jogador não pode depender de um servidor. Decidimos que o banco no dispositivo é a fonte da verdade; a nuvem com Postgres entra apenas depois, como destino dos eventos de sincronização.

## Considered Options

- Sincronizar com Postgres ou Firebase desde o início: descartado porque transforma a disponibilidade da rede em pré-condição do progresso e da própria diversão.
- CRDT para o progresso: descartado porque faz merge em vez de rejeitar escritas, e não expressa autoridade sobre XP e retenção.

## Consequences

O esquema e a fila de eventos precisam ser desenhados para sobreviver à migração para a nuvem; o servidor replays eventos idempotentes em vez de ser o dono do estado.
