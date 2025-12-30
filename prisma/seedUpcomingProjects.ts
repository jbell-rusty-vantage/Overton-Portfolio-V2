import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Seeding upcoming projects...");

  // Delete all existing upcoming projects
  console.log("🗑️  Deleting existing upcoming projects...");
  await prisma.upcomingProjects.deleteMany({});
  console.log("✅ Deleted all existing upcoming projects");

  // Human Upgrade System - Multi-Service Platform
  const humanUpgradeSystem = await prisma.upcomingProjects.create({
    data: {
      name: "Human Upgrade System",
      description:
        "A multi-service biotech knowledge platform that transforms long-form podcast content into structured episode and entity data through state-aware pipelines and agentic research workflows.",
      extendedDescription:
        "The Human Upgrade System is a comprehensive backend-first platform inspired by The Human Upgrade with Dave Asprey podcast. It converts long-form biotech and health optimization content into a structured knowledge base for exploration, research, recommendations, and downstream product experiences. The system consists of five integrated components: (1) AWS CDK Infrastructure orchestrating ECR, Fargate tasks, and Lambda functions for cloud-native ingestion services; (2) Data ETL Pipeline using async Playwright, Beautiful Soup, MongoDB, and computer-use LLM agents to ingest Human Upgrade podcast episodes and biotech entities from general sources; (3) Production-grade GraphQL API (TypeScript/Apollo/MongoDB) with real-time activity logging, Redis Pub/Sub subscriptions, token bucket rate limiting, and background workers for trending and recommendations; (4) LangGraph-based Research and Ingestion Agent that processes transcripts, performs evidence research, and extracts structured entities; (5) Next.js Client Web App for user-facing exploration and interaction. The platform features state-aware ingestion pipelines with idempotency, real-time event patterns, background worker systems, and cloud-native orchestration with infrastructure-as-code.",
      githubUrl: "https://github.com/Overton77/human-upgrade-system",
      technologies: [
        "AWS CDK",
        "ECS Fargate",
        "Lambda",
        "S3",
        "EventBridge",
        "SQS",
        "Playwright",
        "Beautiful Soup",
        "MongoDB",
        "GraphQL",
        "Apollo Server",
        "TypeScript",
        "Redis",
        "LangGraph",
        "Langchain",
        "Langsmith",
        "Next.js",
        "React",
        "Python",
        "Node.js",
        "Docker",
        "CloudWatch",
      ],
      features: [
        "Multi-service architecture with clear service boundaries",
        "State-aware ingestion pipelines with idempotency",
        "Episode discovery and enhancement workflows",
        "Transcript processing and normalization",
        "Agentic research pipelines (evidence research, entity intelligence)",
        "Production GraphQL API with real-time subscriptions",
        "Event-driven architecture with Redis Pub/Sub",
        "Token bucket rate limiting with operation-specific costs",
        "Background workers for trending and recommendations",
        "Cloud-native orchestration with infrastructure-as-code",
        "Computer-use LLM agents for web automation",
        "Knowledge graph creation and entity extraction",
        "Activity logging and real-time activity tracking",
        "Personalized recommendations system",
        "Trending snapshots (24h/7d windows)",
        "Type-safe SDKs for cross-service communication",
        "Comprehensive observability with CloudWatch",
        "Retry mechanisms and DLQ handling",
      ],
      tags: [
        "multi-service",
        "biotech",
        "knowledge-platform",
        "aws-cdk",
        "graphql",
        "langgraph",
        "data-pipeline",
        "etl",
        "research-agent",
        "real-time",
        "event-driven",
        "cloud-native",
        "infrastructure-as-code",
        "typescript",
        "python",
        "nextjs",
        "mongodb",
        "redis",
        "apollo-server",
        "playwright",
        "llm-agents",
      ],
      images: ["/projects/human_upgrade_api/human_upgrade_api_4.png"],
    },
  });

  console.log("✅ Seeded Human Upgrade System:", humanUpgradeSystem.name);
  console.log("🎉 Seeding completed! Created 1 upcoming project.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding upcoming projects:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
