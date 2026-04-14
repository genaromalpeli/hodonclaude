import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const projects = await prisma.project.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { nodes: true, chats: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("GET /api/projects error:", err);
    // Table might not exist yet
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
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
  } catch (err) {
    console.error("POST /api/projects error:", err);
    const msg = err instanceof Error ? err.message : "Error interno";
    if (msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json(
        { error: "La base de datos necesita actualizarse. Ejecuta: prisma db push" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Error creando proyecto." }, { status: 500 });
  }
}
