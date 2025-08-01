"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";
import { Container } from "@/components/Container";

export default function AboutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("About page error:", error);
  }, [error]);

  return (
    <Container>
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          {/* Error Visual */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Something went wrong!
            </h2>
          </div>

          {/* Error Message */}
          <div className="mb-8 space-y-2">
            <p className="text-gray-600">
              We encountered an error while loading the about page.
            </p>
            <p className="text-sm text-gray-500">
              This might be a temporary issue. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-12 text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              If the problem persists:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                Check your internet connection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                Try refreshing the page
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <Link
                  href="/projects"
                  className="text-blue-600 hover:underline"
                >
                  Check out my projects instead
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}
