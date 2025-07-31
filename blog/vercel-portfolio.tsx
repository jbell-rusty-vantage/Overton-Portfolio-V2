"use client";

import Content from "./vercel-portfolio.mdx";
import { BlogLayout } from "../components/BlogLayout";

const meta = {
  title:
    "Deploy Your Portfolio with Next.js and Vercel: A Complete Guide for Bootcamp Students",
  description:
    "Learn how to deploy a professional portfolio using Next.js and Vercel. A comprehensive tutorial covering setup, GitHub authentication, development workflow, and essential resources for React developers.",
  date: "2024-01-20",
  image: "/blogimages/vercel-dashboard.png",
  tags: ["vercel", "nextjs", "react", "portfolio", "deployment", "tutorial"],
};

export default function VercelPortfolioPost() {
  return (
    <BlogLayout meta={meta}>
      <Content />
    </BlogLayout>
  );
}
