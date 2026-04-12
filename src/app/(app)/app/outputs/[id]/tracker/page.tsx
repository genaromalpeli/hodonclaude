"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Experiment {
  id: string;
  level: "H48" | "W2_4" | "W8_12";
  title: string;
  metricSuccess: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  outcome: "SUCCESS" | "FAIL" | "INCONCLUSIVE" | "NONE";
  learning: string;
  nextStep: string;
  createdAt: string;
  updatedAt: string;
}

interface Output {
  id: string;
  title: string;
}

const LEVEL_LABELS = { H48: "48 horas", W2_4: "2-4 semanas", W8_12: "8-12 semanas" };
const LEVEL_COLORS = {
  H48: "bg-success/10 text-success border-success/30",
  W2_4: "bg-accent/10 text-accent border-accent/30",
  W8_12: "bg-warning/10 text-warning border-warning/30",
};
const STATUS_LABELS = { PENDING: "Pendiente", IN_PROGRESS: "En progreso", DONE: "Completado" };
const STATUS_COLORS = {
  PENDING: "text-text-muted",
  IN_PROGRESS: "text-warning",
  DONE: "text-success",
};
const OUTCOME_LABELS = { SUCCESS: "Éxito", FAIL: "Fallo", INCONCLUSIVE: "Inconcluso", NONE: "Sin resultado" };
const OUTCOME_COLORS = {
  SUCCESS: "text-success",
  FAIL: "text-danger",
  INCONCLUSIVE: "text-warning",
  NONE: "text-text-muted",
};

