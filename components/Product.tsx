"use client";
import Image from "next/image";
import React, { useState } from "react";
import { Heading } from "./Heading";
import { Paragraph } from "./Paragraph";
import { motion } from "framer-motion";

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

export const SingleProduct = ({ project }: { project: GitHubProject }) => {
  // Placeholder images from Unsplash
  const placeholderImages = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
  ];

  // Use project images if available, otherwise use placeholders
  const projectImages =
    project.images && project.images.length > 0
      ? project.images
      : placeholderImages.slice(0, 3);
  const [activeImage, setActiveImage] = useState<string>(projectImages[0]);

  return (
    <div className="py-10">
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        key={project.id}
        className="relative"
      >
        <Image
          src={activeImage}
          alt={`${project.name} preview`}
          height="1000"
          width="1000"
          className="rounded-md object-contain"
        />
        <div className="absolute bottom-0 bg-white h-40 w-full [mask-image:linear-gradient(to_bottom,transparent,white)]" />
      </motion.div>

      <div className="flex flex-row justify-center my-8 flex-wrap">
        {projectImages.map((image, idx) => (
          <button
            onClick={() => setActiveImage(image)}
            key={`image-thumbnail-${idx}`}
          >
            <Image
              src={image}
              alt={`${project.name} thumbnail ${idx + 1}`}
              height="1000"
              width="1000"
              className="h-14 w-16 md:h-40 md:w-60 object-cover object-top mr-4 mb-4 border rounded-lg border-neutral-100"
            />
          </button>
        ))}
      </div>

      <div className="flex lg:flex-row justify-between items-center flex-col mt-20">
        <Heading className="font-black mb-2 pb-1">{project.name}</Heading>
        <div className="flex flex-wrap space-x-2 md:mb-1 mt-2 md:mt-0">
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

      <div>
        <Paragraph className="max-w-xl mt-4">{project.description}</Paragraph>
      </div>

      {project.extendedDescription && (
        <div className="mt-6">
          <Paragraph className="max-w-none text-neutral-600">
            {project.extendedDescription}
          </Paragraph>
        </div>
      )}

      {/* Features Section */}
      {project.features && project.features.length > 0 && (
        <div className="mt-8">
          <Heading as="h3" className="text-lg font-semibold mb-4">
            Key Features
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {project.features.map((feature: string) => (
              <div key={feature} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-neutral-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {project.tags && project.tags.length > 0 && (
        <div className="mt-8">
          <Heading as="h3" className="text-lg font-semibold mb-4">
            Tags
          </Heading>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-blue-50 px-3 py-1 rounded-full text-blue-700 border border-blue-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 group/button rounded-full hover:scale-105 focus:outline-none transition ring-offset-gray-900 bg-gray-800 text-white shadow-lg shadow-black/20 sm:backdrop-blur-sm group-hover/button:bg-gray-50/15 group-hover/button:scale-105 focus-visible:ring-1 focus-visible:ring-offset-2 ring-gray-50/60 text-sm font-medium px-4 py-2 mt-auto origin-left"
        >
          View on GitHub
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
          >
            <path d="M5 12l14 0"></path>
            <path d="M13 18l6 -6"></path>
            <path d="M13 6l6 6"></path>
          </svg>
        </a>

        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 group/button rounded-full hover:scale-105 focus:outline-none transition ring-offset-gray-900 bg-blue-600 text-white shadow-lg shadow-black/20 sm:backdrop-blur-sm group-hover/button:bg-blue-700 group-hover/button:scale-105 focus-visible:ring-1 focus-visible:ring-offset-2 ring-blue-50/60 text-sm font-medium px-4 py-2 mt-auto origin-left"
          >
            Live Demo
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12l14 0"></path>
              <path d="M13 18l6 -6"></path>
              <path d="M13 6l6 6"></path>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};
