# Build Windows do wordpet

Guia para buildar o projeto numa máquina Windows **sem assistente de IA**. Objetivo: gerar os dois instaladores — `wordpet_<versao>_x64-setup.exe` (NSIS) e `wordpet_<versao>_x64_en-US.msi` (MSI/WiX) — e anotar qualquer problema para trazer de volta e corrigirmos depois.

> O atalho `npm run release:linux` **não funciona no Windows**: ele é Linux-only. Aqui o processo é manual.

## Resumo rápido

Se as ferramentas já estiverem instaladas, no PowerShell dentro da pasta do projeto:

```powershell
npm install
npm test
npm run build
npm run tauri build -- --bundles nsis,msi
```

O `--bundles nsis,msi` é **obrigatório**: `src-tauri/tauri.conf.json:34` também lista `deb`, `rpm` e `appimage`, que não devem ser gerados no Windows.

## 1. O que levar para o Windows

Copie a pasta do projeto, mas **não** é preciso levar `node_modules/`, `src-tauri/target/`, `dist/`, `backups/` ou `releases/` — tudo isso é regenerado.

Não esqueça especialmente:

- `src\content\pack.json` (~70 MB) — sem ele o Vite falha no build.
- `src-tauri\icons\` — ícones do app, bandeja e instaladores.
- `src-tauri\tauri.conf.json`, `src-tauri\Cargo.toml`, `src-tauri\Cargo.lock`.
- `package.json` e `package-lock.json` (as versões precisam estar iguais às dos arquivos acima).
- `.nvmrc` (Node `24.22.3`).

Use um caminho simples, por exemplo `C:\dev\wordpet`. Evite OneDrive/Google Drive: o build cria milhares de arquivos em `src-tauri\target\`.

## 2. Pré-requisitos

### 2.1 Microsoft C++ Build Tools

Baixe o instalador em <https://visualstudio.microsoft.com/visual-cpp-build-tools/> e marque o workload **Desktop development with C++**. O Visual Studio IDE completo não é necessário, apenas as ferramentas de build.

Alternativa via winget:

```powershell
winget install --id Microsoft.VisualStudio.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

### 2.2 WebView2 Runtime

Windows 11 e Windows 10 a partir da versão 1803 já vêm com o runtime. Para confirmar:

```powershell
(Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}').pv
```

Se der erro, instale o **Evergreen Bootstrapper** em <https://developer.microsoft.com/en-us/microsoft-edge/webview2/>.

### 2.3 VBSCRIPT (somente para MSI)

O WiX (usado pelo `.msi`) precisa do recurso opcional **VBSCRIPT**. Em geral já vem habilitado; se aparecer `failed to run light.exe`, vá em **Configurações → Aplicativos → Recursos opcionais → Mais recursos do Windows**, marque **VBSCRIPT** e reinicie.

### 2.4 Rust (toolchain MSVC)

Instale via <https://rustup.rs/> (ou `winget install --id Rustlang.Rustup`). Na instalação padrão, escolha a opção padrão; o host deve ser `x86_64-pc-windows-msvc`. Se estiver diferente:

```powershell
rustup default stable-x86_64-pc-windows-msvc
rustup update stable
```

Feche e reabra o terminal após instalar para o PATH ser atualizado.

### 2.5 Node 24

O projeto exige Node >= 24 (`.nvmrc` = `24.22.3`). Use o nvm-windows (`nvm install 24.22.3` e `nvm use 24.22.3`) ou o instalador x64 de <https://nodejs.org/>. O Node padrão do sistema, se for 22, **não atende** ao `engines` do `package.json`.

### 2.6 WiX e NSIS

