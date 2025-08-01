import { Container } from "@/components/Container";

export default function ProjectsLoading() {
  return (
    <Container>
      {/* Emoji placeholder */}
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-4"></div>

      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded-md w-80 animate-pulse mb-10"></div>

      {/* Projects grid skeleton */}
      <div className="grid grid-cols-1 gap-10">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 pt-4">
              {/* Image skeleton */}
              <div className="h-48 w-48 bg-gray-200 rounded-md"></div>

              {/* Content skeleton */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  {/* Title skeleton */}
                  <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2"></div>

                  {/* Description skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
                  </div>
                </div>

                {/* Technologies skeleton */}
                <div className="flex space-x-2 mt-4">
                  {[...Array(3)].map((_, techIndex) => (
                    <div
                      key={techIndex}
                      className="h-6 w-16 bg-gray-200 rounded-sm"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
