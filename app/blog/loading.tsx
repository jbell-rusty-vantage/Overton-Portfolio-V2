import { Container } from "@/components/Container";

export default function Loading() {
  return (
    <Container>
      {/* Emoji placeholder */}
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-4"></div>

      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded-md w-80 animate-pulse mb-2"></div>

      {/* Description skeleton */}
      <div className="h-4 bg-gray-200 rounded-md w-96 animate-pulse mb-10"></div>

      {/* Search bar skeleton */}
      <div className="mb-10">
        <div className="h-6 bg-gray-200 rounded-md w-40 animate-pulse mb-2"></div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Blog posts skeleton */}
      <div className="max-w-5xl mx-auto">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="my-10">
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
        ))}
      </div>

      {/* Loading indicator at bottom */}
      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </Container>
  );
}
