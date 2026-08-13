"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center dark:bg-slate-950">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Error</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          We could not load this page. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Retry
      </button>
    </div>
  );
}
