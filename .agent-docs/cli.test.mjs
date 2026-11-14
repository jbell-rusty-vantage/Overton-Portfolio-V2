import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync, rmSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { replaceBlock, run, search } from './cli.mjs';

function removeFixture(root) {
  const target = resolve(root);
  assert.equal(resolve(target, '..'), resolve(tmpdir()));
  assert.match(target.slice(resolve(tmpdir()).length + 1), /^agent-docs-[a-z-]+[a-zA-Z0-9]+$/);
  rmSync(target, { recursive: true, force: true });
}

function write(root, path, content) {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), content);
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'agent-docs-test-'));
  t.after(() => removeFixture(root));
  write(root, 'README.md', '# Example\nUseful docs.\n');
  write(root, 'package.json', '{"scripts":{"test":"never executed"}}\n');
  const config = { version: 1, id: 'example', purpose: 'An example service.', lifecycle: 'Test fixture.', budgetBytes: 8192, rules: ['Keep identity stable.'], commands: ['npm test'], docs: [{ path: 'README.md', task: 'Read first' }], watch: ['package.json'], decisions: [], ciWorkflow: '.github/workflows/agent-docs.yml' };
  const save = () => write(root, '.agent-docs/config.json', JSON.stringify(config));
  save();
  return { root, config, save, execute: (command) => run({ command, scope: 'repo', root }) };
}

test('build is reproducible, and a second build does not touch files', (t) => {
  const f = fixture(t);
  f.execute('build');
  const before = statSync(join(f.root, 'AGENTS.md')).mtimeMs;
  assert.deepEqual([f.execute('build').changed, f.execute('check').exitCode, statSync(join(f.root, 'AGENTS.md')).mtimeMs], [[], 0, before]);
});

test('authored bytes and framework markers survive a generated block refresh', () => {
  const before = '# Authored\r\n<!-- BEGIN:nextjs-agent-rules -->\r\nCustom rule\r\n<!-- END:nextjs-agent-rules -->\r\n';
  const once = replaceBlock(before, 'old', 'agent-docs');
  assert.equal(replaceBlock(once, 'new', 'agent-docs'), `${before}\n<!-- BEGIN GENERATED: agent-docs -->\nnew\n<!-- END GENERATED: agent-docs -->\n`);
});

for (const content of ['<!-- BEGIN GENERATED: agent-docs -->', '<!-- END GENERATED: agent-docs -->\n<!-- BEGIN GENERATED: agent-docs -->', '<!-- BEGIN GENERATED: agent-docs --', '<!-- BEGIN GENERATED: agent-docs --><!-- END GENERATED: agent-docs --><!-- BEGIN GENERATED: agent-docs --><!-- END GENERATED: agent-docs -->']) {
  test(`malformed marker rejected: ${content.slice(0, 45)} (${content.length})`, () => {
    assert.throws(() => replaceBlock(content, 'new', 'agent-docs'), /Malformed|Reversed/);
  });
}

test('a changed source is reported without rewriting authored docs', (t) => {
  const f = fixture(t);
  f.execute('build');
  write(f.root, 'README.md', '# Changed behavior\n');
  assert.deepEqual(f.execute('check').drift, ['.agent-docs/provenance.json']);
});

test('missing input fails before writing any output', (t) => {
  const f = fixture(t);
  f.config.docs.push({ path: 'missing.md', task: 'Missing' }); f.save();
  assert.throws(() => f.execute('build'), /ENOENT/);
  assert.equal(existsSync(join(f.root, 'AGENTS.md')), false);
});

test('oversized instruction output preserves previous files', (t) => {
  const f = fixture(t);
  f.execute('build');
  const original = readFileSync(join(f.root, 'AGENTS.md'), 'utf8');
  f.config.budgetBytes = 10; f.save();
  assert.throws(() => f.execute('build'), /budget/);
  assert.equal(readFileSync(join(f.root, 'AGENTS.md'), 'utf8'), original);
});

for (const path of ['outputs/data.md', 'artifacts/runs/one.md', '.env', 'node_modules/next/docs.md', '../outside.md', 'docs/*.md', 'docs/key.pem']) {
  test(`forbidden input cannot be read: ${path}`, (t) => {
    const f = fixture(t);
    f.config.watch.push(path); f.save();
    assert.throws(() => f.execute('build'), /Excluded|Unsafe/);
  });
}

