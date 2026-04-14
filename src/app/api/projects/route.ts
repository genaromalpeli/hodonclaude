import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { nodes: true, chats: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { title, seedQuestion } = await request.json();
  if (!title?.trim() || !seedQuestion?.trim()) {
    return NextResponse.json({ error: "Título y pregunta son requeridos." }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId: session.userId,
      title: title.trim(),
      seedQuestion: seedQuestion.trim(),
    },
  });

  // Create initial chat
  await prisma.chat.create({ data: { projectId: project.id } });

  return NextResponse.json({ project }, { status: 201 });
}
