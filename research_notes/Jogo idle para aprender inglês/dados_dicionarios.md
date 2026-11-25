# Repositórios de dados/dicionário em inglês para um jogo idle de vocabulário

Escopo: uso prático em um jogo de inglês para falantes de português (incluindo contexto pt-BR e, onde houver dados, contexto marroquino). Todas as contagens marcadas como "medição própria" foram obtidas por mim dos arquivos brutos no GitHub em 24/11/2026; números de terceiros estão acompanhados da fonte.

## 1. O que cada repo fornece, em que formato e quantas entradas

### Takeaway
Os três repositórios são complementares e **não** são substituíveis: `google-10000-english` é só uma lista de frequência sem definições; `dwyl/english-words` é um vocabulário gigante de grafias sem frequência nem definição; `WebstersEnglishDictionary` é um dicionário de definições antigas, sem frequência. Nenhum traz tradução para português, níveis CEFR, áudio ou flexões.

### Cited Findings
- `first20hours/google-10000-english`: "a list of the 10,000 most common English words in order of frequency", obtida por análise de n-gramas do *Google Trillion Word Corpus*; derivada de `count_1w.txt` de Peter Norvig, com os contadores de frequência removidos (`sed 's/[0-9]*//g'`). O repositório traz aviso de "Not Maintained" — [Source](https://github.com/first20hours/google-10000-english).
- Arquivos TXT, um palavra por linha, **sem contagens numéricas**; há variantes: `google-10000-english.txt`, `google-10000-english-no-swears.txt`, `google-10000-english-usa.txt`, `google-10000-english-usa-no-swears{-short,-medium,-long}.txt` (1–4, 5–8, 9+ caracteres) e `20k.txt` — [Source](https://github.com/first20hours/google-10000-english).
- Medição própria nas URLs brutas: `google-10000-english.txt` = 10.000 linhas; `google-10000-english-no-swears.txt` = 9.894; `google-10000-english-usa.txt` = 9.999; `20k.txt` = 20.000. Primeiras palavras: `the, of, and, to, a, in, for, is, on, that...` — [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt); [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt); [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt).
- Tamanhos via GitHub Contents API: `google-10000-english.txt` 75.888 bytes (~74 KB), `no-swears` 75.153 bytes, `20k.txt` 155.418 bytes (~152 KB) — [Source](https://api.github.com/repos/first20hours/google-10000-english/contents).
- `dwyl/english-words`: README descreve "over 466k English words"; a descrição da página do repositório diz 479k (números divergentes entre README e About). Os arquivos são `words.txt` (todas as palavras), `words_alpha.txt` (somente letras A-Z), `words_dictionary.json` (mesmas palavras de `words_alpha`, todas com valor `1`), mais ZIPs e `uk-us-dict.txt` — [Source](https://github.com/dwyl/english-words).
- Medição própria: `words.txt` = 466.550 linhas; `words_alpha.txt` = 370.105; `words_dictionary.json` = 370.101 chaves (4 a menos que o TXT, provavelmente chaves duplicadas colapsadas no JSON). Tamanhos: 4.862.985 bytes (~4,9 MB), 4.234.910 (~4,2 MB), 6.825.577 (~6,8 MB), respectivamente; ZIPs: 1,47 MB / 0,94 MB / 0,97 MB — [Source](https://api.github.com/repos/dwyl/english-words/contents); [Source](https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json).
- Origem dos dados: README conta que as palavras vieram de uma planilha XLS do Infochimps (via Stack Overflow) e que "Copyright still belongs to them"; os créditos locais identificam a coleção como derivada de *Moby Word II*, de Grady Ward — [Source](https://github.com/dwyl/english-words); [Source](https://raw.githubusercontent.com/dwyl/english-words/master/word_list_moby_README.txt).
- O documento do Moby Word II descreve subcomponentes originais (não equivalem ao arquivo consolidado do dwyl): 74.550 palavras comuns, 354.984 palavras simples, 256.772 compostas, 113.809 de palavras cruzadas, 21.986 nomes, 10.196 lugares, 1.000 por frequência etc.; o texto observa que a lista de palavras simples **não exclui arcaísmos nem variantes ortográficas** e que acentos foram removidos — [Source](https://raw.githubusercontent.com/dwyl/english-words/master/word_list_moby_README.txt).
- `matthewreagan/WebstersEnglishDictionary`: README alerta que **não é um espelho mantido**, mas uma ferramenta de parsing em Swift com uma cópia do *Webster's Unabridged Dictionary* do Project Gutenberg, compilado em 22/08/2009, "com erros e omissões conhecidos". Formatos: TXT original, `dictionary.json`, `dictionary_compact.json` e `dictionary_alpha_arrays.json` (array com 26 dicionários A-Z) — [Source](https://github.com/matthewreagan/WebstersEnglishDictionary).
- Cada entrada é `palavra → string de definição` (ex.: `anopheles` com definição longa; `uniclinal`: "See Nonoclinal."; `sarong` com citação "Balfour (Cyc. of India)") — [Source](https://github.com/matthewreagan/WebstersEnglishDictionary).
- Medição própria: `dictionary_compact.json` contém **102.217 chaves**. Tamanhos via API: TXT 28.937.177 bytes (~29 MB), `dictionary.json` 22.970.019, `dictionary_alpha_arrays.json` 23.164.387, `dictionary_compact.json` 22.458.933 — [Source](https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json); [Source](https://api.github.com/repos/matthewreagan/WebstersEnglishDictionary/contents).
- O TXT começa com o cabeçalho do Gutenberg ("Release Date: August 22, 2009 [EBook #29765]") e usa marcadores como `Defn:` dentro das definições — [Source](https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/WebstersEnglishDictionary.txt). A página do ebook registra "Public domain in the USA", 27,6 MB de texto plano e última atualização em 07/07/2025 — [Source](https://www.gutenberg.org/ebooks/29765).

### Inferences
- Papéis naturais: frequência = `google-10000-english`; validação de grafia/cobertura = `dwyl`; definição = Webster. O dicionário Webster cobre apenas parte das palavras de alta frequência do jogo: na medição própria, **5.619 das 9.894 palavras** da lista `no-swears` têm entrada no `dictionary_compact.json` — [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt); [Source](https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json).
- A lista `words_alpha.txt` do dwyl contém **9.263 das 9.894** palavras `no-swears` na medição própria, ou seja, é um bom filtro de grafia, mas não uma fonte de dificuldade — [Source](https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt).
- `words_dictionary.json` não é um dicionário semântico: todos os valores são `1`, servindo apenas como conjunto de palavras — [Source](https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json).

### Gaps
- Os repositórios não publicam contagem oficial de entradas para o JSON do Webster; 102.217 é medição própria.
- Não encontrei explicação oficial para a divergência "466k" (README) vs "479k" (About) no dwyl.
- Não medi a interseção completa entre `20k.txt` e o Webster, nem entre as 370 mil palavras do dwyl e o Webster.

## 2. Licenças e o que permitem em produto (inclusive comercial)

### Takeaway
O ponto mais sensível juridicamente é o `google-10000-english`: o próprio LICENSE desaconselha uso comercial sem licenciar o corpus da LDC. O dwyl é Unlicense, mas há uma nota de copyright preservado no README; o Webster mistura domínio público (texto Gutenberg) com GPL v2 (ferramenta e arquivos de saída).

### Cited Findings
- `google-10000-english/LICENSE.md`: dados derivados do *Google Web Trillion Word Corpus* distribuído pela Linguistic Data Consortium (LDC), com subconjunto de Peter Norvig (licença MIT para suas contribuições) e edição/cleanup de Josh Kaufman. Texto literal: "Educational and personal/research use of this data is permitted under the LDC license, Norvig's MIT license for his contributions, and US fair use doctrine. **I do not recommend using this data for commercial purposes without licensing it from the Linguistic Data Consortium.**" — [Source](https://github.com/first20hours/google-10000-english/blob/master/LICENSE.md).
- O README cita o artigo do Google Research (2006) com 1.024.908.267.229 palavras processadas e 13.588.391 palavras únicas após descartar palavras com menos de 200 ocorrências; esses números são do **corpus**, não da lista de 10.000 — [Source](https://github.com/first20hours/google-10000-english).
- `dwyl/english-words/LICENSE.md` é a Unlicense: domínio público, permite "copy, modify, publish, use, compile, sell, or distribute ... for any purpose, commercial or non-commercial" — [Source](https://raw.githubusercontent.com/dwyl/english-words/master/LICENSE.md); [Source](https://unlicense.org/).
- Conflito documentado: o README do dwyl diz "Copyright still belongs to them" ao descrever a origem Infochimps; os documentos Moby afirmam que o material é "Public Domain material by grant from the author, January, 2001", mas o "small print" do Project Gutenberg impõe condições para distribuir sob a marca Gutenberg (cópia exata + avisos, ou 20% dos lucros brutos se usar a marca) — [Source](https://github.com/dwyl/english-words); [Source](https://raw.githubusercontent.com/dwyl/english-words/master/word_list_moby_README.txt).
- `WebstersEnglishDictionary/README.md`, seção License: "The original dictionary text file is covered by The Gutenberg Project's licensing ... The Swift parsing tool and **example output files** in this repository are free and distributed under the **GNU General Public License, Version 2**" — [Source](https://github.com/matthewreagan/WebstersEnglishDictionary).
- A página do ebook 29765 diz "Public domain in the USA" e que todos os eBooks Gutenberg são gratuitos — [Source](https://www.gutenberg.org/ebooks/29765). Definições do Webster 1913 foram amplamente importadas para a Wiktionary, que as fornece sob CC BY-SA — [Source](https://en.wiktionary.org/wiki/Wiktionary:Public_domain_sources).

### Inferences
- Para produto comercial: tratar a lista do Google como insumo **apenas de desenvolvimento** ou buscar licença LDC; alternativas modernas (wordfreq) resolvem a ordenação por frequência com licenças mais explícitas (ver §5).
- O texto Webster em si parece utilizável nos EUA como domínio público, mas **os JSONs do repo são declarados GPL v2**; para evitar copyleft indesejado, gerar novamente as definições a partir do TXT Gutenberg com um pipeline próprio é uma alternativa técnica (com revisão jurídica) — inferência baseada em [Source](https://github.com/matthewreagan/WebstersEnglishDictionary) e [Source](https://www.gutenberg.org/ebooks/29765).
- A Unlicense do dwyl favorece uso comercial, mas a nota de copyright no README exige due diligence sobre a cadeia de proveniência antes de redistribuir a lista — inferência de [Source](https://github.com/dwyl/english-words).

### Gaps
- Não encontrei custo ou cláusulas da licença LDC aplicáveis ao corpus; é necessário contato direto com a LDC.
- Não foi possível esclarecer se a afirmação "Copyright still belongs to them" do README do dwyl tem efeito legal sobre o arquivo licenciado como Unlicense.
- A tentativa de ler o texto completo da licença do Project Gutenberg falhou (HTTP 503); só foram confirmados o PDF/resumo da página do ebook e o "small print" embutido nos arquivos Moby.

## 3. Limitações práticas dos três repositórios

### Takeaway
Faltam quase todos os campos que um jogo de aprendizado precisa: definições confiáveis e modernas, tradução pt-BR, níveis CEFR, áudio, flexões e frases de exemplo. Há ruído, arcaísmos, palavras ofensivas (exceto na variante `no-swears`) e viés de corpus antigo/web.

### Cited Findings
- `google-10000-english` contém **apenas strings**, sem definição, classe gramatical, lemma, tradução, nível ou áudio; os contadores foram removidos — [Source](https://github.com/first20hours/google-10000-english); [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt).
- O repo oferece variantes `no-swears` (remoção baseada nas listas `reimertz/curse-words`, `MauriceButler/badwords` e `LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words`) e variantes por comprimento; a lista padrão **não** é livre de palavrões — [Source](https://github.com/first20hours/google-10000-english).
- O repositório está marcado como não mantido e deriva de um corpus de web de 2006; na medição própria, palavras modernas/técnicas como `online`, `email`, `software`, `video`, `internet`, `dvd`, `website`, `download`, `ebay` aparecem na lista, mas **não** têm entrada no Webster; também faltam flexões como `services`, `used`, `years`, `days`, `using` — [Source](https://github.com/first20hours/google-10000-english); [Source](https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json).
- `words.txt` do dwyl inclui palavras com números/símbolos; `words_alpha.txt` foi criado exatamente para filtrar isso. A lista Moby original não exclui arcaísmos nem variantes e teve acentos removidos (`etude` sem acento) — [Source](https://github.com/dwyl/english-words); [Source](https://raw.githubusercontent.com/dwyl/english-words/master/word_list_moby_README.txt).
- O dicionário Webster tem "known errors and omissions" declarados pelo próprio repo, usa definições do inglês de ~1913, traz referências internas inúteis para o jogador ("See Nonoclinal."), citações eruditas embutidas e não traz IPA, tradução, POS, frequência ou CEFR — [Source](https://github.com/matthewreagan/WebstersEnglishDictionary); [Source](https://www.gutenberg.org/ebooks/29765).
- A Wiktionary aponta que o Webster 1913 é uma fonte de domínio público usada como base, mas que o conteúdo moderno da Wiktionary a substituiu em grande parte; o próprio projeto WordNet é descrito como "not in public domain" e com dados modernos — [Source](https://en.wiktionary.org/wiki/Wiktionary:Public_domain_sources).
- Nenhum dos três repositórios fornece tradução para português (do Brasil ou de Portugal), nem rótulos CEFR; o English Vocabulary Profile/EVP atribui níveis **a sentidos específicos** das palavras, não apenas ao lemma, e usa corpus de aprendizes — [Source](https://englishprofile.org/?menu=english-vocabulary-profile); [Source](https://www.cambridge.org/core/journals/english-profile-journal/article/a1b2-vocabulary-insights-and-issues-arising-from-the-english-profile-wordlists-project/E57847F6C5574124B2354F9BEEC005FA).
- Listas BNC/COCA de Paul Nation são organizadas em faixas de 1.000 word families (1k–25k) e explicitamente voltadas a leitores graduados; elas excluem nomes próprios, palavrões/exclamações, compostos e siglas — [Source](https://www.eapfoundation.com/vocab/general/bnccoca).
- A literatura sobre CEFR mostra que nível não é sinônimo de frequência bruta: a atribuição de níveis usa corpora rotulados por nível e dispersão, e a frequência é apenas um preditor (o mais influente) ao inferir níveis para palavras fora da lista — [Source](https://aclanthology.org/2020.lrec-1.43.pdf); [Source](https://www.nature.com/articles/s41599-025-05446-y).

### Inferences
- Usar a posição na lista do Google como "dificuldade" é uma aproximação aceitável para desbloquear conteúdo no início, mas não deve ser apresentada ao usuário como CEFR; palavras curtas e frequentes podem ter sentidos avançados.
- O Webster é adequado como definição *fallback* para vocabulário clássico, mas é arriscado como fonte primária em um jogo moderno: quase metade das palavras comuns da amostra medida não tem entrada, e as definições podem confundir o aprendiz.
- Palavras ofensivas exigem filtro explícito: usar `no-swears` como base e manter uma lista própria, pois nem todo conteúdo sensível (ex.: sentidos relacionados a álcool, violência) está coberto por listas de palavrões — inferência de [Source](https://github.com/first20hours/google-10000-english) e [Source](https://www.cambridge.org/core/journals/english-profile-journal/article/a1b2-vocabulary-insights-and-issues-arising-from-the-english-profile-wordlists-project/E57847F6C5574124B2354F9BEEC005FA).

### Gaps
- Não encontrei nenhum dataset nos três repositórios específico para Marrocos (árabe marroquino/tamazight) nem voltado ao português do Brasil.
- Não há métrica publicada de precisão/erros das definições do Webster além da declaração genérica "known errors and omissions".
- Não medi quantas das 370.105 palavras do dwyl são grafias inválidas/obsoletas em inglês contemporâneo.

## 4. Como combinar os três e quais camadas faltam (e onde obtê-las)

### Takeaway
Use o Google como **índice de frequência**, o dwyl como **filtro de grafia** e o Webster como **definição de reserva**; para um produto real, essas três camadas devem ser complementadas por Wiktionary/WordNet (definições e relações), EVP/BNC-COCA (dificuldade pedagógica), wiktextract (pt-BR, flexões, áudio) e Tatoeba (exemplos bilíngues).

### Cited Findings
- Camada 1 (seleção/ordenação): `google-10000-english-no-swears.txt` (9.894 palavras medidas) ou `20k.txt` para estágios avançados; `no-swears` já remove palavrões segundo listas externas — [Source](https://github.com/first20hours/google-10000-english); [Source](https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt).
- Camada 2 (validação): `words_alpha.txt` cobre 9.263/9.894 da Base medida; `words_dictionary.json` permite lookup O(1) em Python, mas só com valor `1` — [Source](https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt); [Source](https://github.com/dwyl/english-words).
- Camada 3 (definições): `dictionary_compact.json` cobre 5.619/9.894 das palavras-base na medição própria; as lacunas concentradas em flexões e termos modernos — [Source](https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json).
- Camada 4 (dificuldade pedagógica): EVP fornece níveis A1–C2 por **sentido**, com versões britânica e americana e áudio para todas as entradas; BNC/COCA de Nation fornece faixas de 1k a 25k word families — [Source](https://englishprofile.org/?menu=english-vocabulary-profile); [Source](https://www.eapfoundation.com/vocab/general/bnccoca).
- Camada 5 (pt-BR, flexões, IPA/áudio, sinônimos): o Wiktextract extrai da Wiktionary "lemmas, inflected forms, translations, etymology, usage examples, pronunciations (including URLs of sound files), lexical and semantic relations" — [Source](https://lrec.elra.info/lrec2022-main-140); as traduções ficam em `translations` (com `code`, `lang`, `word`, `sense`) — [Source](https://github.com/tatuylonen/wiktextract). O kaikki.org publica JSONL atualizado semanalmente e um pacote com cerca de 942.000 arquivos de áudio (~20,4 GB) — [Source](https://kaikki.org/dictionary/rawdata.html).
- Camada 6 (exemplos bilíngues en→pt): Tatoeba exporta frases semanais com pares traduzidos; licença padrão CC BY 2.0 FR (com parte em CC0) e áudio com licença escolhida pelo contribuidor — [Source](https://tatoeba.org/en/downloads); [Source](https://tatoeba.org/en/terms_of_use). O manythings.org distribui pares prontos para Anki, com **197.147 pares português–inglês** na atualização de fevereiro/2026, e avisa que o corpus contém erros e que filtrou ofensas — [Source](https://www.manythings.org/anki).
- Camada 7 (relações semânticas/lemas): WordNet agrupa sinônimos em synsets interligados por relações (hiperonymia, meronímia, antonímia) e permite uso comercial com aviso de copyright; Princeton não desenvolve mais o projeto, recomendando Open English WordNet — [Source](https://wordnet.princeton.edu/); [Source](https://opensource.org/license/wordnet); [Source](https://kghub.org/kg-registry/resource/wordnet/wordnet.html).
- Dados prontos com flexões e etiquetas de exame (zk/gk/cet4/cet6/ky/TOEFL/IELTS/GRE), BNC/COCA e campo `exchange`: ECDICT (CSV ~63 MB, licença MIT no repositório), embora seja inglês→chinês, não inglês→português — [Source](https://github.com/skywind3000/ECDICT); [Source](https://github.com/XJacket/dict-popup/blob/master/docs/DICTIONARIES.md).

### Inferences
- Arquitetura sugerida: gerar um **SQLite único** com colunas `word, rank/frequency, source, definition_en, definition_pt_br, cefr, pos, forms, ipa, audio_url, example_en, example_pt, offensive_flags, license`; os três repos entram como camadas de baixo custo, e as demais fontes preenchem os campos faltantes antes do build.
- No loop idle, a frequência controla desbloqueio/economia do jogo, enquanto CEFR controla a **progressão pedagógica**; usar apenas frequência achata a dificuldade de polissemia (ex.: sentidos avançados de palavras frequentes) — inferência de [Source](https://www.cambridge.org/core/journals/english-profile-journal/article/a1b2-vocabulary-insights-and-issues-arising-from-the-english-profile-wordlists-project/E57847F6C5574124B2354F9BEEC005FA).
- Para pt-BR, a via mais escalável é o campo `translations` do Wiktextract com `lang_code = pt`, com curadoria manual das ambiguidades; para frases, Tatoeba/manythings já fornece pares prontos, mas exige atribuição e revisão — inferência de [Source](https://github.com/tatuylonen/wiktextract) e [Source](https://www.manythings.org/anki).
- Contexto marroquino: a lista de idiomas CC0 da Tatoeba inclui "Standard Moroccan Tamazight" e "Algerian Arabic", o que pode servir a frases de apoio se o público for falante de árabe/tamazight; os três repositórios, porém, não trazem nada específico — [Source](https://tatoeba.org/en/downloads).

### Gaps
- Não medi a cobertura real de traduções `pt` no Wiktextract para as 9.894 palavras-base.
- Não verifiquei a qualidade/url dos arquivos de áudio da Wiktionary nem a licença individual de cada gravação.
- Não há fonte identificada que forneça, em conjunto, nível CEFR + tradução pt-BR + áudio + exemplos para as mesmas entradas; será necessário join e curadoria.

## 5. Alternativas modernas comparáveis e quando usar cada uma

### Takeaway
Para frequência, prefira **wordfreq** (multilíngue, Apache 2.0 + dados CC BY-SA) ou COCA/BNC conforme o orçamento; para definições ricas e traduções, **Wiktionary via Wiktextract/kaikki**; para relações semânticas, **WordNet/Open English WordNet**; para rótulos de exame/flexões, **ECDICT**; para frases, **Tatoeba**. O Webster e o dwyl ficam como fontes auxiliares/dominio público, não como núcleo do produto.

### Cited Findings
- **wordfreq**: biblioteca Python com frequências em mais de 40 idiomas, combinando Wikipedia, OpenSubtitles/SUBTLEX, notícias, Google Books, web, Twitter e Reddit; funções `word_frequency`, `zipf_frequency`, `top_n_list`, `iter_wordlist`; listas "small" (≥1/1.000.000) e "large" (≥1/100.000.000) — [Source](https://github.com/rspeer/wordfreq/blob/master/README.md). Licença: Apache 2.0 desde a versão 3.0.3, com arquivos de dados CC BY-SA 4.0; o README proíbe converter para CSV por perder atribuição/licença; os dados são um snapshot até ~2021, sem atualizações previstas — [Source](https://github.com/rspeer/wordfreq/blob/master/CHANGELOG.md); [Source](https://github.com/rspeer/wordfreq/blob/master/README.md).
- **Princeton WordNet / Open English WordNet**: synsets com relações semânticas; licença WordNet 3.0 permite uso comercial sem royalties mediante manutenção de aviso e não usar o nome Princeton em publicidade; projeto Princeton descontinuado, sucessor comunitário licenciado em CC BY 4.0 sobre a base WordNet — [Source](https://wordnet.princeton.edu/license-and-commercial-use); [Source](https://wordnet.princeton.edu/); [Source](https://github.com/globalwordnet/english-wordnet/blob/main/LICENSE.md).
- **Wiktionary/Wiktextract/kaikki**: CC BY-SA + GFDL, uso comercial permitido com atribuição e compartilhamento igual das derivações; extração inclui formas flexionadas, traduções, exemplos, IPA e URLs de áudio; dump bruto 24,8 GB (2,9 GB comprimido), atualizado semanalmente — [Source](https://enterprise.wikimedia.com/project-data/wiktionary-api); [Source](https://kaikki.org/dictionary/rawdata.html); [Source](https://lrec.elra.info/lrec2022-main-140).
- **ECDICT**: MIT no repositório, CSV de ~63 MB, ~760.000 entradas (76万 no texto-fonte) na versão básica segundo levantamento de terceiros; inclui BNC/COCA, tags de exame, fonética e flexões (`exchange`), mas o histórico dos dados é agregado de várias fontes e a análise de terceiros recomenda cautela quanto à proveniência individual — [Source](https://github.com/skywind3000/ECDICT/blob/master/LICENSE); [Source](https://github.com/XJacket/dict-popup/blob/master/docs/DICTIONARIES.md); [Source](https://github.com/skywind3000/ECDICT/blob/master/ecdict.csv).
- **WordFrequency.info/COCA**: lista de 60.000 lemas com frequência por 8 gêneros e 100 subgêneros, 220.000 formas de palavra; amostra gratuita de 5.000 entradas; a licença paga proíbe mostrar frequência/rank exatos ao usuário final (permitindo até 20 faixas) e não permite redistribuir os dados fora da empresa — [Source](https://www.wordfrequency.info/); [Source](https://www.wordfrequency.info/samples.asp); [Source](https://www.wordfrequency.info/license.asp).
- **BNC/COCA word family lists (Paul Nation)**: faixas 1k–25k, PDF 15,8 MB e XLSX 1,2 MB, voltadas a leitores graduados e livros didáticos — [Source](https://www.eapfoundation.com/vocab/general/bnccoca).
- **English Vocabulary Profile (Cambridge)**: A1–C2 por palavra **e sentido**, com áudio, versões britânica/americana, acesso online gratuito para professores/educadores — [Source](https://englishprofile.org/?menu=english-vocabulary-profile). O artigo de C1/C2 registra 6.970 cabeçalhos e ~15.000 sentidos/frases no recurso — [Source](https://www.cambridge.org/core/journals/english-profile-journal/article/completing-the-english-vocabulary-profile-c1-and-c2-vocabulary/418955FC7ED2455E98A499BC40C2C816).
- **EFLLex**: recurso acadêmico com 15.280 entradas lemma+POS e frequências por nível CEFR (A1–C1), incluindo expressões multi-palavra e phrasal verbs — [Source](https://aclanthology.org/2020.lrec-1.43.pdf).
- **Tatoeba**: frases e traduções, CC BY 2.0 FR (parte CC0), exportações semanais e pares prontos en-pt (197.147 em manythings.org) — [Source](https://tatoeba.org/en/downloads); [Source](https://www.manythings.org/anki).

### Inferences
- Substituir a lista do Google por `wordfreq.top_n_list('en', N)` resolve o problema comercial do corpus LDC e acrescenta escala Zipf contínua; manter `google-10000-english` apenas como referência histórica/DEBUG — inferência de [Source](https://github.com/first20hours/google-10000-english/blob/master/LICENSE.md) e [Source](https://github.com/rspeer/wordfreq/blob/master/README.md).
- Wiktionary é a melhor fonte única para "tudo em um" (definição moderna + pt + flexões + áudio + exemplos), mas exige pipeline de extração e cumprimento de CC BY-SA; WordNet entra para sinônimos/hiperônimos e jogos de associação, não como dicionário do aprendiz.
- COCA/WordFrequency só vale a pena se o produto aceitar a restrição de não expor rank/frequência exatos e o custo de licença; para faixas didáticas gratuitas, BNC/COCA de Nation ou EVP são mais simples.
- ECDICT é comparável em estrutura (frequência + exames + flexões) mas é inglês→chinês: útil como **modelo de esquema de dados**, não como fonte de tradução pt-BR.

### Gaps
- Não encontrei fonte aberta, grande e simultaneamente CEFR + pt-BR + áudio + exemplos; a combinação terá de ser montada e auditada internamente.
- Não verifiquei se as listas BNC/COCA e EVP permitem redistribuição em um aplicativo comercial; seus sites oferecem acesso/download, mas não esclarecem aqui termos de redistribuição de dados.


## Revisão de licenças (2026-11-25)

- Wiktionary: manter como fonte primária; CC BY-SA 4.0 com attribution por revisão.
- Websters/Gutenberg 29765: texto reutilizável sob Project Gutenberg; conversor e JSON do repositório são GPL-2.0. Preparar texto original separadamente se necessário.
- mahavivo/english-dictionary: sem licença; contém dicionários comerciais. Não usar.
- dolph/dictionary: sem licença; listas de palavras sem definições. Não usar como fonte de conteúdo.
