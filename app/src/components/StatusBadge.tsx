import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "danger" | "info";

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="empty-state">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}

export function SectionHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {eyebrow ? <p>{eyebrow}</p> : null}
      </div>
    </div>
  );
}

