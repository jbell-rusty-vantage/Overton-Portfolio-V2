"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "./books-card";

interface Book {
  id: string;
  title: string;
  description?: string | null;
  publishedDate?: string | null;
  pageCount?: number | null;
  thumbnail?: string | null;
  categories: string[];
  authors: {
    name: string;
  };
}

interface BooksGridProps {
  books: Book[];
}

export default function BooksGrid({ books }: BooksGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 3;
  const totalPages = Math.ceil(books.length / booksPerPage);

  // Reset to first page when books change
  useEffect(() => {
    setCurrentPage(1);
  }, [books]);

  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No books found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Books Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {currentBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • Showing {startIndex + 1}-
          {Math.min(endIndex, books.length)} of {books.length} books
        </div>
      )}
    </div>
  );
}
