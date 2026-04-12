import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const output = await prisma.output.findUnique({
    where: { id },
    include: {
      input: true,
      experiments: { orderBy: { createdAt: "asc" } },
      feedback: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!output || output.userId !== session.userId) {
    return NextResponse.json({ error: "Output not found." }, { status: 404 });
  }

  return NextResponse.json({ output });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const output = await prisma.output.findUnique({ where: { id } });
  if (!output || output.userId !== session.userId) {
    return NextResponse.json({ error: "Output not found." }, { status: 404 });
  }

  await prisma.output.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const output = await prisma.output.findUnique({ where: { id } });
  if (!output || output.userId !== session.userId) {
    return NextResponse.json({ error: "Output not found." }, { status: 404 });
  }

  const body = await request.json();
  const { title, sectionsJson } = body;

  const updated = await prisma.output.update({
    where: { id },
    data: { ...(title && { title }), ...(sectionsJson && { sectionsJson }) },
  });

  return NextResponse.json({ output: updated });
}
