import BlogPreviewCard from "./BlogPreviewCard";
import prisma from "@/prisma/globalPrisma";
import { BlogSearch } from "./BlogSearch";
import { BlogFilter } from "./BlogFilter";

type BlogListProps = {
  searchParams?: Promise<{
    query?: string;
    offset?: number;
    limit?: number;
    readingTime?: number;
    publishedAt?: string;
    tags?: string;
  }>;
};

export async function BlogList({ searchParams }: BlogListProps) {
  const params = await searchParams;

  const query = params?.query || "";
  const offset = Number(params?.offset) || 0;
  const limit = Number(params?.limit) || 5;
  const readingTime = Number(params?.readingTime) || undefined;
  const publishedAt = params?.publishedAt
    ? new Date(params.publishedAt)
    : undefined;
  const tagsParam = params?.tags;

  async function fetchAllBlogPosts() {
    // If there's a search query, use vector search and ignore filters
    if (query && query.trim() !== "") {
      console.log("QUERY IN PRISMA FUNCTION", query);
      const results = await prisma.blogPost.returnPineconeResults(
        query.trim(),
        2
      );

      console.log("RESULTS\n\n", results);

      return results.map((result) => result.blogPost);
    }

    // Otherwise, use regular filtering
    const whereClause: any = {
      isPublished: true, // Only return published posts
    };

    // Filter by reading time - less than or equal to provided value
    if (
      readingTime !== undefined &&
      readingTime !== null &&
      !isNaN(readingTime)
    ) {
      whereClause.readingTime = {
        lte: readingTime,
      };
    }

    // Filter by published date - more recent than or equal to provided date
    if (publishedAt !== undefined && publishedAt !== null) {
      whereClause.publishedAt = {
        gte: publishedAt,
      };
    }

    // Filter by tags - check if any of the blog post tags match
    if (tagsParam && tagsParam.trim() !== "") {
      const tags = tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length > 0) {
        whereClause.tags = {
          hasSome: tags,
        };
      }
    }

    const blogPosts = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: {
        publishedAt: "desc", // Most recent first
      },
      //   skip: offset,
      //   take: limit,
    });

    return blogPosts;
  }

  const blogs = await fetchAllBlogPosts();

  const isSearchMode = query && query.trim() !== "";
  const hasFilters = readingTime || publishedAt || tagsParam;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar with Filters - positioned below navbar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto z-10">
        <div className="p-6 space-y-6">
          {/* Sidebar Header */}
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Filter Articles</h2>
            <p className="text-sm text-gray-600 mt-1">
              Refine your search results
            </p>
          </div>

          {/* Show filters only when not searching */}
          {!isSearchMode ? (
            <BlogFilter />
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="font-medium">Search Active</span>
              </div>
              <p className="text-sm text-blue-700">
                Searching for: <span className="font-semibold">"{query}"</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Filters are disabled during search. Clear search to use filters.
              </p>
            </div>
          )}

          {/* Status indicator */}
          <div className="text-sm">
            {isSearchMode ? (
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Search Results</span>
                </div>
              </div>
            ) : hasFilters ? (
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="font-medium">Filtered Results</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span className="font-medium">All Articles</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-80 min-h-screen">
        {/* Search Section - Fixed at top, below navbar */}
        <div className="sticky top-16 bg-white border-b border-gray-200 z-20 shadow-sm">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Explore Articles
                </h1>
                <p className="text-gray-600">
                  Discover insights, tutorials, and stories
                </p>
              </div>
              <BlogSearch placeholder="Search articles using AI..." />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {blogs.length > 0 ? (
              <div className="space-y-6">
                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {isSearchMode
                      ? `Found ${blogs.length} search result${
                          blogs.length !== 1 ? "s" : ""
                        }`
                      : `Showing ${blogs.length} article${
                          blogs.length !== 1 ? "s" : ""
                        }`}
                  </p>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {blogs.map((blog: any) => (
                    <BlogPreviewCard key={blog.id} {...blog} />
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {isSearchMode
                      ? "Try a different search term or clear your search to browse all articles."
                      : "Try adjusting your filters or check back later for new articles."}
                  </p>
                </div>
              </div>
            )}

            {/* Load more indicator */}
            {blogs.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center text-xs text-gray-400 bg-white px-4 py-2 rounded-full shadow-sm border">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  End of articles
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
