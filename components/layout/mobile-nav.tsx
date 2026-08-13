import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      {[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agents", href: "/agents" },
        { label: "Workspace", href: "/workspace" },
        { label: "Settings", href: "/settings" },
      ].map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
