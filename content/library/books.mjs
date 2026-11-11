// The Library's project volumes: public copy, media and placement, authored by hand from verified project notes.
// `node scripts/build-library-content.mjs` turns this into content/library/books.json and prepares the images.
// Keep it public-safe: no customer data, no internal process detail, nothing that is not true today.

const h = (text) => ({ component: "Heading", props: { text } });
const p = (text) => ({ component: "Prose", props: { text } });
const m = (label, text) => ({ component: "Metric", props: { label, text } });
const link = (text, url) => ({ component: "Link", props: { text, url } });
/** An image prepared from content/media-src (or an already rendered artwork file). */
const img = (name, text, src) => ({ image: { name, src }, text });
const plate = (text) => ({ image: { name: "architecture", rendered: true }, text });
/** A recording hosted in Blob; `file` is in content/media-out, `poster` in content/media-src. */
const video = (file, poster, text) => ({ video: { file, poster }, text });

const DEV = "In development";
const LIVE = "Delivered and live";

export const books = [
  // ------------------------------------------------------------------ AI & agent systems
  {
    slug: "agentic-mission-control",
    title: "Mission Control",
    tagline: "A Temporal macro-scheduler and cross-provider agent cognition system",
    summary:
      "Mission Control is a Temporal macro-scheduler and cross-provider agent cognition system. A mission control agent spawns long-running workflows that complete coding and knowledge work, whichever agent framework does the work. It has come a long way and is still in development.",
    status: "active", startedOn: "2026-07-01", shelf: "stacks-ai-agents", position: 1, publishAs: "featured", featuredRank: 1,
    tags: ["In development", "Temporal", "Python", "PostgreSQL", "Multi-agent", "MCP"],
    skills: ["Python", "Temporal", "PostgreSQL", "FastAPI", "LangGraph", "Deep Agents", "Claude Agent SDK", "MCP", "Next.js", "TypeScript"],
    repos: [{ fullName: "jbell-rusty-vantage/agentic-mission-control", role: "agent", primary: true }],
    deployments: [],
    pages: {
      overview: [
        img("episode", "A recorded research mission: one finding shown beside the company page and the paper it cites.", "agentic-mission-control/episode-live.png"),
        m("Status", DEV), m("My role", "Designer and engineer"),
        p("Mission Control is a Temporal macro-scheduler and cross-provider agent cognition system. A mission control agent spawns long-running workflows that complete coding and knowledge work. It has progressed a lot and is still in development."),
        h("The problem"),
        p("Every agent framework ships its own loop, its own session store and its own controls. None of them answers what an operator needs to know about a long, multi-agent job: what was admitted, what state the agent was in at a given step, whether the run can be steered or forked from there, what it promised to deliver, and who judged the result. Moving the same workflow to another provider usually means rewriting the orchestration."),
        h("What I built"),
        p("A control service in which a mission is data. A mission describes a goal, a workflow shape, the agents involved, their capabilities and the outputs they owe. Temporal schedules the work and recovers it after a failure; PostgreSQL holds the authoritative state. Each agent runtime plugs in as a provider lane behind one contract, so the same mission shape can run on LangChain Deep Agents, the Claude Agent SDK, Codex or Cursor."),
        p("Mission control agents understand workflows and the provider-specific cognition inside them: agent skills, MCP servers, plugins, hooks, context transfers, output obligations, and capabilities particular to a provider, such as the to-do list middleware in Deep Agents."),
        p("Mission Control works together with Knowledge Services. Between them they are the interfaces and guidance for turning research into real service data and features."),
      ],
      architecture: [
        plate("How a mission moves from a manifest to a judged result."),
        p("The service is layered so that the rules for interpreting a mission know nothing about databases, Temporal or any provider SDK. Adapters implement those dependencies, and tests enforce the boundary. Temporal is the only scheduler. PostgreSQL holds mission state under a versioned schema that the runtime checks before it starts."),
        h("Main parts"),
        p("Mission manifest. A written description of the mission that is compiled, validated and stored as an immutable revision.\nWorkflows. Two workflow systems run on Temporal: a staged graph and a goal loop that iterates until a verifier is satisfied.\nProvider lanes. One contract in front of several agent runtimes. Deep Agents is the reference lane and the one proven in live runs.\nStep-level control. Each step is recorded, so a run can be read as of any step, forked from it, given a new instruction or interrupted.\nOutput contracts. Outputs are named promises. An independent verifier judges them, and a person can be asked to approve.\nOperator surfaces. An HTTP API, a command-line tool, MCP servers and a live event stream."),
      ],
      notes: [
        p("Execution, fulfilment and approval are recorded as three separate facts. A run can finish without having delivered what it promised, and the system says so."),
        p("An agent that assesses an output is never the agent that produced it. Verification runs in its own session, and can use a different model."),
        p("Nine lane profiles are declared. Deep Agents is live-proven; the Claude Agent SDK and Codex lanes have each run a staged mission; the others are implemented against test fixtures. Each lane states which controls it supports natively, emulates or does not support."),
        p("A recorded end-to-end run is public: a research mission that produced a report and ten source-linked findings from five captured sources, checked by an independent verifier and approved by me."),
      ],
      metrics: [m("Provider lane profiles", "9"), m("Workflow systems", "2"), m("Agent skill bundles", "17"), m("Architecture decision records", "69"), m("Python source modules", "1,063"), m("Findings in the recorded run", "10")],
      gallery: [
        video("agentic-mission-control-reel.mp4", "agentic-mission-control/reel-poster.png", "Walkthrough of the recorded research mission: a finding, its sources, the run timeline and the accepted report."),
        img("case-study", "The published case study introduces the recorded mission.", "agentic-mission-control/case-study.png"),
        img("timeline", "The run timeline steps through the events of the recorded mission.", "agentic-mission-control/episode-timeline.png"),
        img("report", "The accepted report, with each statement linked to its source.", "agentic-mission-control/episode-report.png"),
        img("harness", "Inside the harness: one goal, two agents and one owner decision.", "agentic-mission-control/episode-harness.png"),
      ],
      links: [link("Source repository", "https://github.com/jbell-rusty-vantage/agentic-mission-control")],
    },
    blurb: "This volume is Mission Control, the system John is building to run teams of AI agents as long-running missions on Temporal, whichever agent framework does the work. Open it to see how a mission is scheduled, steered and judged.",
  },
  {
    slug: "ai-engineer-platform",
    title: "AI Engineer Platform",
    tagline: "An educational platform for AI engineering, usable from the web and from coding agents",
    summary:
      "AI Engineer is an educational platform under development. It uses deep research to support course experiences that can be taken on the web and inside coding agent harnesses, with an industry and technical knowledge component. The backend services will be released as MCP servers, an API, an agent skill with a CLI, and the web app. It is partially complete.",
    status: "active", startedOn: "2026-08-14", shelf: "stacks-ai-agents", position: 2, publishAs: "published",
    tags: ["In development", "PostgreSQL", "Supabase", "TypeScript", "MCP", "Education"],
    skills: ["TypeScript", "PostgreSQL", "Supabase", "Fastify", "MCP", "Zod", "Next.js", "Cursor Cloud Agents", "GitHub Actions"],
    repos: [
      { fullName: "jbell-rusty-vantage/ai-engineer-services", role: "api", primary: true },
      { fullName: "jbell-rusty-vantage/agent-engineer-db-contract", role: "data" },
      { fullName: "jbell-rusty-vantage/ai-engineer-cloud-agent-knowledge-repo", role: "agent" },
    ],
    deployments: [],
    pages: {
      overview: [
        m("Status", "In development, partially complete"), m("My role", "Owner and architect"),
        p("AI Engineer is an educational platform that uses deep research to support next-generation course experiences. Courses can be taken on the web and inside coding agent harnesses, and there is an industry and technical knowledge component to it. The backend services will be released as MCP servers, an API, an agent skill with a CLI, and the web app."),
        h("The problem"),
        p("People learning AI engineering do the real work inside coding agents such as Claude Code, Codex and Cursor. Learning platforms live in the browser and cannot see or serve that work. I want a lesson, a note, a project submission and a research report to be the same objects whether they are reached from a web page, an MCP tool or a terminal."),
        h("What is built so far"),
        p("The rules live in the database. A PostgreSQL contract owns permissions, audit, sealed revisions and one command and read interface. A TypeScript product service sits on top of it and exposes the same operations over HTTP, MCP and a CLI. A third repository is the workspace that cloud coding agents open to do sourced research for the knowledge base; a deterministic executor applies only what has been approved."),
        p("The service and database layers have been exercised together in a lab environment. Nothing is deployed for learners yet, and the web app is a shell."),
      ],
      architecture: [
        plate("One set of product operations behind every client."),
        p("Because permissions and audit are enforced below every client, an agent calling an MCP tool is held to the same rules as a person using the web app. An agent can propose; decisions reserved for a person, such as reviews and acceptance, are refused to it."),
        h("Main parts"),
        p("Database contract. Ordered migrations, row-level security and a single command and read interface, installed by a guarded installer.\nProduct service. One operation catalog shared by the HTTP API, the MCP server and the CLI.\nSchema workspace. Pages generated from the live database that tell an agent where an answer lives in a few reads.\nCloud agent repository. The environment and roles research agents work in, one leased video at a time."),
      ],
      notes: [
        p("One operation catalog drives every surface: 69 operations reachable through HTTP, MCP and the CLI through a single interface."),
        p("Uploads are handled on the server: store, read back, hash, then complete. Clients never hold storage credentials."),
        p("I tested whether the generated schema workspace actually helps agents with a three-arm experiment, and changed the workspace when the result showed one of its rules was getting in the way."),
      ],
      metrics: [m("Product operations", "69"), m("MCP tools", "13"), m("Database schemas", "27"), m("Tables and views", "333"), m("Migrations", "193")],
      gallery: [img("course-world", "An early prototype of a course map rendered as a 3D world.", "ai-engineer-platform/course-world.png")],
      links: [
        link("Product service repository", "https://github.com/jbell-rusty-vantage/ai-engineer-services"),
        link("Database contract repository", "https://github.com/jbell-rusty-vantage/agent-engineer-db-contract"),
        link("Cloud agent knowledge repository", "https://github.com/jbell-rusty-vantage/ai-engineer-cloud-agent-knowledge-repo"),
      ],
    },
    blurb: "This is the AI Engineer platform, an educational product John is building so that courses can be taken on the web or from inside a coding agent. It is partially complete; the volume shows the database contract and services underneath it.",
  },
  {
    slug: "polymarket-mcp-server",
    title: "Polymarket MCP Server",
    tagline: "Market data and gated order tools for agents, over the Model Context Protocol",
    summary:
      "A TypeScript MCP server that wraps Polymarket's market, data and order-book APIs as tools an agent can call. An agent can search markets, read order books and positions, and preview orders. Live orders are possible only when environment gates and an approval step allow it. Built in May 2026 and paused.",
    status: "paused", startedOn: "2026-05-04", endedOn: "2026-05-07", shelf: "stacks-ai-agents", position: 3, publishAs: "published",
    tags: ["Earlier work", "TypeScript", "MCP", "Express", "Trading research"],
    skills: ["TypeScript", "MCP", "Express", "Zod", "WebSockets", "Vitest"],
    repos: [], deployments: [],
    pages: {
      overview: [
        m("Status", "Paused"), m("My role", "Sole author"),
        p("A TypeScript workspace that exposes Polymarket's APIs to agents as Model Context Protocol tools served over Streamable HTTP. I built it for my own trading research and as an exercise in making a financial API safe for a model to use."),
        h("The problem"),
        p("Polymarket spreads its functionality across several APIs, each with its own authentication and response shapes. A model cannot use them safely as they are: responses are inconsistent, rate limits differ, and an order tool with no guard lets a model move real funds on a misread prompt."),
        h("What I built"),
        p("A layered workspace in which each concern is its own package: validated configuration, shared input and output schemas, an API client with rate limiting, timeouts and normalized errors, and an MCP app on top. Every tool returns the same envelope, so the model handles one error shape."),
        p("Live execution is deliberately hard to reach. An order tool builds a validated preview, checks the execution mode and live flags, which are all off by default, then asks for approval and validates again before posting."),
      ],
      architecture: [plate("Reads are open to the agent. Orders pass through gates."), p("Requests enter through one MCP endpoint. Each tool validates its input against a shared schema and calls the client library, which queues the call behind a rate limiter for that group of endpoints.")],
      notes: [
        p("Order submission and cancellation are blocked unless the execution mode and the specific live flag are both switched on."),
        p("Approval uses MCP elicitation with a typed schema. For clients that do not support elicitation there are separate tools that keep the server-side validation and the environment gates."),
      ],
      metrics: [m("MCP tools", "64"), m("Workspace packages", "6"), m("Test cases", "53"), m("TypeScript lines", "9,467")],
      links: [],
    },
    blurb: "This shorter volume is an MCP server John wrote to let an agent read prediction markets and, behind several gates, place orders. It is here as an example of making a risky API safe for a model.",
  },
  {
    slug: "biotech-research-ingestion",
    title: "Biotech Research Ingestion",
    tagline: "The first-generation research backend: approved plans run as staged Temporal missions",
    summary:
      "The first generation of my biotech research work. A coordinator agent turns a conversation into a research plan and pauses for a person's approval. The approved plan runs as a Temporal workflow of staged research agents, and results can be written into a Neo4j knowledge graph. It was later superseded by Mission Control and the knowledge services.",
    status: "archived", endedOn: "2026-04-03", shelf: "stacks-ai-agents", position: 4, publishAs: "published",
    tags: ["Earlier work", "Python", "FastAPI", "Temporal", "LangGraph", "Neo4j"],
    skills: ["Python", "FastAPI", "Temporal", "LangChain", "LangGraph", "MongoDB", "Neo4j", "Socket.IO", "Next.js", "AWS S3"],
    repos: [], deployments: [],
    pages: {
      overview: [
        m("Status", "Archived, superseded"), m("My role", "Sole author"),
        p("A Python backend and a Next.js dashboard for deep research on biotech companies. It is the predecessor of Mission Control: the ideas that survived are the approval gate, staged missions and structured results."),
        h("The problem"),
        p("Deep research on a company takes many long, expensive agent runs. As a single agent loop it cannot be restarted, cannot run independent lines of inquiry in parallel, gives the user no say before money is spent, and leaves its results as chat text."),
        h("What I built"),
        p("I separated planning from execution. In chat, a coordinator agent proposes a structured plan and is paused before the plan takes effect. Nothing else happens until the user approves, edits or rejects it. Approval starts a mission."),
        p("A mission is a Temporal workflow. Stages declare what they depend on; the workflow runs independent stages in parallel and passes finished reports to the stages that need them. Reports are stored, and an optional step extracts entities and relationships into a Neo4j graph."),
      ],
      architecture: [plate("A plan is approved by a person, then run as a staged workflow."), p("The API and realtime layer is FastAPI with Socket.IO. Conversations are checkpointed so they survive a restart. Research agents use search, browser automation, document parsing, SEC filings and clinical trial records as separate tools.")],
      notes: [
        p("The approval gate is an interrupt inside the agent run. The coordinator is paused before the plan tool executes and resumed by the same interrupt after approval."),
        p("Graph writes are driven by a schema registry and merged on stable identifiers, so repeating a run does not duplicate entities."),
      ],
      metrics: [m("Python lines", "28,135"), m("API route handlers", "25"), m("Workflow and activity definitions", "14"), m("Dashboard pages", "12")],
      links: [],
    },
    blurb: "This is the first research backend John built, where a person approves a plan before agents spend anything on it. Mission Control grew out of this.",
  },

  // ------------------------------------------------------------------ Data & knowledge
  {
    slug: "agent-knowledge-services",
    title: "Knowledge Services",
    tagline: "Evidence capture, verification, ingestion and retrieval that agents call by contract",
    summary:
      "Knowledge Services is the layer research agents call to capture sources, check claims against what was actually captured, and add only supported knowledge to a store. Together with Mission Control it forms the interfaces and guidance for turning research into real service data and features. In development.",
    status: "active", startedOn: "2026-09-01", shelf: "stacks-data-knowledge", position: 1, publishAs: "published", featuredRank: 3,
    tags: ["In development", "TypeScript", "PostgreSQL", "MCP", "Retrieval", "Verification"],
    skills: ["TypeScript", "PostgreSQL", "pgvector", "Fastify", "MCP", "Zod", "OpenAPI", "Docker", "GitHub Actions"],
    repos: [{ fullName: "jbell-rusty-vantage/agent-knowledge-services", role: "api", primary: true }],
    deployments: [],
    pages: {
      overview: [
        m("Status", DEV), m("My role", "Designer and engineer"),
        p("Knowledge Services is a set of services that research and mission agents call to capture sources, verify claims, ingest what is supported and retrieve published knowledge with its evidence. Mission Control and Knowledge Services work together as interfaces and guidance for turning research into real service data and features."),
        h("The problem"),
        p("Research agents are good at finding sources and hard to trust with a knowledge base. Left alone they write directly to tables, treat a model's verdict as truth, cite text that is not in the source and retry unchanged inputs after a failure. I wanted an agent to be able to do the whole research-to-knowledge loop without holding database credentials, and for every admitted fact to trace back to captured bytes."),
        h("What I built"),
        p("Agents write intents: capture this page, this exact quote supports this claim, ingest these records. The service captures the source, locates the quote in the captured bytes and runs verification in a fixed order, with mechanical checks before any model judgment. A later stage can add restrictions but cannot reverse an earlier failure."),
        p("Ingestion is plan, apply and receipt. Replaying the same request returns the recorded receipt instead of writing twice. Retrieval answers from published versions only and returns evidence packets whose citations can be replayed."),
      ],
      architecture: [
        plate("From a captured source to an evidence packet."),
        p("One application layer sits behind four ways of calling it: an HTTP API, MCP, a command-line tool and agent-to-agent tasks. A catalog lists every operation and which callers may use it, and a test fails if a transport exposes something the catalog does not admit."),
        h("Main parts"),
        p("Capture. Stores immutable bytes with their lineage.\nVerification. An ordered, sealed run: integrity, mechanical checks, semantic support, then policy.\nIngestion. Plans without writing, applies once, and records a receipt.\nVerification ledger. A versioned PostgreSQL component with its own roles and row-level security.\nRetrieval. Search over published versions, returning evidence that can be checked again."),
      ],
      notes: [
        p("Agents never hold database credentials or write SQL. Everything they change goes through an intent that the service checks."),
        p("A sandbox distribution lets an agent run the capture and verification steps remotely while the store, the judging credentials and the receipts stay on the host."),
        p("The same platform serves two domains, AI Engineer and Biotech, through explicit bindings. The second domain did not require forking the verification code."),
      ],
      metrics: [m("API operations", "90"), m("Workspace packages", "26"), m("Ways to call it", "4"), m("Verification tables", "31"), m("Reviewed evaluation cases", "96")],
      links: [link("Source repository", "https://github.com/jbell-rusty-vantage/agent-knowledge-services")],
    },
    blurb: "Knowledge Services is the layer that lets research agents add to a knowledge base without being trusted blindly: every claim is checked against the captured source first. It works hand in hand with Mission Control.",
  },
  {
    slug: "ai-engineer-worldsfair-showcase",
    title: "AI Engineer Research Library",
    tagline: "1,007 conference talks researched by an agent pipeline and published as a site and API",
    summary:
      "A public library of research briefs for 1,007 talks from the AI Engineer YouTube channel, including the World's Fair. Each brief has a summary, a taxonomy, the organizations and technologies researched on the web, and sources. The briefs were produced by a research pipeline I built on Vercel's Eve agent framework, with GLM 5.2 as the model for most of them.",
    status: "shipped", startedOn: "2026-08-01", endedOn: "2026-11-09", shelf: "stacks-data-knowledge", position: 2, publishAs: "featured", featuredRank: 2,
    tags: ["Live", "Next.js", "Agent pipeline", "Vercel", "Open dataset", "Research"],
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel", "Vercel AI Gateway", "Supabase", "Node.js"],
    repos: [{ fullName: "jbell-rusty-vantage/ai-engineer-worldsfair-showcase", role: "frontend", primary: true }],
    deployments: [{ slug: "ai-engineer-research-library", title: "AI Engineer Research Library", url: "https://ai-engineer-worldsfair-showcase-dusky.vercel.app", primary: true }],
    pages: {
      overview: [
        img("home", "The library's home page: 1,007 talks in 17 engineering categories.", "ai-engineer-worldsfair-showcase/home.png"),
        m("Status", "Live"), m("My role", "Sole builder"),
        p("A public, static library of machine-generated research briefs for 1,007 talks from the AI Engineer YouTube channel. It is the first visible output of the research work behind my AI Engineer platform."),
        h("The problem"),
        p("The channel has about a thousand talks and no way to browse them by engineering topic, by the companies and tools discussed, or by what a learner should take from them. I had already run a research pipeline over the transcripts; the results needed a durable public form."),
        h("What I built"),
        p("The pipeline reads each transcript, researches the organizations and technologies it mentions on the web, verifies the sources and writes a brief. I built it on Vercel's Eve agent framework; GLM 5.2 produced 928 of the 1,007 briefs."),
        p("For the site I converted the pipeline's output into one brief per talk, re-classified every talk into 17 categories, and matched 179 talks to sessions in the official World's Fair 2026 program. The site is a statically generated Next.js app with no database at runtime. The same data is available as a read-only JSON API and bulk downloads, so people and agents can use it without scraping."),
      ],
      architecture: [
        plate("Nine pipeline stages turn a transcript into a published brief."),
        p("Model work and writes are kept apart. Only three of the nine pipeline stages call a model; the rest are deterministic, and each stage records an immutable artifact."),
      ],
      notes: [
        p("The site labels its own limits: the briefs are machine-generated and unreviewed, transcripts are not republished, every brief links back to the original video, and the project is not affiliated with the conference."),
        p("The first category labels put most talks in one category, so I re-classified all of them against a fixed taxonomy and kept the raw answers in the repository."),
      ],
      metrics: [m("Talk briefs", "1,007"), m("Engineering categories", "17"), m("Matched to World's Fair 2026", "179"), m("Organizations researched", "593"), m("Source links", "10,638")],
      gallery: [
        video("ai-engineer-worldsfair-showcase-walkthrough.mp4", "ai-engineer-worldsfair-showcase/walkthrough-poster.png", "A scroll through the library's home page and categories."),
        img("category", "A category page lists its talks with difficulty and date.", "ai-engineer-worldsfair-showcase/category.png"),
        img("brief", "A talk's research brief: summary, organizations, technologies and sources.", "ai-engineer-worldsfair-showcase/talk-brief.png"),
        img("talks", "All 1,007 talks, searchable by title, company or technology.", "ai-engineer-worldsfair-showcase/talks.png"),
        img("developers", "The API and bulk downloads page.", "ai-engineer-worldsfair-showcase/developers.png"),
      ],
      links: [
        link("Visit the library", "https://ai-engineer-worldsfair-showcase-dusky.vercel.app"),
        link("API and downloads", "https://ai-engineer-worldsfair-showcase-dusky.vercel.app/developers"),
        link("Source repository", "https://github.com/jbell-rusty-vantage/ai-engineer-worldsfair-showcase"),
      ],
    },
    blurb: "This one is live. It is a library of research briefs for a thousand AI Engineer conference talks, written by an agent pipeline John built and published as a site and an open API.",
  },
  {
    slug: "biotech-knowledge-platform",
    title: "Biotech Knowledge Platform",
    tagline: "A biotech knowledge graph that agents read and write through validated intents",
    summary:
      "Biotech will become a knowledge service platform that excels in different biotech domains, starting with supplements, compounds and case studies, then diagnostics. Reports, recommendations, protocols and biomarker guidance will be among the first major features. It is the earliest-stage of my current projects; what exists today is the knowledge graph foundation.",
    status: "active", startedOn: "2026-10-07", shelf: "stacks-data-knowledge", position: 3, publishAs: "published",
    tags: ["Early stage", "Neo4j", "GraphQL", "TypeScript", "Knowledge graph"],
    skills: ["Neo4j", "GraphQL", "TypeScript", "PostgreSQL", "Apollo Server", "MCP", "Zod", "Python"],
    repos: [
      { fullName: "jbell-rusty-vantage/biotech-knowledge-services", role: "data", primary: true },
      { fullName: "jbell-rusty-vantage/biotech-postgres-db-contract", role: "data" },
    ],
    deployments: [],
    pages: {
      overview: [
        m("Status", "Early stage"), m("My role", "Designer and engineer"),
        p("Biotech will become a biotech knowledge service platform that excels in different biotech domains. It starts with supplements, compounds and case studies, and then diagnostics. Reports, recommendations, protocols and biomarker guidance will be some of the first major features. Of my current projects this is the least developed, and its direction is still being settled."),
        h("The problem"),
        p("A biotech knowledge graph is only useful if every stated fact carries its evidence, the period it was valid for and the run that produced it. Letting agents write graph queries directly gives no validation, duplicates on retry and no receipts. The schema is also too large for an agent to hold in context."),
        h("What exists today"),
        p("The foundation: a versioned graph schema, a generated workspace that lets an agent explore that schema a little at a time, and an executor through which agents read and write using validated intents. Client applications read through a GraphQL API limited to reviewed operations."),
      ],
      architecture: [
        plate("Agents discover the schema, then read and write through validated intents."),
        p("A write is an intent that the executor plans against the schema and the live graph, then applies in a single transaction and answers with a receipt. The same intent against the same graph produces the same plan, and nothing is deleted; a fact is closed, not removed."),
      ],
      notes: [
        p("The schema is a pinned release. Everything generated from it can be rebuilt, and the build fails if a regenerated file differs from the one checked in."),
        p("On a full-scale synthetic graph of 360,800 nodes, the GraphQL API held a mixed-load 95th percentile of 230 ms with 20 concurrent clients and no errors. That was measured on a laptop with a local database."),
        p("So far the graph has been exercised with synthetic data and test fixtures."),
      ],
      metrics: [m("Node types", "69"), m("Relationship types", "106"), m("Schema cards for agents", "1,035"), m("Executor MCP tools", "19"), m("Benchmark p95, mixed load", "230 ms")],
      links: [link("Source repository", "https://github.com/jbell-rusty-vantage/biotech-knowledge-services")],
    },
    blurb: "This is the earliest of John's current projects: the foundation of a biotech knowledge platform, beginning with supplements and compounds. What is built so far is the knowledge graph and the safe way agents write to it.",
  },
  {
    slug: "vantage-lead-analytics",
    title: "Vantage Lead Analytics",
    bookTitle: "Lead Analytics",
    tagline: "Lead cost, source and sales reporting computed from one system of record",
    summary:
      "The data and reporting side of the Vantage Movers platform. It attributes every form and call lead to a paid source, prices it from a dated cost schedule, follows it to a booking or cancellation, and answers the owner's questions about spend, conversion and sales credit.",
    status: "shipped", startedOn: "2026-05-11", shelf: "stacks-data-knowledge", position: 4, publishAs: "published",
    client: "vantage-movers",
    tags: ["Live", "MongoDB", "TypeScript", "Analytics", "Google Sheets API", "MCP"],
    skills: ["MongoDB", "TypeScript", "Node.js", "Express", "Vercel", "Google Sheets API", "MCP", "Next.js", "Google Cloud Run"],
    repos: [
      { fullName: "jbell-rusty-vantage/vantage-movers-server", role: "api", primary: true },
      { fullName: "jbell-rusty-vantage/vantage-movers-mcp", role: "agent" },
    ],
    deployments: [],
    pages: {
      overview: [
        img("team", "The owner's team view of daily outreach against goals. All names and numbers shown are demo data.", "vantage-admin-raw/team-owner-1186x742.png"),
        m("Status", LIVE), m("My role", "Data model, pipelines and reporting"),
        p("The reporting side of the platform I built for Vantage Movers. It turns leads, calls, bookings and cancellations into numbers the owner can act on and can defend to a lead partner."),
        h("The problem"),
        p("The owner pays partners per lead and per qualified call, so every number matters twice: once for the partner's invoice and once for judging sources and sales reps. The figures lived in spreadsheets that were edited by hand and disagreed with the sales CRM. A lead's cost went stale when a rate changed, and a deposit split between two reps was counted in full for each."),
        h("What I built"),
        p("Every fact lives in one database, and the spreadsheets became a projection of it. A lead's cost comes from a schedule of dated rates and is read at the time of the report, so correcting a rate corrects every report. Duplicates and overlapping leads are classified and reported, not deleted. Bookings store how credit was split at the time of sale."),
        p("Results reach the owner three ways: an insights dashboard, Google Sheets that update from a queue, and saved reports that are previewed and confirmed before anything is written. The same reads are available to an assistant through an MCP server."),
      ],
      architecture: [plate("Every lead is attributed, priced and followed to an outcome."), p("Writes to Google never hold up a request. Each change is appended to an outbox, and a queue consumer with a scheduled drain carries it to the spreadsheet.")],
      notes: [
        p("Three reporting defects were removed by design: period ends that dropped the last day because of time zones, full deposit credit given to each rep on a split booking, and stale cost totals."),
        p("The database tools exposed to the assistant are read-only by construction, and large results are trimmed by whole records with a note about what was left out."),
        p("The screenshots here use invented names and phone numbers. No customer data appears in this portfolio."),
      ],
      metrics: [m("Named analytics reports", "16"), m("Scheduled jobs", "30"), m("Queue consumers", "7"), m("Backups", "Nightly")],
      gallery: [
        img("performance", "Rep performance by week, with daily call goals. Demo data.", "vantage-admin-raw/performance-desktop-calls.png"),
        img("rep", "A sales rep's own queue for the day. Demo data.", "vantage-admin-raw/my-rep-1186x742.png"),
        img("numbers", "Every number that called or was called, and who is waiting on a call back. Demo data.", "vantage-admin-raw/all-numbers-owner-1186x742.png"),
      ],
      links: [link("Server repository", "https://github.com/jbell-rusty-vantage/vantage-movers-server"), link("MCP server repository", "https://github.com/jbell-rusty-vantage/vantage-movers-mcp")],
    },
    blurb: "This volume covers the numbers behind Vantage Movers: what each lead cost, where it came from and which ones became booked moves. It is a good one to open if you care about data work.",
  },
  {
    slug: "human-upgrade-ingestion-pipeline",
    title: "Podcast Ingestion Pipeline",
    tagline: "A podcast archive scraped into structured records, running on AWS Fargate",
    summary:
      "A two-stage Python pipeline that discovers every episode of a long-running health podcast, then parses each episode page into structured MongoDB documents and S3 transcript files. It runs as a container on ECS Fargate with its AWS resources defined in CDK. It was the first data source for what became my biotech work.",
    status: "archived", startedOn: "2025-12-14", endedOn: "2026-03-11", shelf: "stacks-data-knowledge", position: 5, publishAs: "published",
    tags: ["Earlier work", "Python", "AWS", "Playwright", "MongoDB", "Data pipeline"],
    skills: ["Python", "Playwright", "MongoDB", "AWS ECS Fargate", "AWS Lambda", "AWS CDK", "AWS S3", "Docker", "GitHub Actions"],
    repos: [], deployments: [],
    pages: {
      overview: [
        m("Status", "Archived"), m("My role", "Sole author"),
        p("An ingestion pipeline and its infrastructure, built to turn a podcast's full back catalogue into structured data for entity extraction and research agents."),
        h("The problem"),
        p("The archive page is rendered with JavaScript behind a button that has to be pressed repeatedly, so a plain crawl cannot list the episodes. The episode pages themselves are plain HTML, but there are hundreds of them, so they need polite, restartable, concurrent fetching and not a browser."),
        h("What I built"),
        p("Two stages with different tools. Discovery drives a headless browser, collects the episode addresses and records each in a registry with a deterministic identifier. Enrichment fetches each page under a per-host rate limit, parses it in worker processes and stores a structured document; transcripts go to S3."),
        p("Both stages can be run again safely. One container image serves both, and a Lambda function chooses the stage when it starts the task. The cluster, queues, buckets and functions are defined as code."),
      ],
      architecture: [plate("Two stages: discover every episode, then enrich each one."), p("A browser is used only where the page requires it. Everything else is asynchronous HTTP with back-off that honours the server's retry hints.")],
      notes: [p("Re-running discovery only updates when an episode was last seen. Enrichment skips episodes that are already complete."), p("Parsing is CPU-bound, so it runs in a process pool while network concurrency is bounded separately.")],
      metrics: [m("Episodes processed", "945"), m("Transcripts stored", "884"), m("Pipeline stages", "2")],
      links: [],
    },
    blurb: "An earlier data engineering piece: a pipeline that collected a whole podcast archive into clean records on AWS. It was the first data source for John's biotech work.",
  },

  // ------------------------------------------------------------------ Web applications
  {
    slug: "the-library",
    title: "The Library",
    tagline: "A portfolio you walk through: a 3D library whose shelves are filled from Postgres",
    summary:
      "The Library is this portfolio. It is a 3D hall with rooms and shelves; a visitor takes a project off a shelf and reads it as a book. The same content is available in a text catalog that works without JavaScript or WebGL. Everything on the shelves comes from a PostgreSQL data model edited through an admin office.",
    status: "active", startedOn: "2026-10-08", shelf: "stacks-web-apps", position: 1, publishAs: "featured", featuredRank: 4,
    tags: ["Live", "Next.js", "Three.js", "PostgreSQL", "Prisma", "Blender"],
    skills: ["Next.js", "React", "TypeScript", "Three.js", "React Three Fiber", "PostgreSQL", "Prisma", "Blender", "Playwright", "Vercel", "Tailwind CSS"],
    repos: [{ fullName: "jbell-rusty-vantage/Overton-Portfolio-V2", role: "frontend", primary: true }],
    deployments: [{ slug: "the-library", title: "The Library", url: "https://overton-portfolio-v2.vercel.app", primary: true }],
    pages: {
      overview: [
        m("Status", "Live and growing"), m("My role", "Concept, design and engineering"),
        p("You are standing in it. The Library is my portfolio, built as a hall you can walk through, with a catalog beside it for anyone who would rather read a list."),
        h("The problem"),
        p("A page of cards does not show how I think about systems. A 3D showpiece, on the other hand, usually fails the people who matter most: someone on a phone, someone using a screen reader, a search crawler, or anyone whose browser has no WebGL. I also wanted to add and reorder projects, and keep drafts private, without redeploying or re-exporting a scene."),
        h("What I built"),
        p("I separated the room from the collection. Blender owns the hall and a list of named anchors for rooms, shelves and screens. PostgreSQL owns the projects, books, pages and where each one sits. The app loads the hall, finds the anchors and fills them from the database, so a shelf can change without rebuilding the room."),
        p("Every volume also has an ordinary reading page and appears in a text catalog. That catalog is what a visitor gets if 3D is unavailable, and the scene is not downloaded at all until someone chooses to enter."),
      ],
      architecture: [plate("The room is built in Blender; what sits on the shelves comes from Postgres."), p("What a visitor may see is decided on the server from publication state and client redaction rules. Content is edited in an admin office, and every change is recorded with a revision.")],
      notes: [
        p("The hall ships in two levels of detail, and the smaller one is served to small screens."),
        p("The collection can be read in full without JavaScript. Browser tests cover a missing WebGL context, a lost context and a corrupt scene file."),
        p("The catalog and reader pass automated accessibility checks, and every room and shelf can be reached from the keyboard."),
      ],
      metrics: [m("Data model tables", "52"), m("Rooms", "7"), m("Shelves", "11"), m("Hall download, compressed", "0.8 MB"), m("Browser test journeys", "11")],
      links: [link("Text catalog", "https://overton-portfolio-v2.vercel.app/catalog"), link("Source repository", "https://github.com/jbell-rusty-vantage/Overton-Portfolio-V2")],
    },
    blurb: "This volume is about the room you are standing in. It explains how the hall was built in Blender and how the shelves are filled from a database.",
  },
  {
    slug: "overtech-digital-services",
    title: "Overtech Digital Services",
    tagline: "My studio site: inspectable work, a tool library, intake and booking",
    summary:
      "Overtech is my digital services studio site. A prospect can read a finished case, inspect the tools behind a service, send an inquiry and book a call; I review inquiries in an owner dashboard. It also hosts a reader for a recorded AI research mission whose findings and citations can be inspected.",
    status: "active", startedOn: "2026-11-09", shelf: "stacks-web-apps", position: 2, publishAs: "published",
    tags: ["Launching", "Node.js", "PostgreSQL", "Neon", "Cal.com", "Vercel"],
    skills: ["Node.js", "JavaScript", "PostgreSQL", "Neon", "Drizzle ORM", "Vercel", "Cal.com", "Resend", "OAuth"],
    repos: [], // private repository
    deployments: [{ slug: "overtech-digital-services", title: "Overtech Digital Services", url: "https://overtech-digital-services.vercel.app", primary: true }],
    pages: {
      overview: [
        img("home", "The studio's home page lets a visitor follow one piece of work through its screens.", "overtech-digital-services/home.png"),
        m("Status", "Launching"), m("My role", "Owner and engineer"),
        p("Overtech is the site for my digital services studio. Instead of asking a visitor to trust a list of offerings, it lets them inspect real work and then ask for something similar."),
        h("The problem"),
        p("A services site usually shows claims. I wanted prospects to see evidence: a research run they can check claim by claim, the specific tools behind each service, and a short path from there to an inquiry and a booked call. That means private material, such as drafts and leads, has to live beside public pages without leaking."),
        h("What I built"),
        p("A small Node server that renders its pages directly and reads a Neon PostgreSQL database. Public pages cover services, work, a searchable tool library and intake. An inquiry leads to a booking link, and a booking counts as confirmed only when a signed message from the scheduling service arrives for that inquiry."),
        p("What is public is enforced in the database. The hosted site connects with a restricted login that can read only released material. Drafts are visible only in a review mode on my own machine."),
      ],
      architecture: [plate("A visitor's inquiry becomes a booked call the owner can act on."), p("The server has no web framework and six runtime dependencies. Each release is an allowlisted bundle, so nothing reaches the host unless it was named.")],
      notes: [
        p("A real appointment was booked and cancelled in production, and both states were read back, before the booking path was considered done."),
        p("The research reader imports a recorded mission from Mission Control only after checking its file hashes, citations and review record."),
      ],
      metrics: [m("Tools in the library", "35"), m("Database tables", "57"), m("Read-only views for the site", "31"), m("Runtime dependencies", "6")],
      gallery: [
        video("overtech-digital-services-walkthrough.mp4", "overtech-digital-services/walkthrough-poster.png", "A scroll through the studio's home page."),
        img("tools", "The tool library shows the tools behind a website, a research brief or an automation.", "overtech-digital-services/tools.png"),
        img("services", "Services are described by the outcome a client wants.", "overtech-digital-services/services.png"),
        img("service-ai", "A service page walks through the interface a client would get.", "overtech-digital-services/service-ai.png"),
        img("work", "Finished work, each with its own case study.", "overtech-digital-services/work.png"),
        img("start", "The inquiry form that begins a project.", "overtech-digital-services/start.png"),
      ],
      links: [link("Visit Overtech", "https://overtech-digital-services.vercel.app")],
    },
    blurb: "Overtech is John's own studio site, where a visitor can inspect finished work and book a call. The volume explains how the inquiry and booking path is kept honest.",
  },

  // ------------------------------------------------------------------ Client work
  {
    slug: "vantage-movers",
    title: "Vantage Movers",
    tagline: "Lead capture, CRM integration, booking records and owner tooling for a moving company",
    summary:
      "The software platform I built as lead developer for Vantage Movers, a long-distance moving company. Quote forms and qualified phone calls become leads in one system of record, are sent to the sales CRM, and are followed through to a booking or cancellation. The owner works from an admin dashboard, sales staff from a browser extension, and assistants through an MCP server.",
    status: "shipped", startedOn: "2026-03-01", shelf: "stacks-client-work", position: 1, publishAs: "featured", featuredRank: 0,
    client: "vantage-movers",
    tags: ["Live", "Next.js", "Express", "MongoDB", "MCP", "Browser extension"],
    skills: ["Next.js", "React", "TypeScript", "Node.js", "Express", "MongoDB", "Vercel", "MCP", "Tailwind CSS", "Playwright", "Browser extensions"],
    repos: [
      { fullName: "jbell-rusty-vantage/vantage-movers-server", role: "api", primary: true },
      { fullName: "jbell-rusty-vantage/vantage-admin", role: "frontend" },
      { fullName: "jbell-rusty-vantage/vantage-movers-clients", role: "frontend" },
      { fullName: "jbell-rusty-vantage/vantage-operations-server", role: "api" },
      { fullName: "jbell-rusty-vantage/vantage-movers-mcp", role: "agent" },
    ],
    deployments: [{ slug: "vantage-home-movers", title: "Vantage Movers", url: "https://www.vantagehomemovers.com", primary: true }],
    pages: {
      overview: [
        img("home", "The main site puts the quote request beside the introduction.", "vantage-movers/home.png"),
        m("Status", LIVE), m("My role", "Lead developer"),
        p("I am the lead developer for Vantage Movers, a long-distance moving company in Florida. Since March 2026 I have designed and built the company's public sites, its operations backend and its internal tools."),
        h("The problem"),
        p("The company pays several partners for each lead and also takes calls on campaign numbers. Leads arrived through web forms and spreadsheets and were typed again into the sales CRM. The owner could not reliably say what a lead cost, which source or sales rep produced a booked move, or which partner charges were duplicates, because no single record was authoritative."),
        h("What I built"),
        p("One database is the system of record, with one API in front of it. Quote forms on the landing pages and qualified inbound calls become leads with their source and cost attached. New leads are sent to the sales CRM. Duplicates are kept and flagged so that a partner's invoice can be checked. Bookings and cancellations are records in their own right, with sales credit split between reps."),
        p("Around that core are the tools people use every day: an admin dashboard for the owner and managers, a browser extension that works inside the CRM and shows a server-calculated price, a separate pricing service, and an MCP server that lets an assistant answer questions from the same data."),
      ],
      architecture: [
        plate("From a quote request to a booked move, in one system of record."),
        p("Anything that touches an outside system runs asynchronously. Spreadsheet updates, text messages and CRM automation are queued when a record is saved and carried out by queue consumers, with scheduled sweeps as a safety net."),
        h("Main parts"),
        p("Public sites. A main site and partner landing pages, each with a quote form.\nMain server. Leads, bookings, cancellations, messaging and reporting.\nCRM integration. Posting leads and recording what comes back as evidence.\nAdmin dashboard. Leads, bookings, setup, insights and a sales outreach desk with role-based access.\nPricing service. Transportation pricing with versioned rate tables.\nBrowser extension. Reads the open job in the CRM and applies a price.\nMCP server. Read access for an assistant."),
      ],
      notes: [
        p("Information coming back from the CRM is treated as evidence, not as a command. It can enrich a lead or open a case for review, but an official booking or refund amount changes only when the owner confirms it."),
        p("The pricing calculator never uses floating point. Amounts are whole-number arithmetic, rounded once, and a published rate table is never edited in place."),
        p("The admin dashboard has a demo mode with invented data and a browser test suite that runs against it, so interface work and screenshots never touch customer records. The admin screens in this volume come from that mode."),
      ],
      metrics: [m("Production codebases", "6"), m("Admin dashboard routes", "51"), m("Scheduled jobs", "30"), m("Queue consumers", "7"), m("MCP tools", "18")],
      gallery: [
        video("vantage-movers-walkthrough.mp4", "vantage-movers/walkthrough-poster.png", "A scroll through the Vantage Movers main site."),
        img("landing", "A partner landing page leads with the estimate request.", "vantage-movers/landing.png"),
        img("services", "Long-distance moving services on the main site.", "vantage-movers/services.png"),
        img("coverage", "Service coverage across the United States.", "vantage-movers/coverage-map.png"),
        img("desk", "The owner's outreach desk with a lead open. Demo data.", "vantage-admin-raw/team-owner-lead-drawer.png"),
        img("activity", "Contact history for active leads. Demo data.", "vantage-admin-raw/activity-owner.png"),
      ],
      links: [
        link("Visit vantagehomemovers.com", "https://www.vantagehomemovers.com"),
        link("Server repository", "https://github.com/jbell-rusty-vantage/vantage-movers-server"),
        link("Admin dashboard repository", "https://github.com/jbell-rusty-vantage/vantage-admin"),
        link("Landing pages repository", "https://github.com/jbell-rusty-vantage/vantage-movers-clients"),
      ],
    },
    blurb: "Vantage Movers is John's current client and his largest delivered system: the websites, the backend and the tools a moving company runs on. It is live at vantagehomemovers.com.",
  },
  {
    slug: "gowipe",
    title: "GoWipe",
    tagline: "A Shopify storefront for a wipes brand, with conversion tracking for ads and analytics",
    summary:
      "GoWipe sells bamboo wipes made for specific uses. I have been the company's web developer since January 2021: I build and maintain the Shopify storefront at gowipe.co and the event tracking that feeds analytics and advertising.",
    status: "shipped", startedOn: "2021-01-01", shelf: "stacks-client-work", position: 2, publishAs: "published",
    client: "gowipe",
    tags: ["Live", "Shopify", "Liquid", "E-commerce", "Google Analytics", "Conversion tracking"],
    skills: ["Shopify", "Liquid", "JavaScript", "HTML", "CSS", "Google Analytics", "Google Ads", "SEO"],
    repos: [],
    deployments: [{ slug: "gowipe", title: "GoWipe", url: "https://gowipe.co", primary: true }],
    pages: {
      overview: [
        img("home", "The GoWipe home page.", "gowipe/home.png"),
        m("Status", LIVE), m("My role", "Web developer since 2021"),
        p("GoWipe sells bamboo wipes for specific uses: face, baby, pet, travel, food-safe and more. I have been the company's web developer since January 2021."),
        h("The problem"),
        p("GoWipe sells one idea in several variants, and each variant answers a different need. A shopper has to tell a facial wipe from a pet wipe within seconds, usually on a phone. The business also advertises, so every step from viewing a product to buying it has to be reported consistently, or the spend cannot be judged."),
        h("What I built"),
        p("I run the storefront on Shopify, starting from a commercial theme and customizing it with section code. The home page introduces the range by use, with social video, a comparison and reviews. Product pages offer one-time and subscription purchases, a sticky add-to-cart, and the ingredient story."),
        p("For measurement, the storefront reports the full shopping funnel to Google Analytics and Google Ads, from viewing a product through to purchase, with each event mapped to a conversion."),
      ],
      architecture: [plate("Shopping events flow from the storefront to analytics and ads."), p("The storefront is published in English and Spanish, and the catalog is organized by use so that each collection answers one need.")],
      notes: [p("Eleven kinds of shopping event are mapped to analytics and advertising conversions."), p("I also handle on-page search optimization and support the team's content work.")],
      metrics: [m("In the role since", "2021"), m("Shopping events tracked", "11"), m("Storefront languages", "2")],
      gallery: [
        video("gowipe-walkthrough.mp4", "gowipe/walkthrough-poster.png", "A scroll through the GoWipe home page."),
        img("collection", "The range, colour-coded by use.", "gowipe/collection.png"),
        img("product", "A product page with pack sizes and subscribe and save.", "gowipe/product.png"),
        img("science", "The science page explains the fibre.", "gowipe/science.png"),
        img("story", "The founders' story.", "gowipe/story.png"),
      ],
      links: [link("Visit gowipe.co", "https://gowipe.co")],
    },
    blurb: "GoWipe is a live online shop John has looked after since 2021, including the tracking that tells the company which adverts lead to sales.",
  },
  {
    slug: "daryl-davis",
    title: "Daryl Davis",
    tagline: "A media-rich site for a speaker and author: book sales, press and booking inquiries",
    summary:
      "A public site for musician, author and lecturer Daryl Davis. It presents his talks, press coverage and podcast appearances, sells his book through Shopify checkout, and routes speaking, podcast, media and music inquiries through booking forms.",
    status: "shipped", startedOn: "2024-09-19", shelf: "stacks-client-work", position: 3, publishAs: "published",
    client: "daryl-davis",
    tags: ["Live", "Shopify", "Liquid", "Media site", "Booking"],
    skills: ["Shopify", "Liquid", "HTML", "CSS"],
    repos: [],
    deployments: [{ slug: "daryl-davis", title: "Daryl Davis", url: "https://klanwetalk.com", primary: true }],
    pages: {
      overview: [
        img("home", "The home page opens on Daryl speaking on stage.", "daryl-davis/home.png"),
        m("Status", LIVE), m("My role", "Website developer"),
        p("A site for Daryl Davis, a musician, author and lecturer known for his work on race relations. I composed the pages and built the paths for buying his book and for asking to book him."),
        h("The problem"),
        p("People arrive for different reasons. Someone who has just heard him speak wants the book. A podcast producer or event organizer wants to judge his work quickly and then ask for a date. A site built around one call to action serves one of them and loses the others."),
        h("What I built"),
        p("The site runs on Shopify so the book can be sold with an ordinary product page and checkout. The home page is a long editorial sequence: stage video, the featured book, a podcast feature, documentary and press coverage, and audience responses."),
        p("Booking has two dedicated pages. The speaking form asks what kind of request it is, including podcasts and media interviews. Music bookings have their own form."),
      ],
      architecture: [plate("Two visitors, two paths: buy the book, or book the speaker.")],
      notes: [p("Podcast and talk media open in place, so a visitor is not sent away from the site."), p("The site carries no third-party tracking scripts.")],
      metrics: [m("Home page sections", "24"), m("Booking forms", "2"), m("Kinds of inquiry", "4")],
      gallery: [
        video("daryl-davis-homepage-original.mp4", "daryl-davis/homepage-poster.png", "A recording of the home page in motion."),
        img("book", "The book's product page.", "daryl-davis/book.png"),
        img("booking", "The speaking inquiry form.", "daryl-davis/booking-music.png"),
        img("bio", "Daryl's biography.", "daryl-davis/bio.png"),
      ],
      links: [link("Visit the site", "https://klanwetalk.com")],
    },
    blurb: "A site for the speaker and author Daryl Davis. One path leads to his book, the other to booking him to speak or play.",
  },
];

/** Organizations the client work was done for. All three are named with their public sites. */
export const clients = [
  { slug: "vantage-movers", name: "Vantage Movers", showName: true },
  { slug: "gowipe", name: "GoWipe", showName: true },
  { slug: "daryl-davis", name: "Daryl Davis", showName: true },
];
