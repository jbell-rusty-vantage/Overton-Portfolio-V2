"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import React from "react";
import { Spinner } from "@/components/ui/skeleton";
import { motion } from "motion/react";

type BlogSearchProps = {
  placeholder: string;
  showAllButton?: boolean;
};

export function BlogSearch({
  placeholder,
  showAllButton = false,
}: BlogSearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("query") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);

  const handleSearch = (evt: React.FormEvent) => {
    evt.preventDefault();

    if (term.trim().length > 0) {
      setIsSearching(true);
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams);

      if (term.trim().length > 0) {
        params.set("query", term.trim());
        params.set("isDoneSearching", "false"); // ✅ reset when starting a new search
      } else {
        params.delete("query");
        params.delete("isDoneSearching");
      }

      replace(`${pathname}?${params.toString()}`);

      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    });
  };

  const clearSearch = () => {
    setTerm("");
    setIsSearching(true);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("query");
      params.delete("isDoneSearching");
      replace(`${pathname}?${params.toString()}`);

      setTimeout(() => {
        setIsSearching(false);
      }, 300);
    });
  };

  const showAllBlogs = () => {
    setTerm("");
    setIsShowingAll(true);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("query");
      params.delete("isDoneSearching");
      replace(`${pathname}?${params.toString()}`);

      setTimeout(() => {
        setIsShowingAll(false);
      }, 500);
    });
  };

  return (
    <motion.div
      className="flex flex-col space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSearch} className="flex flex-col space-y-2">
        <label className="text-xl font-sans font-bold" htmlFor="search">
          Search Blog Posts
        </label>
        <div className="flex gap-2">
          <motion.input
            id="search"
            type="text"
            placeholder={placeholder}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none bg-transparent focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            whileFocus={{ scale: 1.02 }}
            disabled={isSearching || isPending}
          />
          <Button
            type="submit"
            disabled={isSearching || isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-200"
          >
            {isSearching || isPending ? (
              <div className="flex items-center space-x-2">
                <Spinner className="w-4 h-4 text-white" />
                <span>Searching...</span>
              </div>
            ) : (
              "Search"
            )}
          </Button>

          {term && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="button"
                onClick={clearSearch}
                disabled={isSearching || isPending}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-70 transition-all duration-200"
              >
                {isSearching ? (
                  <Spinner className="w-4 h-4 text-white" />
                ) : (
                  "Clear"
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between">
        {searchParams.get("query") && (
          <motion.div
            className="text-sm text-gray-600"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            Searching for:{" "}
            <span className="font-semibold">"{searchParams.get("query")}"</span>
          </motion.div>
        )}

        {showAllButton && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              onClick={showAllBlogs}
              disabled={isShowingAll || isPending}
              className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 transition-all duration-200"
            >
              {isShowingAll ? (
                <div className="flex items-center space-x-2">
                  <Spinner className="w-3 h-3 text-white" />
                  <span>Loading...</span>
                </div>
              ) : (
                "← Show All Blogs"
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
