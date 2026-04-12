"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface HodonSections {
  one_liner: string;
  concept_map: { core: string; nodes: string[]; edges: Array<{ from: string; to: string; label: string }> };
  quadrants: { facts: string[]; inferences: string[]; hypotheses: string[]; speculation: string[] };
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

interface Output {
  id: string;
  title: string;
  createdAt: string;
  sectionsJson: HodonSections;
  input: { domain: string; objective: string; type: string; sourceRef: string };
}

function Accordion({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-text">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-background text-text-muted">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-success/10 text-success border-success/30",
    medium: "bg-warning/10 text-warning border-warning/30",
    low: "bg-danger/10 text-danger border-danger/30",
  };
  const labels = { high: "Alta", medium: "Media", low: "Baja" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: "GO" | "NO_GO" | "NEEDS_DATA" }) {
  const colors = {
    GO: "bg-success text-white",
    NO_GO: "bg-danger text-white",
    NEEDS_DATA: "bg-warning text-black",
  };
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${colors[verdict]}`}>{verdict.replace(/_/g, " ")}</span>
  );
}

function generateMarkdown(output: Output): string {
  const s = output.sectionsJson;
  const lines: string[] = [
    `# ${output.title}`,
    `> Generado por Hodon · ${new Date(output.createdAt).toLocaleDateString("es-MX")}`,
    ``,
    `**Dominio:** ${output.input.domain} | **Objetivo:** ${output.input.objective.replace(/_/g, " ")}`,
    ``,
    `---`,
    ``,
    `## 1. One-liner`,
    ``,
    s.one_liner,
    ``,
    `## 2. Mapa de conceptos`,
    ``,
    `**Core:** ${s.concept_map.core}`,
    ``,
    `**Nodos:** ${s.concept_map.nodes.join(", ")}`,
    ``,
    `## 3. Cuadrantes epistémicos`,
    ``,
    `### Hechos`,
    ...s.quadrants.facts.map((f) => `- ${f}`),
    ``,
    `### Inferencias`,
    ...s.quadrants.inferences.map((f) => `- ${f}`),
    ``,
    `### Hipótesis`,
    ...s.quadrants.hypotheses.map((f) => `- ${f}`),
    ``,
    `### Especulación`,
    ...s.quadrants.speculation.map((f) => `- ${f}`),
    ``,
    `## 4. Axiomas`,
    ``,
    ...s.axioms.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `## 5. Supuestos críticos`,
    ``,
    ...s.critical_assumptions.map((a) => `- [${a.confidence.toUpperCase()}] ${a.text}`),
    ``,
    `## 6. Primeros principios`,
    ``,
    ...s.first_principles.map((p, i) => `${i + 1}. ${p}`),
    ``,
    `## 7. Red Team (10 modos de fallo)`,
    ``,
    ...s.red_team.map((r, i) => [
      `### ${i + 1}. ${r.failure_mode}`,
      `**Test de falsificación:** ${r.falsification_test}`,
      ``,
    ]).flat(),
    `## 8. Foresight Lite`,
    ``,
    `**Drivers:** ${s.foresight_lite.drivers.join("; ")}`,
    ``,
    `**Incertidumbres:** ${s.foresight_lite.uncertainties.join("; ")}`,
    ``,
    `### Escenarios`,
    ...s.foresight_lite.scenarios.map((sc) => `- **${sc.name}:** ${sc.description}`),
    ``,
    `## 9. Oportunidades`,
    ``,
    ...s.potable_opportunities.map((o) => `- **${o.opportunity}:** ${o.rationale}`),
    ``,
    `## 10. Plan de experimentos`,
    ``,
    `### 48 horas: ${s.experiment_plan.H48.title}`,
    s.experiment_plan.H48.description,
    `**Métrica:** ${s.experiment_plan.H48.metric} | **Costo:** ${s.experiment_plan.H48.cost} | **Riesgo:** ${s.experiment_plan.H48.risk}`,
    ``,
    `### 2-4 semanas: ${s.experiment_plan.W2_4.title}`,
    s.experiment_plan.W2_4.description,
    `**Métrica:** ${s.experiment_plan.W2_4.metric} | **Costo:** ${s.experiment_plan.W2_4.cost} | **Riesgo:** ${s.experiment_plan.W2_4.risk}`,
    ``,
    `### 8-12 semanas: ${s.experiment_plan.W8_12.title}`,
    s.experiment_plan.W8_12.description,
    `**Métrica:** ${s.experiment_plan.W8_12.metric} | **Costo:** ${s.experiment_plan.W8_12.cost} | **Riesgo:** ${s.experiment_plan.W8_12.risk}`,
    ``,
    `## 11. Riesgos y ética`,
    ``,
    ...s.risks_ethics.map((r) => `- **${r.risk}:** ${r.mitigation}`),
    ``,
    `## 12. Recomendación final`,
    ``,
    `**Veredicto:** ${s.final_recommendation.verdict.replace(/_/g, " ")}`,
    ``,
    s.final_recommendation.rationale,
  ];

  return lines.join("\n");
}

