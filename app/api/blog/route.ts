import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prisma/globalPrisma";

interface BlogFilters {
  readingTime?: number;
  publishedAt?: Date;
}

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);

  const readingTimeParam = params.get("readingTime");
  const publishedAtParam = params.get("publishedAt");
  const offsetParam = params.get("offset");
  const limitParam = params.get("limit");

  // Parse tags from comma-separated string

  // Parse readingTime as number
  const readingTime = readingTimeParam ? parseInt(readingTimeParam) : null;

  // Parse publishedAt as Date
  const publishedAt = publishedAtParam ? new Date(publishedAtParam) : null;

  // Parse pagination parameters as numbers
  const offset = offsetParam ? parseInt(offsetParam) : 0;
  const limit = limitParam ? parseInt(limitParam) : 5;

  // Build where clause
  const whereClause: any = {
    isPublished: true, // Only return published posts
  };

  // Filter by tags - check if any of the blog post tags are in the provided tags

  // Filter by reading time - less than or equal to provided value
  if (readingTime !== null) {
    whereClause.readingTime = {
      lte: readingTime,
    };
  }

  // Filter by published date - more recent than or equal to provided date
  if (publishedAt !== null) {
    whereClause.publishedAt = {
      gte: publishedAt,
    };
  }

  const blogPosts = await prisma.blogPost.findMany({
    where: whereClause,
    orderBy: {
      publishedAt: "desc", // Most recent first
    },
    skip: offset,
    take: limit,
  });

  return NextResponse.json(blogPosts);
}
