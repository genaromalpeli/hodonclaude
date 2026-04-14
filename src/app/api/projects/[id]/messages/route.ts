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

  // Get or create chat
  let chat = await prisma.chat.findFirst({ where: { projectId: params.id } });
  if (!chat) {
    chat = await prisma.chat.create({ data: { projectId: params.id } });
  }

  const messages = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages, chatId: chat.id });
}
