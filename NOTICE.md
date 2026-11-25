# Avisos de terceiros e dados

## Código

O código-fonte deste repositório é distribuído sob a licença MIT, conforme [LICENSE](LICENSE).

## Dados linguísticos

- Definições e exemplos em inglês foram extraídos e adaptados da **Wiktionary em inglês** (<https://en.wiktionary.org/>), sob licença **CC BY-SA 4.0** (<https://creativecommons.org/licenses/by-sa/4.0/>).
- A lista de frequência usada como insumo está em `content/source/google-10000-english-no-swears.txt`.
- `content/generated/EnglishDictionary.json`, `content/cache/`, `content/review-queue.json` e `src/content/pack.json` são derivados desses materiais. Pelo ShareAlike, esses dados derivados devem ser tratados sob CC BY-SA 4.0, separadamente do código MIT.
- Os metadados por item (`license`, `attribution`, `source_url`, `revid`) são preservados pelo gerador em `scripts/build-content.mjs`.

## Ícones

Os ícones do app e da bandeja foram gerados a partir do SVG `src-tauri/icons/pet-source.svg`, criado para este projeto com base nos estilos do próprio sprite em `src/style.css`. Não há arte de terceiros incluída.

## Dependências

As dependências npm e os crates Rust não são redistribuídos neste repositório (`node_modules/` e `src-tauri/target/` estão no `.gitignore`). Cada dependência mantém a própria licença.
