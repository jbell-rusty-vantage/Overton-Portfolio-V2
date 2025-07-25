import prisma from "@/prisma/globalPrisma";
import ProjectsGrid from "./projects-grid";

export default async function ProjectsSection() {
  // Fetch all projects from the database

  const projects = await prisma.githubprojects.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section id="projects" className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of my recent work showcasing full-stack development,
            AI/ML applications, and modern web technologies.
          </p>
        </div>

        <ProjectsGrid projects={projects} />
      </div>
    </section>
  );
}
