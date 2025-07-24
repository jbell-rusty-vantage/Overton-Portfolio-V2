"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard from "./project-card";

interface Project {
  id: string;
  name: string;
  description: string;
  extendedDescription?: string | null;
  technologies: string[];
  features: string[];
  tags: string[];
  url: string;
  liveUrl?: string | null;
  images: string[];
}

interface ProjectsGridProps {
  projects: Project[];
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  // Reset to first page when projects change
  useEffect(() => {
    setCurrentPage(1);
  }, [projects]);

  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentProjects.map((project) => (
          <ProjectCard
            key={project.id}
            name={project.name}
            description={project.description}
            extendedDescription={project.extendedDescription || undefined}
            technologies={project.technologies}
            features={project.features}
            tags={project.tags}
            url={project.url}
            liveUrl={project.liveUrl}
            images={project.images}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • Showing {startIndex + 1}-
          {Math.min(endIndex, projects.length)} of {projects.length} projects
        </div>
      )}
    </div>
  );
}
