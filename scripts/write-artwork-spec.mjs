// Source of the cover and architecture-plate specifications. Run to regenerate content/artwork.json,
// then `node scripts/render-artwork.mjs` to draw the files in public/library/artwork/.
import { writeFile } from "node:fs/promises";

const cover = (slug, title, subtitle, kicker, emblem, cloth) => ({ slug, title, subtitle, kicker, emblem, cloth });
const covers = [
  cover("agentic-mission-control", "Mission Control", "Durable multi-agent missions on Temporal", "AI & Agent Systems", "orbits", "green"),
  cover("ai-engineer-platform", "AI Engineer Platform", "A learning platform built to be used by agents", "AI & Agent Systems", "compass", "navy"),
  cover("polymarket-mcp-server", "Polymarket MCP Server", "Market data and gated order tools for agents", "AI & Agent Systems", "candles", "slate"),
  cover("biotech-research-ingestion", "Biotech Research Ingestion", "Approved plans run as staged research missions", "AI & Agent Systems", "dag", "oxblood"),
  cover("agent-knowledge-services", "Knowledge Services", "Evidence capture, verification and retrieval for agents", "Data & Knowledge", "lattice", "oxblood"),
  cover("ai-engineer-worldsfair-showcase", "AI Engineer Research Library", "1,007 conference talks, researched by a pipeline", "Data & Knowledge", "wheel", "plum"),
  cover("biotech-knowledge-platform", "Biotech Knowledge Platform", "A knowledge graph agents write through intents", "Data & Knowledge", "helix", "teal"),
  cover("vantage-lead-analytics", "Lead Analytics", "Cost, source and sales reporting for a moving company", "Data & Knowledge", "funnel", "ochre"),
  cover("human-upgrade-ingestion-pipeline", "Podcast Ingestion Pipeline", "An archive scraped into structured records on AWS", "Data & Knowledge", "broadcast", "moss"),
  cover("the-library", "The Library", "A portfolio you can walk through", "Web Applications", "arch", "green"),
  cover("overtech-digital-services", "Overtech Digital Services", "A studio site with an owner’s desk behind it", "Web Applications", "dividers", "oxblood"),
  cover("vantage-movers", "Vantage Movers", "Lead capture, CRM and owner tooling for a moving company", "Client Work", "route", "navy"),
  cover("gowipe", "GoWipe", "A Shopify storefront and its conversion tracking", "Client Work", "droplet", "teal"),
  cover("daryl-davis", "Daryl Davis", "A speaker and author’s site for books and bookings", "Client Work", "microphone", "plum"),
];

