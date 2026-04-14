import Anthropic from "@anthropic-ai/sdk";
import { INTENT_SYSTEM_PROMPT, buildSynthesisPrompt } from "./prompts";
import type { ScientificReadableFramework } from "@/types/srf";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";

export interface IntentResult {
  core_question: string;
  domains: string[];
  problem_type: string;
  sub_questions: string[];
  knowledge_gaps: string[];
}

// Step 1: Parse intent
export async function parseIntent(question: string): Promise<IntentResult> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: INTENT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: question }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  try {
    return JSON.parse(text) as IntentResult;
  } catch {
    return {
      core_question: question,
      domains: ["general"],
      problem_type: "exploratory",
      sub_questions: [question],
      knowledge_gaps: [],
    };
  }
}

// Step 2: Search OpenAlex (simplified — uses internal API)
export async function searchPapers(
  queries: string[],
): Promise<Array<{ title: string; authors: string[]; year: number; abstract: string; citedByCount: number }>> {
  const results: Array<{ title: string; authors: string[]; year: number; abstract: string; citedByCount: number }> = [];

  for (const q of queries.slice(0, 3)) {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per_page=5&mailto=hodon@hodon.app&select=id,title,abstract_inverted_index,publication_year,cited_by_count,authorships`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Hodon/0.1 (mailto:hodon@hodon.app)" },
      });
      if (!res.ok) continue;
      const data = await res.json() as { results?: Array<Record<string, unknown>> };
      for (const w of (data.results || []).slice(0, 3)) {
        const inv = w.abstract_inverted_index as Record<string, number[]> | undefined;
        let abstract = "";
        if (inv) {
          const words: [string, number][] = [];
          for (const [word, positions] of Object.entries(inv)) {
            for (const pos of positions) words.push([word, pos]);
          }
          words.sort((a, b) => a[1] - b[1]);
          abstract = words.map((x) => x[0]).join(" ").slice(0, 400);
        }
        const auths = (w.authorships as Array<{ author: { display_name: string } }> || [])
          .slice(0, 3).map((a) => a.author.display_name);
        results.push({
          title: (w.title as string) || "",
          authors: auths,
          year: (w.publication_year as number) || 0,
          abstract,
          citedByCount: (w.cited_by_count as number) || 0,
        });
      }
    } catch {
      // continue on failure — graceful degradation
    }
  }
  return results;
}

// Step 3: Synthesis — generate SRF
export async function generateSRF(opts: {
  question: string;
  intent: IntentResult;
  papers: Array<{ title: string; authors: string[]; year: number; abstract: string }>;
  projectContext: string;
  messageHistory: string;
}): Promise<ScientificReadableFramework> {
  const papersContext = opts.papers.length > 0
    ? opts.papers.map((p, i) =>
        `[${i + 1}] "${p.title}" (${p.authors.join(", ")}, ${p.year})\nAbstract: ${p.abstract}`
      ).join("\n\n")
    : "";

  const systemPrompt = buildSynthesisPrompt({
    papersContext,
    projectContext: opts.projectContext,
    messageHistory: opts.messageHistory,
  });

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: opts.question }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";

  // Try to parse JSON (may be wrapped in backticks)
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as ScientificReadableFramework;
  } catch {
    // Return a minimal valid SRF
    return {
      distilledQuestion: opts.intent.core_question,
      executiveSummary: text,
      knowns: [],
      unknowns: opts.intent.knowledge_gaps,
      axioms: [],
      hypotheses: [],
      conceptualModel: { entities: [], relations: [], constraints: [] },
      interdisciplinaryLinks: [],
      explanationLayers: { simple: text, intermediate: text, senior: text },
      nextQuestions: opts.intent.sub_questions,
      suggestedNodes: [],
      citedSources: [],
    };
  }
}

// Full pipeline
export async function runCKOE(input: {
  question: string;
  projectId: string;
  existingNodesSummary: string;
  messageHistory: string;
}): Promise<{
  srf: ScientificReadableFramework;
  intent: IntentResult;
}> {
  // Step 1: Intent
  const intent = await parseIntent(input.question);

  // Step 2: Retrieval (parallel)
  const papers = await searchPapers(intent.sub_questions);

  // Step 3: Synthesis
  const srf = await generateSRF({
    question: input.question,
    intent,
    papers,
    projectContext: input.existingNodesSummary,
    messageHistory: input.messageHistory,
  });

  return { srf, intent };
}
