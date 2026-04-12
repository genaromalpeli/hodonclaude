"use client";

import { useEffect, useState } from "react";

interface Settings {
  id: string;
  openAlexApiKey: string | null;
  hasApiKey: boolean;
  exportPreference: "MD" | "PDF";
}

interface RateLimitData {
  tier?: string;
  is_free_tier?: boolean;
  oa_status?: string;
  remaining?: number;
  limit?: number;
  reset_time?: string;
  hasApiKey: boolean;
  error?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitData | null>(null);
  const [testingRate, setTestingRate] = useState(false);
  const [exportPref, setExportPref] = useState<"MD" | "PDF">("MD");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { settings?: Settings }) => {
        if (d.settings) {
          setSettings(d.settings);
          setExportPref(d.settings.exportPreference);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(apiKeyInput !== "" && { openAlexApiKey: apiKeyInput }),
          exportPreference: exportPref,
        }),
      });
      if (res.ok) {
        const d = await res.json() as { settings: Settings };
        setSettings(d.settings);
        setApiKeyInput("");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function testRateLimit() {
    setTestingRate(true);
    setRateLimit(null);
    try {
      const res = await fetch("/api/openalex/rate-limit");
      const data = await res.json() as RateLimitData;
      setRateLimit(data);
    } finally {
      setTestingRate(false);
    }
  }

  async function clearApiKey() {
    if (!confirm("¿Eliminar API key guardada?")) return;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openAlexApiKey: "" }),
    });
    setSettings((s) => s ? { ...s, hasApiKey: false, openAlexApiKey: null } : s);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Ajustes</h1>
      <p className="text-text-muted text-sm mb-8">Configura tu cuenta e integraciones.</p>

      <form onSubmit={handleSave} className="space-y-8">
        {/* OpenAlex API */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text mb-1">OpenAlex API Key</h2>
          <p className="text-text-muted text-xs mb-5">
            Desde Feb 2026, OpenAlex requiere API key. Obtén la tuya en{" "}
            <span className="text-accent font-mono">openalex.org</span>.
          </p>

          {settings?.hasApiKey && (
            <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-lg mb-4">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <div className="flex-1">
                <span className="text-success text-xs font-medium">API key configurada</span>
                <span className="text-text-muted text-xs ml-2 font-mono">
                  {settings.openAlexApiKey}
                </span>
              </div>
              <button
                type="button"
                onClick={clearApiKey}
                className="text-xs text-text-muted hover:text-danger"
              >
                Eliminar
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                {settings?.hasApiKey ? "Nueva API key (reemplaza la actual)" : "API Key"}
              </label>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Pega tu API key aquí"
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="border border-border rounded-lg px-3 text-xs text-text-muted hover:text-text transition-colors"
                >
                  {showKey ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* Rate limit test */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={testRateLimit}
                disabled={testingRate}
                className="text-xs border border-border hover:border-accent/40 hover:text-accent text-text-muted px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                {testingRate ? "Probando..." : "Probar conexión / ver límites"}
              </button>
            </div>

            {rateLimit && (
              <div className={`p-4 rounded-lg border text-sm ${rateLimit.error ? "bg-danger/5 border-danger/30" : "bg-success/5 border-success/20"}`}>
                {rateLimit.error ? (
                  <div>
                    <div className="text-danger font-medium mb-1">Error de conexión</div>
                    <div className="text-text-muted text-xs">{rateLimit.error}</div>
                    {!rateLimit.hasApiKey && (
                      <div className="text-warning text-xs mt-2">
                        No tienes API key configurada. Guarda una primero.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-success font-medium mb-2">Conexión exitosa</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {rateLimit.tier && (
                        <div>
                          <span className="text-text-muted">Tier: </span>
                          <span className="text-text font-mono">{rateLimit.tier}</span>
                        </div>
                      )}
                      {rateLimit.remaining !== undefined && (
                        <div>
                          <span className="text-text-muted">Remaining: </span>
                          <span className="text-text font-mono">{rateLimit.remaining}</span>
                        </div>
                      )}
                      {rateLimit.limit !== undefined && (
                        <div>
                          <span className="text-text-muted">Limit: </span>
                          <span className="text-text font-mono">{rateLimit.limit}</span>
                        </div>
                      )}
                      {rateLimit.reset_time && (
                        <div>
                          <span className="text-text-muted">Reset: </span>
                          <span className="text-text font-mono">{rateLimit.reset_time}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mt-2 font-mono">
                      Raw: {JSON.stringify(rateLimit, null, 0).slice(0, 200)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export preference */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text mb-1">Preferencia de exportación</h2>
          <p className="text-text-muted text-xs mb-4">
            Formato por defecto al exportar outputs.
          </p>
          <div className="flex gap-3">
            {(["MD", "PDF"] as const).map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => setExportPref(pref)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  exportPref === pref
                    ? "bg-accent/10 border-accent text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
          {exportPref === "PDF" && (
            <p className="text-xs text-warning mt-2">
              PDF export: usa la función de impresión del navegador (Ctrl+P) desde el output viewer.
            </p>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            {saving ? "Guardando..." : "Guardar ajustes"}
          </button>
          {saved && <span className="text-success text-sm">¡Guardado!</span>}
        </div>
      </form>

      {/* Info */}
      <div className="mt-8 p-4 bg-surface border border-border rounded-xl text-xs text-text-muted space-y-2">
        <div className="font-semibold text-text-dim">Notas MVP</div>
        <div>· Las API keys se almacenan en texto plano en la base de datos (TODO: cifrar en producción).</div>
        <div>· El almacenamiento de archivos es local en <code className="font-mono">/uploads</code> (TODO: migrar a S3).</div>
        <div>· El generador de outputs es determinístico (TODO: conectar LLM).</div>
      </div>
    </div>
  );
}
