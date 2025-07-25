import { NextResponse } from "next/server";
import prisma from "@/prisma/globalPrisma";

export async function GET() {
  try {
    const dbProjects = await prisma.githubprojects.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform database format to UI format
    const projects = dbProjects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      extendedDescription: project.extendedDescription,
      technologies: project.technologies,
      features: project.features,
      tags: project.tags,
      url: project.url, // Database already has url field
      liveUrl: project.liveUrl,
      images: project.images,
    }));

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
