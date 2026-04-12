import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const output = await prisma.output.findUnique({ where: { id } });
  if (!output || output.userId !== session.userId) {
    return NextResponse.json({ error: "Output not found." }, { status: 404 });
  }

  const body = await request.json();
  const { sectionKey, rating, missingEvidence } = body;

  if (!sectionKey || !rating) {
    return NextResponse.json({ error: "sectionKey and rating are required." }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: { outputId: id, sectionKey, rating, missingEvidence },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}
