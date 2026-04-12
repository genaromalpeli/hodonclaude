import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { openAlexRequest } from "@/lib/openalex";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const perPage = searchParams.get("per_page") || "10";

  if (!search) {
    return NextResponse.json({ error: "search param required." }, { status: 400 });
  }

  try {
    const data = await openAlexRequest(session.userId, "/concepts", {
      search,
      per_page: perPage,
      select: "id,display_name,description,level,works_count,cited_by_count,related_concepts",
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "OpenAlex request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
