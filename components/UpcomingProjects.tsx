"use client";
import React, { useEffect, useState } from "react";
import { Heading } from "./Heading";
import Link from "next/link";
import { Paragraph } from "./Paragraph";
import { motion } from "motion/react";

type UpcomingProject = {
  id: string;
  name: string;
  description: string;
  extendedDescription?: string;
  githubUrl?: string;
  technologies: string[];
  features: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export const UpcomingProjects = () => {
  const [projects, setProjects] = useState<UpcomingProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/upcomingprojects");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching upcoming projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <Heading as="h3" className="text-gray-500">
          No upcoming projects yet
        </Heading>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project: UpcomingProject, idx: number) => (
          <motion.div
            key={project.id}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ duration: 0.2, delay: idx * 0.1 }}
          >
            <div className="group text-center hover:bg-gray-50 rounded-xl transition duration-200 p-6">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Heading as="h4" className="font-black text-lg md:text-xl">
                    {project.name}
                  </Heading>
                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="View on GitHub"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Link>
                  )}
                </div>

                <Paragraph className="text-sm mt-2 max-w-2xl">
                  {project.description}
                </Paragraph>

                {project.extendedDescription && (
                  <Paragraph className="text-xs mt-2 max-w-2xl text-gray-600">
                    {project.extendedDescription}
                  </Paragraph>
                )}

                {/* Features - Limited to 3 */}
                {project.features && project.features.length > 0 && (
                  <div className="mt-4 w-full">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {project.features.slice(0, 3).map((feature: string) => (
                        <span
                          key={feature}
                          className="text-xs bg-blue-50 px-2 py-1 rounded-sm text-blue-700 border border-blue-200"
                        >
                          {feature}
                        </span>
                      ))}
                      {project.features.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{project.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {project.technologies?.map((tech: string) => (
                    <span
                      key={tech}
                      className="text-xs bg-gray-50 px-2 py-1 rounded-sm text-secondary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Tags - Limited to 3 */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {project.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-green-50 px-2 py-1 rounded-sm text-green-700 border border-green-200"
                      >
                        #{tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
