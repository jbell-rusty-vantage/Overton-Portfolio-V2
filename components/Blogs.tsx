"use client";
import { Blog } from "@/app/types/blog";
import Image from "next/image";
import React, { useState } from "react";
import { Heading } from "./Heading";
import { Paragraph } from "./Paragraph";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

export const Blogs = ({ blogs }: { blogs: Blog[] }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <motion.div
      className="max-w-5xl mx-auto my-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {blogs.map((blog, index) => (
          <motion.div
            key={blog.id}
            layout
            initial={{
              opacity: 0,
              y: 50,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -50,
              scale: 0.9,
            }}
            transition={{
              duration: 0.4,
              delay: Math.min(index * 0.1, 0.3),
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 },
            }}
          >
            <Link
              href={`/blog/${blog.slug}?mdx=${blog.mdxPath}`}
              className="relative my-10 block group cursor-pointer"
              onMouseEnter={() => setHovered(blog.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <AnimatePresence mode="wait">
                {hovered === blog.slug && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scaleX: 0.95,
                      scaleY: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      scaleX: 1.02,
                      scaleY: 1.05,
                    }}
                    exit={{
                      opacity: 0,
                      scaleX: 0.95,
                      scaleY: 0.95,
                    }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="absolute z-0 pointer-events-none bg-gradient-to-r from-gray-50 to-blue-50 inset-0 h-full w-full rounded-lg shadow-lg"
                  />
                )}
              </AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
                <motion.div
                  className="overflow-hidden rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src="/images/sidefolio-moonbeam-2.png"
                    alt="thumbnail"
                    height="200"
                    width="200"
                    objectFit="cover"
                    className="rounded-md object-cover h-40 w-60 transition-transform duration-300 group-hover:scale-110"
                  />
                </motion.div>

                <div className="flex flex-col col-span-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                  >
                    <Heading className="text-lg md:text-lg lg:text-lg transition-colors duration-200 group-hover:text-blue-600">
                      {blog.title}
                    </Heading>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <Paragraph className="text-sm md:text-sm lg:text-sm mt-2 transition-colors duration-200 group-hover:text-gray-700">
                      {blog.description}
                    </Paragraph>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <Paragraph className="text-sm text-blue-800 md:text-sm lg:text-sm mt-4 transition-colors duration-200 group-hover:text-blue-900">
                      {blog.summary}
                    </Paragraph>
                  </motion.div>

                  <motion.div
                    className="flex space-x-2 flex-wrap mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                  >
                    {blog.tags?.map((tag, tagIndex) => (
                      <motion.span
                        key={`tag-${blog.id}-${tagIndex}`}
                        className="text-xs px-2 py-1 text-secondary border border-neutral-200 bg-white rounded-md transition-all duration-200 hover:bg-blue-50 hover:border-blue-200"
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: index * 0.1 + 0.5 + tagIndex * 0.05,
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
