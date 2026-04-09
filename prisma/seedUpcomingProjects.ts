import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Seeding upcoming projects...");

  console.log("🗑️  Deleting existing upcoming projects...");
  await prisma.upcomingProjects.deleteMany({});
  console.log("✅ Deleted all existing upcoming projects");

  const humanUpgradeBiotechClient = await prisma.upcomingProjects.create({
    data: {
      name: "Human Upgrade Biotech client web app",
      description:
        "A client web app for biohacker enthusiasts, researchers, and investors—integrated with the research and ingestion services of the full biotech suite.",
      extendedDescription:
        "Audiences:\n\nEnthusiasts — find protocols, products, compounds, and biohacker mentors.\n\nResearchers — talk to an AI assistant about case studies.\n\nInvestors — news stories, financials, and business operations of companies.\n\nThe client web app is integrally tied to the research and ingestion services of the full biotech suite of services.",
      technologies: [
        "OpenAI",
        "Vercel AI SDK",
        "LangChain",
        "Deep Agents",
        "GraphQL",
        "Postgres",
        "Next.js",
      ],
      features: [
        "Protocols, products, compounds, and biohacker mentor discovery (enthusiasts)",
        "AI assistant for case-study conversations (researchers)",
        "News, financials, and business operations of companies (investors)",
        "Integrated with suite-wide research and ingestion pipelines",
      ],
      tags: [
        "biotech",
        "client-app",
        "nextjs",
        "graphql",
        "postgres",
        "langchain",
        "vercel-ai-sdk",
        "openai",
        "deep-agents",
        "human-upgrade",
      ],
      images: [],
    },
  });

  console.log(
    "✅ Seeded Human Upgrade Biotech client web app:",
    humanUpgradeBiotechClient.name,
  );
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
