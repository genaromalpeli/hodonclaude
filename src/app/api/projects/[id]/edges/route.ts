import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const edges = await prisma.canvasEdge.findMany({
    where: { projectId: params.id },
  });

  return NextResponse.json({ edges });
}
