"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HodonSections {
  abstract: string;
  mapa_conceptos: {
    nucleo: string;
    nodos: string[];
    relaciones: Array<{ desde: string; hasta: string; etiqueta: string }>;
  };
  cuadrantes: {
    hechos: string[];
    inferencias: string[];
    hipotesis: string[];
    especulacion: string[];
  };
  axiomas: string[];
  supuestos_criticos: Array<{ texto: string; confianza: "alta" | "media" | "baja" }>;
  primeros_principios: string[];
  red_team: Array<{ modo_fallo: string; test_falsificacion: string }>;
  foresight: {
    drivers: string[];
    incertidumbres: string[];
    escenarios: Array<{ nombre: string; descripcion: string }>;
    señales: string[];
  };
  riesgos: Array<{ riesgo: string; mitigacion: string }>;
  recomendacion_final: {
    veredicto: "AVANZAR" | "NO AVANZAR" | "REQUIERE MÁS DATOS";
    fundamento: string;
    proximos_pasos: string[];
  };
  referencias: Array<{
    titulo: string;
    autores: string;
    año: number;
    relevancia: string;
    tipo: "paper" | "informe" | "libro" | "dataset";
  }>;
}

interface Output {
  id: string;
  title: string;
  createdAt: string;
  sectionsJson: HodonSections;
  input: { domain: string; objective: string; type: string };
}

// ── Card definitions ──────────────────────────────────────────────────────────

const CARD_DEFS = [
  { key: "abstract" as const,           label: "Abstract",               border: "border-accent/40",  selBorder: "border-accent" },
  { key: "mapa_conceptos" as const,     label: "Mapa de conceptos",      border: "border-accent/30",  selBorder: "border-accent" },
  { key: "cuadrantes" as const,         label: "Cuadrantes epistémicos", border: "border-warning/40", selBorder: "border-warning" },
  { key: "axiomas" as const,            label: "Axiomas",                border: "border-accent/30",  selBorder: "border-accent" },
  { key: "supuestos_criticos" as const, label: "Supuestos críticos",     border: "border-warning/40", selBorder: "border-warning" },
  { key: "primeros_principios" as const,label: "Primeros principios",    border: "border-accent/30",  selBorder: "border-accent" },
  { key: "red_team" as const,           label: "Red Team",               border: "border-danger/40",  selBorder: "border-danger" },
  { key: "foresight" as const,          label: "Foresight",              border: "border-success/40", selBorder: "border-success" },
  { key: "riesgos" as const,            label: "Riesgos",                border: "border-danger/30",  selBorder: "border-danger" },
  { key: "recomendacion_final" as const,label: "Recomendación final",    border: "border-success/40", selBorder: "border-success" },
  { key: "referencias" as const,        label: "Referencias",            border: "border-border",     selBorder: "border-border-2" },
] as const;

type CardKey = typeof CARD_DEFS[number]["key"];

const CARD_W = 340;

const INIT_POS: Record<CardKey, { x: number; y: number }> = {
  abstract:            { x: 40,  y: 40  },
  mapa_conceptos:      { x: 420, y: 40  },
  cuadrantes:          { x: 800, y: 40  },
  axiomas:             { x: 40,  y: 520 },
  supuestos_criticos:  { x: 420, y: 500 },
  primeros_principios: { x: 800, y: 520 },
  red_team:            { x: 40,  y: 1000},
  foresight:           { x: 420, y: 980 },
  riesgos:             { x: 800, y: 1000},
  recomendacion_final: { x: 220, y: 1460},
  referencias:         { x: 640, y: 1460},
};

// ── Card content renderer ─────────────────────────────────────────────────────

