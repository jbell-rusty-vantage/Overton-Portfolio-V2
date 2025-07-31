import prisma from "./globalPrisma";

const blogPosts = [
  {
    slug: "vercel-portfolio",
    title:
      "Deploy Your Portfolio with Next.js and Vercel: A Complete Guide for Bootcamp Students",
    description:
      "Learn how to deploy a professional portfolio using Next.js and Vercel. A comprehensive tutorial covering setup, GitHub authentication, development workflow, and essential resources for React developers.",
    summary:
      "A complete step-by-step guide for bootcamp students to deploy their portfolios using Next.js and Vercel. Covers account setup, GitHub authentication, development workflow, and essential resources for the React ecosystem.",
    tags: ["vercel", "nextjs", "react", "portfolio", "deployment", "tutorial"],
    publishedAt: new Date("2024-01-20"),
    coverImage: "/blogimages/vercel-dashboard.png",
    mdxPath: "/blog/vercel-portfolio.mdx",
    readingTime: 14,
    isPublished: true,
  },
];

async function seedBlogPosts() {
  console.log("🌱 Starting blog posts seeding...");

  try {
    // Clear existing blog posts
    await prisma.blogPost.deleteMany({});
    console.log("🗑️  Cleared existing blog posts");

    // Insert new blog posts
    for (const post of blogPosts) {
      await prisma.blogPost.create({
        data: post,
      });
      console.log(`✅ Created blog post: ${post.title}`);
    }

    console.log("🎉 Blog posts seeding completed successfully!");
    console.log(`📊 Total blog posts created: ${blogPosts.length}`);
  } catch (error) {
    console.error("❌ Error seeding blog posts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedBlogPosts()
  .then(() => {
    console.log("🚀 Database seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
