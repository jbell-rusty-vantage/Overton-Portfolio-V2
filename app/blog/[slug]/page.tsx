import { notFound } from "next/navigation";
import prisma from "@/prisma/globalPrisma";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import {
  AnimatedBlogPage,
  AnimatedHeader,
  AnimatedContent,
  AnimatedBackButton,
} from "@/components/AnimatedBlogPage";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mdx?: string }>;
};

// Loading component for MDX content
function MDXLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
  );
}

// Dynamic MDX Component Loader
function DynamicMDXContent({ mdxPath }: { mdxPath: string }) {
  if (!mdxPath) return null;

  // Process the mdx path for dynamic import
  // mdxPath is like "/blog/filename.mdx", we need to import the TSX wrapper
  const importPath = mdxPath.replace(/^\/blog\//, "").replace(/\.mdx$/, "");

  try {
    const MDXComponent = dynamic(
      () => import(`../../../blog/${importPath}.tsx`),
      {
        loading: () => <MDXLoading />,
        ssr: true, // Must be false since we're importing client components
      }
    );

    return (
      <div className="prose prose-lg max-w-none">
        <MDXComponent />
      </div>
    );
  } catch (error) {
    console.error("Error loading MDX component:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">
          Error loading blog content. The TSX wrapper file might not exist at:{" "}
          <br />
          <code className="text-sm bg-red-100 px-1 rounded">
            blog/{importPath}.tsx
          </code>
        </p>
      </div>
    );
  }
}

export default async function BlogPostPage({
  params,
  searchParams,
}: BlogPostPageProps) {
  const { slug } = await params;
  const { mdx } = await searchParams;

  console.log(mdx);

  // Fetch blog post metadata from database
  const blogPost = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!blogPost) {
    notFound();
  }

  // Use mdx from query params or fall back to the one in database
  const mdxPath = mdx || blogPost.mdxPath || "";

  return (
    <AnimatedBlogPage>
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <AnimatedBackButton />

        {/* Blog Header */}
        <AnimatedHeader>
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {blogPost.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <time dateTime={blogPost.publishedAt.toISOString()}>
                {blogPost.publishedAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{blogPost.readingTime} min read</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xl text-gray-700 leading-relaxed">
            {blogPost.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {blogPost.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Cover Image */}
          {blogPost.coverImage && (
            <div className="w-full h-64 md:h-80 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={blogPost.coverImage}
                alt={blogPost.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </AnimatedHeader>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* MDX Content */}
        <AnimatedContent>
          <Suspense fallback={<MDXLoading />}>
            <DynamicMDXContent mdxPath={mdxPath} />
          </Suspense>
        </AnimatedContent>

        {/* Footer */}
        <AnimatedContent>
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700">{blogPost.summary}</p>
            </div>
          </footer>
        </AnimatedContent>
      </article>
    </AnimatedBlogPage>
  );
}
