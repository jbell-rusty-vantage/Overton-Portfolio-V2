import Link from "next/link";
import Image from "next/image";
import { Badge } from "./ui/badge";

type BlogPreviewCardProps = {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
  tags: string[];
  readingTime: number;
  publishedAt: Date;
  mdxPath: string;
};

export default function BlogPreviewCard({
  id,
  title,
  description,
  image,
  slug,
  tags,
  readingTime,
  publishedAt,
  mdxPath,
}: BlogPreviewCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Link href={`/blog/${slug}?mdx=${mdxPath}`} className="block group">
      <article className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ease-out overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1">
        {/* Image Section */}
        <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
          <Image
            src="/placeholder-one.jpg"
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Reading time badge */}
          <div className="absolute top-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              {readingTime} min read
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed line-clamp-3 text-sm md:text-base">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <time
                dateTime={publishedAt.toISOString()}
                className="flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(publishedAt)}
              </time>
            </div>

            {/* Read more arrow */}
            <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors duration-200">
              <span className="mr-1">Read more</span>
              <svg
                className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
