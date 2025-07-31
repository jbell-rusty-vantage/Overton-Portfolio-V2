import prisma from "@/prisma/globalPrisma";
import { BlogSearch } from "./BlogSearch";
import { Blogs } from "./Blogs";
import { Blog } from "@/app/types/blog";
import { Heading } from "./Heading";
import { Paragraph } from "./Paragraph";
import { Suspense } from "react";
import { BlogListSkeleton } from "./ui/skeleton";

type BlogListProps = {
  searchParams?: Promise<{
    query?: string;
  }>;
};

// Separate component for blog content that can be wrapped in Suspense
async function BlogContent({ searchParams }: BlogListProps) {
  const params = await searchParams;
  const query = params?.query || "";

  async function fetchBlogPosts() {
    // If there's a search query, use vector search
    if (query && query.trim() !== "") {
      console.log("QUERY IN PRISMA FUNCTION", query);
      const results = await prisma.blogPost.returnPineconeResults(
        query.trim(),
        5 // Increased limit for better search results
      );

      return results;
    }

    // Otherwise, fetch all published posts
    console.log("FETCHING ALL BLOGS");
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        isPublished: true, // Only return published posts
      },
      orderBy: {
        publishedAt: "desc", // Most recent first
      },
    });

    return blogPosts;
  }

  const blogs = await fetchBlogPosts();

  console.log("FETCHED BLOGS:", blogs.length);

  // Transform prisma data to match Blog type
  const transformedBlogs: Blog[] = blogs.map((blog) => ({
    title: blog?.title || "",
    description: blog?.description || "",
    summary: blog?.summary || "",
    readingTime: blog?.readingTime || undefined,
    publishedAt: blog?.publishedAt?.toISOString() || "",
    date: blog?.publishedAt?.toISOString() || "",
    slug: blog?.slug || "",
    image: blog?.coverImage || undefined,
    mdxPath: (blog as any)?.mdxPath || "", // Fix for mdxPath property
    tags: blog?.tags || [],
    id: blog?.id || "",
  }));

  const isSearchMode = query && query.trim() !== "";

  return (
    <>
      {transformedBlogs.length > 0 ? (
        <Blogs blogs={transformedBlogs} />
      ) : (
        <div className="text-center py-16">
          <div className="mb-6">
            <span className="text-6xl">{isSearchMode ? "🔍" : "📖"}</span>
            <Heading className="text-lg font-medium text-gray-900 mb-2 mt-4">
              {isSearchMode ? "No search results found" : "No articles found"}
            </Heading>
            <Paragraph className="text-gray-600 max-w-md mx-auto">
              {isSearchMode
                ? "Try a different search term or browse all articles."
                : "Check back later for new articles."}
            </Paragraph>
          </div>
        </div>
      )}
    </>
  );
}

export async function BlogList({ searchParams }: BlogListProps) {
  const params = await searchParams;
  const query = params?.query || "";
  const isSearchMode = query && query.trim() !== "";

  return (
    <>
      <span className="text-4xl">📝</span>
      <Heading className="font-black mb-2">
        {isSearchMode ? "Search Results" : "Latest Blog Posts"}
      </Heading>
      <Paragraph className="mb-10">
        {isSearchMode
          ? `Searching for "${query}"...`
          : "Read tutorials on AI, Full Stack Development and More. Journey with me into technology and life."}
      </Paragraph>

      <div className="mb-10">
        <BlogSearch
          placeholder="Search articles using AI..."
          showAllButton={isSearchMode ? true : false}
        />
      </div>

      <Suspense fallback={<BlogListSkeleton count={isSearchMode ? 2 : 3} />}>
        <BlogContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
