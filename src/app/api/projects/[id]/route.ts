import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { nodes: true } },
    },
  });

  if (!project || project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
