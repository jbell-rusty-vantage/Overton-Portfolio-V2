import prisma from "./globalPrisma";

async function main() {
  console.log("🌱 Seeding upcoming projects...");

  // Seed the rehab searching admissions with AI assistant application
  const rehabProject = await prisma.upcomingProjects.upsert({
    where: { id: "rehab-admissions-ai-assistant" },
    update: {},
    create: {
      id: "rehab-admissions-ai-assistant",
      name: "Rehab Admissions AI Assistant",
      description:
        "An AI-powered application for searching and managing rehabilitation facility admissions with intelligent assistance.",
      extendedDescription:
        "A comprehensive microservice-based system that helps users find and connect with rehabilitation facilities. The application features intelligent data ingestion from multiple sources, AI-assisted search capabilities, and streamlined admission processes. Built with FastAPI, Supabase, and modern web technologies.",
      githubUrl: "https://github.com/Overton77/rehab-ingestion-py-ms",
      technologies: [
        "FastAPI",
        "Python",
        "Supabase",
        "PostgreSQL",
        "Docker",
        "Kafka",
        "REST API",
        "Data Ingestion",
        "AI/ML",
      ],
      features: [
        "NPI Data Ingestion",
        "CSV Processing Pipeline",
        "API Integration",
        "Data Deduplication",
        "Real-time Search",
        "AI Assistant Integration",
        "Provider Database Management",
        "Health Monitoring",
        "Background Task Processing",
      ],
      tags: [
        "healthcare",
        "rehabilitation",
        "ai-assistant",
        "data-ingestion",
        "microservices",
        "fastapi",
        "supabase",
      ],
      images: [
        "/images/projects/rehab-ai-assistant-1.png",
        "/images/projects/rehab-ai-assistant-2.png",
      ],
    },
  });

  console.log(
    "✅ Seeded rehab admissions AI assistant project:",
    rehabProject.name
  );
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding projects:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
