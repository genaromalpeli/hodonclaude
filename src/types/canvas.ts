export type NodeType =
  | "question" | "insight" | "paper" | "concept"
  | "axiom" | "hypothesis" | "framework" | "method"
  | "contradiction" | "unknown" | "next_step" | "user_note";

export type RelationType =
  | "supports" | "contradicts" | "explains" | "requires"
  | "extends" | "derives_from" | "inspired_by" | "maps_to";

export type EpistemicStatus = "fact" | "inference" | "hypothesis" | "speculation";

export const NODE_COLORS: Record<NodeType, string> = {
  question:      "#3B82F6", // blue
  insight:       "#10B981", // green
  paper:         "#6B7280", // gray
  concept:       "#8B5CF6", // purple
  axiom:         "#F59E0B", // amber
  hypothesis:    "#F97316", // orange
  framework:     "#EF4444", // red
  method:        "#06B6D4", // cyan
  contradiction: "#DC2626", // dark red
  unknown:       "#9CA3AF", // light gray
  next_step:     "#22D3EE", // light cyan
  user_note:     "#FBBF24", // yellow
};

export const NODE_LABELS: Record<NodeType, string> = {
  question:      "Pregunta",
  insight:       "Insight",
  paper:         "Paper",
  concept:       "Concepto",
  axiom:         "Axioma",
  hypothesis:    "Hipótesis",
  framework:     "Framework",
  method:        "Método",
  contradiction: "Contradicción",
  unknown:       "Desconocido",
  next_step:     "Próximo paso",
  user_note:     "Nota",
};
