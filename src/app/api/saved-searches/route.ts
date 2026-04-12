import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ searches });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const { query, filtersJson } = body;

  if (!query) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  const search = await prisma.savedSearch.create({
    data: { userId: session.userId, query, filtersJson },
  });

  return NextResponse.json({ search }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const search = await prisma.savedSearch.findUnique({ where: { id } });
  if (!search || search.userId !== session.userId) {
    return NextResponse.json({ error: "Saved search not found." }, { status: 404 });
  }

  await prisma.savedSearch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
