# Wiktionary como fonte de traduções pt-BR — validação prática

Data da validação: **25/11/2026**. Fermenta: extrair até 1 tradução por `(lemma, pos, sense_index)` para as primeiras 1000 palavras de `google-10000-english/no-swears.txt`, com `definition_en` associada e metadados de proveniência.

## 0. Conclusão acionável

**Fonte primária: `en.wiktionary.org`.** Ela é a única que fornece, na mesma entrada, (a) definição em inglês, (b) índice de sentido (`#`, `##`, `{{senseid|en|...}}`), (c) bloco `{{trans-top|gloss}} ... {{trans-bottom}}` com linha `* Portuguese:` e templates `{{t|pt|...}}` / `{{tt|pt|...}}`. A `pt.wiktionary.org` tem traduções diretas em seções `={{-en-}}=`, mas as definições são em português, os títulos de classe gramatical são localizados (`==Substantivo==`, `==Verbo==`), não há `definition_en`, e algumas entradas misturam vários idiomas antes da seção do inglês.

**Fonte secundária (fallback/validação): `pt.wiktionary.org`.** Use apenas para preencher lacunas ou revisar nuance; nunca como fonte de `definition_en`.

**Armadilha descoberta na prática:** em `water`, `be`, `run` e `house`, as traduções dos substantivos/verbos principais **não estão na página do lemma**, mas em subpáginas `<lemma>/translations`, indicadas por `{{see translation subpage|Noun}}` / `{{see translation subpage|Verb}}`. Um pipeline que lê só a página principal perde `água`, `ser`, `correr`, `casa`.

## 1. Corpus de entrada (fato corrigido)

O arquivo canônico do repositório é `google-10000-english-no-swears.txt` (na raiz), não `no-swears.txt`:

```
https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt
```

Validado em 25/11/2026: **9894 linhas**; primeiras palavras `the, of, and, to, a, in, for, is, on, that, by, this, with, i, you, it, not, or, be, are, ...`; a palavra #1000 é `availability`.

## 2. Teste A/B nas duas wikis (5 palavras)

User-Agent usado em **todas** as chamadas:

```
VocabGameResearch/1.0 (educational vocabulary pipeline; contact: research@example.com)
```

### 2.1 `en.wiktionary.org` — endpoint recomendado

URL exata (lote das 5 palavras, com `revid`/`timestamp`):

```
curl -A 'VocabGameResearch/1.0 (educational vocabulary pipeline; contact: research@example.com)' \
  'https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=the%7Cbe%7Cwater%7Crun%7Chouse&rvprop=content%7Ctimestamp%7Cids&rvslots=main&maxlag=5'
```

Resultado real: 5 páginas, todas existentes; revids/timestamps obtidos: `the` 95738810 / 2026-11-20T03:27:33Z, `be` 95738818 / 2026-11-20T03:28:22Z, `run` 95825733 / 2026-11-23T12:53:55Z, `house` 95706966 / 2026-11-18T21:22:24Z, `water` 95589231 / 2026-11-12T22:54:15Z.

URL exata para subpágina (o `/` precisa ir codificado em `titles`):

```
https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=water%2Ftranslations&rvprop=content&rvslots=main
```

Trechos reais de wikitext (copiados da resposta da API):

| Palavra | Página consultada | Trecho real de wikitext com tradução pt |
|---|---|---|
| `the` | página principal (`...titles=the&...`) | `* Portuguese: {{t+\|pt\|o\|m}}, {{t+\|pt\|a\|f}}, {{t+\|pt\|os\|m-p}}, {{t+\|pt\|as\|f-p}}` |
| `be` | `be/translations` | `* Portuguese: {{t+\|pt\|ser}}` (a secção também contém `estar`) |
| `water` | `water/translations` | `* Portuguese: {{tt+\|pt\|água\|f}}` |
| `water` (verbo) | página principal | `* Portuguese: {{tt+\|pt\|regar}}, {{tt+\|pt\|aguar}}` |
| `run` | `run/translations` | `* Portuguese: {{t+\|pt\|correr}}` |
| `house` | `house/translations` | `* Portuguese: {{tt+\|pt\|casa\|f}}` |

Contexto real do bloqueio de sentido em `house/translations`:

```
{{translation subpage}}
==English==

===Noun===

====Translations====
{{trans-top-see|human abode|housing}}
{{multitrans|data=
* Abau: {{tt|aau|a}}
...
* Portuguese: {{tt+|pt|casa|f}}
...
{{trans-bottom}}
```

