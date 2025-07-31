"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AnimatedBlogPageProps {
  children: ReactNode;
}

export function AnimatedBlogPage({ children }: AnimatedBlogPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

// Animated components for different sections
export function AnimatedHeader({ children }: { children: ReactNode }) {
  return (
    <motion.header
      className="mb-8 space-y-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      {children}
    </motion.header>
  );
}

export function AnimatedContent({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedBackButton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-6"
    >
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
      >
        <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
          <ArrowLeft className="w-4 h-4" />
        </motion.div>
        <span className="group-hover:underline">Back to all posts</span>
      </Link>
    </motion.div>
  );
}
