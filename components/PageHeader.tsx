/** One masthead shape for every screen, so the app reads as one product. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5 pt-1">
      <h1 className="text-[1.75rem] font-extrabold leading-tight">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
