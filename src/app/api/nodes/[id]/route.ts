import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const node = await prisma.canvasNode.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { userId: true } },
      sourcesOn: { include: { source: true } },
      edgesFrom: { include: { targetNode: { select: { id: true, title: true, type: true } } } },
      edgesTo: { include: { sourceNode: { select: { id: true, title: true, type: true } } } },
    },
  });

  if (!node || node.project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({ node });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const node = await prisma.canvasNode.findUnique({
    where: { id: params.id },
    include: { project: { select: { userId: true } } },
  });
  if (!node || node.project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const { positionX, positionY } = await request.json();
  const updated = await prisma.canvasNode.update({
    where: { id: params.id },
    data: {
      ...(positionX !== undefined && { positionX }),
      ...(positionY !== undefined && { positionY }),
    },
  });

  return NextResponse.json({ node: updated });
}
