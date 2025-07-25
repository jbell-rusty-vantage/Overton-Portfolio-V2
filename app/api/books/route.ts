import { NextResponse } from "next/server";
import prisma from "@/prisma/globalPrisma";

export async function GET() {
  try {
    const dbBooks = await prisma.books.findMany({
      include: {
        authors: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform database format to UI format
    const books = dbBooks.map((book) => ({
      id: book.id,
      title: book.title,
      description: book.description,
      publishedDate: book.publishedDate,
      pageCount: book.pageCount,
      thumbnail: book.thumbnail,
      categories: book.categories,
      authors: {
        name: book.authors.name, // Single author relationship
      },
    }));

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
