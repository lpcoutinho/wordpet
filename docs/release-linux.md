# Release Linux do wordpet

Gera os três instaladores Linux (`.deb`, `.rpm` e `.AppImage`) a partir de uma versão semver. O atalho `npm run release:linux` usa `scripts/release-linux.mjs`: ele valida e atualiza a versão nos cinco arquivos do projeto, roda os testes, compila os bundles e copia os artefatos com `SHA256SUMS`.

## Atalho

```bash
nvm use
npm run release:linux -- 0.2.0
```

Ensaio sem alterar arquivos nem compilar:

```bash
npm run release:linux -- 0.2.0 --dry-run
```

Resultado: `releases/v0.2.0/` com `wordpet_0.2.0_amd64.deb`, `wordpet-0.2.0-1.x86_64.rpm`, `wordpet_0.2.0_amd64.AppImage` e `SHA256SUMS`.

## O que o script faz

1. Exige Linux e Node >= 24 (`.nvmrc`); falha com mensagem clara se estiver fora disso.
2. Verifica se a versão atual é a mesma em `package.json`, `package-lock.json` (raiz e workspace), `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` e `src-tauri/Cargo.lock`. Se divergir, para antes de escrever.
3. Valida `X.Y.Z` e exige que seja maior que a versão atual (sem sufixos como `-rc`).
4. Faz backup dos cinco arquivos em `backups/<versao-antiga>-<timestamp>/` (nomes achatados, ex.: `src-tauri__Cargo.toml`).
5. Roda `npm test`. Só depois atualiza os arquivos de versão; se alguma escrita falhar, restaura o backup.
6. Roda `npm run tauri build -- --bundles deb,rpm,appimage`.
7. Copia os três artefatos para `releases/v<versao>/` e gera `SHA256SUMS`.

Se o build falhar depois do bump, a versão permanece atualizada nos arquivos e o caminho do backup é impresso. `backups/` e `releases/` estão no `.gitignore` — artefatos e backups são locais, não versionados.

> Para Windows, veja [build-windows.md](./build-windows.md); este script é Linux-only.

## Pré-requisitos

- Node 24.22.3 (`nvm use`), npm e Rust/Cargo 1.95.0 (ver `rust-version` em `src-tauri/Cargo.toml`).
- Dependências de build Tauri no Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`.
- ~1 GB livres em disco e 1-2 minutos de build.
- Para compatibilidade, compile na distro mais antiga que pretende suportar (ex.: Ubuntu 22.04/Debian 12). Um `.deb` feito em distro mais nova pode exigir glibc mais novo que o dos usuários.
- Os pacotes **não são assinados**. `SHA256SUMS` serve só para conferir integridade local; para distribuição pública, assine `.deb`/`.rpm` com sua chave e o AppImage com GPG.

## Processo manual (sem o script)

Use quando quiser controlar cada passo:

```bash
nvm use
# edite manualmente a versão X.Y.Z nos 5 arquivos listados acima
npm test
npm run tauri build -- --bundles deb,rpm,appimage
mkdir -p releases/v0.2.0
cp src-tauri/target/release/bundle/deb/wordpet_0.2.0_amd64.deb releases/v0.2.0/
cp src-tauri/target/release/bundle/rpm/wordpet-0.2.0-1.x86_64.rpm releases/v0.2.0/
cp src-tauri/target/release/bundle/appimage/wordpet_0.2.0_amd64.AppImage releases/v0.2.0/
cd releases/v0.2.0 && sha256sum wordpet_* > SHA256SUMS
```

Atenção aos nomes: `.deb` e `.AppImage` usam `_amd64`; `.rpm` usa `-1.x86_64`.

## Instalar e testar localmente

```bash
sudo apt install ./wordpet_0.2.0_amd64.deb
sudo dnf install ./wordpet-0.2.0-1.x86_64.rpm
chmod +x wordpet_0.2.0_amd64.AppImage
./wordpet_0.2.0_amd64.AppImage
```

O `.deb` declara dependência de `libwebkit2gtk-4.1-0`, `libgtk-3-0` e `libayatana-appindicator3-1`. Após instalar, confira: splash com o pet na abertura, cartão com o pet ao lado da pergunta e persistência entre execuções.

## Versionamento

- Semver `X.Y.Z`, sempre crescente. A versão aparece nos nomes dos arquivos e nos metadados dos pacotes.
- `bundle.targets` em `src-tauri/tauri.conf.json` já inclui `nsis` e `msi` para Windows, mas este script gera apenas Linux; MSI exige runner Windows/WiX.
- O aviso do Tauri sobre `com.wordpet.app` terminar em `.app` é específico do bundle macOS e não afeta estes pacotes.

## Problemas comuns

- `Node >= 24 obrigatório`: rode `nvm use` (o Node padrão do sistema é 22).
- `Versões divergentes`: alinhe os cinco arquivos, especialmente `package-lock.json`, que costuma ficar em `0.0.0` após bump manual.
- Erro do `webkit2gtk-sys`/`gdk-sys`: instale as dependências de build listadas acima.
- AppImage falha por FUSE: rode `./wordpet_0.2.0_amd64.AppImage --appimage-extract-and-run` ou instale `fuse`.
- Conferir checksums: `cd releases/v0.2.0 && sha256sum -c SHA256SUMS`.
