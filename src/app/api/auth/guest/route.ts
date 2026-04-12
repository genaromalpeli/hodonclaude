import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * Auto-login as the demo/guest user.
 * Creates the user if it doesn't exist (handles first deploy without seed).
 */
export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/app";

  try {
    const email = process.env.SEED_DEMO_EMAIL || "demo@hodon.local";
    const password = process.env.SEED_DEMO_PASSWORD || "demo1234";

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // First visit after deploy — create the guest user on the fly
      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: { name: "Demo", email, passwordHash, role: "RESEARCHER" },
      });
      await prisma.userSettings.create({ data: { userId: user.id } });
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Validate callbackUrl to avoid open-redirect
    const safe = callbackUrl.startsWith("/") ? callbackUrl : "/app";
    const response = NextResponse.redirect(new URL(safe, request.url));

    response.cookies.set("hodon-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("Guest auth error:", err);
    // If DB is not configured yet, show a helpful message
    const url = new URL("/setup-required", request.url);
    return NextResponse.redirect(url);
  }
}
