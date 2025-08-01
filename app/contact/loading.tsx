import { Container } from "@/components/Container";

export default function ContactLoading() {
  return (
    <Container>
      {/* Emoji placeholder */}
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-4"></div>

      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 rounded-md w-40 animate-pulse mb-2"></div>

      {/* Description skeleton */}
      <div className="space-y-2 mb-10">
        <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded-md w-4/6 animate-pulse"></div>
      </div>

      {/* Contact form skeleton */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Name field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded-md w-16 mb-2 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-md w-full animate-pulse"></div>
        </div>

        {/* Email field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded-md w-20 mb-2 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-md w-full animate-pulse"></div>
        </div>

        {/* Subject field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded-md w-24 mb-2 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-md w-full animate-pulse"></div>
        </div>

        {/* Message field skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded-md w-28 mb-2 animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-md w-full animate-pulse"></div>
        </div>

        {/* Submit button skeleton */}
        <div className="pt-4">
          <div className="h-12 bg-gray-200 rounded-md w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Contact info skeleton */}
      <div className="mt-16 max-w-2xl mx-auto">
        <div className="h-6 bg-gray-200 rounded-md w-48 mx-auto mb-8 animate-pulse"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email skeleton */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-32 mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-48 mx-auto animate-pulse"></div>
          </div>

          {/* Social links skeleton */}
          <div className="text-center space-y-3">
            <div className="h-4 bg-gray-200 rounded-md w-32 mx-auto animate-pulse"></div>
            <div className="flex justify-center space-x-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