export default function OutputViewerPage() {
  const params = useParams();
  const id = params.id as string;
  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/outputs/${id}`)
      .then((r) => r.json())
      .then((d: { output?: Output; error?: string }) => {
        if (d.output) setOutput(d.output);
        else setError(d.error || "Error cargando output.");
      })
      .catch(() => setError("Error de red."))
      .finally(() => setLoading(false));
  }, [id]);

  function exportMd() {
    if (!output) return;
    const md = generateMarkdown(output);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!output) return;
    setSaving(true);
    try {
      await fetch(`/api/outputs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionsJson: output.sectionsJson }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !output) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{error || "Output no encontrado."}</p>
        <Link href="/app/library" className="text-accent text-sm mt-4 block hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const s = output.sectionsJson;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/app/library" className="text-text-muted hover:text-text text-xs">
                ← Biblioteca
              </Link>
            </div>
            <h1 className="text-xl font-bold text-text leading-tight">{output.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-text-muted font-mono bg-surface border border-border px-2 py-0.5 rounded">
                {output.input.domain}
              </span>
              <span className="text-xs text-text-muted">
                {output.input.objective.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(output.createdAt).toLocaleDateString("es-MX")}
              </span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={exportMd}
            className="flex items-center gap-1.5 text-xs border border-border hover:border-accent/40 hover:text-accent text-text-muted px-3 py-1.5 rounded-md transition-colors"
          >
            Export MD
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs border border-border hover:border-success/40 hover:text-success text-text-muted px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href={`/app/outputs/${id}/tracker`}
            className="flex items-center gap-1.5 text-xs border border-accent/30 text-accent hover:bg-accent/5 px-3 py-1.5 rounded-md transition-colors"
          >
            Tracker de experimentos →
          </Link>
        </div>
      </div>

      {/* Sections */}

      {/* 1. One-liner */}
      <Accordion title="1. One-liner">
        <p className="text-text-dim text-sm leading-relaxed italic">"{s.one_liner}"</p>
      </Accordion>

      {/* 2. Concept map */}
      <Accordion title="2. Mapa de conceptos" badge={`${s.concept_map.nodes.length} nodos`}>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Core</span>
            <p className="text-text font-semibold mt-1">{s.concept_map.core}</p>
          </div>
          <div>
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Nodos</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {s.concept_map.nodes.map((n) => (
                <span key={n} className="text-xs bg-accent/10 text-accent-glow border border-accent/20 px-2 py-0.5 rounded-full">
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Relaciones</span>
            <div className="space-y-1 mt-2">
              {s.concept_map.edges.map((e, i) => (
                <div key={i} className="text-xs text-text-muted">
                  <span className="text-text">{e.from}</span>
                  <span className="mx-2 text-border-2">→</span>
                  <span className="text-accent/70 italic">{e.label}</span>
                  <span className="mx-2 text-border-2">→</span>
                  <span className="text-text">{e.to}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Accordion>

      {/* 3. Quadrants */}
      <Accordion title="3. Cuadrantes epistémicos">
        <div className="grid grid-cols-2 gap-4">
          {(["facts", "inferences", "hypotheses", "speculation"] as const).map((q) => {
            const labels = { facts: "Hechos", inferences: "Inferencias", hypotheses: "Hipótesis", speculation: "Especulación" };
            const colors = { facts: "border-success/20", inferences: "border-accent/20", hypotheses: "border-warning/20", speculation: "border-text-muted/20" };
            return (
              <div key={q} className={`border ${colors[q]} rounded-lg p-3`}>
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{labels[q]}</div>
                <ul className="space-y-1.5">
                  {s.quadrants[q].map((item, i) => (
                    <li key={i} className="text-xs text-text-dim leading-relaxed flex gap-2">
                      <span className="text-border-2 shrink-0 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* 4. Axioms */}
      <Accordion title="4. Axiomas" badge={`${s.axioms.length}`}>
        <ol className="space-y-3">
          {s.axioms.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-accent font-bold text-sm shrink-0 w-5">{i + 1}.</span>
              <p className="text-text-dim text-sm leading-relaxed">{a}</p>
            </li>
          ))}
        </ol>
      </Accordion>

      {/* 5. Critical assumptions */}
      <Accordion title="5. Supuestos críticos" badge={`${s.critical_assumptions.length}`}>
        <div className="space-y-3">
          {s.critical_assumptions.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <ConfidenceBadge level={a.confidence} />
              <p className="text-text-dim text-sm leading-relaxed flex-1">{a.text}</p>
            </div>
          ))}
        </div>
      </Accordion>

      {/* 6. First principles */}
      <Accordion title="6. Primeros principios" badge={`${s.first_principles.length}`}>
        <ol className="space-y-3">
          {s.first_principles.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-accent font-bold text-sm shrink-0 w-5">{i + 1}.</span>
              <p className="text-text-dim text-sm leading-relaxed">{p}</p>
            </li>
          ))}
        </ol>
      </Accordion>

      {/* 7. Red team */}
      <Accordion title="7. Red Team" badge={`${s.red_team.length} modos de fallo`}>
        <div className="space-y-4">
          {s.red_team.map((r, i) => (
            <div key={i} className="border border-danger/10 rounded-lg p-4">
              <div className="flex gap-3 mb-2">
                <span className="text-danger font-bold text-xs shrink-0 w-6">{i + 1}.</span>
                <p className="text-text text-sm font-medium">{r.failure_mode}</p>
              </div>
              <div className="flex gap-3 pl-6">
                <span className="text-xs text-text-muted shrink-0">Test:</span>
                <p className="text-text-muted text-xs leading-relaxed italic">{r.falsification_test}</p>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* 8. Foresight */}
      <Accordion title="8. Foresight Lite">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Drivers</div>
            <ul className="space-y-1">
              {s.foresight_lite.drivers.map((d, i) => (
                <li key={i} className="text-sm text-text-dim flex gap-2">
                  <span className="text-accent shrink-0">→</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Incertidumbres</div>
            <ul className="space-y-1">
              {s.foresight_lite.uncertainties.map((u, i) => (
                <li key={i} className="text-sm text-text-dim flex gap-2">
                  <span className="text-warning shrink-0">?</span>{u}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Escenarios</div>
            <div className="space-y-2">
              {s.foresight_lite.scenarios.map((sc, i) => (
                <div key={i} className="p-3 bg-background rounded-lg">
                  <div className="text-sm font-semibold text-text mb-1">{sc.name}</div>
                  <div className="text-xs text-text-muted">{sc.description}</div>
                </div>
              ))}
            </div>
          </div>
          {s.foresight_lite.signals.length > 0 && (
            <div>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Señales</div>
              <ul className="space-y-1">
                {s.foresight_lite.signals.map((sig, i) => (
                  <li key={i} className="text-xs text-text-dim flex gap-2">
                    <span className="text-success shrink-0">◆</span>{sig}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Accordion>

      {/* 9. Opportunities */}
      <Accordion title="9. Oportunidades accionables" badge={`${s.potable_opportunities.length}`}>
        <div className="space-y-4">
          {s.potable_opportunities.map((o, i) => (
            <div key={i} className="border border-success/10 rounded-lg p-4">
              <div className="font-semibold text-text text-sm mb-1">{o.opportunity}</div>
              <div className="text-xs text-text-muted leading-relaxed">{o.rationale}</div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* 10. Experiment plan */}
      <Accordion title="10. Plan de experimentos">
        <div className="space-y-4">
          {(["H48", "W2_4", "W8_12"] as const).map((level) => {
            const e = s.experiment_plan[level];
            const labels = { H48: "48 horas", W2_4: "2-4 semanas", W8_12: "8-12 semanas" };
            const colors = { H48: "border-success/20", W2_4: "border-accent/20", W8_12: "border-warning/20" };
            return (
              <div key={level} className={`border ${colors[level]} rounded-xl p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono text-text-muted bg-background px-2 py-0.5 rounded">
                    {labels[level]}
                  </span>
                  <span className="font-semibold text-text text-sm">{e.title}</span>
                </div>
                <p className="text-text-dim text-sm mb-3 leading-relaxed">{e.description}</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-text-muted mb-0.5">Métrica</div>
                    <div className="text-text">{e.metric}</div>
                  </div>
                  <div>
                    <div className="text-text-muted mb-0.5">Costo</div>
                    <div className="text-text">{e.cost}</div>
                  </div>
                  <div>
                    <div className="text-text-muted mb-0.5">Riesgo</div>
                    <div className="text-text">{e.risk}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Accordion>

      {/* 11. Risks & ethics */}
      <Accordion title="11. Riesgos y ética" badge={`${s.risks_ethics.length}`}>
        <div className="space-y-3">
          {s.risks_ethics.map((r, i) => (
            <div key={i} className="p-4 bg-background rounded-lg">
              <div className="font-semibold text-text text-sm mb-1">{r.risk}</div>
              <div className="text-xs text-text-muted leading-relaxed">
                <span className="text-success">Mitigación:</span> {r.mitigation}
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* 12. Final recommendation */}
      <Accordion title="12. Recomendación final">
        <div className="flex items-center gap-4 mb-4">
          <VerdictBadge verdict={s.final_recommendation.verdict} />
        </div>
        <p className="text-text-dim text-sm leading-relaxed">{s.final_recommendation.rationale}</p>
      </Accordion>

      {/* Bottom actions */}
      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/app/outputs/${id}/tracker`}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Abrir Tracker →
        </Link>
        <button
          onClick={exportMd}
          className="text-sm text-text-muted hover:text-text border border-border hover:border-border-2 px-4 py-2 rounded-lg transition-colors"
        >
          Exportar Markdown
        </button>
      </div>
    </div>
  );
}
