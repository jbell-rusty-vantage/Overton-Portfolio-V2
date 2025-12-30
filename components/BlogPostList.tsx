import prisma from "@/prisma/globalPrisma";
import { BlogSearch } from "./BlogSearch";
import { Blogs } from "./Blogs";
import { Blog } from "@/app/types/blog";
import { Heading } from "./Heading";
import { Paragraph } from "./Paragraph";
import { Suspense } from "react";
import { BlogListSkeleton } from "./ui/skeleton";
import { redirect } from "next/navigation";

type BlogListProps = {
  searchParams?: Promise<{
    query?: string;
    isDoneSearching?: string; // ✅ keep as string because URL params
  }>;
};

// Separate component for blog content that can be wrapped in Suspense
async function BlogContent({ searchParams }: BlogListProps) {
  const params = await searchParams;
  const query = params?.query || "";
  const isSearchMode = query && query.trim() !== "";
  const isDoneSearching = params?.isDoneSearching === "true";

  async function fetchBlogPosts() {
    if (isSearchMode) {
      const results = await prisma.blogPost.returnPineconeResults(
        query.trim(),
        5
      );
      return results;
    }

    const blogPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
    });

    return blogPosts;
  }

  const blogs = await fetchBlogPosts();

  // ✅ Once search results are fetched, redirect to mark "done"
  if (isSearchMode && !isDoneSearching) {
    const qs = new URLSearchParams();
    qs.set("query", query.trim());
    qs.set("isDoneSearching", "true");

    redirect(`?${qs.toString()}`);
  }

  const transformedBlogs: Blog[] = blogs.map((blog) => ({
    title: blog?.title || "",
    description: blog?.description || "",
    summary: blog?.summary || "",
    readingTime: blog?.readingTime || undefined,
    publishedAt: blog?.publishedAt?.toISOString() || "",
    date: blog?.publishedAt?.toISOString() || "",
    slug: blog?.slug || "",
    image: blog?.coverImage || undefined,
    mdxPath: (blog as any)?.mdxPath || "",
    tags: blog?.tags || [],
    id: blog?.id || "",
  }));

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
  const isSearchMode = Boolean(query && query.trim() !== "");
  const isDoneSearching = params?.isDoneSearching === "true";

  return (
    <>
      <span className="text-4xl">📝</span>
      <Heading className="font-black mb-2">
        {isSearchMode ? "Search Results" : "Latest Blog Posts"}
      </Heading>

      <Paragraph className="mb-10">
        {isSearchMode
          ? isDoneSearching
            ? `Showing results for "${query}".`
            : `Searching for "${query}"...`
          : "Read tutorials on AI, Full Stack Development and More. Journey with me into technology and life."}
      </Paragraph>

      <div className="mb-10">
        <BlogSearch
          placeholder="Search posts (keywords or concepts)"
          showAllButton={isSearchMode}
        />
      </div>

      <Suspense fallback={<BlogListSkeleton count={isSearchMode ? 2 : 3} />}>
        <BlogContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
