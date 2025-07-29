import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function BlogNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* 404 Visual */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="relative -mt-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Blog Post Not Found
            </h2>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-2">
          <p className="text-gray-600">
            Sorry, we couldn't find the blog post you're looking for.
          </p>
          <p className="text-sm text-gray-500">
            The post may have been moved, deleted, or the URL might be
            incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse All Blog Posts
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 text-left">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            What you can do:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              Check the URL for any typos
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              Browse our latest blog posts
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              Use the search feature to find related content
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
