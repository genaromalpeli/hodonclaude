"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        if (data.resetUrl) setResetUrl(data.resetUrl);
      } else {
        setError(data.error || "Error.");
        setStatus("error");
      }
    } catch {
      setError("Error de red.");
      setStatus("error");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1">Recuperar contraseña</h1>
      <p className="text-text-muted text-sm mb-8">
        <Link href="/login" className="text-accent hover:underline">
          ← Volver al login
        </Link>
      </p>

      {status === "done" ? (
        <div className="space-y-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm">
            Enlace de recuperación generado.
          </div>
          {resetUrl && (
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-xs text-text-muted mb-2 font-mono uppercase tracking-wider">
                Enlace de reset (solo en desarrollo)
              </p>
              <a
                href={resetUrl}
                className="text-accent text-sm break-all hover:underline"
              >
                {resetUrl}
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-dim mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {status === "loading" ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}
    </div>
  );
}
