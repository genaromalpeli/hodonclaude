"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("done");
      } else {
        setError(data.error || "Error.");
        setStatus("error");
      }
    } catch {
      setError("Error de red.");
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <p className="text-danger text-sm">
        Token inválido. Solicita un nuevo enlace de recuperación.
      </p>
    );
  }

  return (
    <>
      {status === "done" ? (
        <div className="space-y-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm">
            Contraseña actualizada exitosamente.
          </div>
          <Link href="/login" className="block text-accent text-sm hover:underline text-center">
            Ir al login →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-dim mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-text-dim mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Repite la contraseña"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {status === "loading" ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1">Nueva contraseña</h1>
      <p className="text-text-muted text-sm mb-8">
        <Link href="/login" className="text-accent hover:underline">
          ← Volver al login
        </Link>
      </p>
      <Suspense fallback={<div className="text-text-muted text-sm">Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
