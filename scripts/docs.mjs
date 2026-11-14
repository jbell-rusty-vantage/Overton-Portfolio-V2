// Repository profile around the unmodified, pinned portable generator.
import { readFileSync, lstatSync, readdirSync, existsSync } from 'node:fs';
import { resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load, JSON_SCHEMA } from '../.agent-docs/vendor/js-yaml.mjs';
import { search } from '../.agent-docs/cli.mjs';
import { queryTokens } from '../.agent-docs/knowledge.mjs';

/** Avoid presenting a single generic word as an answer to a multi-word question. */
export function profileSearch(options) {
  guard(options.root);
  const result = search(options);
  if (queryTokens(options.query).length >= 3) result.results = result.results.filter(r => r.matchedTerms.length >= 2);
  result.exitCode = result.results.length ? 0 : 1;
  result.noAnswer = result.results.length === 0;
  return result;
}

export function assertPublicPath(root, path) {
  const parts = path.split('/');
  if (!path || path.includes('\\') || parts.some(p => !p || p === '.' || p === '..') ||
      /^(?:\.local-library|\.env[^/]*|\.vercel|node_modules|\.next[^/]*|content\/(?:projects|media-src|media-out)|lib\/generated|docs\/(?:archive|releases)|test-results|playwright-report)(?:\/|$)/i.test(path) ||
      !/^(?:knowledge\/|app\/|components\/|lib\/|scripts\/|tests\/|prisma\/|assets\/.+\.(?:json|md)$|content\/.+\.json$|docs\/(?:operations|reference|adr)\/|\.agent-docs\/|(?:HANDOFF|README|AGENTS|CLAUDE)\.md$|package\.json$)/.test(path)) throw Error('Private or unregistered evidence path: ' + path);
  let current = root;
  for (const part of parts) {
    current = resolve(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw Error('Symlink evidence escape: ' + path);
  }
  if (!existsSync(current) || !lstatSync(current).isFile() || lstatSync(current).size > 1024 * 1024) throw Error('Missing or oversized evidence: ' + path);
  return current;
}

export function guard(root) {
  const read = path => readFileSync(assertPublicPath(root, path), 'utf8');
  const config = JSON.parse(read('.agent-docs/config.json'));
  if (config.knowledge?.root !== 'knowledge') throw Error('Only the registered knowledge bundle may be searched');
  const registry = JSON.parse(read(config.codeMap));
  for (const path of [...config.watch, ...config.docs.map(d => d.path), ...registry.modules.flatMap(m => [...m.entrypoints, ...m.tests])]) assertPublicPath(root, path);
  const owners = new Set(registry.modules.map(m => m.id));
  const registered = new Set(config.docs.filter(d => d.path.startsWith('knowledge/')).map(d => d.path));
  for (const entry of readdirSync(resolve(root, 'knowledge'), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error('Symlink in knowledge bundle');
    if (entry.name !== 'index.md' && !registered.has('knowledge/' + entry.name)) throw Error('Unregistered concept: ' + entry.name);
  }
  for (const doc of config.docs.filter(d => d.path.startsWith('knowledge/'))) {
    const text = read(doc.path), match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) throw Error('Missing YAML: ' + doc.path);
    const meta = load(match[1], { schema: JSON_SCHEMA });
    if (!meta?.owner || !owners.has(meta.owner) || !Array.isArray(meta.tags) || !meta.sources?.length || !meta.implementation_status || !meta.validation_status) throw Error('Incomplete concept profile: ' + doc.path);
    if (meta.status && meta.status !== doc.status) throw Error('Registry status mismatch: ' + doc.path);
    const ids = meta.sources.map(s => s.id);
    if (new Set(ids).size !== ids.length) throw Error('Duplicate source ID: ' + doc.path);
    const links = [...text.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)].map(m => m[1]);
    for (const link of [...meta.sources.map(s => s.resource), ...links]) {
      if (/^(?:https?:|mailto:|#)/.test(link)) continue;
      const path = posix.normalize(posix.join(posix.dirname(doc.path), decodeURIComponent(link.split('#')[0])));
      assertPublicPath(root, path);
    }
  }
  return config;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
    guard(root);
    const [command, ...args] = process.argv.slice(2);
    if (!['build', 'check', 'search', 'context', 'audit'].includes(command)) throw Error('Choose build, check, search, context or audit');
    if (args.includes('--repo') || args.includes('--workspace')) throw Error('The repository profile fixes its own root');
    if (command === 'search' || command === 'context') {
      const options = { command, root, format: 'text' };
      for (let i = 0; i < args.length; i += 2) {
        if (!['--query', '--limit', '--type', '--tag', '--format'].includes(args[i]) || !args[i + 1]) throw Error('Invalid search option');
        options[args[i].slice(2)] = args[i] === '--limit' ? Number(args[i + 1]) : args[i + 1];
      }
      const result = profileSearch(options);
      console.log(options.format === 'json' ? JSON.stringify(result, null, 2) : result.noAnswer ? 'No answer in the current registered knowledge bundle.' : result.results.map(r => `${r.path}: ${r.title}\n${JSON.stringify(r.snippets ?? r.sections)}`).join('\n'));
      process.exit(result.exitCode);
    }
    const result = spawnSync(process.execPath, [resolve(root, '.agent-docs/cli.mjs'), command, '--repo', root, ...args], { stdio: 'inherit', windowsHide: true });
    process.exitCode = result.status ?? 2;
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
