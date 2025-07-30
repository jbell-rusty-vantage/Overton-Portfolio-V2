import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Blog Card Skeleton Component
function BlogCardSkeleton() {
  return (
    <div className="my-10 block">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Image skeleton */}
        <div className="h-40 w-60 bg-gray-200 rounded-md animate-pulse"></div>

        {/* Content skeleton */}
        <div className="flex flex-col col-span-3 space-y-4">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-4/6 animate-pulse"></div>
          </div>

          {/* Summary skeleton */}
          <div className="h-4 bg-blue-100 rounded-md w-4/5 animate-pulse"></div>

          {/* Tags skeleton */}
          <div className="flex space-x-2 flex-wrap">
            {[...Array(3)].map((_, tagIndex) => (
              <div
                key={tagIndex}
                className="h-6 w-16 bg-gray-200 rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Multiple Blog Cards Skeleton
function BlogListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="max-w-5xl mx-auto my-10">
      {[...Array(count)].map((_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Spinner Component
function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Skeleton, BlogCardSkeleton, BlogListSkeleton, Spinner };
