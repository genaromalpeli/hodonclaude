import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const { type, sourceRef, rawText, domain, objective, constraintsJson } = body;

    if (!type || !sourceRef) {
      return NextResponse.json({ error: "type and sourceRef are required." }, { status: 400 });
    }

    const input = await prisma.input.create({
      data: {
        userId: session.userId,
        type,
        sourceRef,
        rawText,
        domain: domain || "OTHER",
        objective: objective || "EXPLORE",
        constraintsJson: constraintsJson || null,
      },
    });

    return NextResponse.json({ input }, { status: 201 });
  } catch (error) {
    console.error("Create input error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const inputs = await prisma.input.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inputs });
}
