import type { ScientificReadableFramework } from "@/types/srf";

interface GeneratedNode {
  type: string;
  title: string;
  contentSimple: string;
  contentMedium: string;
  contentSenior: string;
  epistemicStatus: string;
  positionX: number;
  positionY: number;
}

interface GeneratedEdge {
  sourceTitleIndex: number;
  targetTitleIndex: number;
  relationType: string;
}

/**
 * Generate canvas nodes and edges from an SRF response.
 * Calculates positions in a radial layout.
 */
export function generateCanvasData(srf: ScientificReadableFramework): {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
} {
  const nodes: GeneratedNode[] = [];

  // Add the question node at center
  nodes.push({
    type: "question",
    title: srf.distilledQuestion,
    contentSimple: srf.explanationLayers.simple,
    contentMedium: srf.explanationLayers.intermediate,
    contentSenior: srf.explanationLayers.senior,
    epistemicStatus: "fact",
    positionX: 0,
    positionY: 0,
  });

  // Add suggested nodes from SRF
  for (const suggested of (srf.suggestedNodes || [])) {
    nodes.push({
      type: suggested.type || "concept",
      title: suggested.title,
      contentSimple: suggested.contentSimple || "",
      contentMedium: suggested.contentMedium || "",
      contentSenior: suggested.contentSenior || "",
      epistemicStatus: suggested.epistemicStatus || "inference",
      positionX: 0,
      positionY: 0,
    });
  }

  // Add nodes for next questions
  for (const nq of (srf.nextQuestions || []).slice(0, 3)) {
    if (!nodes.find((n) => n.title === nq)) {
      nodes.push({
        type: "next_step",
        title: nq,
        contentSimple: nq,
        contentMedium: nq,
        contentSenior: nq,
        epistemicStatus: "speculation",
        positionX: 0,
        positionY: 0,
      });
    }
  }

  // Radial layout: question at center, others around it
  const centerX = 400;
  const centerY = 300;
  const radius = 280;

  nodes[0].positionX = centerX;
  nodes[0].positionY = centerY;

  for (let i = 1; i < nodes.length; i++) {
    const angle = ((2 * Math.PI) / (nodes.length - 1)) * (i - 1) - Math.PI / 2;
    nodes[i].positionX = Math.round(centerX + radius * Math.cos(angle));
    nodes[i].positionY = Math.round(centerY + radius * Math.sin(angle));
  }

  // Generate edges: connect each non-center node to center, plus SRF relations
  const edges: GeneratedEdge[] = [];

  for (let i = 1; i < nodes.length; i++) {
    edges.push({
      sourceTitleIndex: 0,
      targetTitleIndex: i,
      relationType: "explains",
    });
  }

  // Add relation-based edges from SRF
  for (const suggested of (srf.suggestedNodes || [])) {
    if (!suggested.relatedTo) continue;
    const srcIdx = nodes.findIndex((n) => n.title === suggested.title);
    if (srcIdx < 0) continue;
    for (const rel of suggested.relatedTo) {
      const tgtIdx = nodes.findIndex((n) => n.title === rel.nodeTitle);
      if (tgtIdx >= 0 && srcIdx !== tgtIdx) {
        edges.push({
          sourceTitleIndex: srcIdx,
          targetTitleIndex: tgtIdx,
          relationType: rel.relation,
        });
      }
    }
  }

  return { nodes, edges };
}
