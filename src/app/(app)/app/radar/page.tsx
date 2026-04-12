"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Work {
  id: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: Array<{ author: { display_name: string } }>;
  primary_location?: { source?: { display_name: string } };
  concepts?: Array<{ display_name: string; score: number }>;
}

interface Concept {
  id: string;
  display_name: string;
  description?: string;
  level: number;
  works_count: number;
  cited_by_count: number;
}

interface SavedSearch {
  id: string;
  query: string;
  filtersJson: unknown;
  createdAt: string;
}

type TabType = "works" | "concepts";

function invertedIndexToText(inv: Record<string, number[]> | undefined): string {
  if (!inv) return "";
  const words: Array<[string, number]> = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  words.sort((a, b) => a[1] - b[1]);
  const text = words.map((w) => w[0]).join(" ");
  return text.slice(0, 300) + (text.length > 300 ? "..." : "");
}

export default function RadarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("works");
  const [query, setQuery] = useState("");
  const [works, setWorks] = useState<Work[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((d: { searches?: SavedSearch[] }) => setSavedSearches(d.searches || []))
      .catch(() => {});
  }, []);

  const runSearch = useCallback(async (q: string, t: TabType) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = t === "works" ? "/api/openalex/works" : "/api/openalex/concepts";
      const res = await fetch(`${endpoint}?search=${encodeURIComponent(q)}&per_page=10`);
      const data = await res.json() as { results?: Work[] | Concept[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Error en la búsqueda.");
      } else {
        if (t === "works") setWorks((data.results || []) as Work[]);
        else setConcepts((data.results || []) as Concept[]);
      }
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(query, tab);
  }

  async function handleSaveSearch() {
    if (!query.trim()) return;
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, filtersJson: { tab } }),
    });
    if (res.ok) {
      const data = await res.json() as { search: SavedSearch };
      setSavedSearches((prev) => [data.search, ...prev]);
    }
  }

  async function handleDeleteSaved(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleImport(work: Work) {
    setImporting(work.id);
    try {
      // Create input
      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OPENALEX_WORK",
          sourceRef: work.id,
          domain: "OTHER",
          objective: "EXPLORE",
        }),
      });
      if (!inputRes.ok) throw new Error("Error creating input");
      const { input } = await inputRes.json() as { input: { id: string } };

      // Generate output
      const outputRes = await fetch("/api/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputId: input.id,
          openAlexWorkData: {
            title: work.title,
            abstract: invertedIndexToText(work.abstract_inverted_index),
            concepts: work.concepts,
            cited_by_count: work.cited_by_count,
            publication_year: work.publication_year,
          },
        }),
      });
      if (!outputRes.ok) throw new Error("Error generating output");
      const { output } = await outputRes.json() as { output: { id: string } };

      setImportSuccess(work.id);
      setTimeout(() => {
        router.push(`/app/outputs/${output.id}`);
      }, 800);
    } catch {
      setError("Error al importar work.");
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Radar OpenAlex</h1>
        <p className="text-text-muted text-sm mt-1">
          Busca papers y conceptos. Importa a Hodon con un clic.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface border border-border rounded-lg p-1 w-fit">
        {(["works", "concepts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-accent text-white" : "text-text-muted hover:text-text"
            }`}
          >
            {t === "works" ? "Papers" : "Conceptos"}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "works" ? "Buscar papers..." : "Buscar conceptos..."}
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "..." : "Buscar"}
        </button>
        <button
          type="button"
          onClick={handleSaveSearch}
          disabled={!query.trim()}
          title="Guardar búsqueda"
          className="border border-border hover:border-border-2 text-text-muted hover:text-text px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Guardar
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
          {error.includes("API") && (
            <span className="ml-2">
              —{" "}
              <a href="/app/settings" className="underline">
                Configura tu API key
              </a>
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Main results */}
        <div className="col-span-3">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && tab === "works" && works.length > 0 && (
            <div className="space-y-4">
              {works.map((work) => (
                <div key={work.id} className="bg-surface border border-border rounded-xl p-5 hover:border-border-2 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text text-sm leading-snug mb-2">
                        {work.title || "Sin título"}
                      </h3>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {work.publication_year && (
                          <span className="text-xs text-text-muted">{work.publication_year}</span>
                        )}
                        <span className="text-xs text-text-muted">
                          {work.cited_by_count || 0} citas
                        </span>
                        {work.primary_location?.source?.display_name && (
                          <span className="text-xs text-text-muted truncate max-w-48">
                            {work.primary_location.source.display_name}
                          </span>
                        )}
                      </div>
                      {work.authorships && work.authorships.length > 0 && (
                        <div className="text-xs text-text-muted mb-2">
                          {work.authorships
                            .slice(0, 3)
                            .map((a) => a.author.display_name)
                            .join(", ")}
                          {work.authorships.length > 3 && ` +${work.authorships.length - 3}`}
                        </div>
                      )}
                      {work.abstract_inverted_index && (
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                          {invertedIndexToText(work.abstract_inverted_index)}
                        </p>
                      )}
                      {work.concepts && work.concepts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {work.concepts.slice(0, 5).map((c) => (
                            <span
                              key={c.display_name}
                              className="text-xs bg-background border border-border px-2 py-0.5 rounded-full text-text-muted"
                            >
                              {c.display_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleImport(work)}
                      disabled={importing === work.id || !!importSuccess}
                      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        importSuccess === work.id
                          ? "bg-success/10 text-success border border-success/30"
                          : "bg-accent hover:bg-accent-dim disabled:opacity-50 text-white"
                      }`}
                    >
                      {importing === work.id
                        ? "Importando..."
                        : importSuccess === work.id
                        ? "¡Importado!"
                        : "Importar a Hodon"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tab === "concepts" && concepts.length > 0 && (
            <div className="space-y-3">
              {concepts.map((concept) => (
                <div key={concept.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-text text-sm">{concept.display_name}</div>
                      {concept.description && (
                        <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                          {concept.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-xs text-text-muted">Nivel {concept.level}</div>
                      <div className="text-xs text-text-muted">
                        {(concept.works_count || 0).toLocaleString()} works
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && ((tab === "works" && works.length === 0) || (tab === "concepts" && concepts.length === 0)) && query && (
            <div className="text-center py-12 text-text-muted text-sm">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-16 text-text-muted">
              <div className="text-4xl mb-4">📡</div>
              <p className="text-sm">Escribe una búsqueda para explorar OpenAlex.</p>
              <p className="text-xs mt-2">
                250M+ papers indexados. Requiere API key configurada.
              </p>
            </div>
          )}
        </div>

        {/* Saved searches */}
        <div className="col-span-1">
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
              Búsquedas guardadas
            </h3>
            {savedSearches.length === 0 ? (
              <p className="text-xs text-text-muted">Ninguna guardada aún.</p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setQuery(s.query);
                        runSearch(s.query, tab);
                      }}
                      className="flex-1 text-left text-xs text-text hover:text-accent truncate transition-colors"
                    >
                      {s.query}
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(s.id)}
                      className="text-text-muted hover:text-danger text-xs shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
