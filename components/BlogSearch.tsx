"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function BlogSearch({ placeholder }: { placeholder: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [term, setTerm] = useState(searchParams.get("query") || "");

  const handleSearch = (evt: React.FormEvent) => {
    evt.preventDefault();

    const params = new URLSearchParams(searchParams);

    if (term.trim().length > 0) {
      // Set the search query
      params.set("query", term.trim());

      // Clear filters when searching (they are mutually exclusive)
      params.delete("readingTime");
      params.delete("publishedAt");
      params.delete("tags");
      params.delete("offset"); // Reset pagination
    } else {
      // If search is empty, remove the query
      params.delete("query");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("query");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col space-y-2">
      <form onSubmit={handleSearch} className="flex flex-col space-y-2">
        <label className="text-xl font-sans font-bold" htmlFor="search">
          Search Blog Posts
        </label>
        <div className="flex gap-2">
          <input
            id="search"
            type="text"
            placeholder={placeholder}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          {term && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {searchParams.get("query") && (
        <div className="text-sm text-gray-600">
          Searching for:{" "}
          <span className="font-semibold">"{searchParams.get("query")}"</span>
        </div>
      )}
    </div>
  );
}
