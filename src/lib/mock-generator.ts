/**
 * Deterministic Mock Output Generator for Hodon MVP.
 * Produces structured output from an Input seed without LLM calls.
 * Architecture is ready to swap in an LLM provider (OpenAI, Anthropic, etc.)
 * by replacing the `generateOutput` function.
 */

export interface OpenAlexWorkSeed {
  title: string;
  abstract?: string;
  concepts?: Array<{ display_name: string; score: number }>;
  cited_by_count?: number;
  publication_year?: number;
  authors?: string[];
}

export interface TextSeed {
  text: string;
  fileName?: string;
}

export type InputSeed = { type: "openalex"; data: OpenAlexWorkSeed } | { type: "text"; data: TextSeed };

export interface HodonSections {
  one_liner: string;
  concept_map: {
    core: string;
    nodes: string[];
    edges: Array<{ from: string; to: string; label: string }>;
  };
  quadrants: {
    facts: string[];
    inferences: string[];
    hypotheses: string[];
    speculation: string[];
  };
  axioms: string[];
  critical_assumptions: Array<{ text: string; confidence: "high" | "medium" | "low" }>;
  first_principles: string[];
  red_team: Array<{ failure_mode: string; falsification_test: string }>;
  foresight_lite: {
    drivers: string[];
    uncertainties: string[];
    scenarios: Array<{ name: string; description: string }>;
    signals: string[];
  };
  potable_opportunities: Array<{ opportunity: string; rationale: string }>;
  experiment_plan: {
    H48: { title: string; description: string; metric: string; cost: string; risk: string };
    W2_4: { title: string; description: string; metric: string; cost: string; risk: string };
    W8_12: { title: string; description: string; metric: string; cost: string; risk: string };
  };
  risks_ethics: Array<{ risk: string; mitigation: string }>;
  final_recommendation: { verdict: "GO" | "NO_GO" | "NEEDS_DATA"; rationale: string };
}

