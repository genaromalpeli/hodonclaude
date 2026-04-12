"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [accessForm, setAccessForm] = useState({ email: "", role: "", reason: "" });
  const [accessStatus, setAccessStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleAccessRequest(e: React.FormEvent) {
    e.preventDefault();
    setAccessStatus("loading");
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accessForm),
      });
      if (res.ok) {
        setAccessStatus("done");
      } else {
        setAccessStatus("error");
      }
    } catch {
      setAccessStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-background text-text">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight text-accent-glow">
            HOD<span className="text-white">ON</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="text-sm bg-accent hover:bg-accent-dim text-white px-4 py-1.5 rounded-md transition-colors font-medium"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full mb-8 font-mono uppercase tracking-widest">
          Motor de IA + Laboratorio de Investigación
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
          La frontera del conocimiento
          <br />
          <span className="text-accent">no se contempla.</span>
          <br />
          Se opera.
        </h1>
        <p className="text-lg md:text-xl text-text-dim max-w-2xl mb-10 leading-relaxed">
          Hodon es un motor de IA + laboratorio que convierte investigación y señales emergentes
          en hipótesis accionables, experimentos y prototipos — con rigor, no con humo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-accent hover:bg-accent-dim text-white font-semibold px-8 py-3 rounded-lg transition-colors text-base"
          >
            Empezar gratis
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center border border-border hover:border-border-2 text-text-dim hover:text-text px-8 py-3 rounded-lg transition-colors text-base"
          >
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* PROMISE IN 3 */}
      <section className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-accent font-mono uppercase tracking-widest mb-10">
            La promesa en 3 pasos
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Ingresa señales",
                desc: "Importa papers de OpenAlex, sube PDFs, pega URLs o formula preguntas. Hodon extrae la estructura de conocimiento.",
              },
              {
                n: "02",
                title: "Genera análisis riguroso",
                desc: "Hodon produce 12 secciones: principios, hipótesis, red team, experimentos clasificados por horizonte y recomendación GO/NO-GO.",
              },
              {
                n: "03",
                title: "Opera y rastrea",
                desc: "Ejecuta experimentos con métricas de éxito claras. Registra aprendizajes. Itera con evidencia, no con intuición.",
              },
            ].map((item) => (
              <div key={item.n} className="group">
                <div className="text-4xl font-bold text-border-2 group-hover:text-accent/30 transition-colors mb-4 font-mono">
                  {item.n}
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ ES HODON */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <p className="text-xs text-accent font-mono uppercase tracking-widest mb-3">
          Qué es Hodon
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Motor + Laboratorio.
          <br />
          <span className="text-text-dim font-normal">Dos capas, una dirección.</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Motor de IA</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Convierte inputs (papers, preguntas, documentos) en análisis estructurado: mapas
              de conceptos, cuadrantes epistémicos, supuestos críticos y primeros principios.
              La IA no adivina — razona con evidencia.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-accent text-xl">🔬</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Laboratorio</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Cada output incluye un plan de experimentos por horizonte (48h, 2-4 semanas,
              8-12 semanas) con métricas de éxito y costos estimados. Rastrea resultados y
              convierte aprendizajes en iteraciones.
            </p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-accent font-mono uppercase tracking-widest mb-3">
            Cómo funciona
          </p>
          <h2 className="text-3xl font-bold mb-12">Del paper al prototipo en horas.</h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                label: "Importa de OpenAlex",
                desc: "Busca cualquier paper científico en la base de datos de 250M+ works. Un clic lo convierte en input de Hodon.",
              },
              {
                step: "2",
                label: "Configura dominio y objetivo",
                desc: "Selecciona el dominio (AI, Biotech, Clima...) y tu objetivo: explorar, validar, diseñar experimento o encontrar producto.",
              },
              {
                step: "3",
                label: "Genera el output Hodon",
                desc: "12 secciones estructuradas en segundos: desde el one-liner hasta la recomendación final GO / NO-GO / NEEDS DATA.",
              },
              {
                step: "4",
                label: "Opera en el tracker",
                desc: "Crea experimentos, registra outcomes, aprendizajes y próximos pasos. El conocimiento se acumula, no se pierde.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <div className="font-semibold text-text mb-1">{item.label}</div>
                  <div className="text-text-muted text-sm">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE OUTPUT PREVIEW */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <p className="text-xs text-accent font-mono uppercase tracking-widest mb-3">
          Ejemplo de output
        </p>
        <h2 className="text-3xl font-bold mb-10">Estructura de un análisis Hodon.</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger/60"></div>
            <div className="w-3 h-3 rounded-full bg-warning/60"></div>
            <div className="w-3 h-3 rounded-full bg-success/60"></div>
            <span className="text-text-muted text-xs ml-2 font-mono">output.hodon</span>
          </div>
          <div className="p-6 space-y-4 text-sm">
            {[
              { key: "one_liner", label: "One-liner", preview: "Síntesis ejecutiva en una oración." },
              { key: "quadrants", label: "Cuadrantes epistémicos", preview: "Hechos / Inferencias / Hipótesis / Especulación." },
              { key: "critical_assumptions", label: "Supuestos críticos", preview: "5+ supuestos con confianza alta / media / baja." },
              { key: "red_team", label: "Red Team", preview: "10 modos de fallo + pruebas de falsificación." },
              { key: "experiment_plan", label: "Plan de experimentos", preview: "48h · 2-4 semanas · 8-12 semanas — métricas y costos." },
              { key: "final_recommendation", label: "Recomendación final", preview: "GO · NO-GO · NEEDS DATA + rationale." },
            ].map((section) => (
              <div key={section.key} className="flex gap-4 items-start p-3 rounded-lg hover:bg-background/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                <div>
                  <span className="font-semibold text-text">{section.label}</span>
                  <span className="text-text-muted ml-2">{section.preview}</span>
                </div>
              </div>
            ))}
            <div className="text-text-muted text-xs pl-6 pt-2">+ 6 secciones más incluidas en cada output...</div>
          </div>
        </div>
      </section>

      {/* PARA QUIÉN */}
      <section className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-accent font-mono uppercase tracking-widest mb-3">
            Para quién
          </p>
          <h2 className="text-3xl font-bold mb-10">Construido para operadores del conocimiento.</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { role: "Founders", icon: "🚀", desc: "Valida ideas antes de invertir 18 meses en el equipo equivocado." },
              { role: "Product Managers", icon: "📋", desc: "Convierte señales de mercado en roadmap con evidencia." },
              { role: "Investigadores", icon: "🔭", desc: "Acelera síntesis de literatura y genera hipótesis falsificables." },
              { role: "Estrategas", icon: "♟", desc: "Mapea incertidumbre, escenarios y oportunidades accionables." },
            ].map((p) => (
              <div key={p.role} className="bg-background border border-border rounded-xl p-5">
                <div className="text-2xl mb-3">{p.icon}</div>
                <div className="font-semibold text-text mb-2">{p.role}</div>
                <div className="text-text-muted text-sm">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPIOS */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <p className="text-xs text-accent font-mono uppercase tracking-widest mb-3">
          Principios
        </p>
        <h2 className="text-3xl font-bold mb-10">Rigor, no humo.</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { title: "Falsificabilidad primero", desc: "Cada hipótesis incluye un test de falsificación. Sin él, no es ciencia — es storytelling." },
            { title: "Horizontes de acción", desc: "48h para lo urgente, 12 semanas para lo transformador. El pensamiento sin fecha de vencimiento no es útil." },
            { title: "Incertidumbre explícita", desc: "Etiquetamos la confianza de cada supuesto. La deshonestidad epistémica es el error más caro." },
            { title: "Evidencia > intuición", desc: "El red team existe para destruir la idea antes de que el mercado lo haga. Asumimos que estamos equivocados." },
          ].map((p) => (
            <div key={p.title} className="flex gap-4">
              <div className="w-1 bg-accent/40 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-semibold text-text mb-1">{p.title}</div>
                <div className="text-text-muted text-sm leading-relaxed">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL + ACCESS REQUEST FORM */}
      <section className="py-24 px-6 bg-surface border-y border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para operar la frontera?
          </h2>
          <p className="text-text-muted mb-10">
            Crea tu cuenta ahora o solicita acceso anticipado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-accent hover:bg-accent-dim text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Crear cuenta gratis
            </Link>
          </div>

          {/* Access request form */}
          <div className="bg-background border border-border rounded-xl p-8 text-left">
            <h3 className="text-lg font-semibold mb-1">Pedir acceso anticipado</h3>
            <p className="text-text-muted text-sm mb-6">
              Para organizaciones que quieren acceso prioritario y onboarding dedicado.
            </p>
            {accessStatus === "done" ? (
              <div className="text-success text-sm font-medium py-4 text-center">
                ¡Solicitud enviada! Nos pondremos en contacto contigo pronto.
              </div>
            ) : (
              <form onSubmit={handleAccessRequest} className="space-y-4">
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={accessForm.email}
                  onChange={(e) => setAccessForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm"
                />
                <select
                  value={accessForm.role}
                  onChange={(e) => setAccessForm((f) => ({ ...f, role: e.target.value }))}
                  required
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text focus:border-accent focus:outline-none text-sm"
                >
                  <option value="">Selecciona tu rol...</option>
                  <option value="FOUNDER">Founder</option>
                  <option value="PM">Product Manager</option>
                  <option value="RESEARCHER">Investigador</option>
                  <option value="OTHER">Otro</option>
                </select>
                <textarea
                  placeholder="¿Para qué quieres usar Hodon?"
                  value={accessForm.reason}
                  onChange={(e) => setAccessForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-text-muted focus:border-accent focus:outline-none text-sm resize-none"
                />
                {accessStatus === "error" && (
                  <p className="text-danger text-sm">Error al enviar. Intenta de nuevo.</p>
                )}
                <button
                  type="submit"
                  disabled={accessStatus === "loading"}
                  className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {accessStatus === "loading" ? "Enviando..." : "Solicitar acceso"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold text-accent-glow">
            HOD<span className="text-white">ON</span>
          </span>
          <p className="text-text-muted text-sm">
            La frontera del conocimiento no se contempla. Se opera.
          </p>
          <div className="flex gap-6 text-sm text-text-muted">
            <Link href="/login" className="hover:text-text transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-text transition-colors">
              Registro
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
