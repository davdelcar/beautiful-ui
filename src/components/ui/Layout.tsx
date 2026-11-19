import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "./icons";

/* ── Separator ─────────────────────────────────────────── */

/** Divisor de 1px (`line`). Con `label`, texto centrado («o continúa con»). */
export function Separator({ orientation = "horizontal", label, className }: { orientation?: "horizontal" | "vertical"; label?: ReactNode; className?: string }) {
  if (orientation === "vertical") return <span role="separator" aria-orientation="vertical" className={cn("w-px self-stretch bg-line", className)} />;
  if (!label) return <hr className={cn("h-px border-0 bg-line", className)} />;
  return (
    <div role="separator" className={cn("flex items-center gap-3 text-meta text-ink-3", className)}>
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────── */

/** Bloque de carga con pulso suave. Dale el tamaño del contenido final para que nada salte. */
export function Skeleton({ className, style, circle = false }: { className?: string; style?: CSSProperties; circle?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("block bg-hover-2", circle ? "rounded-full" : "rounded-chip", className)}
      style={{ animation: "skeleton-pulse 1.6s ease-in-out infinite", ...style }}
    />
  );
}

/** Líneas de texto falsas (la última más corta). */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cn("flex flex-col gap-2", className)} aria-busy>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }} />
      ))}
    </span>
  );
}

/* ── Collapsible / Accordion ───────────────────────────── */

/** Contenido que se pliega con altura animada (grid 0fr → 1fr). */
export function Collapse({ open, children, id, className }: { open: boolean; children: ReactNode; id?: string; className?: string }) {
  return (
    <div id={id} className={cn("bui-collapse", className)} data-open={open} inert={!open || undefined}>
      <div>{children}</div>
    </div>
  );
}

/** Sección plegable con disparador propio. */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-chip text-body font-medium text-ink-2 transition-colors hover:text-ink"
      >
        <IconChevronDown size={13} className="transition-transform duration-200" style={{ transform: open ? undefined : "rotate(-90deg)" }} />
        {title}
      </button>
      <Collapse open={open} id={id}>
        <div className="pt-2">{children}</div>
      </Collapse>
    </div>
  );
}

export type AccordionItem = { value: string; title: ReactNode; content: ReactNode; meta?: ReactNode };

/** Lista de secciones plegables en una card. `multiple` permite varias abiertas. */
export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  className,
}: {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const base = useId();
  const toggle = (v: string) => setOpen((o) => (o.includes(v) ? o.filter((x) => x !== v) : multiple ? [...o, v] : [v]));
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card", className)}>
      {items.map((it) => {
        const isOpen = open.includes(it.value);
        const id = `${base}-${it.value}`;
        return (
          <div key={it.value}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => toggle(it.value)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-body font-medium text-ink transition-colors hover:bg-inset"
              >
                <span className="min-w-0 flex-1">{it.title}</span>
                {it.meta && <span className="text-meta font-normal text-ink-3">{it.meta}</span>}
                <IconChevronDown size={14} className="shrink-0 text-ink-3 transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : undefined }} />
              </button>
            </h3>
            <Collapse open={isOpen} id={id}>
              <div className="px-4 pb-4 text-body text-ink-2">{it.content}</div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

/* ── ScrollArea ────────────────────────────────────────── */

/** Contenedor con scroll y barra fina del sistema; `fade` difumina los bordes. */
export function ScrollArea({
  children,
  className,
  maxHeight,
  fade = false,
}: {
  children: ReactNode;
  className?: string;
  maxHeight?: number | string;
  fade?: boolean;
}) {
  return (
    <div
      tabIndex={0}
      className={cn("overflow-auto overscroll-contain [scrollbar-color:var(--line-strong)_transparent] [scrollbar-width:thin]", className)}
      style={{
        maxHeight,
        maskImage: fade ? "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
