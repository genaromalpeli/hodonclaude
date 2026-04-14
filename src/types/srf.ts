import type { NodeType, RelationType, EpistemicStatus } from "./canvas";

export interface ScientificReadableFramework {
  distilledQuestion: string;
  executiveSummary: string;
  knowns: string[];
  unknowns: string[];
  axioms: string[];
  hypotheses: string[];
  conceptualModel: {
    entities: string[];
    relations: string[];
    constraints: string[];
  };
  interdisciplinaryLinks: string[];
  explanationLayers: {
    simple: string;
    intermediate: string;
    senior: string;
  };
  nextQuestions: string[];
  suggestedNodes: SuggestedNode[];
  citedSources: CitedSource[];
}

export interface SuggestedNode {
  type: NodeType;
  title: string;
  contentSimple: string;
  contentMedium: string;
  contentSenior: string;
  epistemicStatus: EpistemicStatus;
  relatedTo?: Array<{ nodeTitle: string; relation: RelationType }>;
}

export interface CitedSource {
  title: string;
  authors?: string[];
  year?: number;
  url?: string;
  openalexId?: string;
  relevance: string;
}
