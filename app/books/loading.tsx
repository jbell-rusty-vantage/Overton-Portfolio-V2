import { Container } from "@/components/Container";

export default function BooksLoading() {
  return (
    <Container>
      {/* Header skeleton */}
      <div className="space-y-8">
        <div className="text-center">
          {/* Title skeleton */}
          <div className="h-10 bg-gray-200 rounded-md w-80 mx-auto animate-pulse mb-4"></div>

          {/* Description skeleton */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="h-5 bg-gray-200 rounded-md w-full animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md w-5/6 mx-auto animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-md w-4/6 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Books grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 animate-pulse"
            >
              {/* Book cover skeleton */}
              <div className="mb-4">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-3">
                {/* Title skeleton */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>

                {/* Author skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2"></div>

                {/* Published date skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3"></div>

                {/* Pages skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4"></div>

                {/* Description skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-4/6"></div>
                </div>

                {/* Categories skeleton */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[...Array(3)].map((_, catIndex) => (
                    <div
                      key={catIndex}
                      className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
