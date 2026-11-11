import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Explicit source allowlist: never enumerate node_modules, dist or local state.
const directories = ['src', 'public', 'tests', 'docs', '.github', 'scripts'];
const rootFiles = ['.gitignore', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'README.md', 'PLANNING.md'];
const paths = [...rootFiles];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Revise o link simbólico antes de publicar: ' + path);
    if (entry.isDirectory()) await walk(path);
    else paths.push(path);
  }
}
for (const directory of directories) await walk(directory);
const secretPatterns = [
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /AKIA[A-Z0-9]{16}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/,
];
const files = [];
for (const path of paths.sort()) {
  if (/(^|\/)\.env(?:\.|$)|\.(pem|key|p12|pfx|tmp|temp|log|tsbuildinfo)$/.test(path)) throw new Error('Arquivo privado/temporário na seleção: ' + path);
  const bytes = await readFile(join(process.cwd(), path));
  const content = bytes.toString('utf8');
  if (secretPatterns.some(pattern => pattern.test(content))) throw new Error('Possível segredo detectado. Revise localmente: ' + path);
  if (content.includes('\u0000') || !Buffer.from(content, 'utf8').equals(bytes)) throw new Error('O arquivo exige upload binário separado: ' + path);
  const sha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  files.push({ path, bytes: bytes.length, sha, content });
}
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(files));
else {
  console.log(files.length + ' arquivos de código/documentação selecionados.');
  console.log('Total: ' + files.reduce((total, file) => total + file.bytes, 0) + ' bytes.');
  console.log('Sem node_modules, dist, arquivos de ambiente ou estado local.');
  console.log('Nenhum dos padrões conhecidos de segredo foi encontrado; isso não substitui revisão humana.');
  for (const file of files) console.log(file.path);
}
