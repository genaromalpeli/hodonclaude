import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runCKOE } from "@/lib/ai/pipeline";
import { generateCanvasData } from "@/lib/ai/canvas-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const node = await prisma.canvasNode.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, userId: true } },
      edgesFrom: { include: { targetNode: { select: { title: true, type: true } } } },
      edgesTo: { include: { sourceNode: { select: { title: true, type: true } } } },
    },
  });

  if (!node || node.project.userId !== session.userId) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  const { question } = await request.json();
  const expandQuestion = question || `Profundiza sobre: ${node.title}`;

  // Context: this node + connected nodes
  const connectedTitles = [
    ...node.edgesFrom.map((e) => `[${e.targetNode.type}] ${e.targetNode.title}`),
    ...node.edgesTo.map((e) => `[${e.sourceNode.type}] ${e.sourceNode.title}`),
  ].join("; ");

  const existingNodesSummary = `Nodo seleccionado: [${node.type}] ${node.title}. Contenido: ${node.contentSimple || ""}. Nodos conectados: ${connectedTitles}`;

  try {
    const { srf } = await runCKOE({
      question: expandQuestion,
      projectId: node.project.id,
      existingNodesSummary,
      messageHistory: "",
    });

    const canvasData = generateCanvasData(srf);

    // Position new nodes relative to the expanded node
    const offsetX = node.positionX;
    const offsetY = node.positionY;

    const createdNodes: Array<{ id: string; idx: number }> = [];
    for (let i = 0; i < canvasData.nodes.length; i++) {
      const n = canvasData.nodes[i];
      const created = await prisma.canvasNode.create({
        data: {
          projectId: node.project.id,
          type: n.type,
          title: n.title,
          contentSimple: n.contentSimple,
          contentMedium: n.contentMedium,
          contentSenior: n.contentSenior,
          epistemicStatus: n.epistemicStatus,
          positionX: offsetX + (n.positionX - 400) * 0.6,
          positionY: offsetY + (n.positionY - 300) * 0.6 + 200,
        },
      });
      createdNodes.push({ id: created.id, idx: i });
    }

    // Connect first new node to parent
    if (createdNodes.length > 0) {
      await prisma.canvasEdge.create({
        data: {
          projectId: node.project.id,
          sourceNodeId: node.id,
          targetNodeId: createdNodes[0].id,
          relationType: "extends",
        },
      });
    }

    // Save internal edges
    for (const e of canvasData.edges) {
      const src = createdNodes[e.sourceTitleIndex];
      const tgt = createdNodes[e.targetTitleIndex];
      if (src && tgt) {
        await prisma.canvasEdge.create({
          data: {
            projectId: node.project.id,
            sourceNodeId: src.id,
            targetNodeId: tgt.id,
            relationType: e.relationType,
          },
        });
      }
    }

    // Return all nodes/edges for canvas refresh
    const allNodes = await prisma.canvasNode.findMany({
      where: { projectId: node.project.id },
    });
    const allEdges = await prisma.canvasEdge.findMany({
      where: { projectId: node.project.id },
    });

    return NextResponse.json({ nodes: allNodes, edges: allEdges, srf });
  } catch (err) {
    console.error("Expand error:", err);
    return NextResponse.json({ error: "Error al expandir nodo." }, { status: 500 });
  }
}
