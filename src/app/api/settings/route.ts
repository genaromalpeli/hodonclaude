import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId: session.userId } });
  }

  return NextResponse.json({
    settings: {
      id: settings.id,
      openAlexApiKey: settings.openAlexApiKey ? "***" + settings.openAlexApiKey.slice(-4) : null,
      hasApiKey: !!settings.openAlexApiKey,
      exportPreference: settings.exportPreference,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();
  const { openAlexApiKey, exportPreference } = body;

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.userId },
    update: {
      ...(openAlexApiKey !== undefined && { openAlexApiKey: openAlexApiKey || null }),
      ...(exportPreference !== undefined && { exportPreference }),
    },
    create: {
      userId: session.userId,
      ...(openAlexApiKey && { openAlexApiKey }),
      ...(exportPreference && { exportPreference }),
    },
  });

  return NextResponse.json({
    settings: {
      id: settings.id,
      openAlexApiKey: settings.openAlexApiKey ? "***" + settings.openAlexApiKey.slice(-4) : null,
      hasApiKey: !!settings.openAlexApiKey,
      exportPreference: settings.exportPreference,
    },
  });
}