test('artifact trees are never enumerated or included in provenance', (t) => {
  const f = fixture(t);
  write(f.root, 'outputs/deep/artifacts/large.json', 'x'.repeat(2 * 1024 * 1024));
  write(f.root, '.env', 'DO_NOT_READ=secret');
  f.execute('build');
  const provenance = JSON.parse(readFileSync(join(f.root, '.agent-docs/provenance.json')));
  assert.deepEqual(Object.keys(provenance.inputs), ['.agent-docs/config.json', 'README.md', 'package.json']);
});

test('symlinked document directories cannot escape the repository', (t) => {
  const f = fixture(t);
  const external = mkdtempSync(join(tmpdir(), 'agent-docs-outside-'));
  t.after(() => removeFixture(external));
  write(external, 'readme.md', 'outside');
  symlinkSync(external, join(f.root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  f.config.watch.push('linked/readme.md'); f.save();
  assert.throws(() => f.execute('build'), /Symlinks/);
});

test('oversized selected files are rejected', (t) => {
  const f = fixture(t);
  write(f.root, 'README.md', 'x'.repeat(1024 * 1024 + 1));
  assert.throws(() => f.execute('check'), /Input must be a file/);
});

test('duplicate document identities fail validation', (t) => {
  const f = fixture(t);
  f.config.docs.push(f.config.docs[0]); f.save();
  assert.throws(() => f.execute('check'), /Duplicate documentation/);
});

test('build respects an existing lock', (t) => {
  const f = fixture(t);
  write(f.root, '.agent-docs/update.lock', 'another process');
  assert.throws(() => f.execute('build'), /Could not acquire/);
});

test('open decisions are visible in audit but do not fail freshness check', (t) => {
  const f = fixture(t);
  f.config.decisions = ['Ownership needs review']; f.save(); f.execute('build');
  assert.deepEqual([f.execute('check').exitCode, f.execute('audit').decisions], [0, [{ repository: 'example', description: 'Ownership needs review' }]]);
});

test('vendored executable works in a separate checkout with no sibling dependencies', (t) => {
  const f = fixture(t); f.execute('build');
  const isolated = mkdtempSync(join(tmpdir(), 'agent-docs-isolated-'));
  t.after(() => removeFixture(isolated));
  cpSync(f.root, isolated, { recursive: true });
  const result = spawnSync(process.execPath, [join(isolated, '.agent-docs/cli.mjs'), 'check', '--repo', isolated, '--format', 'json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('CLI has distinct exit codes for drift and invalid configuration', (t) => {
  const f = fixture(t); f.execute('build');
  const cli = join(f.root, '.agent-docs/cli.mjs');
  write(f.root, 'README.md', 'new');
  const drift = spawnSync(process.execPath, [cli, 'check', '--repo', f.root]);
  const invalid = spawnSync(process.execPath, [cli, 'check', '--repo', f.root, '--unknown', 'x']);
  assert.deepEqual([drift.status, invalid.status], [1, 2]);
});

function workspaceFixture(t) {
  const f = fixture(t);
  const root = mkdtempSync(join(tmpdir(), 'agent-docs-workspace-'));
  t.after(() => removeFixture(root));
  cpSync(f.root, join(root, 'example'), { recursive: true });
  const manifest = { version: 1, budgetBytes: 8192, template: 'ai-engineer-meta/docs/agents/workspace/ROOT-TEMPLATE.md', repositories: [{ path: 'example' }], otherDirectories: [{ path: 'ai-engineer-meta', purpose: 'sources' }, { path: '.agent-docs', purpose: 'locks' }] };
  const save = () => write(root, 'ai-engineer-meta/docs/agents/workspace/workspace.json', JSON.stringify(manifest));
  save(); write(root, manifest.template, '# Workspace\n');
  return { root, manifest, save, execute: (command) => run({ command, scope: 'workspace', root }) };
}

test('workspace build is reproducible and bootstraps the root instructions', (t) => {
  const f = workspaceFixture(t); f.execute('build');
  assert.deepEqual([f.execute('check').exitCode, f.execute('build').changed], [0, []]);
});

test('missing required repository does not partially write a workspace', (t) => {
  const f = workspaceFixture(t);
  f.manifest.repositories.push({ path: 'missing' }); f.save();
  assert.throws(() => f.execute('build'), /ENOENT/);
  assert.equal(existsSync(join(f.root, 'example/AGENTS.md')), false);
});

test('duplicate repository mapping is rejected', (t) => {
  const f = workspaceFixture(t);
  f.manifest.repositories.push({ path: 'example' }); f.save();
  assert.throws(() => f.execute('build'), /Duplicate/);
});

test('new top-level directories are reported without descending into them', (t) => {
  const f = workspaceFixture(t); f.execute('build');
  write(f.root, 'new-repo/outputs/huge.txt', 'x');
  assert.deepEqual(f.execute('audit').unknownDirectories, ['new-repo']);
});

test('CRLF checkouts remain fresh without rewriting authored bytes', (t) => {
  const f = fixture(t); f.execute('build');
  for (const path of ['README.md', 'package.json', '.agent-docs/config.json', 'AGENTS.md', '.agent-docs/provenance.json', '.agent-docs/cli.mjs', '.agent-docs/.gitignore', '.github/workflows/agent-docs.yml']) {
    write(f.root, path, readFileSync(join(f.root, path), 'utf8').replace(/\r?\n/g, '\r\n'));
  }
  assert.deepEqual(f.execute('check').drift, []);
});

test('scheduled wrapper emits changed findings once and then stays quiet', (t) => {
  const f = workspaceFixture(t); f.execute('build');
  write(f.root, 'new-repo/example.md', 'new inventory');
  const script = resolve(import.meta.dirname, 'audit-job.mjs');
  const first = spawnSync(process.execPath, [script, '--workspace', f.root], { encoding: 'utf8' });
  const second = spawnSync(process.execPath, [script, '--workspace', f.root], { encoding: 'utf8' });
  assert.deepEqual([first.status, JSON.parse(first.stdout).unknownDirectories, second.status, second.stdout], [1, ['new-repo'], 1, '']);
});

test('workspace refreshes shared snapshots while isolated repos keep their pinned content', (t) => {
  const f = workspaceFixture(t);
  f.manifest.repositories[0].snapshots = [{ source: 'ai-engineer-meta/shared.md', target: 'docs/agents/shared/terms.md' }]; f.save();
  write(f.root, 'ai-engineer-meta/shared.md', 'accepted terms v1');
  const repoRoot = join(f.root, 'example');
  const config = JSON.parse(readFileSync(join(repoRoot, '.agent-docs/config.json')));
  config.docs.push({ path: 'docs/agents/shared/terms.md', task: 'Vocabulary' });
  write(repoRoot, '.agent-docs/config.json', JSON.stringify(config));
  f.execute('build');
  write(f.root, 'ai-engineer-meta/shared.md', 'accepted terms v2');
  assert.equal(run({ command: 'check', scope: 'repo', root: repoRoot }).exitCode, 0);
  assert.ok(f.execute('check').drift.includes('example/docs/agents/shared/terms.md'));
  f.execute('build');
  assert.match(readFileSync(join(repoRoot, 'docs/agents/shared/terms.md'), 'utf8'), /accepted terms v2/);
});

test('snapshot generation cannot overwrite an authored file', (t) => {
  const f = workspaceFixture(t);
  f.manifest.repositories[0].snapshots = [{ source: 'ai-engineer-meta/shared.md', target: 'docs/agents/shared/terms.md' }]; f.save();
  write(f.root, 'ai-engineer-meta/shared.md', 'source');
  write(f.root, 'example/docs/agents/shared/terms.md', '# Authored terms');
  assert.throws(() => f.execute('build'), /Refusing to replace authored snapshot/);
});

function semanticFixture(t) {
  const f = fixture(t);
  f.config.codeMap = '.agent-docs/modules.json';
  f.config.docs[0].status = 'accepted';
  f.config.docs[0].modules = ['application'];
  f.save();
  const semantic = {
    version: 1,
    groups: [{ path: 'packages', summary: 'Use cases and domain primitives.', inventory: 'directories' }],
    routes: [{ task: 'Change use-case behavior', modules: ['application', 'domain'] }],
    modules: ['application', 'domain'].map((id) => ({ id, path: `packages/${id}`, kind: 'package', state: 'implemented', summary: `${id} behavior owner`, entrypoints: [`packages/${id}/src/index.ts`], interface: [`${id} facade`], packageJson: `packages/${id}/package.json`, uses: [], constraints: [], tests: [] })),
  };
  for (const module of semantic.modules) {
    write(f.root, module.entrypoints[0], 'export const value = 1;\n');
    write(f.root, module.packageJson, JSON.stringify({ name: `@example/${module.id}`, exports: { '.': './dist/index.js' }, dependencies: module.id === 'application' ? { '@example/domain': 'workspace:*' } : {}, scripts: { test: 'never executed' } }));
  }
  const saveSemantic = () => write(f.root, f.config.codeMap, JSON.stringify(semantic));
  saveSemantic();
  return { ...f, semantic, saveSemantic };
}

test('semantic map links implementation, declared dependencies, and accepted architecture', (t) => {
  const f = semanticFixture(t); f.execute('build');
  const map = readFileSync(join(f.root, 'docs/agents/CODE-MAP.md'), 'utf8');
  assert.ok(map.includes('packages/application/src/index.ts') && map.includes('**Declared internal package dependencies:** [domain](#domain)') && map.includes('[accepted] [`README.md`]'));
});

test('package dependency changes update the map without executing package scripts', (t) => {
  const f = semanticFixture(t); f.execute('build');
  write(f.root, 'packages/application/package.json', JSON.stringify({ name: '@example/application', dependencies: { fastify: '5' }, scripts: { test: 'DO NOT EXECUTE' } }));
  assert.ok(f.execute('check').drift.includes('docs/agents/CODE-MAP.md'));
  f.execute('build');
  assert.match(readFileSync(join(f.root, 'docs/agents/CODE-MAP.md'), 'utf8'), /Other runtime dependencies:\*\* fastify/);
});

test('new package directory is reported rather than assigned an invented summary', (t) => {
  const f = semanticFixture(t); f.execute('build');
  write(f.root, 'packages/unknown/package.json', '{}');
  assert.deepEqual(f.execute('check').unmappedModules, ['example/packages/unknown']);
});

test('excluded artifact directory under an inventoried source root is not traversed', (t) => {
  const f = semanticFixture(t);
  write(f.root, 'packages/artifacts/deep/large.json', 'x'.repeat(2 * 1024 * 1024));
  f.execute('build');
  assert.equal(f.execute('check').exitCode, 0);
});

test('missing semantic source fails before maps are generated', (t) => {
  const f = semanticFixture(t);
  f.semantic.modules[0].entrypoints = ['packages/application/missing.ts']; f.saveSemantic();
  assert.throws(() => f.execute('build'), /ENOENT/);
  assert.equal(existsSync(join(f.root, 'packages/AGENTS.md')), false);
});

test('canonical document cannot reference an unknown module', (t) => {
  const f = semanticFixture(t);
  f.config.docs[0].modules = ['invented']; f.save();
  assert.throws(() => f.execute('build'), /Unknown architecture module/);
});

test('proposed documents retain their status in repository and module guidance', (t) => {
  const f = semanticFixture(t);
  f.config.docs[0].status = 'proposed'; f.save(); f.execute('build');
  assert.ok(readFileSync(join(f.root, 'AGENTS.md'), 'utf8').includes('[proposed]') && readFileSync(join(f.root, 'docs/agents/CODE-MAP.md'), 'utf8').includes('[proposed]'));
});

test('duplicate semantic identities and unresolved runtime relationships fail', (t) => {
  const f = semanticFixture(t);
  f.semantic.modules[0].uses = ['not-present']; f.saveSemantic();
  assert.throws(() => f.execute('build'), /Unknown semantic dependency/);
  f.semantic.modules[0].uses = [];
  f.semantic.modules[1].id = 'application'; f.saveSemantic();
  assert.throws(() => f.execute('build'), /Duplicate or invalid semantic module ID/);
});

test('module implementation changes trigger provenance review without inventing new interface text', (t) => {
  const f = semanticFixture(t); f.execute('build');
  write(f.root, 'packages/application/src/index.ts', 'export const value = 2;\n');
  assert.deepEqual(f.execute('check').drift, ['.agent-docs/provenance.json']);
});

test('semantic source paths cannot enter output directories', (t) => {
  const f = semanticFixture(t);
  f.semantic.modules[0].entrypoints = ['outputs/generated.ts']; f.saveSemantic();
  assert.throws(() => f.execute('build'), /Excluded path/);
});

test('semantic map and directory guides preserve authored text on refresh', (t) => {
  const f = semanticFixture(t);
  write(f.root, 'packages/AGENTS.md', '# Local rule\nKeep this.\n'); f.execute('build');
  f.semantic.modules[0].summary = 'Refined reviewed responsibility'; f.saveSemantic(); f.execute('build');
  assert.ok(readFileSync(join(f.root, 'packages/AGENTS.md'), 'utf8').startsWith('# Local rule\nKeep this.\n'));
});

test('semantic generation remains idempotent', (t) => {
  const f = semanticFixture(t); f.execute('build');
  assert.deepEqual([f.execute('build').changed, f.execute('check').exitCode], [[], 0]);
});

function knowledgeFixture(t) {
  const f = fixture(t);
  f.config.knowledge = { root: 'knowledge', routes: [{ task: 'Retry a failed operation', concepts: ['retry'] }] };
  f.config.docs.push({ path: 'knowledge/retry.md', task: 'Retry semantics', status: 'reference' });
  write(f.root, 'knowledge/retry.md', '---\ntype: workflow\ntitle: Retry and cancellation\ndescription: Preserve operation identity during recovery.\ntags: [retry, recovery]\ncustom: {future: true}\n---\n# Retry\nA retry keeps its identity; cancellation stops future work.\n[Evidence](../src/worker.ts)\n');
  write(f.root, 'src/worker.ts', 'export const attempts = 3;\n');
  f.save();
  return f;
}

test('OKF concepts generate compact routes, an index and evidence provenance without corpus duplication', (t) => {
  const f = knowledgeFixture(t);
  f.execute('build');
  const guide = readFileSync(join(f.root, 'AGENTS.md'), 'utf8');
  assert.match(guide, /Business logic and workflows \(OKF\)/);
  assert.match(guide, /cli.mjs search --repo/);
  assert.doesNotMatch(guide, /A retry keeps its identity/);
  assert.equal(guide.split('knowledge/retry.md').length - 1, 1);
  const index = readFileSync(join(f.root, 'knowledge/index.md'), 'utf8');
  assert.match(index, /\[Retry and cancellation\]\(retry.md\)/);
  const provenance = JSON.parse(readFileSync(join(f.root, '.agent-docs/provenance.json')));
  assert.ok(provenance.knowledge.inputs['src/worker.ts']);
  assert.deepEqual([f.execute('build').changed, f.execute('check').exitCode], [[], 0]);
});

test('cited evidence changes require freshness review without rewriting authored prose', (t) => {
  const f = knowledgeFixture(t); f.execute('build');
  write(f.root, 'src/worker.ts', 'export const attempts = 4;\n');
  assert.deepEqual(f.execute('check').drift, ['.agent-docs/provenance.json']);
});

for (const [name, content, error] of [
  ['missing frontmatter', '# Retry', /frontmatter/],
  ['missing type', '---\ntitle: Retry\ndescription: Retry\n---\n', /OKF type/],
  ['malformed YAML', '---\ntype: [broken\n---\n', /flow collection/],
  ['duplicate key', '---\ntype: workflow\ntype: concept\n---\n', /duplicated mapping/],
  ['non-string type', '---\ntype: 12\n---\n', /OKF type/],
  ['missing local profile title', '---\ntype: workflow\n---\n', /Navigation requires/],
]) {
  test(`knowledge rejects ${name} before writing outputs`, (t) => {
    const f = knowledgeFixture(t); write(f.root, 'knowledge/retry.md', content);
    assert.throws(() => f.execute('build'), error);
    assert.equal(existsSync(join(f.root, 'AGENTS.md')), false);
  });
}

test('unknown OKF fields and types and multiline YAML descriptions are supported', (t) => {
  const f = knowledgeFixture(t);
  write(f.root, 'knowledge/retry.md', '---\ntype: My Custom Concept\ntitle: "Retries: safely"\ndescription: >-\n  Preserve identity\n  across retries.\nfuture_field:\n  nested: value\n---\n# Retry\n[Source](../README.md)\n');
  assert.equal(f.execute('build').exitCode, 0);
  assert.match(readFileSync(join(f.root, 'knowledge/index.md'), 'utf8'), /Preserve identity across retries/);
});

test('search ranks intent metadata over body-only mentions and returns current line numbers', (t) => {
  const f = knowledgeFixture(t);
  f.config.docs.push({ path: 'knowledge/other.md', task: 'Other' }); f.save();
  write(f.root, 'knowledge/other.md', '---\ntype: concept\ntitle: Storage\ndescription: Store bytes.\n---\n# Storage\nRetry cancellation\n');
  const result = search({ root: f.root, query: 'retry cancellation', limit: 1 });
  assert.equal(result.total, 2);
  assert.equal(result.results[0].path, 'knowledge/retry.md');
  assert.equal(result.results[0].snippets[0].line, 9);
  assert.equal(search({ root: f.root, query: 'retry', type: 'concept' }).results[0].path, 'knowledge/other.md');
  assert.equal(search({ root: f.root, query: 'retry', tag: 'recovery' }).total, 1);
  assert.equal(search({ root: f.root, query: 'absentterm' }).exitCode, 1);
  assert.throws(() => search({ root: f.root, query: '', limit: 5 }), /query/);
  assert.throws(() => search({ root: f.root, query: 'retry', limit: 100 }), /limit/);
});

for (const [target, error] of [['../missing.ts', /ENOENT/], ['../../outside.ts', /escapes/], ['../.env', /Excluded/], ['../AGENTS.md', /generated guidance/]]) {
  test(`knowledge evidence rejects ${target}`, (t) => {
    const f = knowledgeFixture(t);
    const path = join(f.root, 'knowledge/retry.md');
    writeFileSync(path, readFileSync(path, 'utf8') + `\n[Bad](${target})\n`);
    assert.throws(() => f.execute('build'), error);
  });
}

test('unregistered concepts and unknown routes cannot disappear from navigation', (t) => {
  const f = knowledgeFixture(t);
  write(f.root, 'knowledge/unregistered.md', '# Forgotten');
  assert.throws(() => f.execute('build'), /Unregistered knowledge/);
  f.config.knowledge.routes[0].concepts = ['missing']; f.save();
  assert.throws(() => f.execute('build'), /Unknown concept/);
});

test('knowledge status cannot contradict registry authority', (t) => {
  const f = knowledgeFixture(t);
  const path = join(f.root, 'knowledge/retry.md');
  writeFileSync(path, readFileSync(path, 'utf8').replace('type: workflow', 'type: workflow\nstatus: accepted'));
  assert.throws(() => f.execute('build'), /status disagrees/);
});

test('vendored knowledge search and build run without source repo or dependencies', (t) => {
  const f = knowledgeFixture(t); f.execute('build');
  const isolated = mkdtempSync(join(tmpdir(), 'agent-docs-knowledge-'));
  t.after(() => removeFixture(isolated));
  cpSync(f.root, isolated, { recursive: true });
  for (const args of [['check', '--repo', isolated], ['search', '--repo', isolated, '--query', 'retry', '--format', 'json']]) {
    const result = spawnSync(process.execPath, [join(isolated, '.agent-docs/cli.mjs'), ...args], { encoding: 'utf8', timeout: 10000, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    if (args[0] === 'search') assert.equal(JSON.parse(result.stdout).results[0].path, 'knowledge/retry.md');
  }
});

test('frontmatter-only local sources are validated and fingerprinted; external sources do not trigger network reads', (t) => {
  const f = knowledgeFixture(t);
  write(f.root, 'knowledge/retry.md', '---\ntype: concept\ntitle: Source metadata\ndescription: Evidence in frontmatter.\nsources:\n  - resource: ../src/worker.ts\n  - resource: https://example.com/spec\n---\n# Source\n');
  f.execute('build');
  const provenance = JSON.parse(readFileSync(join(f.root, '.agent-docs/provenance.json')));
  assert.ok(provenance.knowledge.inputs['src/worker.ts']);
  assert.equal(Object.keys(provenance.knowledge.inputs).length, 2);
  write(f.root, 'src/worker.ts', 'changed');
  assert.deepEqual(f.execute('check').drift, ['.agent-docs/provenance.json']);
});

test('navigation profile requires source evidence and rejects malformed sources', (t) => {
  const f = knowledgeFixture(t);
  const prefix = '---\ntype: concept\ntitle: Example\ndescription: Example description.\n';
  write(f.root, 'knowledge/retry.md', `${prefix}---\n# No evidence\n`);
  assert.throws(() => f.execute('build'), /requires local source evidence/);
  write(f.root, 'knowledge/retry.md', `${prefix}sources: [{title: missing resource}]\n---\n`);
  assert.throws(() => f.execute('build'), /requires a resource/);
  write(f.root, 'knowledge/retry.md', `${prefix}sources: [{resource: ../missing.ts}]\n---\n`);
  assert.throws(() => f.execute('build'), /ENOENT/);
});

test('knowledge concept and aggregate evidence sizes are bounded', (t) => {
  const f = knowledgeFixture(t);
  const path = join(f.root, 'knowledge/retry.md');
  const original = readFileSync(path, 'utf8');
  writeFileSync(path, original + 'x'.repeat(65536));
  assert.throws(() => search({ root: f.root, query: 'retry' }), /64 KiB/);
  const links = [];
  for (let index = 0; index < 9; index++) {
    write(f.root, `src/evidence-${index}.ts`, 'x'.repeat(1024 * 1024));
    links.push(`[Evidence ${index}](../src/evidence-${index}.ts)`);
  }
  writeFileSync(path, original + links.join('\n'));
  assert.throws(() => f.execute('build'), /8 MiB total/);
  assert.equal(existsSync(join(f.root, 'AGENTS.md')), false);
});


test('context reports changed and missing evidence without treating hashes as semantic approval', (t) => {
  const f = knowledgeFixture(t); f.execute('build');
  const options = { root: f.root, command: 'context', query: 'retry' };
  assert.equal(search(options).results[0].evidence[0].freshness, 'unchanged');
  write(f.root, 'src/worker.ts', 'changed implementation');
  assert.equal(search(options).results[0].evidence[0].freshness, 'changed');
  rmSync(join(f.root, 'src/worker.ts'));
  assert.equal(search(options).results[0].evidence[0].freshness, 'missing');
});

test('context rejects forbidden evidence even when ordinary search can read its concept', (t) => {
  const f = knowledgeFixture(t);
  const path = join(f.root, 'knowledge/retry.md');
  writeFileSync(path, readFileSync(path, 'utf8') + '\n[Secret](../.env)\n');
  assert.throws(() => search({ root: f.root, command: 'context', query: 'retry' }), /Excluded/);
});

test('portable context command emits bounded sections as JSON without sibling dependencies', (t) => {
  const f = knowledgeFixture(t); f.execute('build');
  const result = spawnSync(process.execPath, [join(f.root, '.agent-docs/cli.mjs'), 'context', '--repo', f.root, '--query', 'retry', '--format', 'json'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  const packet = JSON.parse(result.stdout);
  assert.equal(packet.results[0].sections[0].heading, 'Retry');
  assert.equal(packet.results[0].evidence[0].freshness, 'unchanged');
  assert.throws(() => search({ root: f.root, command: 'context', query: 'retry', limit: 6 }), /Context limit/);
});


test('hidden navigation documents remain selected evidence and detect changed bytes', (t) => {
  const f = fixture(t);
  f.config.docs.push({ path: 'docs/historical.md', task: 'Historical context', navigation: false });
  write(f.root, 'docs/historical.md', '# Historic rule\n');
  f.save(); f.execute('build');
  const guide = readFileSync(join(f.root, 'AGENTS.md'), 'utf8');
  assert.doesNotMatch(guide, /historical\.md|Historical context/);
  const provenance = readFileSync(join(f.root, '.agent-docs/provenance.json'), 'utf8');
  assert.match(provenance, /docs\/historical\.md/);
  write(f.root, 'docs/historical.md', '# Updated historic rule\n');
  assert.ok(f.execute('check').drift.includes('.agent-docs/provenance.json'));
});

test('navigation visibility rejects nonboolean configuration', (t) => {
  const f = fixture(t); f.config.docs[0].navigation = 'false'; f.save();
  assert.throws(() => f.execute('check'), /navigation must be boolean/);
});


test('portable retrieval tests run against the vendored frozen corpus without siblings', (t) => {
  const f = knowledgeFixture(t); f.execute('build');
  const result = spawnSync(process.execPath, ['--test', join(f.root, '.agent-docs/retrieval.test.mjs')], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const provenance = JSON.parse(readFileSync(join(f.root, '.agent-docs/provenance.json'), 'utf8'));
  assert.ok(provenance.generator.supportSha256['fixtures/ks-context-v1/queries.json']);
});
