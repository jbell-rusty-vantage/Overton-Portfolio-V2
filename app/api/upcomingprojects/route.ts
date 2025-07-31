import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/globalPrisma";

export async function GET(req: NextRequest) {
  const upcomingProjects = await prisma.upcomingProjects.findMany({});

  return NextResponse.json(upcomingProjects);
}
