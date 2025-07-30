import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../prisma/globalPrisma";

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json();

  const contact = await prisma.contacts.create({
    data: { name, email, message },
  });

  return NextResponse.json(contact);
}
