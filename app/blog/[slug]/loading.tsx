export default function BlogPostLoading() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      {/* Blog Header Skeleton */}
      <header className="mb-8 space-y-4">
        {/* Title Skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
        </div>

        {/* Meta Information Skeleton */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-full"></div>
          <div className="h-5 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Tags Skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded-full w-16"></div>
          ))}
        </div>

        {/* Cover Image Skeleton */}
        <div className="w-full h-64 md:h-80 bg-gray-200 rounded-lg"></div>
      </header>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-8"></div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        {/* Paragraph skeletons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}

        {/* Code block skeleton */}
        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* More paragraph skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i + 8} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </footer>
    </article>
  );
}