Contagem observada nos wikitexts baixados (páginas principais + subpáginas das 5 palavras): 78 `{{t+|pt|...}}`, 18 `{{tt+|pt|...}}`, 3 `{{t|pt|...}}`, 2 `{{tt|pt|...}}`. Também aparece `{{not used|pt}}` em `the` — é uma tradução explicitamente inexistente, não um termo.

`action=parse&prop=wikitext` também funciona:

```
https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&page=the&prop=wikitext&section=0
```

Atenção: com `section=0` a resposta traz só o lead (`{{also|...}}`, `{{minitoc}}`). Para wikitext completo + `revid`, prefira `action=query&prop=revisions&rvprop=content|ids|timestamp&rvslots=main`.

### 2.2 `pt.wiktionary.org` — fonte secundária

URL exata:

```
https://pt.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=water&rvprop=content&rvslots=main
```

Não há templates `{{t|pt|...}}` nestas entradas. O padrão é marcador de idioma `={{-en-}}=`, seção POS em português e lista numerada com `[[link]]`:

| Palavra | Trecho real de wikitext (seção `={{-en-}}=`) |
|---|---|
| `the` | `={{-en-}}=` / `==Artigo==` / `# [[o]] (artigo definido masculino singular)` |
| `be` | `={{-en-}}=` / `==Verbo==` / `# [[ser]]` / `# [[estar]]` |
| `water` | `={{-en-}}=` / `==Substantivo==` / `# {{escopo\|en\|Química}} [[água]] (H<sub>2</sub>O)` |
| `run` | `={{-en-}}=` / `==Verbo==` / `# [[correr]]` / `# [[dirigir]]` / `# {{escopo\|en\|Informática}} [[correr]], [[executar]], [[rodar]] (programa)` |
| `house` | `={{-en-}}=` / `==Substantivo==` / `# [[casa]]` / `# [[residência]]` / `# [[lar]]` |

Risco concreto: em `pt/water` a entrada começa com `={{-af-}}=` (afrikaans) e só depois vem `={{-nl-}}=`, `={{-en-}}=`, `={{-it-}}=`, `={{-li-}}=`. **Sem filtrar por `={{-en-}}=` você extrai tradução do idioma errado.**

### 2.3 Decisão

| Critério | en.wiktionary | pt.wiktionary |
|---|---|---|
| `definition_en` na mesma entrada | Sim (`# A structure built...`) | Não (definições em pt) |
| Sentido indexado | `#`/`##`, `{{senseid\|en\|...}}`, `{{trans-top\|gloss}}` | só numeração `#` em pt |
| Tradução pt explícita | Sim, `Portuguese:` + template com código `pt` | Sim, mas como lista numerada |
| Subpáginas de tradução | Sim (4 de 5 palavras) | Não |
| Risco de idioma misturado | Seções `==English==` bem marcadas | Alto (`water` começa em Afrikaans) |
| Uso no pipeline | **Primário** | Fallback/revisão |

## 3. Licença e atribuição (páginas oficiais)

Fonte oficial: **Wikimedia Foundation Terms of Use, seção 7 "Licensing of Content"** — <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use> (página editada em 25/10/2026; ToU atual **em vigor desde 07/06/2023**).

Fatos literais da seção 7:

