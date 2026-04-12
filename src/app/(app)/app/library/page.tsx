"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Output {
  id: string;
  title: string;
  createdAt: string;
  input: { domain: string; objective: string; type: string };
}

const DOMAINS = ["", "AI", "BIOTECH", "SPACE", "CLIMATE", "MATERIALS", "ECON", "OTHER"];
const OBJECTIVES = [
  { value: "", label: "Todos" },
  { value: "EXPLORE", label: "Explorar" },
  { value: "VALIDATE", label: "Validar" },
  { value: "DESIGN_EXPERIMENT", label: "Diseñar experimento" },
  { value: "FIND_PRODUCT", label: "Encontrar producto" },
];

export default function LibraryPage() {
  const router = useRouter();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [objective, setObjective] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOutputs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (domain) params.set("domain", domain);
      if (objective) params.set("objective", objective);

      const res = await fetch(`/api/outputs?${params}`);
      if (res.ok) {
        const data = await res.json() as { outputs: Output[]; total: number };
        setOutputs(data.outputs);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, domain, objective]);

  useEffect(() => {
    const t = setTimeout(fetchOutputs, 300);
    return () => clearTimeout(t);
  }, [fetchOutputs]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este output? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/outputs/${id}`, { method: "DELETE" });
      setOutputs((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca</h1>
          <p className="text-text-muted text-sm mt-1">{total} outputs totales</p>
        </div>
        <Link
          href="/app/create"
          className="flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
        />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d || "Todos los dominios"}</option>
          ))}
        </select>
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-text focus:border-accent focus:outline-none text-sm"
        >
          {OBJECTIVES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : outputs.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm mb-4">
            {search || domain || objective ? "No se encontraron resultados." : "Aún no tienes outputs."}
          </p>
          {!search && !domain && !objective && (
            <Link
              href="/app/create"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Crear primer output
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {outputs.map((output) => (
            <div
              key={output.id}
              className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-2 transition-colors"
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/app/outputs/${output.id}`)}
              >
                <div className="font-medium text-text hover:text-accent-glow truncate text-sm">
                  {output.title}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted font-mono bg-background px-2 py-0.5 rounded">
                    {output.input.domain}
                  </span>
                  <span className="text-xs text-text-muted">
                    {output.input.objective.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-text-muted">·</span>
                  <span className="text-xs text-text-muted">
                    {new Date(output.createdAt).toLocaleDateString("es-MX")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/app/outputs/${output.id}`}
                  className="text-xs text-text-muted hover:text-accent border border-border hover:border-accent/40 px-3 py-1.5 rounded-md transition-colors"
                >
                  Ver
                </Link>
                <Link
                  href={`/app/outputs/${output.id}/tracker`}
                  className="text-xs text-text-muted hover:text-text border border-border px-3 py-1.5 rounded-md transition-colors"
                >
                  Tracker
                </Link>
                <button
                  onClick={() => handleDelete(output.id)}
                  disabled={deletingId === output.id}
                  className="text-xs text-text-muted hover:text-danger disabled:opacity-50 border border-border hover:border-danger/40 px-3 py-1.5 rounded-md transition-colors"
                >
                  {deletingId === output.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