function ExperimentCard({
  exp,
  onUpdate,
  onDelete,
}: {
  exp: Experiment;
  onUpdate: (id: string, data: Partial<Experiment>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: exp.title,
    metricSuccess: exp.metricSuccess,
    status: exp.status,
    outcome: exp.outcome,
    learning: exp.learning,
    nextStep: exp.nextStep,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/experiments/${exp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json() as { experiment: Experiment };
        onUpdate(exp.id, data.experiment);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar experimento?")) return;
    await fetch(`/api/experiments/${exp.id}`, { method: "DELETE" });
    onDelete(exp.id);
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${LEVEL_COLORS[exp.level]}`}>
            {LEVEL_LABELS[exp.level]}
          </span>
          <span className={`text-xs font-medium ${STATUS_COLORS[exp.status]}`}>
            {STATUS_LABELS[exp.status]}
          </span>
          {exp.outcome !== "NONE" && (
            <span className={`text-xs ${OUTCOME_COLORS[exp.outcome]}`}>
              · {OUTCOME_LABELS[exp.outcome]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-text-muted hover:text-text border border-border px-2 py-1 rounded transition-colors"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-text-muted hover:text-danger border border-border px-2 py-1 rounded transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Métrica de éxito</label>
              <input
                value={form.metricSuccess}
                onChange={(e) => setForm((f) => ({ ...f, metricSuccess: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Experiment["status"] }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En progreso</option>
                  <option value="DONE">Completado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Resultado</label>
                <select
                  value={form.outcome}
                  onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value as Experiment["outcome"] }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                >
                  <option value="NONE">Sin resultado</option>
                  <option value="SUCCESS">Éxito</option>
                  <option value="FAIL">Fallo</option>
                  <option value="INCONCLUSIVE">Inconcluso</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Aprendizajes</label>
              <textarea
                value={form.learning}
                onChange={(e) => setForm((f) => ({ ...f, learning: e.target.value }))}
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none resize-none"
                placeholder="¿Qué aprendiste?"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Próximo paso</label>
              <input
                value={form.nextStep}
                onChange={(e) => setForm((f) => ({ ...f, nextStep: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                placeholder="¿Qué sigue?"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold text-text">{exp.title}</h3>
            <div>
              <span className="text-xs text-text-muted">Métrica de éxito: </span>
              <span className="text-xs text-text-dim">{exp.metricSuccess}</span>
            </div>
            {exp.learning && (
              <div>
                <div className="text-xs text-text-muted mb-0.5">Aprendizajes</div>
                <div className="text-sm text-text-dim leading-relaxed">{exp.learning}</div>
              </div>
            )}
            {exp.nextStep && (
              <div>
                <div className="text-xs text-text-muted mb-0.5">Próximo paso</div>
                <div className="text-sm text-accent/70">{exp.nextStep}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const params = useParams();
  const id = params.id as string;
  const [output, setOutput] = useState<Output | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newExp, setNewExp] = useState({
    level: "H48",
    title: "",
    metricSuccess: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/outputs/${id}`).then((r) => r.json()),
      fetch(`/api/outputs/${id}/experiments`).then((r) => r.json()),
    ]).then(([outputData, expData]: [{ output?: Output }, { experiments?: Experiment[] }]) => {
      if (outputData.output) setOutput(outputData.output);
      if (expData.experiments) setExperiments(expData.experiments);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/outputs/${id}/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExp),
      });
      if (res.ok) {
        const data = await res.json() as { experiment: Experiment };
        setExperiments((prev) => [...prev, data.experiment]);
        setNewExp({ level: "H48", title: "", metricSuccess: "" });
        setShowForm(false);
      }
    } finally {
      setCreating(false);
    }
  }

  function handleUpdate(id: string, data: Partial<Experiment>) {
    setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }

  function handleDelete(id: string) {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/app/outputs/${id}`} className="text-text-muted hover:text-text text-xs">
            ← Output
          </Link>
        </div>
        <h1 className="text-xl font-bold">Tracker de experimentos</h1>
        {output && <p className="text-text-muted text-sm mt-1 truncate">{output.title}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(["PENDING", "IN_PROGRESS", "DONE"] as const).map((s) => {
          const count = experiments.filter((e) => e.status === s).length;
          return (
            <div key={s} className="bg-surface border border-border rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${STATUS_COLORS[s]}`}>{count}</div>
              <div className="text-xs text-text-muted mt-0.5">{STATUS_LABELS[s]}</div>
            </div>
          );
        })}
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-text">{experiments.length}</div>
          <div className="text-xs text-text-muted mt-0.5">Total</div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-text-dim uppercase tracking-wider">Experimentos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs bg-accent hover:bg-accent-dim text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          + Nuevo experimento
        </button>
      </div>

      {/* New experiment form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-accent/30 rounded-xl p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-sm text-text">Nuevo experimento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Horizonte</label>
              <select
                value={newExp.level}
                onChange={(e) => setNewExp((f) => ({ ...f, level: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
              >
                <option value="H48">48 horas</option>
                <option value="W2_4">2-4 semanas</option>
                <option value="W8_12">8-12 semanas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Título</label>
              <input
                value={newExp.title}
                onChange={(e) => setNewExp((f) => ({ ...f, title: e.target.value }))}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
                placeholder="Nombre del experimento"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Métrica de éxito</label>
            <input
              value={newExp.metricSuccess}
              onChange={(e) => setNewExp((f) => ({ ...f, metricSuccess: e.target.value }))}
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none"
              placeholder="¿Cómo sabrás que tuvo éxito?"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {creating ? "Creando..." : "Crear experimento"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 text-sm text-text-muted border border-border rounded-lg hover:text-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Experiments list */}
      {experiments.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">No hay experimentos todavía.</p>
          <p className="text-text-muted text-xs mt-1">
            Crea uno o ve al output para ver el plan sugerido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group by level */}
          {(["H48", "W2_4", "W8_12"] as const).map((level) => {
            const levelExps = experiments.filter((e) => e.level === level);
            if (levelExps.length === 0) return null;
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${LEVEL_COLORS[level]}`}>
                    {LEVEL_LABELS[level]}
                  </span>
                </div>
                <div className="space-y-3">
                  {levelExps.map((exp) => (
                    <ExperimentCard
                      key={exp.id}
                      exp={exp}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
