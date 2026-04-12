import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [outputCount, recentOutputs, experimentStats] = await Promise.all([
    prisma.output.count({ where: { userId: session.userId } }),
    prisma.output.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { input: { select: { domain: true, objective: true } } },
    }),
    prisma.experiment.groupBy({
      by: ["status"],
      where: { output: { userId: session.userId } },
      _count: true,
    }),
  ]);

  const experimentCounts = Object.fromEntries(
    experimentStats.map((s) => [s.status, s._count])
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Bienvenido, {session.name.split(" ")[0]}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Tu laboratorio de conocimiento accionable.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Outputs", value: outputCount, color: "text-accent" },
          { label: "En progreso", value: experimentCounts["IN_PROGRESS"] || 0, color: "text-warning" },
          { label: "Completados", value: experimentCounts["DONE"] || 0, color: "text-success" },
          { label: "Pendientes", value: experimentCounts["PENDING"] || 0, color: "text-text-muted" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-text-muted text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/app/create"
          className="flex items-center gap-4 bg-accent/5 hover:bg-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl p-5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-text group-hover:text-accent-glow transition-colors">
              Nuevo análisis
            </div>
            <div className="text-text-muted text-xs mt-0.5">
              Crea un output desde cero
            </div>
          </div>
        </Link>

        <Link
          href="/app/radar"
          className="flex items-center gap-4 bg-surface hover:bg-surface-2 border border-border rounded-xl p-5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-text group-hover:text-accent-glow transition-colors">
              Buscar en OpenAlex
            </div>
            <div className="text-text-muted text-xs mt-0.5">
              Importa papers y señales
            </div>
          </div>
        </Link>
      </div>

      {/* Recent outputs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Outputs recientes</h2>
          <Link href="/app/library" className="text-xs text-accent hover:underline">
            Ver todos →
          </Link>
        </div>

        {recentOutputs.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-10 text-center">
            <p className="text-text-muted text-sm mb-4">Aún no tienes outputs.</p>
            <Link
              href="/app/create"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dim text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Crear primer output
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOutputs.map((output) => (
              <Link
                key={output.id}
                href={`/app/outputs/${output.id}`}
                className="flex items-center justify-between bg-surface hover:bg-surface-2 border border-border rounded-xl px-5 py-4 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="font-medium text-text group-hover:text-accent-glow truncate transition-colors text-sm">
                    {output.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted font-mono">
                      {output.input.domain}
                    </span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">
                      {output.input.objective.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-text-muted ml-4 shrink-0">
                  {new Date(output.createdAt).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