- Texto submetido é licenciado sob **CC BY-SA 4.0 International** **e** **GNU Free Documentation License (GFDL)** — esta última "unversioned, with no invariant sections, front-cover texts, or back-cover texts".
- "**Reusers may comply with either license or both.**" Ou seja: basta cumprir CC BY-SA 4.0; não é obrigatório aplicar GFDL.
- Mudança: ToU anteriores vigoraram até 07/06/2023; anúncio oficial da migração CC BY-SA 3.0 → 4.0 em 29/06/2023 (<https://diff.wikimedia.org/2023/06/29/stepping-into-the-future-wikimedia-projects-transition-to-creative-commons-4-0-license>). FAQ oficial: revisões anteriores ao upgrade permanecem sob 3.0 (<https://meta.wikimedia.org/wiki/Terms_of_use/Creative_Commons_4.0/FAQ>). Como este pipeline fixa revisões de 2026, aplica-se 4.0.
- Atribuição aceita (uma das três), segundo a ToU: (1) hyperlink/URL para a página reutilizada — cada página tem history com autores; (2) hyperlink/URL para cópia online estável equivalente; (3) lista de todos os autores (podendo filtrar contribuições pequenas).
- Reutilização com modificação: **indique claramente que o original foi modificado**; cada cópia/versão distribuída deve incluir aviso de licença com hyperlink/URL para o texto da licença ou cópia dela.
- Exceção relevante: conteúdo importado de terceiros pode estar sob CC BY-SA compatível mas **não GFDL**; nesse caso cumpra o CC BY-SA compatível. Por isso o campo `license` deve ser gravado por item, não assumido globalmente.

Recomendação operacional para o jogo: adotar **CC BY-SA 4.0** (mais simples que cumprir as duas), gravar `license: "CC-BY-SA-4.0"` por item, e gerar uma linha de crédito por lemma:

```
Tradução: Wiktionary (en), "house/translations", rev 95706966,
https://en.wiktionary.org/w/index.php?title=house/translations&oldid=95706966 —
CC BY-SA 4.0 (texto extraído e adaptado).
```

Padrão de URL permanente: `https://<site>.wiktionary.org/w/index.php?title=<titulo>&oldid=<revid>`.

## 4. Parsing robusto e algoritmo recomendado

### 4.1 Formatos reais que o parser deve aceitar

- `{{t|pt|termo}}`, `{{t+|pt|termo}}`: na própria página; `+` indica entry existente (boa prioridade).
- `{{tt|pt|termo}}`, `{{tt+|pt|termo}}`: forma "translation term" usada dentro de `{{multitrans|data=...}}`; **é predominante nas subpáginas** (ex.: `água`, `casa`).
- Parâmetros posicionais após o termo são marcadores de gênero/número/aspecto (`|m`, `|f`, `|m-p`, `|impf`) e `|tr=...`; não fazem parte da tradução.
- Termos com wikilinks: `{{tt|pt|[[dar]] [[água]] [[a]]}}` — remova `[[...]]` mantendo o texto visível.
- `{{not used|pt}}`: tradução inexistente declarada → `pending_no_pt`.
- Blocos de sentido: `{{trans-top|gloss}}`, `{{trans-top-see|gloss|ver}}`, `{{trans-bottom}}`; dentro deles, a linha é `* Portuguese:` (ou `Portuguese:` dentro de `{{multitrans}}`).
- Linhas `*: Indo-Portuguese: {{tt|idb|ag}}` e `*: Korlai Creole Portuguese: ...` **não são `pt`**: exija o rótulo exato `Portuguese:` e o código exato `pt` no template.
- Não faça regex global `\{\{t\|pt` no wikitext inteiro: no lote testado isso capturou `{{desc|pt}}`, `{{ety|pt}}`, `{{rhyme|pt}}`, `{{syn|pt}}` fora de blocos de tradução. **Sempre delimite ao bloco `trans-top ... trans-bottom` e à linha `Portuguese:`.**

### 4.2 Algoritmo (1 tradução por `lemma, pos, sense_index`)

1. **Baixar** a página do lemma (lote de até 50 títulos por request) e guardar wikitext cru + `revid` + `timestamp`.
2. **Delimitar idioma**: somente a seção `==English==` até o próximo heading de nível 2.
3. **Delimitar POS**: headings de nível 3 ou 4 cujo nome começa com `Noun`, `Verb`, `Adjective`, `Adverb`, `Article`, `Preposition`; normalizar para `noun|verb|adj|adv|article|prep`. Fechar a seção no próximo heading de nível ≤ ao do POS.
4. **Extrair sentidos**: linhas que começam com `#`, `##`, `###` (excluir `#*`, `#:`). `sense_index` = `s1`, `s1.1`, `s2` ... pelo número de `#`. Limpar markup com parser de wikitext (não regex simples): `{{non-gloss|...}}`, `{{lb|...}}`, `{{senseid|en|...}}`. **Gotcha medido:** uma limpeza de uma passada deixou `{{non-gloss|Used before a demonym...}}` literal no `definition_en`; use achatamento recursivo de templates.
5. **Detectar subpágina**: se o POS contém `{{see translation subpage|Noun}}` (ou `Verb`), buscar `<lemma>/translations` (codificar `/` como `%2F` em `titles`) e usar o bloco de tradução dessa subpágina, mantendo o POS da página principal.
6. **Extrair traduções**: para cada `{{trans-top...|gloss}} ... {{trans-bottom}}`, localizar apenas a linha `Portuguese:`; capturar todos os templates com código `pt` e limpar termo (links, itálicos, marcadores). `{{not used|pt}}` → `pending_no_pt`.
7. **Associar sentido** (ordem de prioridade, determinística):
   1. gloss normalizado igual ao início da definiçãoEN (case/acento_insensitive) → alta confiança;
   2. token de `{{senseid|en|...}}`/`{{sid|en|...}}` presente no gloss → alta confiança;
   3. interseção de tokens de conteúdo (remover stopwords) ≥ 2 ou Jaccard ≥ 0,5 → média confiança;
   4. senão `definition_en = null`, `match_confidence = "unlinked"`, `sense_index = "t<n>"` (nº do bloco de tradução) e enviar para fila de revisão. **Nunca inventar associação.**
8. **Escolher no máximo 1 termo**: preferir `tt+`/`t+` (entry existe), depois `tt`/`t`; entre iguais, o mais curto após limpeza; manter os demais em `pt_candidates` (opcional) sem publicá-los como resposta principal.
9. **Deduplicar** por chave `(lemma, pos, sense_index)`; gravar `status` = `ok` / `pending_no_pt` / `pending_unlinked`.
10. **Fallback pt.wiktionary**: só se `status != ok`; exigir `={{-en-}}=`, traduzir headings POS pt→en, extrair `# [[termo]]`; gravar `definition_en` do en.wiktionary quando existir e `source_id = "pt_wiktionary"`.

### 4.3 Validação do protótipo

Protótipo regex simples rodado sobre as 5 palavras (páginas + subpáginas): **204 blocos de tradução processados, 88 com algum termo `pt`**. Porém vários desses 88 ficaram com `definition_en` errada ou vazia por correspondência fraca de gloss (ex.: `the` → `s1.2` com gloss "this"), confirmando que o passo 7 precisa das regras acima e de revisão humana para itens de baixa confiança. Isto é evidence de que **contar templates não basta**: a associação ao sentido é o ponto fraco.

O projeto atual é TypeScript/Node 24 (`package.json`: `typescript 7.0.2`, `vitest 5.1.1`, sem parser de wikitext instalado). Use um parser de wikitext (por exemplo `mwparserfromhell` num step Python offline, ou implemente um tokenizer TS pequeno e testado) antes de inserir no pipeline de conteúdo; regex sobre wikitext aninhado não é suficiente.

## 5. Limites de API, rate limiting e cache

Fonte oficial: <https://www.mediawiki.org/wiki/API:Etiquette> e <https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits> (esta última editada em 08/11/2026; limites "novos em 2026", sujeitos a mudança).

**Observação real durante esta pesquisa:** com intervalo de **0,4 s** entre chamadas, a API de `en.wiktionary.org` respondeu em texto puro (sem JSON):

```
You are making too many requests to the API.
Please follow the best practices at https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits.
```

Após recuo de ~8 s e intervalo de 3 s, as mesmas requisições funcionaram. Portanto: **0,4 s é insuficiente; não use delay fixo curto.**

Limites oficiais por cliente (req/min, aplicados por minuto): não identificado (só IP) **10**; browser anônimo **200**; bot não autenticado **com User-Agent conforme** **200**; autenticado (editor comum) **200**; editor established **2000**; bot com flag / WMCS / cliente isento: exempt (ainda sujeito a Robot Policy). Máximo de **3 requisições concorrentes**. Erros: HTTP **429** com header `Retry-After`; se ausente, aguardar **≥5 s** ou exponential backoff. Use `maxlag=5` para jobs não interativos, `Accept-Encoding: gzip`, GET (não POST) para leitura, e **série, não paralelo**. User-Agent deve ser descritivo com contato: `clientname/version (contato) framework/version`.

Agrupamento validado: uma única requisição com `titles=` contendo as 50 primeiras palavras separadas por `|` devolveu **50 páginas, 0 missing**, corpo JSON de **2.362.710 bytes** (sha256 `93b65a13...`). Ou seja: ~20 requests cobrem as 1000 palavras, mas o volume bruto é grande — justifica cache em disco por página/revisão.

```bash
curl -A 'VocabGameResearch/1.0 (educational vocabulary pipeline; contact: research@example.com)' \
  --get 'https://en.wiktionary.org/w/api.php' \
  --data-urlencode 'action=query' \
  --data-urlencode 'format=json' \
  --data-urlencode 'formatversion=2' \
  --data-urlencode 'prop=revisions' \
  --data-urlencode 'rvprop=content|ids|timestamp' \
  --data-urlencode 'rvslots=main' \
  --data-urlencode "titles=$(paste -sd'|' primeiras50.txt)" \
  --data-urlencode 'maxlag=5'
```

### 5.1 Cache de respostas brutas com checksum

- Chave: `source_id + ":" + normalized_title + ":" + revid` (revid garante imutabilidade; se não houver revid ainda, baixe metadados primeiro e só depois o conteúdo).
- Guardar **corpo HTTP cru** (bytes exatos) em `cache/en_wiktionary/<title>@<revid>.json`; calcular `sha256` desses bytes e também `sha256` do `wikitext` extraído.
- Revalidar com `rvprop=ids|timestamp` (barato) antes de reusar cache antigo; se `revid` mudou, baixar nova versão e manter a antiga para auditoria.
- Respeitar `Retry-After`; backoff exponencial com jitter; fila serial; nunca mais de 3 concorrentes.
- Proteção contra corpo não-JSON (como o erro de rate limit acima): validar `Content-Type`/parse JSON antes de escrever no cache; falha = `fetch_error`, não "sem tradução".

### 5.2 Campos de metadados por item

```json
{
  "lemma": "house",
  "pos": "noun",
  "sense_index": "s1",
  "definition_en": "A structure built or serving as an abode of human beings.",
  "pt": "casa",
  "pt_candidates": ["casa"],
  "status": "ok",
  "match_confidence": "high",
  "source_id": "en_wiktionary",
  "source_url": "https://en.wiktionary.org/w/index.php?title=house/translations&oldid=95706966",
  "source_page": "house/translations",
  "revid": 95706966,
  "rev_timestamp": "2026-11-18T21:22:24Z",
  "license": "CC-BY-SA-4.0",
  "retrieved_at": "2026-11-25T00:00:00Z",
  "raw_checksum": "sha256:<hex-do-corpo-json>",
  "wikitext_checksum": "sha256:<hex-do-wikitext>",
  "attribution": "Wiktionary (en), house/translations, rev 95706966, CC BY-SA 4.0 (extraído e adaptado)"
}
```

`retrieved_at` deve ser o instante real da requisição (ISO-8601 UTC); o valor acima é ilustrativo do formato.

## 6. Riscos e como marcar pendente sem inventar

1. **Palavras funcionais.** `the` tem 11 ocorrências de template `pt` espalhadas por sentidos gramaticais ("used as an alternative to a possessive pronoun", "with a superlative") e `{{not used|pt}}` em um sentido. Irrestrito, o parser gera `o` repetido para sentidos diferentes. `be` tem 25 templates `pt` na subpágina, muitos em sentidos auxiliais onde a tradução é estrutural (`ser`/`estar`), não lexical. **Ação:** marcar `status: "pending_function_word"` quando `pos` for `article`/`prep` ou quando o gloss for auxiliar/gramatical; não usar como cartão de vocabulário sem curadoria.
2. **Tradução inexistente explicitamente.** `{{not used|pt}}` → `status: "pending_no_pt"`, `pt: null`. Nunca substituir por tradução " óbvia" inventada.
3. **Sentido sem gloss correspondente.** `definition_en: null`, `sense_index: "t<n>"`, `match_confidence: "unlinked"`; vai para fila de revisão, não para o jogo.
4. **`pt` ≠ `pt-BR` específico.** O código nos templates é `pt` (português); nas 5 páginas analisadas não apareceu `pt-BR`. Se for necessária variante brasileira, trate como revisão editorial explícita com `locale: "pt-BR"` e justificativa — não presuma que cada termo `pt` é pt-BR.
5. **Subpáginas esquecidas.** Checar sempre `{{see translation subpage|...}}`; 4 das 5 palavras testadas dependem disso.
6. **Conteúdo volátil.** Fixar `revid` + checksum; sem isso uma reexecução silenciosa pode trocar `pt` e `definition_en`.
7. **Licença mista.** Verificar rodapé/histórico da página para conteúdo importado sob CC BY-SA compatível sem GFDL; por isso gravar `license` por item e usar CC BY-SA 4.0 como caminho padrão.

## 7. Comandos reproduzíveis (resumo)

```bash
UA='VocabGameResearch/1.0 (educational vocabulary pipeline; contact: research@example.com)'

# 5 palavras, página principal (en)
curl -A "$UA" 'https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=the%7Cbe%7Cwater%7Crun%7Chouse&rvprop=content%7Ctimestamp%7Cids&rvslots=main&maxlag=5'

# subpáginas de tradução (en)
curl -A "$UA" 'https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=water%2Ftranslations&rvprop=content&rvslots=main'

# 5 palavras, página principal (pt)
curl -A "$UA" 'https://pt.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=water&rvprop=content&rvslots=main'

# wikitext via action=parse (atenção: section=0 traz só o lead)
curl -A "$UA" 'https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&page=the&prop=wikitext'
```

Referências oficiais consultadas: ToU §7 <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>; anúncio CC 4.0 <https://diff.wikimedia.org/2023/06/29/stepping-into-the-future-wikimedia-projects-transition-to-creative-commons-4-0-license>; FAQ 4.0 <https://meta.wikimedia.org/wiki/Terms_of_use/Creative_Commons_4.0/FAQ>; etiqueta da Action API <https://www.mediawiki.org/wiki/API:Etiquette>; limites da API <https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits>.
