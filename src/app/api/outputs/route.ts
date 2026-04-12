import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOutput, InputSeed } from "@/lib/mock-generator";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const { inputId, openAlexWorkData } = body;

    if (!inputId) {
      return NextResponse.json({ error: "inputId is required." }, { status: 400 });
    }

    const input = await prisma.input.findUnique({ where: { id: inputId } });
    if (!input || input.userId !== session.userId) {
      return NextResponse.json({ error: "Input not found." }, { status: 404 });
    }

    // Build seed for mock generator
    let seed: InputSeed;
    if (input.type === "OPENALEX_WORK" && openAlexWorkData) {
      seed = { type: "openalex", data: openAlexWorkData };
    } else if (input.type === "OPENALEX_WORK") {
      seed = {
        type: "openalex",
        data: { title: input.sourceRef, abstract: undefined, concepts: [], cited_by_count: undefined },
      };
    } else {
      seed = {
        type: "text",
        data: { text: input.rawText || input.sourceRef, fileName: input.sourceRef },
      };
    }

    const sections = generateOutput(seed, input.domain, input.objective);

    const title =
      input.type === "OPENALEX_WORK" && openAlexWorkData?.title
        ? openAlexWorkData.title
        : input.rawText
        ? input.rawText.slice(0, 80)
        : input.sourceRef;

    const output = await prisma.output.create({
      data: {
        userId: session.userId,
        inputId: input.id,
        title,
        sectionsJson: JSON.parse(JSON.stringify(sections)),
      },
    });

    return NextResponse.json({ output }, { status: 201 });
  } catch (error) {
    console.error("Create output error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const domain = searchParams.get("domain") || "";
  const objective = searchParams.get("objective") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { userId: session.userId };

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  if (domain || objective) {
    where.input = {
      ...(domain && { domain }),
      ...(objective && { objective }),
    };
  }

  const [outputs, total] = await Promise.all([
    prisma.output.findMany({
      where,
      include: { input: { select: { domain: true, objective: true, type: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.output.count({ where }),
  ]);

  return NextResponse.json({ outputs, total, page, limit });
}
