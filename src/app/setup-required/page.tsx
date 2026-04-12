export default function SetupRequired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-5xl mb-6">🗄️</div>
        <h1 className="text-2xl font-bold mb-3">Base de datos no configurada</h1>
        <p className="text-text-muted mb-6 leading-relaxed">
          Hodon necesita una base de datos PostgreSQL para funcionar. En tu panel de Vercel,
          agrega la variable de entorno{" "}
          <code className="font-mono text-accent bg-surface px-1.5 py-0.5 rounded">
            DATABASE_URL
          </code>{" "}
          apuntando a tu base de datos.
        </p>
        <div className="bg-surface border border-border rounded-xl p-6 text-left text-sm space-y-3 mb-6">
          <p className="font-semibold text-text">Opción recomendada: Neon (gratis)</p>
          <ol className="space-y-2 text-text-muted list-decimal pl-4">
            <li>Ve a neon.tech y crea un proyecto gratis</li>
            <li>Copia el connection string (postgresql://...)</li>
            <li>
              En Vercel → Settings → Environment Variables, agrega{" "}
              <code className="font-mono text-accent">DATABASE_URL</code>
            </li>
            <li>Re-deploy el proyecto</li>
          </ol>
        </div>
        <p className="text-xs text-text-muted">
          También necesitas:{" "}
          <code className="font-mono text-accent">AUTH_SECRET</code> (string random 32+ chars) y{" "}
          <code className="font-mono text-accent">NEXT_PUBLIC_APP_URL</code> (tu URL de Vercel).
        </p>
      </div>
    </div>
  );
}
