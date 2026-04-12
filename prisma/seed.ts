import { PrismaClient, UserRole, InputType, Domain, Objective } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_DEMO_EMAIL || "demo@hodon.local";
  const password = process.env.SEED_DEMO_PASSWORD || "demo1234";

  console.log(`Seeding demo user: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo User",
      email,
      passwordHash,
      role: UserRole.RESEARCHER,
    },
  });

  console.log(`User created: ${user.id}`);

  // Create demo UserSettings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
    },
  });

  // Create demo Input
  const input = await prisma.input.create({
    data: {
      userId: user.id,
      type: InputType.OPENALEX_WORK,
      sourceRef: "W2741809807",
      domain: Domain.AI,
      objective: Objective.EXPLORE,
      constraintsJson: { timeWeeks: 4, budgetUSD: 5000, riskTolerance: "medium" },
    },
  });

  // Demo output sections
  const sectionsJson = {
    one_liner:
      "Attention mechanisms in transformer models enable dynamic context weighting, unlocking unprecedented performance across language, vision, and multimodal tasks.",
    concept_map: {
      core: "Attention Mechanisms",
      nodes: [
        "Self-attention",
        "Multi-head attention",
        "Positional encoding",
        "Transformers",
        "BERT / GPT",
        "Cross-modal attention",
      ],
      edges: [
        { from: "Self-attention", to: "Multi-head attention", label: "scales into" },
        { from: "Multi-head attention", to: "Transformers", label: "backbone of" },
        { from: "Transformers", to: "BERT / GPT", label: "instantiated as" },
      ],
    },
    quadrants: {
      facts: [
        "Attention mechanisms were introduced in Bahdanau et al. 2015 for NMT.",
        "Vaswani et al. 2017 introduced the Transformer architecture.",
        "GPT-4 and Claude 3 use variants of multi-head attention.",
        "Attention has O(n²) complexity in sequence length.",
      ],
      inferences: [
        "Longer contexts require architectural innovations (sparse attention, linear attention).",
        "Attention weights can serve as interpretability proxies.",
      ],
      hypotheses: [
        "Sparse attention patterns may encode domain-specific priors.",
        "Attention heads specialize in syntactic vs semantic processing.",
      ],
      speculation: [
        "Future models may replace attention entirely with state-space models.",
        "Neuromorphic hardware could make attention O(1) amortized.",
      ],
    },
    axioms: [
      "Information relevance is context-dependent — static representations are insufficient.",
      "Parallelism over sequences enables more efficient training than recurrence.",
      "Compositionality requires mechanisms that can relate arbitrary token pairs.",
    ],
    critical_assumptions: [
      { text: "Training data quality scales model capability proportionally.", confidence: "high" },
      { text: "Attention weights are a reliable proxy for model reasoning.", confidence: "low" },
      { text: "Current hardware limitations constrain context length, not model design.", confidence: "medium" },
      {
        text: "Multi-head specialization is emergent and not explicitly trained.",
        confidence: "medium",
      },
      { text: "Attention is computationally necessary for strong generalization.", confidence: "low" },
    ],
    first_principles: [
      "Neural networks are universal function approximators — architecture determines the inductive bias.",
      "Gradient descent finds local optima; attention shapes the loss landscape.",
      "Communication bandwidth between positions is the fundamental bottleneck in sequence modeling.",
    ],
    red_team: [
      {
        failure_mode: "Attention collapses to uniform weights on long sequences",
        falsification_test: "Measure entropy of attention distributions at scale > 10k tokens",
      },
      {
        failure_mode: "Positional encodings fail to generalize beyond training length",
        falsification_test: "Zero-shot evaluation on sequences 2× training length",
      },
      {
        failure_mode: "Multi-head redundancy — heads learn identical patterns",
        falsification_test: "Head pruning ablation study: remove 50% of heads, measure perplexity delta",
      },
      {
        failure_mode: "Attention is not the bottleneck — FFN layers dominate capacity",
        falsification_test: "Isomorphic architecture with linear attention; compare FLOP-matched performance",
      },
      {
        failure_mode: "Interpretability via attention is misleading (Jain & Wallace 2019)",
        falsification_test: "Randomize attention weights post-hoc; measure prediction change",
      },
      {
        failure_mode: "Quadratic scaling makes deployment uneconomical at context > 100k",
        falsification_test: "Cost-per-token analysis at 128k context vs. RWKV baseline",
      },
      {
        failure_mode: "Attention memorizes training data rather than generalizing",
        falsification_test: "Membership inference attack on attention patterns",
      },
      {
        failure_mode: "Cross-attention bridges fail in long-document retrieval tasks",
        falsification_test: "Needle-in-haystack benchmark across architectures",
      },
      {
        failure_mode: "Attention heads encode spurious correlations from pretraining data",
        falsification_test: "Controlled counterfactual evaluation with de-biased datasets",
      },
      {
        failure_mode: "Hardware-aware attention variants sacrifice accuracy for speed",
        falsification_test: "FlashAttention-2 vs vanilla attention on GLUE/SuperGLUE exact-match delta",
      },
    ],
    foresight_lite: {
      drivers: [
        "Exponential growth in pretraining compute",
        "Commoditization of transformer inference",
        "Regulatory pressure on model transparency",
      ],
      uncertainties: [
        "Whether SSMs (Mamba, RWKV) will displace transformers",
        "Emergence of neuromorphic accelerators",
      ],
      scenarios: [
        {
          name: "Attention Dominance",
          description: "Transformers remain dominant; hardware catches up to O(n²).",
        },
        {
          name: "SSM Disruption",
          description: "State-space models prove superior at scale; attention becomes legacy.",
        },
        {
          name: "Hybrid Architecture",
          description: "Attention + SSM hybrids become the standard (Jamba, Falcon-H1).",
        },
      ],
      signals: [
        "Apple deploying SSMs in iPhone on-device models (2024)",
        "Google DeepMind Gemini Ultra using sparse MoE + attention",
      ],
    },
    potable_opportunities: [
      {
        opportunity: "Attention efficiency tooling for edge deployment",
        rationale: "Huge market gap: 95% of inference infra assumes datacenter-scale compute.",
      },
      {
        opportunity: "Attention-based interpretability-as-a-service for regulated industries",
        rationale: "GDPR Art. 22 and EU AI Act demand explainability for automated decisions.",
      },
      {
        opportunity: "Cross-modal attention datasets for medical imaging + text",
        rationale: "Radiology reports + DICOM scans remain largely unstructured; pairing is lucrative.",
      },
    ],
    experiment_plan: {
      H48: {
        title: "Literature gap analysis",
        description: "Identify top 20 unresolved open problems in attention efficiency via Semantic Scholar.",
        metric: "20 problem statements mapped to active research groups",
        cost: "$0 (desk research)",
        risk: "low",
      },
      W2_4: {
        title: "Prototype sparse attention benchmark",
        description:
          "Implement BigBird + Longformer vs vanilla attention on a 32k-token legal document dataset.",
        metric: "Perplexity delta < 2% at 10× speed improvement",
        cost: "~$200 in GPU credits",
        risk: "medium",
      },
      W8_12: {
        title: "Edge deployment pilot",
        description:
          "Deploy quantized attention model on Raspberry Pi 5 cluster; measure throughput vs accuracy.",
        metric: ">10 tokens/sec at < 1% accuracy loss vs full-precision baseline",
        cost: "~$2,000 (hardware + cloud comparison)",
        risk: "medium",
      },
    },
    risks_ethics: [
      {
        risk: "Concentration of attention-research capability in Big Tech",
        mitigation: "Publish benchmarks and datasets open-source; advocate for compute grants.",
      },
      {
        risk: "Misuse of attention interpretability to game moderation systems",
        mitigation: "Red-team interpretability tools before release; coordinate with platform trust teams.",
      },
      {
        risk: "Energy consumption of large attention models",
        mitigation: "Report FLOPs and carbon footprint in all experiments; favor efficient variants.",
      },
    ],
    final_recommendation: {
      verdict: "GO",
      rationale:
        "The attention mechanism remains the dominant paradigm for sequence modeling. Efficiency gaps at edge scale represent a tractable, commercially valuable problem. Proposed 48h experiment is zero-cost and de-risks the hypothesis immediately. Proceed with literature scan and benchmark prototype in parallel.",
    },
  };

  const output = await prisma.output.create({
    data: {
      userId: user.id,
      inputId: input.id,
      title: "Attention Mechanisms in Transformer Models — Hodon Analysis",
      sectionsJson,
    },
  });

  console.log(`Output created: ${output.id}`);

  // Create demo experiments
  await prisma.experiment.createMany({
    data: [
      {
        outputId: output.id,
        level: "H48",
        title: "Literature gap analysis",
        metricSuccess: "20 problem statements mapped to active research groups",
        status: "DONE",
        outcome: "SUCCESS",
        learning: "Found 7 key open problems; 3 overlapping with startup opportunities.",
        nextStep: "Prototype sparse attention benchmark",
      },
      {
        outputId: output.id,
        level: "W2_4",
        title: "Sparse attention benchmark",
        metricSuccess: "Perplexity delta < 2% at 10× speed improvement",
        status: "IN_PROGRESS",
        outcome: "NONE",
        learning: "",
        nextStep: "",
      },
      {
        outputId: output.id,
        level: "W8_12",
        title: "Edge deployment pilot",
        metricSuccess: ">10 tokens/sec at < 1% accuracy loss",
        status: "PENDING",
        outcome: "NONE",
        learning: "",
        nextStep: "",
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
