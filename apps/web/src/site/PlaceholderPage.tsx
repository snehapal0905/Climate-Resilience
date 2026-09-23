import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Intentionally simple page for routes whose features are built in later steps. */
export function PlaceholderPage({ eyebrow = "Coming soon", title, description, children }: Props) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">{eyebrow}</p>
      <h1 className="max-w-3xl font-lp-display text-[40px] leading-[1.08] tracking-[-0.02em] text-lp-ink sm:text-[56px]">{title}</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">{description}</p>
      {children && <div className="mt-10">{children}</div>}
    </section>
  );
}
