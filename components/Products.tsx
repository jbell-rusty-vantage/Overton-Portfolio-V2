"use client";
import React, { useEffect, useState } from "react";
import { Heading } from "./Heading";
import Link from "next/link";
import Image from "next/image";
import { Paragraph } from "./Paragraph";
import { motion } from "motion/react";

type GitHubProject = {
  id: string;
  name: string;
  description: string;
  extendedDescription?: string;
  technologies: string[];
  features: string[];
  tags: string[];
  url: string;
  liveUrl?: string;
  images: string[];
};

export const Products = () => {
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Placeholder images from Unsplash
  const placeholderImages = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
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
          No projects found
        </Heading>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-10">
        {projects.map((project: GitHubProject, idx: number) => (
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
            <Link
              href={project.liveUrl ? project.liveUrl : project.url}
              target={project.liveUrl ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 hover:bg-gray-50 rounded-2xl transition duration-200 pt-4"
            >
              <Image
                src={
                  project.images.length > 0
                    ? project.images[0]
                    : placeholderImages[idx % placeholderImages.length]
                }
                alt={`${project.name} thumbnail`}
                height="200"
                width="200"
                className="rounded-md object-cover"
              />
              <div className="flex flex-col justify-between">
                <div>
                  <Heading
                    as="h4"
                    className="font-black text-lg md:text-lg lg:text-lg"
                  >
                    {project.name}
                  </Heading>
                  <Paragraph className="text-sm md:text-sm lg:text-sm mt-2 max-w-xl">
                    {project.description}
                  </Paragraph>
                </div>
                <div className="flex flex-wrap gap-2 md:mb-1 mt-2 md:mt-0">
                  {project.technologies?.map((tech: string) => (
                    <span
                      key={tech}
                      className="text-xs md:text-xs lg:text-xs bg-gray-50 px-2 py-1 rounded-sm text-secondary text-center inline-flex items-center justify-center"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
