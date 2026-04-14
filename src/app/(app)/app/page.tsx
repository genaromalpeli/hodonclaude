"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  seedQuestion: string;
  createdAt: string;
  updatedAt: string;
  _count: { nodes: number; chats: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [seedQ, setSeedQ] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d: { projects?: Project[] }) => setProjects(d.projects || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!title.trim() || !seedQ.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), seedQuestion: seedQ.trim() }),
      });
      if (res.ok) {
        const { project } = await res.json() as { project: { id: string } };
        router.push(`/app/projects/${project.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Proyectos</h1>
          <p className="text-text-muted text-sm mt-1">Tu laboratorio de pensamiento científico.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🔬</div>
          <h2 className="text-lg font-semibold text-text mb-2">Sin proyectos aún</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Crea tu primer proyecto con una pregunta de investigación. Cosmo te ayudará a explorar el espacio de conocimiento.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent hover:bg-accent-dim text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}`}
              className="bg-surface border border-border hover:border-accent/30 rounded-xl p-5 transition-colors group"
            >
              <h3 className="font-semibold text-text group-hover:text-accent-glow transition-colors text-sm mb-1.5">
                {p.title}
              </h3>
              <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
                {p.seedQuestion}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>{p._count.nodes} nodos</span>
                <span>·</span>
                <span>{new Date(p.updatedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-text mb-4">Nuevo proyecto</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Título del proyecto</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Plasticidad sináptica en privación de sueño"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-text-muted focus:border-accent focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Pregunta semilla</label>
                <textarea
                  value={seedQ}
                  onChange={(e) => setSeedQ(e.target.value)}
                  placeholder="¿Cuál es tu pregunta de investigación principal?"
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setTitle(""); setSeedQ(""); }}
                className="text-sm text-text-muted hover:text-text px-4 py-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || !seedQ.trim() || creating}
                className="bg-accent hover:bg-accent-dim disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {creating ? "Creando..." : "Crear proyecto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
