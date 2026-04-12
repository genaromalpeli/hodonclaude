import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { output: true },
  });

  if (!experiment || experiment.output.userId !== session.userId) {
    return NextResponse.json({ error: "Experiment not found." }, { status: 404 });
  }

  const body = await request.json();
  const { title, metricSuccess, status, outcome, learning, nextStep } = body;

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(metricSuccess !== undefined && { metricSuccess }),
      ...(status !== undefined && { status }),
      ...(outcome !== undefined && { outcome }),
      ...(learning !== undefined && { learning }),
      ...(nextStep !== undefined && { nextStep }),
    },
  });

  return NextResponse.json({ experiment: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { output: true },
  });

  if (!experiment || experiment.output.userId !== session.userId) {
    return NextResponse.json({ error: "Experiment not found." }, { status: 404 });
  }

  await prisma.experiment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
