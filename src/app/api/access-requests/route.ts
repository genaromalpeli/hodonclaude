import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, reason } = body;

    if (!email || !role || !reason) {
      return NextResponse.json({ error: "Email, role and reason are required." }, { status: 400 });
    }

    const accessRequest = await prisma.accessRequest.create({
      data: { email, role, reason },
    });

    return NextResponse.json({ id: accessRequest.id, message: "Access request submitted." }, { status: 201 });
  } catch (error) {
    console.error("Access request error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
