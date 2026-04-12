"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OTHER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrarse.");
      } else {
        router.push("/app");
        router.refresh();
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-1">Crear cuenta</h1>
      <p className="text-text-muted text-sm mb-8">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Ingresar
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-dim mb-1.5">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="Tu nombre"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-dim mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            placeholder="tu@email.com"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-dim mb-1.5">Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-dim mb-1.5">Rol</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text focus:border-accent focus:outline-none text-sm"
          >
            <option value="FOUNDER">Founder</option>
            <option value="PM">Product Manager</option>
            <option value="RESEARCHER">Investigador</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
