import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { guard, assertPublicPath, profileSearch } from '../../scripts/docs.mjs';
import { run } from '../../.agent-docs/cli.mjs';
import { load } from '../../.agent-docs/vendor/js-yaml.mjs';

test('current documentation links resolve without relying on archived instructions', () => {
  const config = guard(process.cwd());
  const paths = ['README.md', 'HANDOFF.md', 'docs/README.md', ...config.docs.map(d => d.path), 'knowledge/index.md'];
  for (const file of new Set(paths)) {
    const text = readFileSync(file, 'utf8').replace(/```[^\n]*\n[\s\S]*?```/g, '');
    for (const match of text.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(match[1])) continue;
      const [relative, anchor] = match[1].split('#');
      const target = resolve(file, '..', decodeURIComponent(relative));
      const content = readFileSync(target, 'utf8');
      if (anchor) {
        const headings = [...content.matchAll(/^#+ (.+)$/gm)].map(m => m[1].toLowerCase().replace(/[^\w -]/g, '').replace(/ /g, '-'));
        assert.ok(headings.includes(anchor) || content.includes(`id="${anchor}"`), `${file}: ${match[1]}`);
      }
    }
  }
});

test('registered corpus is public, parsed and reproducibly generated', () => {
  guard(process.cwd());
  assert.equal(run({ command: 'check', scope: 'repo', root: process.cwd() }).exitCode, 0);
  for (const path of ['AGENTS.md', 'app/AGENTS.md', 'components/AGENTS.md', 'lib/AGENTS.md', 'scripts/AGENTS.md', 'tests/AGENTS.md']) assert.ok(readFileSync(path).length <= 8192, path);
  assert.ok(readFileSync('HANDOFF.md').length <= 4096);
  assert.match(readFileSync('AGENTS.md', 'utf8'), /BEGIN:nextjs-agent-rules/);
});

test('private paths and YAML ambiguity are rejected before retrieval', () => {
  for (const path of ['.env.local', '.local-library/release/baseline.json', '.vercel/project.json', 'content/projects/writing.json', 'lib/generated/prisma/client.ts', 'docs/archive/pre-cleanup/HANDOFF.md', '../secrets', '/absolute']) assert.throws(() => assertPublicPath(process.cwd(), path));
  assert.throws(() => load('owner: first\nowner: duplicate\n'));
  assert.throws(() => load('owner: [broken\n'));
  const dir = mkdtempSync(join(tmpdir(), 'overton-docs-'));
  try {
    mkdirSync(join(dir, 'knowledge'));
    writeFileSync(join(dir, 'outside.md'), 'private');
    symlinkSync(join(dir, 'outside.md'), join(dir, 'knowledge', 'escape.md'));
    assert.throws(() => assertPublicPath(dir, 'knowledge/escape.md'), /Symlink/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('frozen Overton retrieval cases find current owners and explicitly miss unknown topics', () => {
  const fixtures = JSON.parse(readFileSync('tests/docs/retrieval-cases.json'));
  const rows = fixtures.cases.map(c => {
    const start = performance.now();
    const result = profileSearch({ command: 'search', root: process.cwd(), query: c.query, limit: 3 });
    const ms = performance.now() - start;
    const hit = c.expectedConcepts.length ? result.results.some(r => c.expectedConcepts.includes(r.id)) : result.results.length === 0;
    return { id: c.id, partition: c.partition, hit, safetyCritical: c.safetyCritical, ms, bytes: Buffer.byteLength(JSON.stringify(result)), results: result.results.map(r => r.id) };
  });
  mkdirSync('.local-library/cleanup', { recursive: true });
  writeFileSync('.local-library/cleanup/retrieval-results.json', JSON.stringify({ labels: fixtures.labels, rows }, null, 2));
  for (const row of rows.filter(r => r.safetyCritical)) assert.ok(row.hit, JSON.stringify(row));
  assert.ok(rows.filter(r => r.hit).length / rows.length >= .9, JSON.stringify(rows.filter(r => !r.hit)));
  assert.ok(rows.every(r => r.ms < 1000));
});

test('isolated repository copy builds twice and detects source drift', () => {
  const root = mkdtempSync(join(tmpdir(), 'overton-isolated-docs-'));
  try {
    const config = guard(process.cwd());
    const modules = JSON.parse(readFileSync('.agent-docs/modules.json'));
    // Only registered public text is copied; no owner content or environment files.
    const paths = new Set(['AGENTS.md', 'CLAUDE.md', ...config.watch, ...config.docs.map(d => d.path), ...modules.modules.flatMap(m => [...m.entrypoints, ...m.tests])]);
    cpSync('.agent-docs', join(root, '.agent-docs'), { recursive: true });
    for (const group of modules.groups) mkdirSync(join(root, group.path), { recursive: true });
    for (const path of paths) { mkdirSync(join(root, path, '..'), { recursive: true }); cpSync(path, join(root, path)); }
    for (const command of ['build', 'check', 'build', 'check']) assert.equal(run({ command, scope: 'repo', root }).exitCode, 0);
    const path = join(root, modules.modules[0].entrypoints[0]);
    writeFileSync(path, readFileSync(path, 'utf8') + '\n// drift fixture\n');
    assert.notEqual(run({ command: 'check', scope: 'repo', root }).exitCode, 0);
    const registryPath = join(root, '.agent-docs/modules.json');
    const invalid = JSON.parse(readFileSync(registryPath));
    invalid.modules[1].id = invalid.modules[0].id;
    writeFileSync(registryPath, JSON.stringify(invalid));
    assert.throws(() => run({ command: 'build', scope: 'repo', root }), /Duplicate/);
  } finally {
    assert.ok(resolve(root).startsWith(resolve(tmpdir())));
    rmSync(root, { recursive: true, force: true });
  }
});
