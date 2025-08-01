import { Container } from "@/components/Container";

export default function HomeLoading() {
  return (
    <Container>
      {/* Hero section skeleton */}
      <div className="space-y-8">
        {/* Emoji placeholder */}
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-4"></div>

        {/* Title skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-md w-96 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-md w-80 animate-pulse"></div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-3 max-w-2xl">
          <div className="h-5 bg-gray-200 rounded-md w-full animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded-md w-4/6 animate-pulse"></div>
        </div>

        {/* CTA button skeleton */}
        <div className="h-12 bg-gray-200 rounded-md w-40 animate-pulse"></div>
      </div>

      {/* Sections skeleton */}
      <div className="mt-20 space-y-16">
        {/* About section skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-md w-32 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded-md w-48 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects section skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-md w-40 animate-pulse"></div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 pt-4"
              >
                <div className="h-48 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    {[...Array(3)].map((_, techIndex) => (
                      <div
                        key={techIndex}
                        className="h-6 w-16 bg-gray-200 rounded-sm animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog section skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-md w-32 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
