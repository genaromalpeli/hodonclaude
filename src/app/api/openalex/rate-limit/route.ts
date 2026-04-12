import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOpenAlexApiKey } from "@/lib/openalex";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const apiKey = await getOpenAlexApiKey(session.userId);

  try {
    const url = new URL("https://api.openalex.org/rate-limit");
    if (apiKey) url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Hodon/0.1 (mailto:admin@hodon.local)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenAlex returned ${res.status}`, hasApiKey: !!apiKey },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ...data, hasApiKey: !!apiKey });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Connection failed.";
    return NextResponse.json({ error: msg, hasApiKey: !!apiKey }, { status: 502 });
  }
}