const n = (name, note, accent) => ({ name, ...(note ? { note } : {}), ...(accent ? { accent: true } : {}) });
const D = (slug, title, caption, footer, columns) => ({
  slug, title, caption, footer,
  columns: columns.map(([label, ...nodes]) => ({ label, nodes })),
});
const diagrams = [
  D("agentic-mission-control", "Mission Control", "A mission is data. Temporal schedules it; PostgreSQL remembers it.", "Python 3.12 · Temporal · PostgreSQL 17 · FastAPI · MCP", [
    ["Author", n("Mission manifest", "YAML: goal, program tree, outputs, budgets"), n("Operator surfaces", "HTTP API, missionctl CLI, two MCP servers")],
    ["Admit", n("Compiler and admission", "Resolves lanes, models and capabilities; stores an immutable, digested revision"), n("Transactional outbox", "The only way work reaches the scheduler")],
    ["Schedule", n("Temporal workflows", "Stage Graph and Goal Loop; replay-tested", true), n("Pure interpreters", "Propose transitions; reducers settle them")],
    ["Execute", n("Provider lanes", "Deep Agents, Claude Agent SDK, Codex, Cursor behind one contract"), n("Cognition points", "State as of any step; fork, inject, interrupt")],
    ["Judge", n("Output contracts", "Named promises, digest-pinned revisions"), n("Independent verifier", "Never judges its own output"), n("Human review", "Approval bound to the exact packet")],
  ]),
  D("ai-engineer-platform", "AI Engineer Platform", "One set of product operations, reachable from a web app, a CLI and an agent.", "PostgreSQL / Supabase · TypeScript · Fastify · MCP", [
    ["Clients", n("Web app shell", "Next.js"), n("aieng CLI", "Typed client"), n("Coding agents", "MCP tools and an agent skill")],
    ["Service", n("Operation catalog", "69 operations validated with Zod"), n("HTTP API and MCP server", "The same application layer behind both", true)],
    ["Database contract", n("Command and read functions", "Permissions and audit enforced in SQL"), n("Sealed revisions and events", "Every change is recorded"), n("Guarded installer", "Plan, apply and verify against a named target")],
    ["Knowledge supply", n("Cloud agent repository", "Agents lease one video and research it"), n("Deterministic executor", "Applies only approved intents"), n("Schema workspace", "Regenerated for agents after each change")],
  ]),
  D("polymarket-mcp-server", "Polymarket MCP Server", "Reads are open to the agent. Orders pass through gates.", "TypeScript · pnpm workspace · Express 5 · MCP Streamable HTTP", [
    ["Agent", n("MCP client", "Cursor or any MCP-capable agent")],
    ["Server", n("MCP app", "64 tools over Streamable HTTP", true), n("Shared schemas", "Zod input and output contracts")],
    ["Client library", n("Rate limiter", "A slot per endpoint group"), n("API surfaces", "Gamma, Data and CLOB"), n("Realtime managers", "WebSocket market and user feeds")],
    ["Order path", n("Validate and preview", "Intent checked before anything is signed"), n("Execution gates", "Mode and live flags from the environment"), n("Approval step", "Required before a live order")],
    ["Polymarket", n("Markets and order books"), n("Positions and trades"), n("Order placement")],
  ]),
  D("biotech-research-ingestion", "Biotech Research Ingestion", "A plan is approved by a person, then run as a staged workflow.", "Python · FastAPI · Temporal · LangGraph · MongoDB · Neo4j", [
    ["Conversation", n("Next.js dashboard", "Chat over Socket.IO"), n("Coordinator agent", "Drafts a research plan")],
    ["Approval", n("Human-in-the-loop gate", "The run pauses until the plan is approved, edited or rejected", true)],
    ["Mission", n("Temporal workflow", "Stages grouped into dependency levels"), n("Parallel activities", "Retries and heartbeats per stage")],
    ["Research", n("Stage agents", "Tools, subagents and memory"), n("Reports", "Passed forward to dependent stages")],
    ["Store", n("S3 and MongoDB", "Reports and run records"), n("Neo4j graph", "Entities and relationships merged with provenance")],
  ]),
  D("agent-knowledge-services", "Knowledge Services", "Agents submit intents. The service checks, applies and returns receipts.", "TypeScript monorepo · Fastify · MCP · PostgreSQL 17 · pgvector", [
    ["Callers", n("Research agents", "Claude Code, Cursor, Codex, Mission Control workers"), n("Transports", "HTTP, MCP, CLI and A2A over one application layer")],
    ["Capture", n("Source capture", "Immutable bytes with lineage"), n("Selectors", "Exact quotes located in the captured bytes")],
    ["Verify", n("Ordered verification", "Integrity, mechanical checks, semantic judgment, policy", true), n("Sealed run", "The result cannot be edited afterwards")],
    ["Ingest", n("Plan", "Writes nothing"), n("Apply once", "An identical replay returns the recorded receipt"), n("Verification ledger", "Operations, receipts and outbox in Postgres")],
    ["Retrieve", n("Prepare and publish", "Convert, chunk, embed, evaluate"), n("Evidence packets", "Search results with replayable citations")],
  ]),
  D("ai-engineer-worldsfair-showcase", "AI Engineer Research Library", "Nine pipeline stages turn a transcript into a published brief.", "Vercel Eve · AI Gateway · Supabase · Next.js 16", [
    ["Intake", n("Channel catalog sync", "Videos and metadata"), n("Transcript ingest", "Stored in Supabase")],
    ["Research", n("Transcript analysis", "Sectioned and reduced by the model"), n("Web research", "Organizations and technologies, sources verified", true), n("Receipts", "An immutable artifact per stage")],
    ["Shape", n("Packet converter", "One trimmed brief per talk"), n("Category classifier", "17 engineering categories"), n("Program matcher", "179 World’s Fair 2026 sessions tagged")],
    ["Publish", n("Static site", "Category, talk and search pages"), n("JSON API", "Read-only, no key"), n("Bulk exports", "NDJSON and CSV")],
  ]),
  D("biotech-knowledge-platform", "Biotech Knowledge Platform", "Agents discover the schema, then read and write through validated intents.", "Neo4j 5 · TypeScript · GraphQL · PostgreSQL · MCP", [
    ["Schema", n("Pinned release", "69 node types, 106 relationship types; every byte checked"), n("Schema workspace", "1,035 generated cards for progressive disclosure")],
    ["Discover", n("bks-schema CLI", "search, get, neighbors, path, slice"), n("Query catalog", "157 templates linked to 454 questions")],
    ["Read and write", n("Read intents", "Compiled to fixed Cypher shapes"), n("Plan / apply / receipt", "One Neo4j transaction per admitted intent", true), n("Executor", "HTTP and MCP, 19 tools")],
    ["Consume", n("GraphQL API", "Persisted, reviewed operations only"), n("Product BFF", "Session check and typed client")],
    ["Operate", n("Root installer", "Postgres components and graph release"), n("Evaluation tasks", "134 frozen tasks for agents")],
  ]),
  D("vantage-lead-analytics", "Lead Analytics", "Every lead is attributed, priced and followed to an outcome.", "MongoDB · TypeScript · Vercel Queues and Cron · Google Sheets API", [
    ["Intake", n("Form and call leads", "Each resolved to a paid source and feed"), n("Duplicate and overlap checks", "Kept and tagged, never dropped")],
    ["Price", n("Cost schedule", "Effective-dated cost per lead by feed", true), n("Evidence", "CRM observations and call-log records linked to the lead")],
    ["Outcome", n("Bookings", "Deposits and agent allocations"), n("Cancellations", "A snapshot of what was lost")],
    ["Project", n("Sheets outbox", "Write-behind queue with a five-minute drain"), n("Report deliveries", "Checksum-bound runs"), n("Nightly backup", "Cloud Run job to Cloud Storage")],
    ["Answer", n("Insights dashboard", "Spend, conversion and sales credit"), n("16 named reports", "Aggregated on request"), n("MCP tools", "The same reads for an assistant")],
  ]),
  D("human-upgrade-ingestion-pipeline", "Podcast Ingestion Pipeline", "Two stages: discover every episode, then enrich each one.", "Python · Playwright · aiohttp · MongoDB · S3 · ECS Fargate · AWS CDK", [
    ["Trigger", n("Lambda orchestrator", "Manual invoke or a daily schedule"), n("ECS RunTask", "Operation chosen by environment")],
    ["Discover", n("Headless Chromium", "Expands the archive and collects episode URLs"), n("Episode registry", "Deterministic IDs and a scrape state machine", true)],
    ["Signal", n("EventBridge bus", "One event per discovered episode"), n("SQS queue", "With a dead-letter queue")],
    ["Enrich", n("Rate-limited fetch", "aiohttp with a per-host limiter"), n("Parsing workers", "HTML parsed in a process pool")],
    ["Store", n("MongoDB documents", "Structured episode records"), n("S3 transcripts", "One file per episode"), n("CloudWatch logs", "Structured throughout")],
  ]),
  D("the-library", "The Library", "The room is built in Blender; what sits on the shelves comes from Postgres.", "Next.js 16 · React Three Fiber · Prisma 7 · PostgreSQL · Blender", [
    ["Build the room", n("Blender scene script", "Generates the hall and its named anchors"), n("Asset packer", "Meshopt compression, glTF validation, anchor check")],
    ["Curate", n("Admin office", "Projects, books, pages and shelf positions"), n("Audit and revisions", "Every write is recorded")],
    ["Project", n("Visibility policy", "Display state, publication date, client redaction", true), n("Block allowlist", "Only supported, browser-safe content leaves the server")],
    ["Visit", n("3D hall", "Two detail tiers chosen for the device"), n("Reader", "Opens a volume from its binding"), n("Text catalog", "Works without JavaScript or WebGL")],
  ]),
  D("overtech-digital-services", "Overtech Digital Services", "A visitor’s inquiry becomes a booked call the owner can act on.", "Node.js (no framework) · Neon Postgres · Drizzle · Cal.com · Resend", [
    ["Visitor", n("Cases and tool library", "Read through restricted database views"), n("Inquiry form", "Validated and throttled")],
    ["Booking", n("Cal.com link", "Carries the lead ID"), n("Signed webhook", "HMAC verified, replays de-duplicated", true)],
    ["Follow-up", n("Mail queue", "Idempotent sends; failures stay queued"), n("Owner dashboard", "Google sign-in checked against an allowlist")],
    ["Research reader", n("Episode import", "A validated archive from Mission Control"), n("Published episode", "Findings, citations and review history")],
    ["Release", n("Allowlisted build", "Only named files ship"), n("Restricted role", "The site reads through 31 views")],
  ]),
  D("vantage-movers", "Vantage Movers", "From a quote request to a booked move, in one system of record.", "Next.js 16 · Express 5 · MongoDB Atlas · Vercel Queues · MCP", [
    ["Capture", n("Landing pages and main site", "Quote forms for each lead partner"), n("Inbound calls", "Qualified from the phone system’s call log")],
    ["Record", n("Main server", "System of record for leads, bookings and cancellations", true), n("Duplicate detection", "Runs at intake")],
    ["Sell", n("CRM posting", "Each new lead is sent to the sales CRM"), n("Browser extension", "Reads the open job and applies a price"), n("Pricing service", "Fixed-point transportation pricing")],
    ["Close", n("Lifecycle evidence", "CRM and call observations"), n("Owner confirmation", "Creates a booking or a cancellation")],
    ["Run the business", n("Admin dashboard", "51 routes for the owner and managers"), n("Sheets projections", "Queue-fed"), n("MCP server", "Agent access to the same data")],
  ]),
  D("gowipe", "GoWipe", "Shopping events flow from the storefront to analytics and ads.", "Shopify Online Store 2.0 · Liquid · Google tag · Judge.me", [
    ["Storefront", n("Home page", "21 sections: range, social video, reviews"), n("Product page", "Variants, subscribe and save")],
    ["Shopper actions", n("Customer events", "View item, add to cart, begin checkout, purchase", true)],
    ["Tracking", n("Web pixels", "Events run in Shopify’s sandbox"), n("Google tag", "Each event mapped to GA4 and an Ads conversion")],
    ["Close the loop", n("Shopify checkout", "The purchase event completes attribution"), n("Reviews", "Collected after purchase and shown on the site")],
  ]),
  D("daryl-davis", "Daryl Davis", "Two visitors, two paths: buy the book, or book the speaker.", "Shopify Online Store 2.0 · Liquid · Shop Pay", [
    ["Arrive", n("Home page", "Stage video, press and audience responses")],
    ["Reader path", n("Book feature", "Cover and purchase action together"), n("Product page", "Signed and unsigned editions"), n("Checkout", "Shopify, with Shop Pay")],
    ["Producer path", n("Media features", "Talks and podcast appearances in a lightbox"), n("Booking forms", "Speaking and music inquiries by type", true)],
    ["Follow-up", n("Inquiry routing", "Requests reach Daryl’s team")],
  ]),
];
await writeFile("content/artwork.json", JSON.stringify({ covers, diagrams }, null, 1));
console.log(covers.length, "covers,", diagrams.length, "plates");
