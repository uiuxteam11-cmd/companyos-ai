import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center dark:bg-slate-950">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">404</p>
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
      <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Return home
      </Link>
    </div>
  );
}
