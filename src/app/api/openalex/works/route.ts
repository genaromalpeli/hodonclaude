import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { openAlexRequest } from "@/lib/openalex";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const perPage = searchParams.get("per_page") || "10";
  const page = searchParams.get("page") || "1";
  const filter = searchParams.get("filter") || "";

  if (!search && !filter) {
    return NextResponse.json({ error: "search or filter param required." }, { status: 400 });
  }

  try {
    const params: Record<string, string> = {
      per_page: perPage,
      page,
      select:
        "id,title,abstract_inverted_index,publication_year,cited_by_count,concepts,authorships,primary_location,doi",
    };

    if (search) params.search = search;
    if (filter) params.filter = filter;

    const data = await openAlexRequest(session.userId, "/works", params);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "OpenAlex request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
