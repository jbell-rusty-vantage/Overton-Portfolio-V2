// Source-grounded reading maps, not screenshots or claims of hosted qualification.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const maps = {
  "vantage-movers": ["A quote and its record", ["Quote request", "Attributed Form Lead", "CRM payload", "Booking record", "Cancellation record"]],
  "gowipe": ["A storefront event trail", ["Choose a product", "Choose a pack", "Add to cart", "Shopify pixel events"]],
  "overtech-digital-services": ["Inspect a research finding", ["Captured source", "Finding + citation", "Source excerpt", "Verifier + review"]],
  "agentic-mission-control": ["From task to acceptance", ["Mission manifest", "Deep Agents execution", "Required outputs", "Independent verification", "Human review"]],
  "agent-knowledge-services": ["Evidence before admission", ["Source + selector", "Deterministic checks", "Verification result", "Exact-use decision", "Admit the bound effect"]],
  "ai-engineer-platform": ["One operation, three clients", ["HTTP API · MCP · CLI", "Shared product service", "Database-owned rules", "Evidence + retained bytes"]],
};
await mkdir("public/library/artwork", { recursive: true });
for (const [slug, [title, nodes]] of Object.entries(maps)) {
  const h = 200 + nodes.length * 172;
  const boxes = nodes.map((label, i) => {
    const y = 160 + i * 172;
    return `<rect x="50" y="${y}" width="800" height="128" rx="3" fill="${i === nodes.length - 1 ? "#263a32" : "#e8ecdf"}" stroke="#a5b39b"/><text x="86" y="${y + 76}" fill="${i === nodes.length - 1 ? "#ced8c1" : "#667a59"}" font-size="28">0${i + 1}</text><text x="450" y="${y + 78}" fill="${i === nodes.length - 1 ? "#f6f3eb" : "#263a32"}" text-anchor="middle" font-size="44">${label}</text>${i < nodes.length - 1 ? `<path d="M450 ${y + 130}v34m-9-9 9 9 9-9" fill="none" stroke="#7d8c71" stroke-width="3"/>` : ""}`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${h}" viewBox="0 0 900 ${h}"><rect width="900" height="${h}" fill="#f6f3eb"/><g font-family="Georgia,serif"><text x="50" y="75" font-size="42" fill="#263a32">${title}</text></g><g font-family="Arial,sans-serif">${boxes}</g></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(`public/library/artwork/${slug}-architecture-v3.webp`);
  console.log(`${slug}: ${nodes.length} stages`);
}
