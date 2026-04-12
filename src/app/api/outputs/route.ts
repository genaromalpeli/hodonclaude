import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateOutput, InputSeed, PaperAdjunto } from "@/lib/mock-generator";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const { inputId, papersAdjuntos } = body;

    if (!inputId) {
      return NextResponse.json({ error: "inputId es requerido." }, { status: 400 });
    }

    const input = await prisma.input.findUnique({ where: { id: inputId } });
    if (!input || input.userId !== session.userId) {
      return NextResponse.json({ error: "Input no encontrado." }, { status: 404 });
    }

    // Construir seed para el generador
    const seed: InputSeed = {
      tipo: input.type === "OPENALEX_WORK" ? "openalex" : input.type === "PDF_UPLOAD" ? "pdf" : "pregunta",
      pregunta: input.rawText || undefined,
      papersAdjuntos: (papersAdjuntos || []) as PaperAdjunto[],
      nombreArchivo: input.type === "PDF_UPLOAD" ? input.sourceRef : undefined,
    };

    const sections = generateOutput(seed);

    const titulo =
      input.rawText
        ? input.rawText.slice(0, 100)
        : papersAdjuntos?.[0]?.titulo
        ? papersAdjuntos[0].titulo.slice(0, 100)
        : input.sourceRef.slice(0, 100);

    const output = await prisma.output.create({
      data: {
        userId: session.userId,
        inputId: input.id,
        title: titulo,
        sectionsJson: JSON.parse(JSON.stringify(sections)),
      },
    });

    return NextResponse.json({ output }, { status: 201 });
  } catch (error) {
    console.error("Error generando output:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { userId: session.userId };
  if (search) where.title = { contains: search, mode: "insensitive" };

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
