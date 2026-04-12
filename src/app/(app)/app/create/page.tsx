"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "type" | "configure" | "generating";

const DOMAINS = ["AI", "BIOTECH", "SPACE", "CLIMATE", "MATERIALS", "ECON", "OTHER"];
const OBJECTIVES = [
  { value: "EXPLORE", label: "Explorar" },
  { value: "VALIDATE", label: "Validar" },
  { value: "DESIGN_EXPERIMENT", label: "Diseñar experimento" },
  { value: "FIND_PRODUCT", label: "Encontrar producto" },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [inputType, setInputType] = useState<"OPENALEX_WORK" | "QUESTION_TEXT" | "URL">("QUESTION_TEXT");
  const [form, setForm] = useState({
    sourceRef: "",
    rawText: "",
    domain: "AI",
    objective: "EXPLORE",
    timeWeeks: "4",
    budgetUSD: "1000",
    riskTolerance: "medium",
  });
  const [openAlexWorkData, setOpenAlexWorkData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchOpenAlex() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/openalex/works?search=${encodeURIComponent(searchQuery)}&per_page=5`);
      if (res.ok) {
        const data = await res.json() as { results?: unknown[] };
        setSearchResults(data.results || []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  function selectWork(work: Record<string, unknown>) {
    setForm((f) => ({ ...f, sourceRef: work.id as string }));
    setOpenAlexWorkData(work);
    setInputType("OPENALEX_WORK");
  }

  async function handleGenerate() {
    setStep("generating");
    setError("");

    try {
      // 1. Create input
      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: inputType,
          sourceRef: form.sourceRef || form.rawText.slice(0, 100),
          rawText: inputType === "QUESTION_TEXT" ? form.rawText : undefined,
          domain: form.domain,
          objective: form.objective,
          constraintsJson: {
            timeWeeks: parseInt(form.timeWeeks),
            budgetUSD: parseInt(form.budgetUSD),
            riskTolerance: form.riskTolerance,
          },
        }),
      });

      if (!inputRes.ok) {
        const d = await inputRes.json() as { error?: string };
        throw new Error(d.error || "Error al crear input.");
      }

      const { input } = await inputRes.json() as { input: { id: string } };

      // 2. Generate output
      const outputRes = await fetch("/api/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputId: input.id,
          openAlexWorkData: openAlexWorkData || undefined,
        }),
      });

      if (!outputRes.ok) {
        const d = await outputRes.json() as { error?: string };
        throw new Error(d.error || "Error al generar output.");
      }

      const { output } = await outputRes.json() as { output: { id: string } };
      router.push(`/app/outputs/${output.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
      setStep("configure");
    }
  }

  if (step === "generating") {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-96">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-lg font-semibold mb-2">Generando análisis Hodon...</h2>
        <p className="text-text-muted text-sm text-center">
          Procesando input, generando cuadrantes, red team y plan de experimentos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Nuevo análisis</h1>
      <p className="text-text-muted text-sm mb-8">
        Define el input y genera un output Hodon completo.
      </p>

      {/* Step 1: Input type */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-4">
          1. Tipo de input
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { type: "QUESTION_TEXT" as const, label: "Pregunta / Texto", icon: "💬" },
            { type: "OPENALEX_WORK" as const, label: "Paper OpenAlex", icon: "📄" },
            { type: "URL" as const, label: "URL", icon: "🔗" },
          ].map((t) => (
            <button
              key={t.type}
              onClick={() => setInputType(t.type)}
              className={`p-4 rounded-xl border text-sm font-medium transition-colors text-left ${
                inputType === t.type
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-muted hover:text-text hover:border-border-2"
              }`}
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Input content */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-4">
          2. Contenido
        </h2>

        {inputType === "QUESTION_TEXT" && (
          <textarea
            value={form.rawText}
            onChange={(e) => setForm((f) => ({ ...f, rawText: e.target.value }))}
            rows={5}
            placeholder="¿Cuál es tu hipótesis, pregunta de investigación, o tema a explorar?"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm resize-none"
          />
        )}

        {inputType === "URL" && (
          <input
            type="url"
            value={form.sourceRef}
            onChange={(e) => setForm((f) => ({ ...f, sourceRef: e.target.value }))}
            placeholder="https://arxiv.org/abs/..."
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
          />
        )}

        {inputType === "OPENALEX_WORK" && (
          <div className="space-y-4">
            {openAlexWorkData ? (
              <div className="p-4 bg-accent/5 border border-accent/30 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-text text-sm">
                      {String((openAlexWorkData as Record<string, unknown>).title || "Work seleccionado")}
                    </div>
                    <div className="text-xs text-text-muted mt-1 font-mono">
                      {String((openAlexWorkData as Record<string, unknown>).id || "")}
                    </div>
                  </div>
                  <button
                    onClick={() => { setOpenAlexWorkData(null); setForm((f) => ({ ...f, sourceRef: "" })); }}
                    className="text-xs text-text-muted hover:text-danger"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchOpenAlex()}
                    placeholder="Buscar paper en OpenAlex..."
                    className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
                  />
                  <button
                    onClick={searchOpenAlex}
                    disabled={searching}
                    className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {searching ? "..." : "Buscar"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(searchResults as Record<string, unknown>[]).map((work) => (
                      <button
                        key={String(work.id)}
                        onClick={() => selectWork(work)}
                        className="w-full text-left p-3 bg-surface hover:bg-surface-2 border border-border rounded-lg transition-colors"
                      >
                        <div className="text-sm font-medium text-text line-clamp-2">
                          {String(work.title || "Sin título")}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {String(work.publication_year || "")} · {(work.cited_by_count as number | undefined) || 0} citas
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-text-muted">
                  Nota: Requiere API key de OpenAlex configurada en Ajustes.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Config */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wider mb-4">
          3. Configuración
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Dominio</label>
            <select
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Objetivo</label>
            <select
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
            >
              {OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Horizonte (semanas)</label>
            <input
              type="number"
              value={form.timeWeeks}
              onChange={(e) => setForm((f) => ({ ...f, timeWeeks: e.target.value }))}
              min="1"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Presupuesto (USD)</label>
            <input
              type="number"
              value={form.budgetUSD}
              onChange={(e) => setForm((f) => ({ ...f, budgetUSD: e.target.value }))}
              min="0"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={
          (inputType === "QUESTION_TEXT" && !form.rawText.trim()) ||
          (inputType === "OPENALEX_WORK" && !form.sourceRef) ||
          (inputType === "URL" && !form.sourceRef.trim())
        }
        className="w-full bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Generar análisis Hodon
      </button>
    </div>
  );
}
