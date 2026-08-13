"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Workspace", href: "/workspace" },
  { label: "Agents", href: "/agents" },
  { label: "Tasks", href: "/agents" },
  { label: "Approvals", href: "/agents" },
  { label: "Intelligence", href: "/dashboard?feature=intelligence", tag: "Soon" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-semibold text-indigo-300">
          C
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-200 uppercase">CompanyOS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href.replace(/\?.*$/, ""));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-indigo-500/15 text-white" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.tag ? (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  {item.tag}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
