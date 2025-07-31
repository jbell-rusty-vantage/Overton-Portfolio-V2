import { FavoriteBooks } from "@/components/FavoriteBooks";

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

async function getBooks(): Promise<Book[]> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/books`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch books");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

export default async function BooksPage() {
  const books = await getBooks();

  return <FavoriteBooks books={books} />;
}