function CardContent({ k, s }: { k: CardKey; s: HodonSections }) {
  switch (k) {
    case "abstract":
      return <p className="text-text-dim text-xs leading-relaxed">{s.abstract}</p>;

    case "mapa_conceptos":
      return (
        <div className="space-y-2">
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider">Núcleo</div>
            <div className="text-text text-xs font-semibold mt-0.5">{s.mapa_conceptos.nucleo}</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {s.mapa_conceptos.nodos.map((n) => (
              <span key={n} className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">{n}</span>
            ))}
          </div>
          <div className="space-y-1">
            {s.mapa_conceptos.relaciones.slice(0, 4).map((r, i) => (
              <div key={i} className="text-xs text-text-muted">
                <span className="text-text">{r.desde}</span>
                <span className="mx-1 text-accent/60 italic"> → {r.etiqueta} → </span>
                <span className="text-text">{r.hasta}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "cuadrantes":
      return (
        <div className="grid grid-cols-2 gap-2">
          {(["hechos", "inferencias", "hipotesis", "especulacion"] as const).map((q) => {
            const meta = {
              hechos:      { label: "Hechos",      cls: "text-success" },
              inferencias: { label: "Inferencias", cls: "text-accent" },
              hipotesis:   { label: "Hipótesis",   cls: "text-warning" },
              especulacion:{ label: "Especulación",cls: "text-text-muted" },
            }[q];
            return (
              <div key={q} className="bg-background/60 rounded-lg p-2">
                <div className={`text-xs font-semibold mb-1 ${meta.cls}`}>{meta.label}</div>
                {s.cuadrantes[q].slice(0, 2).map((item, i) => (
                  <p key={i} className="text-xs text-text-dim leading-snug">· {item}</p>
                ))}
              </div>
            );
          })}
        </div>
      );

    case "axiomas":
      return (
        <ol className="space-y-2">
          {s.axiomas.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent font-bold text-xs shrink-0">{i + 1}.</span>
              <p className="text-text-dim text-xs leading-relaxed">{a}</p>
            </li>
          ))}
        </ol>
      );

    case "supuestos_criticos":
      return (
        <div className="space-y-1.5">
          {s.supuestos_criticos.map((sup, i) => {
            const clr = {
              alta:  "text-success bg-success/10 border-success/20",
              media: "text-warning bg-warning/10 border-warning/20",
              baja:  "text-danger  bg-danger/10  border-danger/20",
            }[sup.confianza];
            return (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-mono shrink-0 ${clr}`}>{sup.confianza}</span>
                <p className="text-xs text-text-dim leading-relaxed">{sup.texto}</p>
              </div>
            );
          })}
        </div>
      );

    case "primeros_principios":
      return (
        <ol className="space-y-2">
          {s.primeros_principios.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent font-bold text-xs shrink-0">{i + 1}.</span>
              <p className="text-text-dim text-xs leading-relaxed">{p}</p>
            </li>
          ))}
        </ol>
      );

    case "red_team":
      return (
        <div className="space-y-2">
          {s.red_team.map((r, i) => (
            <div key={i} className="border border-danger/10 bg-danger/5 rounded-lg p-2">
              <p className="text-xs text-text font-medium leading-snug">{i + 1}. {r.modo_fallo}</p>
              <p className="text-xs text-text-muted italic mt-0.5">Test: {r.test_falsificacion}</p>
            </div>
          ))}
        </div>
      );

    case "foresight":
      return (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Drivers</div>
            {s.foresight.drivers.map((d, i) => (
              <p key={i} className="text-xs text-text-dim">→ {d}</p>
            ))}
          </div>
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Escenarios</div>
            {s.foresight.escenarios.map((sc, i) => (
              <div key={i} className="mb-1.5">
                <span className="text-xs font-semibold text-text">{sc.nombre}: </span>
                <span className="text-xs text-text-muted">{sc.descripcion}</span>
              </div>
            ))}
          </div>
          {s.foresight.señales.length > 0 && (
            <div>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Señales</div>
              {s.foresight.señales.map((sig, i) => (
                <p key={i} className="text-xs text-success">◆ {sig}</p>
              ))}
            </div>
          )}
        </div>
      );

    case "riesgos":
      return (
        <div className="space-y-2">
          {s.riesgos.map((r, i) => (
            <div key={i} className="p-2 bg-background/60 rounded-lg">
              <p className="text-xs text-text font-medium">{r.riesgo}</p>
              <p className="text-xs text-success mt-0.5">↳ {r.mitigacion}</p>
            </div>
          ))}
        </div>
      );

    case "recomendacion_final": {
      const vClr = {
        "AVANZAR":            "bg-success text-white",
        "NO AVANZAR":         "bg-danger text-white",
        "REQUIERE MÁS DATOS": "bg-warning text-black",
      }[s.recomendacion_final.veredicto];
      return (
        <div className="space-y-3">
          <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-lg ${vClr}`}>
            {s.recomendacion_final.veredicto}
          </span>
          <p className="text-xs text-text-dim leading-relaxed">{s.recomendacion_final.fundamento}</p>
          <div>
            <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Próximos pasos</div>
            {s.recomendacion_final.proximos_pasos.map((p, i) => (
              <p key={i} className="text-xs text-text-dim">→ {p}</p>
            ))}
          </div>
        </div>
      );
    }

    case "referencias":
      return (
        <div className="space-y-2">
          {s.referencias.map((r, i) => (
            <div key={i} className="pb-2 border-b border-border/40 last:border-0 last:pb-0">
              <p className="text-xs text-text font-medium leading-snug">{r.titulo}</p>
              <p className="text-xs text-text-muted">{r.autores} · {r.año}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-1.5 rounded font-mono ${
                  r.tipo === "paper"   ? "bg-accent/10 text-accent" :
                  r.tipo === "libro"   ? "bg-warning/10 text-warning" :
                  r.tipo === "dataset" ? "bg-success/10 text-success" :
                  "bg-surface text-text-muted"
                }`}>{r.tipo}</span>
                <p className="text-xs text-text-muted italic truncate">{r.relevancia}</p>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ── Markdown export ───────────────────────────────────────────────────────────

function buildMarkdown(output: Output): string {
  const s = output.sectionsJson;
  const lines: string[] = [
    `# ${output.title}`,
    `> Hodon · ${new Date(output.createdAt).toLocaleDateString("es-MX")}`,
    ``,
    `## Abstract`,
    ``,
    s.abstract,
    ``,
    `## Mapa de conceptos`,
    ``,
    `**Núcleo:** ${s.mapa_conceptos.nucleo}`,
    ``,
    `**Nodos:** ${s.mapa_conceptos.nodos.join(", ")}`,
    ``,
    `## Cuadrantes epistémicos`,
    ``,
    `### Hechos`,
    ...s.cuadrantes.hechos.map((f) => `- ${f}`),
    ``,
    `### Inferencias`,
    ...s.cuadrantes.inferencias.map((f) => `- ${f}`),
    ``,
    `### Hipótesis`,
    ...s.cuadrantes.hipotesis.map((f) => `- ${f}`),
    ``,
    `### Especulación`,
    ...s.cuadrantes.especulacion.map((f) => `- ${f}`),
    ``,
    `## Axiomas`,
    ``,
    ...s.axiomas.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `## Supuestos críticos`,
    ``,
    ...s.supuestos_criticos.map((a) => `- [${a.confianza.toUpperCase()}] ${a.texto}`),
    ``,
    `## Primeros principios`,
    ``,
    ...s.primeros_principios.map((p, i) => `${i + 1}. ${p}`),
    ``,
    `## Red Team`,
    ``,
    ...s.red_team.flatMap((r, i) => [
      `### ${i + 1}. ${r.modo_fallo}`,
      `**Test:** ${r.test_falsificacion}`,
      ``,
    ]),
    `## Foresight`,
    ``,
    `**Drivers:** ${s.foresight.drivers.join("; ")}`,
    ``,
    `**Incertidumbres:** ${s.foresight.incertidumbres.join("; ")}`,
    ``,
    ...s.foresight.escenarios.map((sc) => `- **${sc.nombre}:** ${sc.descripcion}`),
    ``,
    `## Riesgos`,
    ``,
    ...s.riesgos.map((r) => `- **${r.riesgo}:** ${r.mitigacion}`),
    ``,
    `## Recomendación final`,
    ``,
    `**Veredicto:** ${s.recomendacion_final.veredicto}`,
    ``,
    s.recomendacion_final.fundamento,
    ``,
    `## Referencias`,
    ``,
    ...s.referencias.map((r) => `- **${r.titulo}** — ${r.autores} (${r.año}). *${r.tipo}*`),
  ];
  return lines.join("\n");
}

// ── Main component ─────────────────────────────────────────────────────────────

type DragState = {
  active: false;
} | {
  active: true;
  type: "pan";
  startMouseX: number;
  startMouseY: number;
  startValX: number;
  startValY: number;
  moved: number;
} | {
  active: true;
  type: "card";
  cardKey: CardKey;
  startMouseX: number;
  startMouseY: number;
  startValX: number;
  startValY: number;
  moved: number;
};

export default function OutputViewerPage() {
  const params = useParams();
  const id = params.id as string;

  const [output, setOutput] = useState<Output | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Canvas positions & pan
  const [positions, setPositions] = useState<Record<CardKey, { x: number; y: number }>>({ ...INIT_POS });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Set<CardKey>>(new Set());
  const [iterQuery, setIterQuery] = useState("");

  // Refs for smooth drag (bypass React re-renders during drag)
  const posRef = useRef<Record<CardKey, { x: number; y: number }>>({ ...INIT_POS });
  const panRef = useRef({ x: 0, y: 0 });
  const worldRef = useRef<HTMLDivElement>(null);
  const cardDivRefs = useRef<Partial<Record<CardKey, HTMLDivElement>>>({});
  const dragRef = useRef<DragState>({ active: false });

  // Load output
  useEffect(() => {
    fetch(`/api/outputs/${id}`)
      .then((r) => r.json())
      .then((d: { output?: Output; error?: string }) => {
        if (d.output) setOutput(d.output);
        else setFetchError(d.error || "Error cargando output.");
      })
      .catch(() => setFetchError("Error de red."))
      .finally(() => setLoading(false));
  }, [id]);

  // Global mouse move + up for drag
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag.active) return;

      const dx = e.clientX - drag.startMouseX;
      const dy = e.clientY - drag.startMouseY;
      const moved = Math.abs(dx) + Math.abs(dy);
      (dragRef.current as { moved: number }).moved = moved;

      if (drag.type === "pan") {
        const nx = drag.startValX + dx;
        const ny = drag.startValY + dy;
        panRef.current = { x: nx, y: ny };
        if (worldRef.current) {
          worldRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
        }
      } else if (drag.type === "card") {
        const nx = drag.startValX + dx;
        const ny = drag.startValY + dy;
        posRef.current[drag.cardKey] = { x: nx, y: ny };
        const el = cardDivRefs.current[drag.cardKey];
        if (el) el.style.transform = `translate(${nx}px, ${ny}px)`;
      }
    }

    function onMouseUp() {
      const drag = dragRef.current;
      if (!drag.active) return;
      const moved = drag.moved;
      dragRef.current = { active: false };

      if (drag.type === "pan") {
        setPan({ ...panRef.current });
      } else if (drag.type === "card") {
        const key = drag.cardKey;
        if (moved < 6) {
          // treat as click → toggle selection
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
          });
          // snap back if tiny drift
          const pos = posRef.current[key];
          const el = cardDivRefs.current[key];
          if (el) el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        } else {
          setPositions({ ...posRef.current });
        }
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function handleCanvasBgMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    dragRef.current = {
      active: true,
      type: "pan",
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startValX: panRef.current.x,
      startValY: panRef.current.y,
      moved: 0,
    };
  }

  function handleCardMouseDown(e: React.MouseEvent, key: CardKey) {
    e.stopPropagation();
    dragRef.current = {
      active: true,
      type: "card",
      cardKey: key,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startValX: posRef.current[key].x,
      startValY: posRef.current[key].y,
      moved: 0,
    };
  }

  function toggleSelected(key: CardKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function exportMd() {
    if (!output) return;
    const md = buildMarkdown(output);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !output) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{fetchError || "Output no encontrado."}</p>
        <Link href="/app/library" className="text-accent text-sm mt-4 block hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const s = output.sectionsJson;
  const selectedArr = Array.from(selected);

  // ── Canvas UI ───────────────────────────────────────────────────────────────

  return (
    <div className="-m-6 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 h-12 border-b border-border bg-surface/70 backdrop-blur shrink-0">
        <Link
          href="/app/library"
          className="text-text-muted hover:text-text text-xs transition-colors shrink-0"
        >
          ← Biblioteca
        </Link>
        <div className="h-4 w-px bg-border shrink-0" />
        <h1 className="text-sm font-semibold text-text truncate flex-1 min-w-0">{output.title}</h1>
        <span className="text-xs text-text-muted shrink-0 hidden sm:block">
          {new Date(output.createdAt).toLocaleDateString("es-MX")}
        </span>
        <button
          onClick={exportMd}
          className="text-xs border border-border text-text-muted hover:text-text hover:border-border-2 px-3 py-1 rounded-md transition-colors shrink-0"
        >
          Exportar MD
        </button>
      </div>

      {/* ── Canvas ── */}
      <div
        className="flex-1 overflow-hidden relative select-none"
        style={{
          background: "#0d0d0f",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          cursor: "grab",
        }}
        onMouseDown={handleCanvasBgMouseDown}
      >
        {/* world — all cards live here; transform for pan */}
        <div
          ref={worldRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            willChange: "transform",
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          {CARD_DEFS.map((def) => {
            const pos = positions[def.key];
            const isSel = selected.has(def.key);

            return (
              <div
                key={def.key}
                data-card={def.key}
                ref={(el) => { if (el) cardDivRefs.current[def.key] = el; }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: CARD_W,
                  willChange: "transform",
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
                onMouseDown={(e) => handleCardMouseDown(e, def.key)}
              >
                <div
                  className={`bg-surface rounded-xl border transition-shadow ${
                    isSel
                      ? `${def.selBorder} shadow-lg shadow-accent/10`
                      : def.border
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 cursor-grab active:cursor-grabbing">
                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider select-none">
                      {def.label}
                    </span>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => toggleSelected(def.key)}
                      className={`text-xs w-6 h-6 flex items-center justify-center rounded border transition-colors ${
                        isSel
                          ? "border-accent text-accent bg-accent/10"
                          : "border-border text-text-muted hover:border-border-2 hover:text-text"
                      }`}
                    >
                      {isSel ? "✓" : "+"}
                    </button>
                  </div>

                  {/* Card body — stop propagation so body scroll/clicks don't drag canvas */}
                  <div
                    className="px-3 py-3 max-h-64 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ scrollbarWidth: "thin" }}
                  >
                    <CardContent k={def.key} s={s} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint overlay */}
        <div className="absolute bottom-3 right-4 text-xs text-white/20 pointer-events-none select-none">
          Arrastra · Click&nbsp;<strong>+</strong>&nbsp;para seleccionar
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="shrink-0 border-t border-border bg-surface/90 backdrop-blur px-4 pt-2.5 pb-3">
        {/* Selected card pills */}
        {selectedArr.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-xs text-text-muted">Iterando sobre:</span>
            {selectedArr.map((k) => {
              const def = CARD_DEFS.find((d) => d.key === k)!;
              return (
                <span
                  key={k}
                  className="flex items-center gap-1 text-xs bg-accent/10 border border-accent/30 text-accent px-2.5 py-0.5 rounded-full"
                >
                  {def.label}
                  <button
                    onClick={() => toggleSelected(k)}
                    className="text-accent/60 hover:text-accent leading-none ml-0.5"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-text-muted hover:text-text px-1.5 py-0.5 transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">
          <textarea
            value={iterQuery}
            onChange={(e) => setIterQuery(e.target.value)}
            placeholder={
              selectedArr.length > 0
                ? `Pregunta o itera sobre ${
                    selectedArr.length === 1
                      ? CARD_DEFS.find((d) => d.key === selectedArr[0])?.label
                      : `${selectedArr.length} piezas seleccionadas`
                  }…`
                : "Selecciona piezas con + para iterar, o escribe una nueva pregunta…"
            }
            rows={2}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-text text-sm placeholder:text-text-muted focus:border-accent focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              disabled={!iterQuery.trim()}
              className="bg-accent hover:bg-accent-dim disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
