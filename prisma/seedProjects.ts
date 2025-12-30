import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Seeding projects...");

  // Delete all existing projects
  console.log("🗑️  Deleting existing projects...");
  await prisma.githubprojects.deleteMany({});
  console.log("✅ Deleted all existing projects");

  // 1. Human Upgrade API
  const humanUpgradeAPI = await prisma.githubprojects.create({
    data: {
      name: "Human Upgrade API",
      description:
        "Production-grade GraphQL API powering the Human Upgrade App—a biotech information platform. Features event-driven recommendations, real-time activity tracking, and token bucket rate limiting.",
      extendedDescription:
        "A production-grade GraphQL API that serves as the central intelligence hub for exploring and managing complex relationships between businesses, products, research, protocols, and people in the biotech and consumer health optimization space. The API facilitates biotech entities like Person, Business, Compound, Product, CaseStudy, Article, Episode, and also manages User, User Profile, User Activity, RecommendationsCache, and TrendingSnapshot. Built with a layered service architecture emphasizing type safety, data integrity, performance, and scalability.",
      url: "https://github.com/Overton77/humanupgrade-api",
      technologies: [
        "MongoDB",
        "GraphQL",
        "TypeScript",
        "Apollo Server",
        "Express",
        "Redis",
        "Node.js",
      ],
      features: [
        "Event-driven recommendations system",
        "Real-time activity tracking",
        "Token bucket rate limiting",
        "GraphQL subscriptions",
        "Redis Pub/Sub integration",
        "MongoDB transactions",
        "DataLoader batching",
        "Type-safe SDKs",
        "Background workers",
        "Trending snapshots",
      ],
      tags: [
        "graphql",
        "mongodb",
        "typescript",
        "apollo-server",
        "redis",
        "biotech",
        "api",
        "backend",
        "real-time",
      ],
      images: [
        "/projects/human_upgrade_api/human_upgrade_api_1.png",
        "/projects/human_upgrade_api/human_upgrade_api_2.png",
        "/projects/human_upgrade_api/human_upgrade_api_3.png",
      ],
    },
  });

  console.log("✅ Seeded Human Upgrade API:", humanUpgradeAPI.name);

  // 2. Human Upgrade API Research Agent
  const researchAgent = await prisma.githubprojects.create({
    data: {
      name: "Human Upgrade API Research Agent",
      description:
        "AI-powered research agent built with LangGraph for creating a biotech knowledge graph and seeding the Human Upgrade API with structured entities from podcast episodes and research queries.",
      extendedDescription:
        "An intelligent research agent built with LangGraph, Langchain, and Langsmith that automates biotech research and knowledge graph creation. The agent has access to file system tools, web search tools (Wikipedia, Tavily, Firecrawl), and medical database tools (PubMed). The Human Upgrade podcast transcripts are processed into research directions, which trigger different subgraphs including the entity subgraph and research subgraph. The system creates a comprehensive biotech knowledge graph, seeds the Human Upgrade API with structured entities, and conducts research on claims, pathways, products, businesses, and people from episodes and administrator questions.",
      url: "https://github.com/Overton77/humanupgrade-app-ingestion_research", // Assuming same repo or separate
      technologies: [
        "LangGraph",
        "Langchain",
        "Langsmith",
        "Python",
        "AI/ML",
        "Knowledge Graphs",
      ],
      features: [
        "Multi-agent research system",
        "Podcast transcript processing",
        "Entity extraction and structuring",
        "Web search integration",
        "Medical database queries",
        "Knowledge graph creation",
        "Automated research workflows",
        "Subgraph orchestration",
      ],
      tags: [
        "langgraph",
        "langchain",
        "ai",
        "research",
        "knowledge-graph",
        "biotech",
        "python",
        "automation",
      ],
      images: [], // No images provided
    },
  });

  console.log("✅ Seeded Research Agent:", researchAgent.name);

  // 3. Go Wipe Store (Shopify)
  const gowipeStore = await prisma.githubprojects.create({
    data: {
      name: "Go Wipe Store",
      description:
        "E-commerce Shopify store design with complete digital marketing pipeline including Google Tag Manager, Analytics, and Ads integration.",
      extendedDescription:
        "A fully designed and implemented Shopify store for Go Wipe, featuring a complete digital marketing pipeline. The project includes custom e-commerce event tracking scripts that send usage details to Google Analytics, comprehensive SEO implementation, and keyword-based Google Ads campaigns. All marketing data is tracked and displayed in the analytics dashboard, providing complete visibility into customer behavior and campaign performance.",
      url: "https://github.com/Overton77/gowipe", // Placeholder - update if you have the actual repo
      liveUrl: "https://gowipe.co/",
      technologies: [
        "Shopify",
        "Google Tag Manager",
        "Google Analytics",
        "Google Ads",
        "SEO",
        "E-commerce",
        "JavaScript",
      ],
      features: [
        "Custom Shopify theme design",
        "Google Tag Manager integration",
        "Custom e-commerce event tracking",
        "Google Analytics dashboard",
        "Google Ads campaigns",
        "SEO optimization",
        "Keyword advertising",
        "Conversion tracking",
      ],
      tags: [
        "shopify",
        "e-commerce",
        "digital-marketing",
        "analytics",
        "seo",
        "google-ads",
        "gtm",
      ],
      images: [
        "/projects/gowipe/gowipe_1.png",
        "/projects/gowipe/gowipe_2.png",
        "/projects/gowipe/gowipe_3.png",
      ],
    },
  });

  console.log("✅ Seeded Go Wipe Store:", gowipeStore.name);

  // 4. Daryl Davis Store (Shopify)
  const darylDavisStore = await prisma.githubprojects.create({
    data: {
      name: "Daryl Davis Store",
      description:
        "Shopify store created for Daryl Davis, renowned speaker, musician, and race relations expert known for his influential Ted Talk and appearances on major podcasts.",
      extendedDescription:
        "A custom Shopify store designed and developed for Daryl Davis, an international recording artist, actor, acclaimed author, and one of the most courageous voices in the modern fight against racism. Daryl is known for having one of the top-watched Ted Talks of all time and has been featured on the Joe Rogan Podcast and The Human Upgrade Podcast with Dave Asprey. His remarkable work includes convincing KKK members to put down their robes through dialogue and understanding.",
      url: "https://github.com/Overton77/daryl-davis-store", // Placeholder - update if you have the actual repo
      liveUrl: "https://daryldavis.myshopify.com/",
      technologies: [
        "Shopify",
        "E-commerce",
        "Web Design",
        "Custom Development",
      ],
      features: [
        "Custom Shopify store",
        "Product catalog management",
        "Event booking integration",
        "Merchandise sales",
        "Responsive design",
      ],
      tags: ["shopify", "e-commerce", "web-design", "custom-development"],
      images: [
        "/projects/daryl_davis/daryl_davis_1.png",
        "/projects/daryl_davis/daryl_davis_2.png",
      ],
    },
  });

  console.log("✅ Seeded Daryl Davis Store:", darylDavisStore.name);

  // 5. Synth-Tree
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
      images: [], // No images provided - placeholder will be used in frontend
    },
  });

  console.log("✅ Seeded Synth-Tree:", synthTree.name);

  console.log("🎉 Seeding completed! Created 5 projects.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding projects:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
