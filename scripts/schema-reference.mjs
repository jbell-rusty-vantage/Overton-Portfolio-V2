import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const source = readFileSync('prisma/schema.prisma', 'utf8');
const models = [...source.matchAll(/((?:\/\/\/[^\n]*\n)*)model (\w+) \{([\s\S]*?)\n\}/g)];
mkdirSync('docs/reference', { recursive: true });
writeFileSync('docs/reference/schema.md', '# Generated Prisma schema reference\n\nSource: [schema.prisma](../../prisma/schema.prisma). Regenerate with `node scripts/schema-reference.mjs`. This reference describes structure, not publication or migration policy.\n\n' + models.map(([, comments, name, body]) => `## ${name}\n\n${comments.replace(/^\/\/\/ ?/gm, '')}\n\n\`\`\`prisma\nmodel ${name} {${body}\n}\n\`\`\`\n`).join('\n'));
console.log(`${models.length} model definitions generated`);