Não instale WiX manualmente. O Tauri CLI baixa o WiX v3 e o NSIS na primeira build e guarda no cache do usuário; é necessário ter internet nesse primeiro build. Se estiver atrás de proxy, configure `HTTPS_PROXY` ou ative `bundle.useLocalToolsDir` no `tauri.conf.json` para cachear em `src-tauri\target\.tauri\`.

## 3. Conferir o ambiente

```powershell
node -v
npm -v
rustc -V
cargo -V
rustup show
npx tauri --version
```

Esperado: Node `v24.x`, `rustc` >= `1.95.0` (exigido por `src-tauri/Cargo.toml`), `Default host: x86_64-pc-windows-msvc` no `rustup show`.

## 4. Build

### 4.1 Se for gerar uma versão nova

Atualize o mesmo `X.Y.Z` nos cinco lugares (hoje todos em `0.1.0`):

| Arquivo | Campo |
| --- | --- |
| `package.json` | `"version"` da raiz |
| `package-lock.json` | `"version"` da raiz **e** de `packages[""].version` |
| `src-tauri/tauri.conf.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version = "..."` em `[package]` |
| `src-tauri/Cargo.lock` | `version` do pacote `wordpet` |

Use apenas `X.Y.Z` (sem `-beta`, sem `-rc`): o MSI rejeita prerelease. A versão deve ser sempre maior que a anterior, senão o Windows Installer entende que já está instalado e não substitui os arquivos.

### 4.2 Comandos

```powershell
cd C:\dev\wordpet
npm install
npm test
npm run build
npm run tauri build -- --bundles nsis,msi
```

Para gerar só um formato:

```powershell
npm run tauri build -- --bundles nsis
npm run tauri build -- --bundles msi
```

Para testar o executável sem instalar:

```powershell
.\src-tauri\target\release\wordpet.exe
```

## 5. Onde estão os artefatos

| Artefato | Caminho |
| --- | --- |
| Executável solto | `src-tauri\target\release\wordpet.exe` |
| Instalador NSIS | `src-tauri\target\release\bundle\nsis\wordpet_<versao>_x64-setup.exe` |
| Instalador MSI | `src-tauri\target\release\bundle\msi\wordpet_<versao>_x64_en-US.msi` |

Exemplo com a versão atual: `wordpet_0.1.0_x64-setup.exe` e `wordpet_0.1.0_x64_en-US.msi`.

## 6. Checklist de teste no Windows

- [ ] A janela abre no canto inferior direito, acima da taskbar, sem borda e sempre no topo.
- [ ] O splash com o pet e a barra aparece na abertura e desaparece sem “tela parada”.
- [ ] O cartão mostra o pet ao lado da pergunta; ao responder há feedback e XP.
- [ ] Feche e reabra: XP/sequência persistiram (ver atenção especial abaixo).
- [ ] O ícone do pet aparece na bandeja do sistema e no atalho do instalador.
- [ ] O NSIS instala sem pedir administrador (padrão `currentUser`); o MSI pede UAC (padrão por máquina).
- [ ] Desinstalar e reinstalar funciona.
- [ ] Aviso do SmartScreen aparece na instalação (esperado: os binários não estão assinados). Anote o texto exato.

## 7. O que trazer de volta

Preencha isto e cole junto com o relato. **Copie as mensagens de erro exatas**, sem resumir:

```text
Data/hora:
Windows (winver):
node -v:
npm -v:
rustc -V:
cargo -V:
rustup show -> Default host:
npx tauri --version:
WebView2 (.pv):
Comando executado:
Erro exato (copiar/colar):
Caminho dos artefatos gerados:
Checklist acima: item / OK ou falha
Screenshots (se tiver):
```

## 8. Atenção especial: cabeçalhos COOP/COEP

`vite.config.ts:3-6` define `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` **apenas para `server` e `preview` do Vite**. Em produção, o Tauri serve `dist/` pelo protocolo próprio, e a documentação oficial exige esses cabeçalhos em `app.security.headers` para isolamento de origem cruzada (necessário para OPFS/SharedArrayBuffer usados pelo sqlite-wasm).

Hoje `src-tauri/tauri.conf.json:28-30` tem somente `"csp": null`. Se o progresso **não persistir** após fechar/reabrir, ou aparecer erro de `crossOriginIsolated`/OPFS/SharedArrayBuffer, traga o erro — a correção provável é adicionar:

```json
"security": {
  "csp": null,
  "headers": {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
}
```

Não altere isso agora só para “prevenir”: primeiro confirme o comportamento no Windows e traga a evidência.

## 9. Problemas comuns

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| `link.exe not found` / erro de linker | Build Tools C++ ausentes | Instale o workload e reabra o terminal |
| `cargo` não é reconhecido | PATH do rustup não carregou | Feche e abra um novo PowerShell |
| `npm.ps1 não pode ser carregado` | Política de execução do PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ou use `cmd` |
| `failed to run light.exe` | VBSCRIPT desabilitado | Habilite o recurso do Windows e reinicie |
| Falha ao baixar WiX/NSIS | Sem internet ou proxy | Configure `HTTPS_PROXY` ou `useLocalToolsDir: true` |
| Erro de formato de versão no MSI | Versão com sufixo prerelease | Use `X.Y.Z` |
| MSI novo não substitui arquivos | Mesma versão já instalada | Aumente a versão ou desinstale antes |
| `frontendDist`/`pack.json` não encontrado | Cópia incompleta do projeto | Copie `src\content\pack.json` e `dist` é gerado pelo build |
| Aviso do SmartScreen | Instalador não assinado | Esperado; anote, assinatura fica para depois |

## 10. Referências oficiais

- Pré-requisitos: <https://v2.tauri.app/start/prerequisites>
- Instaladores Windows: <https://v2.tauri.app/distribute/windows-installer>
- Cabeçalhos HTTP: <https://v2.tauri.app/security/http-headers>
- WebView2: <https://developer.microsoft.com/en-us/microsoft-edge/webview2/>
- C++ Build Tools: <https://visualstudio.microsoft.com/visual-cpp-build-tools/>