function deterministicChoice<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateOutput(seed: InputSeed, domain: string, objective: string): HodonSections {
  let title: string;
  let concepts: string[];
  let abstract: string;
  let year: number | undefined;
  let citedBy: number | undefined;

  if (seed.type === "openalex") {
    title = seed.data.title || "Research Topic";
    abstract = seed.data.abstract || `Analysis of ${title} across key dimensions.`;
    concepts = (seed.data.concepts || []).slice(0, 6).map((c) => c.display_name);
    if (concepts.length === 0) concepts = ["Core Concept", "Methodology", "Applications"];
    year = seed.data.publication_year;
    citedBy = seed.data.cited_by_count;
  } else {
    const text = seed.data.text || seed.data.fileName || "Research topic";
    title = text.length > 80 ? text.slice(0, 80) + "…" : text;
    abstract = text;
    concepts = ["Core Concept", "Methodology", "Application", "Impact"];
  }

  const h = hashString(title + domain + objective);

  const domains: Record<string, string[]> = {
    AI: ["Machine learning", "Neural networks", "Data pipelines", "Model inference", "Embeddings", "Transformers"],
    BIOTECH: ["CRISPR", "Protein folding", "Gene expression", "Clinical trials", "Bioreactors", "Organoids"],
    SPACE: ["Orbital mechanics", "Propulsion", "Telemetry", "Radiation shielding", "Debris tracking", "Re-entry"],
    CLIMATE: [
      "Carbon sequestration",
      "Renewable energy",
      "Climate modeling",
      "Grid storage",
      "Methane capture",
      "Geoengineering",
    ],
    MATERIALS: [
      "Nanomaterials",
      "Composites",
      "Catalysis",
      "2D materials",
      "Metamaterials",
      "Additive manufacturing",
    ],
    ECON: [
      "Market microstructure",
      "Behavioral finance",
      "Monetary policy",
      "Supply chains",
      "Crypto assets",
      "Trade flows",
    ],
    OTHER: ["Systems thinking", "Complex networks", "Cross-domain transfer", "Emerging patterns", "Feedback loops"],
  };

  const domainConcepts = domains[domain] || domains.OTHER;
  const allConcepts = Array.from(new Set([...concepts, ...domainConcepts.slice(0, 3)]));

  // Verdicts based on cited_by_count and year
  let verdict: "GO" | "NO_GO" | "NEEDS_DATA" = "NEEDS_DATA";
  if (citedBy !== undefined) {
    if (citedBy > 500) verdict = "GO";
    else if (citedBy < 10) verdict = "NO_GO";
    else verdict = "NEEDS_DATA";
  } else {
    const verdicts: Array<"GO" | "NO_GO" | "NEEDS_DATA"> = ["GO", "NEEDS_DATA", "GO", "NEEDS_DATA", "NO_GO"];
    verdict = deterministicChoice(verdicts, h);
  }

  const yearLabel = year ? ` (${year})` : "";
  const citedLabel = citedBy !== undefined ? ` Cited ${citedBy}× in literature.` : "";

  return {
    one_liner: `${title}${yearLabel} represents a critical inflection point in ${domain.toLowerCase()} — characterized by ${allConcepts[0]} and ${allConcepts[1]}, with measurable impact on downstream ${objective.toLowerCase().replace(/_/g, " ")} initiatives.${citedLabel}`,

    concept_map: {
      core: title.length > 40 ? title.slice(0, 40) : title,
      nodes: allConcepts.slice(0, 6),
      edges: allConcepts.slice(1, 5).map((c, i) => ({
        from: allConcepts[0],
        to: c,
        label: deterministicChoice(["enables", "constrains", "informs", "scales into", "precedes"], h + i),
      })),
    },

    quadrants: {
      facts: [
        `${allConcepts[0]} is a documented mechanism in ${domain} with empirical validation.`,
        `${title.slice(0, 60)} has been studied since ${year || "recent years"}.`,
        `${allConcepts[1] || "Methodology"} is the predominant approach in this domain.`,
        `Cited ${citedBy || "N/A"} times — indicating ${(citedBy || 0) > 100 ? "high" : "moderate"} community adoption.`,
      ],
      inferences: [
        `Current bottlenecks in ${allConcepts[0]} suggest near-term investment will concentrate in ${allConcepts[2] || "adjacent technologies"}.`,
        `The ${year ? 2025 - year : 5}-year maturity gap implies productization opportunities remain underexplored.`,
      ],
      hypotheses: [
        `Combining ${allConcepts[0]} with ${allConcepts[1] || "ML"} may unlock non-linear performance gains.`,
        `${domain} applications will converge on ${allConcepts[2] || "hybrid architectures"} as the dominant paradigm by 2027.`,
      ],
      speculation: [
        `${allConcepts[0]} may become obsolete if ${allConcepts[3] || "next-generation alternatives"} achieve cost parity.`,
        `Regulatory intervention could restructure the entire ${domain} value chain before 2030.`,
      ],
    },

    axioms: [
      `Complexity without compressibility is noise — any ${domain} system must reduce to communicable principles.`,
      `First-mover advantage in ${allConcepts[0]} is secondary to execution speed and capital efficiency.`,
      `${domain} breakthroughs follow an S-curve; current position determines optimal entry timing.`,
    ],

    critical_assumptions: [
      {
        text: `${allConcepts[0]} scales linearly with investment in this domain.`,
        confidence: deterministicChoice(["high", "medium", "low"] as const, h),
      },
      {
        text: `Existing ${domain} infrastructure can be retrofitted without full replacement.`,
        confidence: deterministicChoice(["medium", "high", "low"] as const, h + 1),
      },
      {
        text: `Regulatory environment remains stable for 18+ months.`,
        confidence: deterministicChoice(["low", "medium", "high"] as const, h + 2),
      },
      {
        text: `Target customers have budget authority and willingness to pay for ${objective.replace(/_/g, " ").toLowerCase()}.`,
        confidence: deterministicChoice(["medium", "low", "high"] as const, h + 3),
      },
      {
        text: `${allConcepts[1] || "Core technology"} dependency does not create a critical single point of failure.`,
        confidence: deterministicChoice(["high", "low", "medium"] as const, h + 4),
      },
    ],

    first_principles: [
      `In ${domain}, energy/compute/capital is the fundamental constraint — all design decisions reduce to allocation of scarce resources.`,
      `${allConcepts[0]} derives its value from reducing variance in outcomes, not from eliminating failure entirely.`,
      `Network effects in ${domain} compound at approximately 30% per doubling of active nodes — design for composability.`,
    ],

    red_team: [
      {
        failure_mode: `${allConcepts[0]} fails to generalize outside controlled lab conditions`,
        falsification_test: `Deploy in 3 diverse real-world environments; require >80% performance retention`,
      },
      {
        failure_mode: `Key assumption about ${domain} market size is 10× overstated`,
        falsification_test: `Bottom-up TAM model from 50 customer interviews; reject if addressable < $100M`,
      },
      {
        failure_mode: `${allConcepts[1] || "Core approach"} is already patented by incumbent`,
        falsification_test: `Patent landscape search (Google Patents + Espacenet) within 48 hours`,
      },
      {
        failure_mode: `Regulatory approval timeline extends beyond 24 months`,
        falsification_test: `Interview 3 regulatory consultants; map worst-case path to compliance`,
      },
      {
        failure_mode: `Technical team cannot execute core ${allConcepts[0]} implementation`,
        falsification_test: `90-day prototype with 2 engineers; define pass/fail criteria upfront`,
      },
      {
        failure_mode: `Customer acquisition cost exceeds lifetime value`,
        falsification_test: `Pilot with 10 design partners; calculate CAC and 12-month LTV`,
      },
      {
        failure_mode: `${domain} supply chain disruption creates input scarcity`,
        falsification_test: `Identify 3 alternative suppliers; stress-test procurement model`,
      },
      {
        failure_mode: `Open-source competitor eliminates willingness to pay`,
        falsification_test: `Competitive landscape weekly scan; define defensibility moat explicitly`,
      },
      {
        failure_mode: `Data quality in ${domain} is insufficient for ${objective.replace(/_/g, " ")} use case`,
        falsification_test: `Audit 5 representative datasets; reject if >30% missing/corrupt`,
      },
      {
        failure_mode: `Team founders have irreconcilable vision misalignment by month 6`,
        falsification_test: `Structured co-founder alignment workshop; document explicit disagreement log`,
      },
    ],

    foresight_lite: {
      drivers: [
        `Accelerating investment in ${domain} (CAGR 25-40% 2024-2028)`,
        `Talent migration from traditional industries toward ${domain} startups`,
        `Geopolitical competition creating national-champion dynamics in ${domain}`,
      ],
      uncertainties: [
        `Whether ${allConcepts[0]} will commoditize before value capture`,
        `Regulatory trajectory: permissive vs. precautionary frameworks`,
      ],
      scenarios: [
        {
          name: "Accelerated Adoption",
          description: `${domain} becomes critical infrastructure within 3 years; incumbents acquire startups.`,
        },
        {
          name: "Regulatory Freeze",
          description: `New ${domain} regulations slow deployment; winners are those with compliance infrastructure.`,
        },
        {
          name: "Open-Source Disruption",
          description: `Foundation models/tools commoditize ${allConcepts[0]}; value moves to services layer.`,
        },
      ],
      signals: [
        `${year ? `Original research published ${year}` : "Recent foundational work"} gaining renewed practitioner interest`,
        `${domain} sector deals up 40% in last 12 months per PitchBook`,
      ],
    },

    potable_opportunities: [
      {
        opportunity: `${titleCase(allConcepts[0])} as a managed service for ${domain} operators`,
        rationale: `Operators lack internal expertise; outsourcing reduces time-to-value from 18 months to 6 weeks.`,
      },
      {
        opportunity: `Vertical-specific ${domain} dataset curation and benchmarking`,
        rationale: `Generic datasets underperform by 20-40% on domain-specific tasks; specialized data commands premium pricing.`,
      },
      {
        opportunity: `${objective.replace(/_/g, " ")} workflow automation for ${domain} practitioners`,
        rationale: `Current manual workflows consume 60-70% of practitioner time; automation compounds output velocity.`,
      },
    ],

    experiment_plan: {
      H48: {
        title: `Landscape scan: ${allConcepts[0]}`,
        description: `Map top 20 papers, 10 startups, 5 incumbents operating in this space. Document white spaces.`,
        metric: `Completed landscape map with ≥3 identified white spaces`,
        cost: `$0 (desk research)`,
        risk: `low`,
      },
      W2_4: {
        title: `Customer discovery: ${objective.replace(/_/g, " ")} validation`,
        description: `Conduct 15 structured interviews with ${domain} practitioners. Validate top 3 pain points.`,
        metric: `≥8/15 interviews confirm primary hypothesis; willingness-to-pay signal from ≥5`,
        cost: `~$500 (researcher time + tools)`,
        risk: `medium`,
      },
      W8_12: {
        title: `Working prototype: ${allConcepts[0]} MVP`,
        description: `Build minimum viable version of core functionality. Deploy to 3 design partners for structured feedback.`,
        metric: `NPS ≥ 30 from design partners; ≥1 LOI for paid pilot`,
        cost: `~$5,000-$15,000 (engineering + cloud infra)`,
        risk: `medium`,
      },
    },

    risks_ethics: [
      {
        risk: `Misuse of ${domain} outputs for non-intended applications`,
        mitigation: `Implement usage policies; monitor anomalous patterns; establish responsible use guidelines.`,
      },
      {
        risk: `${allConcepts[0]} encodes biases present in training/source data`,
        mitigation: `Audit for bias before deployment; document known limitations; provide uncertainty estimates.`,
      },
      {
        risk: `Concentration of ${domain} capability creates monopolistic dynamics`,
        mitigation: `Publish methodology openly; support interoperability standards; engage with policy bodies.`,
      },
    ],

    final_recommendation: {
      verdict,
      rationale:
        verdict === "GO"
          ? `Strong evidence base (${citedBy || "substantial"} citations, mature concepts) and clear market gap. Proceed immediately with 48h landscape scan. Capital efficiency favors early mover.`
          : verdict === "NO_GO"
          ? `Insufficient validation data. Core assumptions (${domain} scalability, customer willingness-to-pay) remain unproven. Conduct customer discovery before committing resources.`
          : `Hypothesis is directionally sound but critical assumptions require validation before significant capital deployment. Execute 48h and W2-4 experiments in parallel before GO decision.`,
    },
  };
}
