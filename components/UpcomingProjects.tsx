"use client";
import React, { useEffect, useState } from "react";
import { Heading } from "./Heading";
import Link from "next/link";
import Image from "next/image";
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
  images: string[];
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
    <div>
      <div className="grid grid-cols-1 gap-10">
        {projects.map((project: UpcomingProject, idx: number) => (
          <motion.div
            key={project.id}
            initial={{
              opacity: 0,
              x: -50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{ duration: 0.2, delay: idx * 0.1 }}
          >
            <div className="group flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 hover:bg-gray-50 rounded-2xl transition duration-200 pt-4">
              <div className="relative flex-shrink-0">
                {project.images && project.images.length > 0 ? (
                  <Image
                    src={project.images[0]}
                    alt={`${project.name} thumbnail`}
                    height="300"
                    width="300"
                    className="rounded-md object-cover w-[300px] h-[300px]"
                  />
                ) : (
                  <Image
                    src="/projects/human_upgrade_api/human_upgrade_api_3.png"
                    alt={`${project.name} thumbnail`}
                    height="300"
                    width="300"
                    className="rounded-md object-cover w-[300px] h-[300px]"
                  />
                )}
              </div>

              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-start justify-between">
                    <Heading
                      as="h4"
                      className="font-black text-lg md:text-lg lg:text-lg"
                    >
                      {project.name}
                    </Heading>
                    {project.githubUrl && (
                      <Link
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </Link>
                    )}
                  </div>

                  <Paragraph className="text-sm md:text-sm lg:text-sm mt-2 max-w-xl">
                    {project.description}
                  </Paragraph>

                  {project.extendedDescription && (
                    <Paragraph className="text-xs md:text-xs lg:text-xs mt-3 max-w-xl text-gray-600">
                      {project.extendedDescription}
                    </Paragraph>
                  )}

                  {/* Features */}
                  {project.features && project.features.length > 0 && (
                    <div className="mt-4 w-full">
                      <h5 className="text-xs font-semibold text-gray-700 mb-2">
                        Key Features:
                      </h5>
                      <div className="flex flex-wrap gap-2 w-full">
                        {project.features.slice(0, 5).map((feature: string) => (
                          <span
                            key={feature}
                            className="text-xs bg-blue-50 px-2 py-1 rounded-sm text-blue-700 border border-blue-200 break-words"
                          >
                            {feature}
                          </span>
                        ))}
                        {project.features.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{project.features.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 md:mb-1 mt-4 md:mt-0">
                  {project.technologies?.map((tech: string) => (
                    <span
                      key={tech}
                      className="text-xs md:text-xs lg:text-xs bg-gray-50 px-2 py-1 rounded-sm text-secondary text-center inline-flex items-center justify-center"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-green-50 px-2 py-1 rounded-sm text-green-700 border border-green-200"
                      >
                        #{tag}
                      </span>
                    ))}
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
