import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Seeding projects...");

  // Delete all existing projects
  console.log("🗑️  Deleting existing projects...");
  await prisma.githubprojects.deleteMany({});
  console.log("✅ Deleted all existing projects");

  const synthTree = await prisma.githubprojects.create({
    data: {
      name: "Synth-Tree",
      description:
        "Course Creation and Course Taking platform built with modern technologies. Contributed the entire GraphQL API architecture.",
      extendedDescription:
        "A comprehensive Course Creation and Course Taking platform developed as part of a TripleTen externship project. The application enables educators to create structured courses and students to take them through an intuitive interface. I contributed the entire GraphQL API, built with Prisma for database management, Pothos for GraphQL schema generation, AWS CDK for infrastructure, and React with React Router for the frontend. The platform is actively being developed and improved.",
      url: "https://github.com/tripleten-externships/synth-tree",
      technologies: [
        "Prisma",
        "Pothos",
        "GraphQL",
        "AWS CDK",
        "React",
        "React Router",
        "TypeScript",
        "Node.js",
      ],
      features: [
        "Course creation system",
        "Course taking interface",
        "GraphQL API",
        "User authentication",
        "Progress tracking",
        "Content management",
        "AWS infrastructure",
        "Type-safe API",
      ],
      tags: [
        "graphql",
        "prisma",
        "react",
        "typescript",
        "aws",
        "education",
        "course-platform",
        "externship",
      ],
      images: [],
    },
  });

  console.log("✅ Seeded Synth-Tree:", synthTree.name);

  const gowipe = await prisma.githubprojects.create({
    data: {
      name: "GoWipe",
      description:
        "Live eCommerce product experience and conversion-focused storefront implementation for a real consumer brand.",
      extendedDescription:
        "A deployed Shopify-based eCommerce build created as a polished product surface for GoWipe. The project focused on translating design and product requirements into a live storefront experience while supporting broader growth and analytics efforts. It reflects end-to-end implementation work across UX, frontend customization, and measurable customer journeys.",
      url: "https://gowipe.co/",
      technologies: [
        "Shopify",
        "JavaScript",
        "Liquid",
        "HTML",
        "CSS",
        "Google Tag Manager",
        "Google Analytics",
      ],
      features: [
        "Live storefront deployment",
        "Custom product presentation",
        "Responsive UI",
        "Conversion-focused design",
        "Analytics instrumentation",
        "Customer journey optimization",
      ],
      tags: [
        "shopify",
        "ecommerce",
        "analytics",
        "conversion",
        "frontend",
        "product-design",
        "marketing-tech",
      ],
      images: [
        "/projects/gowipe/gowipe_one.png",
        "/projects/gowipe/gowipe_two.png",
      ],
    },
  });

  console.log("✅ Seeded GoWipe:", gowipe.name);

  const darylDavis = await prisma.githubprojects.create({
    data: {
      name: "Daryl Davis Storefront",
      description:
        "Deployed Shopify storefront showcasing end-to-end product implementation and UI design for a live brand experience.",
      extendedDescription:
        "A live Shopify implementation built as a client-facing product surface with emphasis on clean presentation, strong user experience, and production-ready deployment. The project demonstrates practical execution across design translation, frontend customization, and launch of a polished commerce experience.",
      url: "https://daryldavis.myshopify.com/",
      technologies: ["Shopify", "Liquid", "JavaScript", "HTML", "CSS"],
      features: [
        "Live storefront deployment",
        "Responsive design",
        "Custom UI implementation",
        "Product-focused user experience",
        "Production-ready commerce surface",
      ],
      tags: [
        "shopify",
        "ecommerce",
        "frontend",
        "ui",
        "design",
        "client-project",
      ],
      images: ["/projects/daryldavis/daryl_davis_one.png"],
    },
  });

  console.log("✅ Seeded Daryl Davis Storefront:", darylDavis.name);

  const humanUpgradeBiotechApi = await prisma.githubprojects.create({
    data: {
      name: "Human Upgrade Biotech API",
      description:
        "Production-facing GraphQL API for structured biotech knowledge generated from long-form health content and research workflows.",
      extendedDescription:
        "A core Human Upgrade biotech application focused on exposing structured outputs through a production-facing GraphQL API deployed on Vercel. The system is part of a broader stack that ingests long-form health content, researches entities and claims, and transforms unstructured source material into queryable biotech knowledge for downstream applications and user-facing experiences.",
      url: "https://github.com/Overton77/humanupgradebiotechapi",
      technologies: [
        "TypeScript",
        "GraphQL",
        "Apollo",
        "Vercel",
        "PostgreSQL",
        "Node.js",
      ],
      features: [
        "GraphQL API",
        "Structured biotech knowledge access",
        "Entity and claim delivery",
        "Production deployment",
        "Queryable health content outputs",
        "Integration with research workflows",
      ],
      tags: [
        "biotech",
        "graphql",
        "api",
        "vercel",
        "health",
        "knowledge-base",
        "research",
      ],
      images: ["/projects/humanupgradeapi/humanupgradeapi_one.png"],
    },
  });

  console.log(
    "✅ Seeded Human Upgrade Biotech API:",
    humanUpgradeBiotechApi.name,
  );

  const biotechHumanUpgradeKnowledgeBase = await prisma.githubprojects.create({
    data: {
      name: "Biotech Human Upgrade Knowledge Base",
      description:
        "Research and ingestion knowledge-base environment for transforming long-form health content into structured biotech intelligence.",
      extendedDescription:
        "A Human Upgrade research system designed to ingest source material, research entities and claims, and organize outputs into a structured knowledge base. It supports agentic workflows, context management, and downstream product surfaces by turning messy health and biotech information into usable, queryable knowledge artifacts.",
      url: "https://github.com/Overton77/biotech-human-upgrade-knowledge-base",
      technologies: [
        "Python",
        "TypeScript",
        "PostgreSQL",
        "LangChain",
        "GraphQL",
      ],
      features: [
        "Long-form content ingestion",
        "Knowledge-base construction",
        "Entity research workflows",
        "Claim extraction support",
        "Structured data generation",
        "Context-rich biotech exploration",
      ],
      tags: [
        "biotech",
        "knowledge-base",
        "agents",
        "research",
        "health",
        "ingestion",
        "llm",
      ],
      images: [
        "/projects/humanupgradeknowledgebase/humanupgrade_kb_one.png",
      ],
    },
  });

  console.log(
    "✅ Seeded Biotech Human Upgrade Knowledge Base:",
    biotechHumanUpgradeKnowledgeBase.name,
  );

  const humanUpgradeDataOps = await prisma.githubprojects.create({
    data: {
      name: "Human Upgrade Data Ops",
      description:
        "State-aware biotech data pipeline system supporting scheduled episode ingestion and structured downstream processing.",
      extendedDescription:
        "A supporting data operations project in the Human Upgrade biotech stack that manages state-aware pipelines for scheduled ingestion and transformation of source material. It is designed to support reliable episode processing, repeatable workflows, and the broader research and API ecosystem around Human Upgrade biotech applications.",
      url: "https://github.com/Overton77/human-upgrade-data-ops",
      technologies: [
        "Python",
        "AWS",
        "PostgreSQL",
        "Data Pipelines",
        "Node.js",
      ],
      features: [
        "Scheduled ingestion workflows",
        "State-aware processing",
        "Data transformation pipelines",
        "Operational reliability",
        "Pipeline orchestration support",
      ],
      tags: [
        "biotech",
        "data-pipelines",
        "data-ops",
        "automation",
        "health",
        "ingestion",
      ],
      images: [
        "/projects/humanupgrade_data_ops/humanupgrade_data_ops_one.png",
      ],
    },
  });

  console.log("✅ Seeded Human Upgrade Data Ops:", humanUpgradeDataOps.name);

  const humanUpgradeInfra = await prisma.githubprojects.create({
    data: {
      name: "Human Upgrade Infrastructure",
      description:
        "Infrastructure-as-code layer for the Human Upgrade biotech stack, supporting research systems, APIs, and data workflows.",
      extendedDescription:
        "An AWS CDK-based infrastructure project supporting deployment and operations for the Human Upgrade biotech ecosystem. It provides the underlying cloud architecture needed for ingestion workflows, production APIs, and knowledge system components, helping the broader suite scale in a structured and maintainable way.",
      url: "https://github.com/Overton77/human-upgrade-infra",
      technologies: ["AWS", "AWS CDK", "TypeScript", "Cloud Infrastructure"],
      features: [
        "Infrastructure as code",
        "Cloud environment provisioning",
        "Support for API deployment",
        "Support for ingestion systems",
        "Maintainable cloud architecture",
      ],
      tags: ["aws", "cdk", "infrastructure", "devops", "biotech", "cloud"],
      images: [],
    },
  });

  console.log(
    "✅ Seeded Human Upgrade Infrastructure:",
    humanUpgradeInfra.name,
  );

  const biotechKnowledgeGraph = await prisma.githubprojects.create({
    data: {
      name: "Biotech Knowledge Graph",
      description:
        "Neo4j GraphQL knowledge graph and ingestion layer for exploring compounds, protocols, people, organizations, and case studies.",
      extendedDescription:
        "A graph-backed biotech research project that structures domain entities and relationships into a navigable knowledge graph. Built to support biohackers, researchers, and investors, it serves as a core foundation for richer research workflows, graph-backed search, and downstream applications that need structured biotech intelligence.",
      url: "https://github.com/Overton77/biotech-kg",
      technologies: [
        "Neo4j",
        "GraphQL",
        "TypeScript",
        "Python",
        "Knowledge Graphs",
      ],
      features: [
        "Graph-backed biotech exploration",
        "Entity relationship modeling",
        "Knowledge graph ingestion layer",
        "Protocol and compound mapping",
        "People and organization linking",
      ],
      tags: [
        "biotech",
        "neo4j",
        "graphql",
        "knowledge-graph",
        "research",
        "graph-database",
      ],
      images: ["/projects/biotech_kg/biotech_kg_one.png"],
    },
  });

  console.log("✅ Seeded Biotech Knowledge Graph:", biotechKnowledgeGraph.name);

  const biotechResearchIngestion = await prisma.githubprojects.create({
    data: {
      name: "Biotech Research Ingestion",
      description:
        "FastAPI and Temporal-powered multi-agent research backend for biotech missions, enrichment workflows, and structured outputs.",
      extendedDescription:
        "A backend research system for the broader biotech suite that coordinates multi-agent workflows for ingestion, enrichment, and biotech investigation. It is designed to support research missions across compounds, protocols, organizations, and case studies, producing structured outputs that can feed client applications and graph-backed exploration systems.",
      url: "https://github.com/Overton77/biotech-research-ingestion",
      technologies: [
        "Python",
        "FastAPI",
        "Temporal",
        "PostgreSQL",
        "Agents",
        "Async Python",
      ],
      features: [
        "Multi-agent research workflows",
        "Biotech mission orchestration",
        "Structured output generation",
        "Backend enrichment pipelines",
        "Asynchronous processing",
        "Research automation",
      ],
      tags: [
        "biotech",
        "fastapi",
        "temporal",
        "agents",
        "research",
        "backend",
        "automation",
      ],
      images: [
        "/projects/biotech_ingestion/biotech_ingestion_one.png",
        "/projects/biotech_ingestion/biotech_ingestion_two.png",
        "/projects/biotech_ingestion/biotech_ingestion_three.png",
      ],
    },
  });

  console.log(
    "✅ Seeded Biotech Research Ingestion:",
    biotechResearchIngestion.name,
  );

  const biotechResearchWeb = await prisma.githubprojects.create({
    data: {
      name: "Biotech Research Web",
      description:
        "Next.js client for biotech research missions and exploration across graph-backed knowledge and agent-assisted workflows.",
      extendedDescription:
        "A web application layer for the broader biotech research suite, built to let users explore structured biotech information and interact with research workflows through a modern frontend. It complements the knowledge graph and multi-agent backend by exposing missions, exploration surfaces, and user-facing interfaces for navigating complex biotech domains.",
      url: "https://github.com/Overton77/biotech-research-web",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "GraphQL",
        "Frontend Architecture",
      ],
      features: [
        "Research mission interface",
        "Graph-backed exploration",
        "Modern web client",
        "User-facing biotech discovery",
        "Integration with backend research systems",
      ],
      tags: ["biotech", "nextjs", "react", "frontend", "research", "web-app"],
      images: [
        "/projects/biotech_client/biotechclientone.png",
        "/projects/biotech_research/biotech_research_one.png",
        "/projects/biotech_research/biotech_research_two.png",
      ],
    },
  });

  console.log("✅ Seeded Biotech Research Web:", biotechResearchWeb.name);

  const aiEngineerResearchIngestion = await prisma.githubprojects.create({
    data: {
      name: "AI Engineer Research Ingestion",
      description:
        "Ingestion and enrichment pipeline for AI Engineer World's Fair sessions, speakers, videos, and entity research.",
      extendedDescription:
        "A backend data and research system built to ingest AI Engineer World's Fair session data, speaker data, and YouTube content into a unified structured dataset. The workflow includes pandas-based processing, retrieval of all videos from the channel, fuzzy matching to connect sessions and videos, and LLM-agent-driven enrichment with web validation for people and organizations before storing relationships in a database.",
      url: "https://github.com/Overton77/ai-engineer-research-ingestion",
      technologies: [
        "Python",
        "Pandas",
        "YouTube API",
        "PostgreSQL",
        "LLM Agents",
        "Web Search",
      ],
      features: [
        "Session and speaker ingestion",
        "YouTube channel ingestion",
        "Fuzzy entity matching",
        "LLM enrichment workflows",
        "People and organization validation",
        "Structured relationship storage",
      ],
      tags: [
        "ai",
        "data-engineering",
        "pandas",
        "llm",
        "agents",
        "youtube-api",
        "research",
      ],
      images: ["/projects/aiengineer/aiengineerone.png"],
    },
  });

  console.log(
    "✅ Seeded AI Engineer Research Ingestion:",
    aiEngineerResearchIngestion.name,
  );

  const aiEngineerWorldsFairWebApp = await prisma.githubprojects.create({
    data: {
      name: "AI Engineer Worlds Fair Web App",
      description:
        "Searchable Next.js application for exploring AI Engineer World's Fair people, organizations, sessions, and videos.",
      extendedDescription:
        "A live exploration app built on top of an enriched AI Engineer World's Fair knowledge dataset. The frontend uses Next.js with Supabase as the storage layer and allows users to search across entities including people, videos, organizations, and sessions. Authenticated users can save entities to their profile and take notes, making the system both a discovery layer and a lightweight personal research workspace.",
      url: "https://github.com/Overton77/ai-engineer-worldsfair-webapp",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Supabase",
        "PostgreSQL",
        "Vercel",
      ],
      features: [
        "Entity search across all content",
        "People, videos, organizations, and sessions views",
        "Supabase-backed storage",
        "User authentication",
        "Saved entities",
        "Personal notes",
        "Live deployment on Vercel",
      ],
      tags: [
        "ai",
        "nextjs",
        "supabase",
        "search",
        "knowledge-system",
        "vercel",
        "web-app",
      ],
      images: ["/projects/aiengineer/aiengineertwo.png"],
    },
  });

  console.log(
    "✅ Seeded AI Engineer Worlds Fair Web App:",
    aiEngineerWorldsFairWebApp.name,
  );

  console.log("🎉 Seeding completed! Created 12 projects.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding projects:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
