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
  const { level, title, metricSuccess, status, outcome, learning, nextStep } = body;

  if (!level || !title || !metricSuccess) {
    return NextResponse.json({ error: "level, title and metricSuccess are required." }, { status: 400 });
  }

  const experiment = await prisma.experiment.create({
    data: {
      outputId: id,
      level,
      title,
      metricSuccess,
      status: status || "PENDING",
      outcome: outcome || "NONE",
      learning: learning || "",
      nextStep: nextStep || "",
    },
  });

  return NextResponse.json({ experiment }, { status: 201 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const output = await prisma.output.findUnique({ where: { id } });
  if (!output || output.userId !== session.userId) {
    return NextResponse.json({ error: "Output not found." }, { status: 404 });
  }

  const experiments = await prisma.experiment.findMany({
    where: { outputId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ experiments });
}
