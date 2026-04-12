"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Paper {
  id: string;
  titulo: string;
  año?: number;
  citas?: number;
  autores?: Array<{ author: { display_name: string } }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: Array<{ display_name: string; score: number }>;
}

function invertirAbstract(inv?: Record<string, number[]>): string {
  if (!inv) return "";
  const words: [string, number][] = [];
  for (const [w, pos] of Object.entries(inv)) pos.forEach((p) => words.push([w, p]));
  words.sort((a, b) => a[1] - b[1]);
  const txt = words.map((w) => w[0]).join(" ");
  return txt.slice(0, 400);
}

export default function CreatePage() {
  const router = useRouter();
  const [pregunta, setPregunta] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [archivoPDF, setArchivoPDF] = useState<string | null>(null);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [queryBusqueda, setQueryBusqueda] = useState("");
  const [resultados, setResultados] = useState<Paper[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function buscarPapers() {
    if (!queryBusqueda.trim()) return;
    setBuscando(true);
    try {
      const res = await fetch(
        `/api/openalex/works?search=${encodeURIComponent(queryBusqueda)}&per_page=8`
      );
      const data = await res.json() as { results?: Paper[]; error?: string };
      if (data.error) setError(data.error);
      else setResultados((data.results || []).map((r) => ({ ...r, titulo: r.titulo || (r as unknown as Record<string, unknown>).title as string })));
    } catch {
      setError("Error en la búsqueda.");
    } finally {
      setBuscando(false);
    }
  }

  function agregarPaper(paper: Paper) {
    const raw = paper as unknown as Record<string, unknown>;
    const p: Paper = {
      id: String(raw.id || paper.id),
      titulo: String(raw.title || paper.titulo || "Sin título"),
      año: raw.publication_year as number | undefined,
      citas: raw.cited_by_count as number | undefined,
      autores: raw.authorships as Paper["autores"],
      abstract_inverted_index: raw.abstract_inverted_index as Paper["abstract_inverted_index"],
      concepts: raw.concepts as Paper["concepts"],
    };
    if (!papers.find((x) => x.id === p.id)) {
      setPapers((prev) => [...prev, p]);
    }
    setMostrarBuscador(false);
    setResultados([]);
    setQueryBusqueda("");
  }

  function quitarPaper(id: string) {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  }

  function handlePDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setArchivoPDF(file.name);
  }

  async function handleGenerar() {
    if (!pregunta.trim() && papers.length === 0 && !archivoPDF) return;
    setGenerando(true);
    setError("");

    try {
      const sourceRef = papers[0]?.id || archivoPDF || pregunta.slice(0, 100);
      const tipo = papers.length > 0 ? "OPENALEX_WORK" : archivoPDF ? "PDF_UPLOAD" : "QUESTION_TEXT";

      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tipo,
          sourceRef,
          rawText: pregunta || undefined,
          domain: "OTHER",
          objective: "EXPLORE",
        }),
      });

      if (!inputRes.ok) throw new Error("Error creando el input.");
      const { input } = await inputRes.json() as { input: { id: string } };

      const papersPayload = papers.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        abstract: invertirAbstract(p.abstract_inverted_index),
        conceptos: p.concepts,
        citas: p.citas,
        año: p.año,
        autores: (p.autores || []).map((a) => a.author.display_name),
      }));

      const outputRes = await fetch("/api/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputId: input.id, papersAdjuntos: papersPayload }),
      });

      if (!outputRes.ok) throw new Error("Error generando el análisis.");
      const { output } = await outputRes.json() as { output: { id: string } };
      router.push(`/app/outputs/${output.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
      setGenerando(false);
    }
  }

  const puedeGenerar = pregunta.trim().length > 0 || papers.length > 0 || !!archivoPDF;

  if (generando) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-text font-semibold text-lg mb-1">Analizando...</p>
          <p className="text-text-muted text-sm">
            Generando mapa epistémico, cuadrantes, red team y referencias.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text mb-2">Nueva investigación</h1>
        <p className="text-text-muted text-sm">
          Escribe tu pregunta o hipótesis. Adjunta papers si los tienes.
        </p>
      </div>

      {/* Textarea principal */}
      <div className="mb-6">
        <textarea
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="¿Cuál es tu pregunta de investigación o hipótesis? Por ejemplo: ¿Qué mecanismos determinan la plasticidad sináptica en condiciones de privación de sueño crónica?"
          rows={6}
          className="w-full bg-surface border border-border rounded-xl px-5 py-4 text-text text-base placeholder:text-text-muted focus:border-accent focus:outline-none resize-none leading-relaxed"
          autoFocus
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-text-muted">{pregunta.length} caracteres</span>
        </div>
      </div>

      {/* Papers adjuntos */}
      {papers.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {papers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg px-3 py-1.5 text-xs"
            >
              <span className="text-accent-glow font-medium max-w-48 truncate">{p.titulo}</span>
              {p.año && <span className="text-text-muted">{p.año}</span>}
              <button
                onClick={() => quitarPaper(p.id)}
                className="text-text-muted hover:text-danger ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PDF adjunto */}
      {archivoPDF && (
        <div className="mb-4 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 text-xs w-fit">
          <span className="text-text-muted">📄</span>
          <span className="text-text-dim">{archivoPDF}</span>
          <button onClick={() => setArchivoPDF(null)} className="text-text-muted hover:text-danger">×</button>
        </div>
      )}

      {/* Acciones secundarias */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setMostrarBuscador(!mostrarBuscador)}
          className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${
            mostrarBuscador
              ? "border-accent text-accent bg-accent/5"
              : "border-border text-text-muted hover:text-text hover:border-border-2"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar papers
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm border border-border text-text-muted hover:text-text hover:border-border-2 rounded-lg px-4 py-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Adjuntar PDF
        </button>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePDF} />
      </div>

      {/* Panel de búsqueda */}
      {mostrarBuscador && (
        <div className="mb-6 bg-surface border border-accent/20 rounded-xl p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={queryBusqueda}
              onChange={(e) => setQueryBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarPapers()}
              placeholder="Buscar investigaciones científicas..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-text text-sm placeholder:text-text-muted focus:border-accent focus:outline-none"
              autoFocus
            />
            <button
              onClick={buscarPapers}
              disabled={buscando || !queryBusqueda.trim()}
              className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {buscando ? "..." : "Buscar"}
            </button>
          </div>

          {resultados.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(resultados as unknown as Record<string, unknown>[]).map((r) => {
                const titulo = String(r.title || r.titulo || "Sin título");
                const id = String(r.id || "");
                const año = r.publication_year as number | undefined;
                const citas = r.cited_by_count as number | undefined;
                const yaAgregado = papers.some((p) => p.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-start justify-between gap-3 p-3 bg-background rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-text text-xs font-medium leading-snug line-clamp-2">{titulo}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {año && <span>{año} · </span>}
                        {citas !== undefined && <span>{citas} citas</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => agregarPaper(r as unknown as Paper)}
                      disabled={yaAgregado}
                      className={`shrink-0 text-xs px-2.5 py-1 rounded-md transition-colors ${
                        yaAgregado
                          ? "text-success border border-success/30"
                          : "bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20"
                      }`}
                    >
                      {yaAgregado ? "Agregado" : "Agregar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!buscando && resultados.length === 0 && queryBusqueda && (
            <p className="text-text-muted text-xs text-center py-4">
              Sin resultados. Verifica tu API key de búsqueda en Ajustes.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleGenerar}
        disabled={!puedeGenerar}
        className="w-full bg-accent hover:bg-accent-dim disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-base"
      >
        Generar análisis →
      </button>

      <p className="text-center text-xs text-text-muted mt-3">
        Hodon generará un mapa epistémico completo con 11 piezas de análisis.
      </p>
    </div>
  );
}
