/**
 * One masthead shape for every screen, so the app reads as one product.
 *
 * `eyebrow` carries the volatile line — today's date, the crop and village —
 * above the title rather than below it, because that context is what tells you
 * the screen is about *your* farm, and it should be read first.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <header className="mb-6 pt-2">
      {eyebrow && (
        <p className="eyebrow mb-2 flex items-center gap-2">{eyebrow}</p>
      )}
      <h1 className="t-title">{title}</h1>
      {subtitle && (
        <p className="t-body mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">{subtitle}</p>
      )}
    </header>
  );
}
