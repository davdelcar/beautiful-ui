import { useRef, type CSSProperties, type ReactNode } from "react";
import { Accordion as SDKAccordion, AccordionHeader, AccordionItem as SDKAccordionItem, AccordionPanel, AccordionTrigger } from "@ui-sdk/react/accordion";
import { Resizable as SDKResizable, ResizableHandle as SDKResizableHandle, ResizablePanel as SDKResizablePanel } from "@ui-sdk/react/resizable";
import { Collapsible as SDKCollapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { cn } from "@/lib/utils";
import { useRovingFocus } from "./floating";
import { IconChevronDown } from "./icons";
import { useLabels } from "./i18n";

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
  return (
    <SDKCollapsible className={className} defaultOpen={defaultOpen}>
      <CollapsibleTrigger
        className="flex items-center gap-1.5 rounded-chip text-body font-medium text-ink-2 transition-colors hover:text-ink"
      >
        {({ open }) => (
          <>
            <IconChevronDown size={13} className="transition-transform duration-200" style={{ transform: open ? undefined : "rotate(-90deg)" }} />
            {title}
          </>
        )}
      </CollapsibleTrigger>
      <CollapsiblePanel keepMounted className="bui-collapse" render={(props, state) => <div {...props} inert={!state.open || undefined} />}>
        <div className="pt-2">{children}</div>
      </CollapsiblePanel>
    </SDKCollapsible>
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
  const root = useRef<HTMLDivElement>(null);
  const onKeyDown = useRovingFocus(root, true, ":scope > * > h3 > button", false);
  return (
    <SDKAccordion ref={root} onKeyDown={onKeyDown} defaultValue={defaultOpen} multiple={multiple} keepMounted className={cn("divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card", className)}>
      {items.map((it) => (
        <SDKAccordionItem key={it.value} value={it.value}>
          <AccordionHeader>
            <AccordionTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left text-body font-medium text-ink transition-colors hover:bg-inset">
              {({ open }) => (
                <>
                  <span className="min-w-0 flex-1">{it.title}</span>
                  {it.meta && <span className="text-meta font-normal text-ink-3">{it.meta}</span>}
                  <IconChevronDown size={14} className="shrink-0 text-ink-3 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : undefined }} />
                </>
              )}
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel className="bui-collapse" render={(props, state) => <div {...props} inert={!state.open || undefined} />}>
            <div className="px-4 pb-4 text-body text-ink-2">{it.content}</div>
          </AccordionPanel>
        </SDKAccordionItem>
      ))}
    </SDKAccordion>
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

/* ── Resizable ─────────────────────────────────────────── */

/**
 * Paneles redimensionables sobre UI SDK (chat junto al documento, lista y
 * detalle, editor y terminal): arrastre, flechas (Mayús = paso largo), Inicio/Fin,
 * Intro o doble clic para plegar un panel `collapsible`. `autoSaveId` recuerda
 * el reparto. Dale altura al grupo; los tamaños van en % o con unidad ("240px").
 */
export function Resizable({
  orientation = "horizontal",
  autoSaveId,
  onLayoutCommit,
  className,
  children,
}: {
  orientation?: "horizontal" | "vertical";
  /** guarda el reparto en localStorage con esta clave */
  autoSaveId?: string;
  onLayoutCommit?: (layout: number[]) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SDKResizable
      orientation={orientation}
      autoSaveId={autoSaveId}
      onLayoutCommit={onLayoutCommit && ((l: number[]) => onLayoutCommit(l))}
      className={cn("flex min-h-0 data-[orientation=vertical]:flex-col", className)}
    >
      {children}
    </SDKResizable>
  );
}

export function ResizablePanel({
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  collapsedSize,
  id,
  className,
  children,
}: {
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  collapsible?: boolean;
  collapsedSize?: number | string;
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <SDKResizablePanel
      id={id}
      defaultSize={defaultSize as never}
      minSize={minSize as never}
      maxSize={maxSize as never}
      collapsible={collapsible}
      collapsedSize={collapsedSize as never}
      className={cn("min-h-0 min-w-0 overflow-auto", className)}
    >
      {children}
    </SDKResizablePanel>
  );
}

/** Asa entre paneles: línea `line` de 1px con zona de agarre amplia; acento al arrastrar o con foco. */
export function ResizableHandle({ "aria-label": ariaLabel, className }: { "aria-label"?: string; className?: string }) {
  const L = useLabels();
  return (
    <SDKResizableHandle
      aria-label={ariaLabel ?? L.resize}
      className={cn(
        `bui-ring group/rh relative flex shrink-0 items-center justify-center bg-line outline-none transition-colors duration-150
         data-[orientation=horizontal]:w-px data-[orientation=horizontal]:cursor-col-resize
         data-[orientation=vertical]:h-px data-[orientation=vertical]:cursor-row-resize
         data-hovering:bg-line-strong data-dragging:bg-accent focus-visible:bg-accent data-disabled:cursor-default`,
        className,
      )}
    >
      <span
        aria-hidden
        className={`absolute rounded-full bg-surface shadow-btn opacity-0 transition-opacity duration-150
          group-data-[orientation=horizontal]/rh:h-6 group-data-[orientation=horizontal]/rh:w-1.5
          group-data-[orientation=vertical]/rh:h-1.5 group-data-[orientation=vertical]/rh:w-6
          group-data-hovering/rh:opacity-100 group-data-dragging/rh:opacity-100 group-focus-visible/rh:opacity-100`}
      />
    </SDKResizableHandle>
  );
}
