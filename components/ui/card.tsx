import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel p-5 ${className}`.trim()}>{children}</div>;
}
