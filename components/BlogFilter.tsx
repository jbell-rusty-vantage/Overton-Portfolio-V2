"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function BlogFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [readingTime, setReadingTime] = useState(
    searchParams.get("readingTime") || ""
  );
  const [publishedAfter, setPublishedAfter] = useState(
    searchParams.get("publishedAt") || ""
  );

  // Common blog tags - updated to match blockchain content
  const availableTags = [
    "blockchain",
    "ethereum",
    "layer2",
    "polygon",
    "arbitrum",
    "optimism",
    "javascript",
    "typescript",
    "react",
    "nextjs",
    "web-development",
    "programming",
    "tutorial",
    "guide",
    "defi",
    "smart-contracts",
  ];

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Update tags
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    } else {
      params.delete("tags");
    }

    // Update reading time
    if (readingTime && !isNaN(Number(readingTime))) {
      params.set("readingTime", readingTime);
    } else {
      params.delete("readingTime");
    }

    // Update published date
    if (publishedAfter) {
      params.set("publishedAt", publishedAfter);
    } else {
      params.delete("publishedAt");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setReadingTime("");
    setPublishedAfter("");

    const params = new URLSearchParams(searchParams);
    params.delete("tags");
    params.delete("readingTime");
    params.delete("publishedAt");

    replace(`${pathname}?${params.toString()}`);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters =
    selectedTags.length > 0 || readingTime || publishedAfter;

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">
            Active Filters
          </span>
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Tags Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <label className="text-sm font-medium text-gray-900">Topics</label>
        </div>
        <div className="space-y-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                selectedTags.includes(tag)
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize">{tag.replace(/-/g, " ")}</span>
                {selectedTags.includes(tag) && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reading Time Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <label
            className="text-sm font-medium text-gray-900"
            htmlFor="reading-time"
          >
            Max Reading Time
          </label>
        </div>
        <div className="relative">
          <input
            id="reading-time"
            type="number"
            min="1"
            max="60"
            value={readingTime}
            onChange={(e) => setReadingTime(e.target.value)}
            placeholder="e.g., 10"
            className="w-full pl-3 pr-12 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <span className="absolute right-3 top-2 text-xs text-gray-500">
            min
          </span>
        </div>
      </div>

      {/* Published Date Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500"
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
          <label
            className="text-sm font-medium text-gray-900"
            htmlFor="published-after"
          >
            Published After
          </label>
        </div>
        <input
          id="published-after"
          type="date"
          value={publishedAfter}
          onChange={(e) => setPublishedAfter(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={updateFilters}
        className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
      >
        Apply Filters
      </button>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Active Filters
          </div>
          {selectedTags.length > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Topics:</span>{" "}
              {selectedTags.join(", ")}
            </div>
          )}
          {readingTime && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Max time:</span> {readingTime}{" "}
              minutes
            </div>
          )}
          {publishedAfter && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">After:</span>{" "}
              {new Date(publishedAfter).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
