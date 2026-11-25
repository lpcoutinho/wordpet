import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const VERSION_FILES = [
  'package.json',
  'package-lock.json',
  'src-tauri/tauri.conf.json',
  'src-tauri/Cargo.toml',
  'src-tauri/Cargo.lock',
];

const fail = (message) => {
  console.error(`\nErro: ${message}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter((arg) => !arg.startsWith('--'));
const unknown = args.filter((arg) => arg.startsWith('--') && arg !== '--dry-run');
const nextVersion = positional[0];

if (unknown.length > 0) fail(`flags desconhecidas: ${unknown.join(', ')}`);
if (!nextVersion || positional.length > 1) {
  fail('Uso: npm run release:linux -- <X.Y.Z> [--dry-run]');
}
if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  fail('Versão inválida. Use semver X.Y.Z (ex.: 0.2.0).');
}
if (process.platform !== 'linux') fail('Este script gera bundles Linux; rode em Linux.');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 24) {
  fail(`Node >= 24 obrigatório (.nvmrc). Atual: ${process.version}. Rode "nvm use" antes.`);
}

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');

const cargoVersion = (text) => {
  const match = text.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) throw new Error('version não encontrada em Cargo.toml');
  return match[1];
};

const lockVersion = (text) => {
  const match = text.match(/\[\[package\]\]\nname = "wordpet"\nversion = "([^"]+)"/);
  if (!match) throw new Error('pacote wordpet não encontrado em Cargo.lock');
  return match[1];
};

let current;
try {
  const packageJson = JSON.parse(await read('package.json'));
  const packageLock = JSON.parse(await read('package-lock.json'));
  const tauri = JSON.parse(await read('src-tauri/tauri.conf.json'));
  current = {
    'package.json': packageJson.version,
    'package-lock.json (root)': packageLock.version,
    'package-lock.json (workspace)': packageLock.packages?.['']?.version,
    'src-tauri/tauri.conf.json': tauri.version,
    'src-tauri/Cargo.toml': cargoVersion(await read('src-tauri/Cargo.toml')),
    'src-tauri/Cargo.lock': lockVersion(await read('src-tauri/Cargo.lock')),
  };
} catch (error) {
  fail(`Não foi possível ler as versões: ${error.message}`);
}

const unique = [...new Set(Object.values(current))];
if (unique.length !== 1) {
  console.error('\nVersões divergentes. Corrija antes de continuar:');
  for (const [file, value] of Object.entries(current)) console.error(`  ${file}: ${value}`);
  process.exit(1);
}
const previousVersion = unique[0];

const compare = (a, b) => {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
};
if (compare(nextVersion, previousVersion) <= 0) {
  fail(`A nova versão (${nextVersion}) precisa ser maior que a atual (${previousVersion}).`);
}

const replaceN = (text, needle, replacement, expected) => {
  let result = text;
  let count = 0;
  while (result.includes(needle) && count < expected) {
    result = result.replace(needle, replacement);
    count += 1;
  }
  if (count !== expected) {
    throw new Error(`Esperava ${expected} ocorrência(s) de "${needle}", encontrei ${count}.`);
  }
  return result;
};

let changes;
try {
  changes = {
    'package.json': replaceN(
      await read('package.json'),
      `"version": "${previousVersion}"`,
      `"version": "${nextVersion}"`,
      1,
    ),
    'package-lock.json': replaceN(
      await read('package-lock.json'),
      `"version": "${previousVersion}"`,
      `"version": "${nextVersion}"`,
      2,
    ),
    'src-tauri/tauri.conf.json': replaceN(
      await read('src-tauri/tauri.conf.json'),
      `"version": "${previousVersion}"`,
      `"version": "${nextVersion}"`,
      1,
    ),
    'src-tauri/Cargo.toml': replaceN(
      await read('src-tauri/Cargo.toml'),
      `version = "${previousVersion}"`,
      `version = "${nextVersion}"`,
      1,
    ),
    'src-tauri/Cargo.lock': replaceN(
      await read('src-tauri/Cargo.lock'),
      `name = "wordpet"\nversion = "${previousVersion}"`,
      `name = "wordpet"\nversion = "${nextVersion}"`,
      1,
    ),
  };
} catch (error) {
  fail(`Não foi possível preparar a atualização de versão: ${error.message}`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(ROOT, 'backups', `${previousVersion}-${stamp}`);

console.log(`Release Linux: ${previousVersion} -> ${nextVersion}`);
for (const file of VERSION_FILES) console.log(`  ${file}`);

if (dryRun) {
  console.log('\n[dry-run] nenhum arquivo será alterado e nenhum bundle será gerado.');
  console.log('Comandos que seriam executados:');
  console.log('  npm test');
  console.log('  npm run tauri build -- --bundles deb,rpm,appimage');
  console.log(`\nArtefatos: releases/v${nextVersion}/`);
  process.exit(0);
}

const backupFile = (rel) => path.join(backupDir, rel.replace(/[\\/]/g, '__'));
await mkdir(backupDir, { recursive: true });
for (const rel of VERSION_FILES) await copyFile(path.join(ROOT, rel), backupFile(rel));
console.log(`\nBackup: ${path.relative(ROOT, backupDir)}/`);

const restore = async () => {
  for (const rel of VERSION_FILES) await copyFile(backupFile(rel), path.join(ROOT, rel));
};

const run = (command, commandArgs) => {
  console.log(`\n$ ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} saiu com status ${result.status}`);
};

try {
  run('npm', ['test']);
} catch (error) {
  fail(`Testes falharam; versão não foi alterada. ${error.message}`);
}

try {
  for (const [rel, content] of Object.entries(changes)) {
    await writeFile(path.join(ROOT, rel), content, 'utf8');
  }
} catch (error) {
  await restore();
  fail(`Falha ao atualizar versões; backup restaurado. ${error.message}`);
}

try {
  run('npm', ['run', 'tauri', 'build', '--', '--bundles', 'deb,rpm,appimage']);
} catch (error) {
  console.error(`\nBuild falhou: ${error.message}`);
  console.error(`As versões já estão em ${nextVersion}. Backup em ${path.relative(ROOT, backupDir)}/.`);
  process.exit(1);
}

const bundleRoot = path.join(ROOT, 'src-tauri/target/release/bundle');
const releaseDir = path.join(ROOT, 'releases', `v${nextVersion}`);
await mkdir(releaseDir, { recursive: true });

const specs = [
  { dir: 'deb', suffix: '.deb' },
  { dir: 'rpm', suffix: '.rpm' },
  { dir: 'appimage', suffix: '.AppImage' },
];
const artifacts = [];
try {
  for (const spec of specs) {
    const entries = await readdir(path.join(bundleRoot, spec.dir));
    const matches = entries.filter((name) => name.includes(nextVersion) && name.endsWith(spec.suffix));
    if (matches.length !== 1) {
      throw new Error(`${spec.dir}: esperava 1 artefato ${nextVersion}, encontrei ${matches.length}`);
    }
    const name = matches[0];
    await copyFile(path.join(bundleRoot, spec.dir, name), path.join(releaseDir, name));
    artifacts.push(name);
  }
} catch (error) {
  fail(`Falha ao copiar artefatos: ${error.message}`);
}

const sums = [];
for (const name of artifacts) {
  const bytes = await readFile(path.join(releaseDir, name));
  sums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);
}
await writeFile(path.join(releaseDir, 'SHA256SUMS'), sums.join(''), 'utf8');

console.log(`\nRelease ${nextVersion} pronta em ${path.relative(ROOT, releaseDir)}/`);
for (const name of [...artifacts, 'SHA256SUMS']) console.log(`  ${name}`);
console.log('\nVerificar com: sha256sum -c SHA256SUMS');
