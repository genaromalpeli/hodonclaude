"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeTypes,
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NODE_COLORS, NODE_LABELS } from "@/types/canvas";
import type { NodeType, EpistemicStatus } from "@/types/canvas";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DBNode {
  id: string;
  type: string;
  title: string;
  contentSimple: string | null;
  contentMedium: string | null;
  contentSenior: string | null;
  epistemicStatus: string | null;
  positionX: number;
  positionY: number;
}

interface DBEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  rawJson: unknown;
  createdAt: string;
}

interface ProjectData {
  id: string;
  title: string;
  seedQuestion: string;
}

// ── Custom Node Component ──────────────────────────────────────────────────────

function CanvasNodeComponent({ data }: { data: { label: string; nodeType: NodeType; epistemicStatus: EpistemicStatus | null; onSelect: () => void } }) {
  const color = NODE_COLORS[data.nodeType] || "#6B7280";
  const typeLabel = NODE_LABELS[data.nodeType] || data.nodeType;

  const epColors: Record<string, string> = {
    fact: "#10B981",
    inference: "#3B82F6",
    hypothesis: "#F97316",
    speculation: "#9CA3AF",
  };
  const epLabels: Record<string, string> = {
    fact: "Hecho",
    inference: "Inferencia",
    hypothesis: "Hipótesis",
    speculation: "Especulación",
  };

  return (
    <div
      className="bg-surface border rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      style={{ borderColor: color, minWidth: 180, maxWidth: 260 }}
      onClick={data.onSelect}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />

      <div className="px-3 py-2 border-b" style={{ borderColor: `${color}30` }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">{typeLabel}</span>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <p className="text-xs text-text font-medium leading-snug line-clamp-3">{data.label}</p>
        {data.epistemicStatus && (
          <span
            className="inline-block text-xs mt-1.5 px-1.5 py-0.5 rounded font-mono"
            style={{
              color: epColors[data.epistemicStatus] || "#9CA3AF",
              backgroundColor: `${epColors[data.epistemicStatus] || "#9CA3AF"}15`,
            }}
          >
            {epLabels[data.epistemicStatus] || data.epistemicStatus}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  canvasNode: CanvasNodeComponent,
};

// ── Main Workspace ────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [statusText, setStatusText] = useState("");
  const [selectedNode, setSelectedNode] = useState<DBNode | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [depthLevel, setDepthLevel] = useState<"simple" | "medium" | "senior">("simple");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([] as RFNode[]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([] as RFEdge[]);

  // ── Load project + data ────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/messages`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/nodes`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/edges`).then((r) => r.json()),
    ]).then(([projData, msgData, nodesData, edgesData]) => {
      if (projData.project) setProject(projData.project);
      if (msgData.messages) setMessages(msgData.messages);
      if (msgData.chatId) setChatId(msgData.chatId);
      if (nodesData.nodes) syncCanvasFromDB(nodesData.nodes, edgesData.edges || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync DB nodes → React Flow ─────────────────────────────────────────────

  const syncCanvasFromDB = useCallback((dbNodes: DBNode[], dbEdges: DBEdge[]) => {
    const newRfNodes: RFNode[] = dbNodes.map((n) => ({
      id: n.id,
      type: "canvasNode",
      position: { x: n.positionX, y: n.positionY },
      data: {
        label: n.title,
        nodeType: n.type as NodeType,
        epistemicStatus: n.epistemicStatus as EpistemicStatus | null,
        onSelect: () => setSelectedNode(n),
      },
    }));

    const newRfEdges: RFEdge[] = dbEdges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      label: e.relationType,
      type: "default",
      style: { stroke: "#444", strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: "#888" },
      animated: e.relationType === "contradicts",
    }));

    setRfNodes(newRfNodes);
    setRfEdges(newRfEdges);
  }, [setRfNodes, setRfEdges]);

  // ── Auto scroll chat ───────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // ── Send message ───────────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setStreaming(true);
    setStreamText("");
    setStatusText("Conectando con Cosmo...");

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      rawJson: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        setStreamText(`Error: ${err.error || "Error desconocido"}`);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setStreaming(false); return; }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr) as {
              type: string;
              text?: string;
              nodes?: DBNode[];
              edges?: DBEdge[];
            };

            if (event.type === "status") {
              setStatusText(event.text || "");
            } else if (event.type === "text") {
              accumulated += event.text || "";
              setStreamText(accumulated);
              setStatusText("");
            } else if (event.type === "canvas_update") {
              if (event.nodes && event.edges) {
                syncCanvasFromDB(event.nodes, event.edges);
              }
            } else if (event.type === "error") {
              accumulated += `\n\nError: ${event.text}`;
              setStreamText(accumulated);
            } else if (event.type === "done") {
              // Final: add assistant message
              const assistantMsg: ChatMessage = {
                id: `msg-${Date.now()}`,
                role: "assistant",
                content: accumulated,
                rawJson: null,
                createdAt: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistantMsg]);
              setStreamText("");
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      setStreamText(`Error de conexión: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setStreaming(false);
      setStatusText("");
    }
  }

  // ── Expand node ────────────────────────────────────────────────────────────

  async function handleExpand(nodeId: string) {
    setExpanding(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nodes && data.edges) {
          syncCanvasFromDB(data.nodes, data.edges);
        }
      }
    } finally {
      setExpanding(false);
    }
  }

  // ── Save node position on drag ─────────────────────────────────────────────

  function handleNodeDragStop(_: unknown, node: RFNode) {
    fetch(`/api/nodes/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionX: node.position.x, positionY: node.position.y }),
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">Proyecto no encontrado.</p>
        <Link href="/app" className="text-accent text-sm mt-4 block hover:underline">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="-m-6 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-11 border-b border-border bg-surface/70 backdrop-blur shrink-0">
        <Link href="/app" className="text-text-muted hover:text-text text-xs transition-colors">← Proyectos</Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-text truncate flex-1">{project.title}</h1>
      </div>

      {/* Main: Canvas + Chat */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-w-0 relative">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff08" />
            <Controls className="!bg-surface !border-border !rounded-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-text-muted [&>button:hover]:!bg-surface-2" />
            <MiniMap
              className="!bg-surface !border-border !rounded-lg"
              nodeColor={(n) => NODE_COLORS[(n.data?.nodeType as NodeType)] || "#444"}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>

          {rfNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-4xl mb-3 opacity-20">🧠</div>
                <p className="text-text-muted/50 text-sm">Envía una pregunta para ver nodos aquí</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-[380px] border-l border-border flex flex-col bg-surface/40 shrink-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
            {/* Seed question hint */}
            {messages.length === 0 && !streaming && (
              <div className="text-center py-8">
                <p className="text-text-muted text-xs mb-3">Pregunta semilla del proyecto:</p>
                <p className="text-text text-sm font-medium italic">&ldquo;{project.seedQuestion}&rdquo;</p>
                <button
                  onClick={() => { setInput(project.seedQuestion); inputRef.current?.focus(); }}
                  className="mt-4 text-xs text-accent hover:underline"
                >
                  Enviar como primera pregunta →
                </button>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent/15 text-text border border-accent/20"
                      : "bg-background text-text-dim border border-border"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-xs">{msg.content}</pre>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-xl px-3.5 py-2.5 bg-background text-text-dim border border-border">
                  {statusText && (
                    <div className="flex items-center gap-2 text-xs text-accent mb-2">
                      <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                      {statusText}
                    </div>
                  )}
                  {streamText && <pre className="whitespace-pre-wrap font-sans text-xs">{streamText}</pre>}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Pregunta a Cosmo..."
                rows={2}
                disabled={streaming}
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-text text-sm placeholder:text-text-muted focus:border-accent focus:outline-none resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                className="self-end bg-accent hover:bg-accent-dim disabled:opacity-30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                {streaming ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Node Inspector (slide-up) */}
      {selectedNode && (
        <div className="shrink-0 border-t border-border bg-surface/95 backdrop-blur px-5 py-4 max-h-64 overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type as NodeType] || "#6B7280" }}
                />
                <span className="text-xs font-mono text-text-muted uppercase">
                  {NODE_LABELS[selectedNode.type as NodeType] || selectedNode.type}
                </span>
                {selectedNode.epistemicStatus && (
                  <span className="text-xs text-text-muted font-mono">· {selectedNode.epistemicStatus}</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-text">{selectedNode.title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleExpand(selectedNode.id)}
                disabled={expanding}
                className="text-xs bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {expanding ? "Expandiendo..." : "Profundizar"}
              </button>
              <button
                onClick={() => {
                  setInput(`Profundiza sobre: ${selectedNode.title}`);
                  inputRef.current?.focus();
                }}
                className="text-xs border border-border text-text-muted hover:text-text px-3 py-1.5 rounded-lg transition-colors"
              >
                Preguntar
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-text-muted hover:text-text text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Depth tabs */}
          <div className="flex gap-1 mb-3">
            {(["simple", "medium", "senior"] as const).map((level) => {
              const labels = { simple: "Simple", medium: "Intermedio", senior: "Experto" };
              return (
                <button
                  key={level}
                  onClick={() => setDepthLevel(level)}
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${
                    depthLevel === level
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text bg-background"
                  }`}
                >
                  {labels[level]}
                </button>
              );
            })}
          </div>

          <p className="text-text-dim text-xs leading-relaxed">
            {depthLevel === "simple" && (selectedNode.contentSimple || "Sin contenido.")}
            {depthLevel === "medium" && (selectedNode.contentMedium || selectedNode.contentSimple || "Sin contenido.")}
            {depthLevel === "senior" && (selectedNode.contentSenior || selectedNode.contentMedium || selectedNode.contentSimple || "Sin contenido.")}
          </p>
        </div>
      )}
    </div>
  );
}
