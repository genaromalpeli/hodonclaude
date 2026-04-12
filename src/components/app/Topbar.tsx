"use client";

import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-border bg-surface/50 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="text-xs text-text-muted hover:text-text border border-border hover:border-border-2 px-3 py-1.5 rounded-md transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
