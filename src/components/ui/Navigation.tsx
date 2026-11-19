import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLabels } from "./i18n";
import { IconCheck, IconChevronRight } from "./icons";

/* ── Breadcrumb ────────────────────────────────────────── */

export type Crumb = { label: ReactNode; href?: string; onClick?: () => void };

/** Ruta de navegación; el último elemento es la página actual. Colapsa el centro con `max`. */
export function Breadcrumb({ items, max = 4, className }: { items: Crumb[]; max?: number; className?: string }) {
  const L = useLabels();
  const shown: (Crumb | "…")[] = items.length > max ? [items[0], "…", ...items.slice(-(max - 2))] : items;
  return (
    <nav aria-label={L.breadcrumb} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-body whitespace-nowrap text-ink-3">
        {shown.map((c, i) => {
          const last = i === shown.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <IconChevronRight size={12} className="shrink-0" aria-hidden />}
              <li className={cn("min-w-0", last ? "truncate font-medium text-ink" : "shrink-0")} aria-current={last ? "page" : undefined}>
                {c === "…" ? (
                  <span aria-hidden>…</span>
                ) : last || (!c.href && !c.onClick) ? (
                  c.label
                ) : c.href ? (
                  <a href={c.href} className="rounded-[4px] transition-colors hover:text-ink">
                    {c.label}
                  </a>
                ) : (
                  <button type="button" onClick={c.onClick} className="rounded-[4px] transition-colors hover:text-ink">
                    {c.label}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Pagination ────────────────────────────────────────── */

/** Páginas a mostrar: siempre primera, última y vecinas de la actual; huecos como null. */
export function pageRange(page: number, total: number, siblings = 1): (number | null)[] {
  const set = new Set([1, total]);
  for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= total) set.add(p);
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] === 2) out.push(p - 1);
    else if (i && p - sorted[i - 1] > 2) out.push(null);
    out.push(p);
  });
  return out;
}

/** Paginación numerada (1-based). `compact` muestra solo «Página X de Y» con flechas. */
export function Pagination({
  page,
  total,
  onChange,
  compact = false,
  className,
}: {
  page: number;
  /** número de páginas */
  total: number;
  onChange: (page: number) => void;
  compact?: boolean;
  className?: string;
}) {
  const L = useLabels();
  if (total <= 1) return null;
  const btn = "inline-flex h-7 min-w-7 items-center justify-center rounded-control px-2 text-body tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label={L.page} className={cn("flex items-center gap-1", className)}>
      <button type="button" className={cn(btn, "text-ink-2 hover:bg-hover-2")} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={L.previous}>
        <IconChevronRight size={14} className="rotate-180" />
      </button>
      {compact ? (
        <span className="px-1.5 text-meta text-ink-2 tabular-nums">
          {L.page} {page} {L.of} {total}
        </span>
      ) : (
        pageRange(page, total).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-ink-3" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
              className={cn(btn, p === page ? "bg-surface font-medium text-ink shadow-btn" : "text-ink-2 hover:bg-hover-2")}
            >
              {p}
            </button>
          ),
        )
      )}
      <button type="button" className={cn(btn, "text-ink-2 hover:bg-hover-2")} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={L.next}>
        <IconChevronRight size={14} />
      </button>
    </nav>
  );
}

/* ── Stepper ───────────────────────────────────────────── */

/** Pasos de un proceso (onboarding, checkout). `current` es 0-based; los anteriores se marcan hechos. */
export function Stepper({
  steps,
  current,
  onStepClick,
  orientation = "horizontal",
  className,
}: {
  steps: { label: ReactNode; description?: ReactNode }[];
  current: number;
  /** permite volver a pasos completados */
  onStepClick?: (index: number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const L = useLabels();
  const vertical = orientation === "vertical";
  return (
    <ol className={cn("flex", vertical ? "flex-col gap-0" : "items-start gap-2", className)}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const clickable = onStepClick && i < current;
        const Dot = (
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-micro font-medium tabular-nums transition-[background-color,box-shadow,color] duration-300",
              state === "done" && "bg-accent text-white",
              state === "current" && "bg-surface text-accent-ink shadow-[0_0_0_1.5px_var(--accent),0_0_0_4px_var(--accent-tint)]",
              state === "todo" && "bg-surface text-ink-3 shadow-btn",
            )}
          >
            {state === "done" ? <IconCheck size={12} strokeWidth={2.6} /> : i + 1}
          </span>
        );
        const text = (
          <span className="flex min-w-0 flex-col">
            <span className={cn("text-body font-medium", state === "todo" ? "text-ink-3" : "text-ink")}>{s.label}</span>
            {s.description && <span className="text-meta text-ink-3">{s.description}</span>}
          </span>
        );
        return (
          <li
            key={i}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("flex min-w-0", vertical ? "gap-3" : "flex-1 flex-col gap-2 sm:flex-row sm:items-center")}
          >
            <span className={cn("flex", vertical ? "flex-col items-center" : "min-w-0 flex-1 items-center gap-2")}>
              {clickable ? (
                <button type="button" onClick={() => onStepClick(i)} aria-label={`${L.step} ${i + 1}`} className="rounded-full">
                  {Dot}
                </button>
              ) : (
                Dot
              )}
              {!vertical && <span className="hidden min-w-0 sm:flex">{text}</span>}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    vertical ? "my-1 min-h-6 w-px flex-1" : "ml-1 h-px min-w-4 flex-1",
                    i < current ? "bg-accent" : "bg-line-strong",
                  )}
                />
              )}
            </span>
            {vertical && <span className="pb-5">{text}</span>}
          </li>
        );
      })}
    </ol>
  );
}
