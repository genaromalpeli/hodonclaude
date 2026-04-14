import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runCKOE } from "@/lib/ai/pipeline";
import { generateCanvasData } from "@/lib/ai/canvas-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== session.userId) {
    return new Response(JSON.stringify({ error: "No encontrado." }), { status: 404 });
  }

  const { content } = await request.json();
  if (!content?.trim()) {
    return new Response(JSON.stringify({ error: "Mensaje vacío." }), { status: 400 });
  }

  // Get or create chat
  let chat = await prisma.chat.findFirst({ where: { projectId: params.id } });
  if (!chat) {
    chat = await prisma.chat.create({ data: { projectId: params.id } });
  }

  // Save user message
  await prisma.message.create({
    data: { chatId: chat.id, role: "user", content: content.trim() },
  });

  // Get message history
  const history = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const messageHistory = history
    .map((m) => `${m.role === "user" ? "Usuario" : "Cosmo"}: ${m.content.slice(0, 500)}`)
    .join("\n");

  // Get existing nodes summary
  const existingNodes = await prisma.canvasNode.findMany({
    where: { projectId: params.id },
    take: 30,
    orderBy: { createdAt: "desc" },
  });
  const existingNodesSummary = existingNodes.length > 0
    ? existingNodes.map((n) => `[${n.type}] ${n.title}`).join("; ")
    : "";

  // Stream response via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send "thinking" event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "status", text: "Analizando tu pregunta..." })}\n\n`)
        );

        // Run CKOE pipeline
        const { srf, intent } = await runCKOE({
          question: content.trim(),
          projectId: params.id,
          existingNodesSummary,
          messageHistory,
        });

        // Send SRF sections progressively
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "status", text: "Generando framework..." })}\n\n`)
        );

        // Build the full text response from SRF
        const responseText = formatSRFAsText(srf);

        // Stream the text in chunks
        const chunkSize = 80;
        for (let i = 0; i < responseText.length; i += chunkSize) {
          const chunk = responseText.slice(i, i + chunkSize);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`)
          );
          // Small delay for streaming feel
          await new Promise((r) => setTimeout(r, 30));
        }

        // Generate canvas data
        const canvasData = generateCanvasData(srf);

        // Save nodes and edges to DB
        const createdNodes: Array<{ id: string; title: string; idx: number }> = [];
        for (let i = 0; i < canvasData.nodes.length; i++) {
          const n = canvasData.nodes[i];
          const created = await prisma.canvasNode.create({
            data: {
              projectId: params.id,
              parentMessageId: null,
              type: n.type,
              title: n.title,
              contentSimple: n.contentSimple,
              contentMedium: n.contentMedium,
              contentSenior: n.contentSenior,
              epistemicStatus: n.epistemicStatus,
              positionX: n.positionX,
              positionY: n.positionY,
            },
          });
          createdNodes.push({ id: created.id, title: created.title, idx: i });
        }

        // Save edges
        for (const e of canvasData.edges) {
          const src = createdNodes[e.sourceTitleIndex];
          const tgt = createdNodes[e.targetTitleIndex];
          if (src && tgt) {
            await prisma.canvasEdge.create({
              data: {
                projectId: params.id,
                sourceNodeId: src.id,
                targetNodeId: tgt.id,
                relationType: e.relationType,
              },
            });
          }
        }

        // Save sources
        for (const cs of (srf.citedSources || [])) {
          await prisma.source.create({
            data: {
              projectId: params.id,
              sourceType: "paper",
              title: cs.title,
              authors: cs.authors || [],
              year: cs.year || null,
              url: cs.url || null,
            },
          });
        }

        // Save assistant message
        await prisma.message.create({
          data: {
            chatId: chat!.id,
            role: "assistant",
            content: responseText,
            rawJson: JSON.parse(JSON.stringify(srf)),
          },
        });

        // Send canvas update event
        const nodesForClient = await prisma.canvasNode.findMany({
          where: { projectId: params.id },
          orderBy: { createdAt: "asc" },
        });
        const edgesForClient = await prisma.canvasEdge.findMany({
          where: { projectId: params.id },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: "canvas_update",
            nodes: nodesForClient,
            edges: edgesForClient,
            srf: { ...srf, intent },
          })}\n\n`)
        );

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        console.error("CKOE pipeline error:", err);
        const errorMsg = err instanceof Error ? err.message : "Error desconocido";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", text: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function formatSRFAsText(srf: {
  distilledQuestion: string;
  executiveSummary: string;
  knowns: string[];
  unknowns: string[];
  axioms: string[];
  hypotheses: string[];
  explanationLayers: { simple: string };
  nextQuestions: string[];
}): string {
  const parts: string[] = [];

  parts.push(`**Pregunta destilada:** ${srf.distilledQuestion}\n`);
  parts.push(`${srf.executiveSummary}\n`);

  if (srf.knowns?.length) {
    parts.push(`\n**Lo que sabemos:**`);
    srf.knowns.forEach((k) => parts.push(`  · ${k}`));
  }
  if (srf.unknowns?.length) {
    parts.push(`\n**Lo que no sabemos:**`);
    srf.unknowns.forEach((u) => parts.push(`  · ${u}`));
  }
  if (srf.axioms?.length) {
    parts.push(`\n**Axiomas:**`);
    srf.axioms.forEach((a, i) => parts.push(`  ${i + 1}. ${a}`));
  }
  if (srf.hypotheses?.length) {
    parts.push(`\n**Hipótesis:**`);
    srf.hypotheses.forEach((h) => parts.push(`  · ${h}`));
  }
  if (srf.nextQuestions?.length) {
    parts.push(`\n**Próximas preguntas:**`);
    srf.nextQuestions.forEach((q) => parts.push(`  → ${q}`));
  }

  return parts.join("\n");
}
