import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prisma/globalPrisma";

const topK = 2;

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);

  const query = params.get("query");

  // Return error if no query is provided
  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  const results = await prisma.blogPost.returnPineconeResults(query, topK);

  return NextResponse.json(results);
}
