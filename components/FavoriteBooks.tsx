"use client";
import React, { useState } from "react";
import { Container } from "./Container";

interface Book {
  id: string;
  title: string;
  description: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  thumbnail: string | null;
  categories: string[];
  authors: {
    name: string;
  };
}

interface FavoriteBooksProps {
  books: Book[];
}

export const FavoriteBooks = ({ books }: FavoriteBooksProps) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToBooks = () => {
    setSelectedBook(null);
  };

  return (
    <Container>
      {/* Main Books Grid */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          selectedBook
            ? "opacity-0 scale-95 pointer-events-none"
            : "opacity-100 scale-100"
        }`}
      >
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              My Favorite Books
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              A collection of books that have influenced my thinking, expanded
              my knowledge, and shaped my perspective on technology, business,
              and life.
            </p>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-neutral-600 dark:text-neutral-400">
                No books found. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleBookClick(book)}
                  className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  {book.thumbnail && (
                    <div className="mb-4">
                      <img
                        src={book.thumbnail}
                        alt={`Cover of ${book.title}`}
                        className="w-full h-48 object-cover rounded-md shadow-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                      {book.title}
                    </h3>

                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      by {book.authors.name}
                    </p>

                    {book.publishedDate && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        Published: {new Date(book.publishedDate).getFullYear()}
                      </p>
                    )}

                    {book.pageCount && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        {book.pageCount} pages
                      </p>
                    )}

                    {book.description && (
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                        {book.description}
                      </p>
                    )}

                    {book.categories && book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {book.categories.slice(0, 3).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-500 ease-in-out ${
            selectedBook ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-all duration-500 ease-out ${
              selectedBook ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="p-8">
              {/* Header with close button */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Book Details
                </h2>
                <button
                  onClick={handleBackToBooks}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors duration-200 font-medium"
                >
                  ← Back to all books
                </button>
              </div>

              {/* Book content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Book cover */}
                <div className="lg:col-span-1">
                  {selectedBook.thumbnail ? (
                    <img
                      src={selectedBook.thumbnail}
                      alt={`Cover of ${selectedBook.title}`}
                      className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full max-w-sm mx-auto h-96 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        No cover available
                      </span>
                    </div>
                  )}
                </div>

                {/* Book information */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                      {selectedBook.title}
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                      by {selectedBook.authors.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-neutral-200 dark:border-neutral-700">
                    {selectedBook.publishedDate && (
                      <div>
                        <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 block">
                          Published
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                          {new Date(selectedBook.publishedDate).getFullYear()}
                        </span>
                      </div>
                    )}
                    {selectedBook.pageCount && (
                      <div>
                        <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 block">
                          Pages
                        </span>
                        <span className="text-neutral-900 dark:text-neutral-100">
                          {selectedBook.pageCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedBook.categories &&
                    selectedBook.categories.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                          Categories
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedBook.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedBook.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                        Description
                      </h3>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {selectedBook.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};
