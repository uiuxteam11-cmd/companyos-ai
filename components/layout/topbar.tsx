"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    if (!supabase) {
      router.push("/login");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
