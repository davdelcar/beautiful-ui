import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./Choice";
import { useLabels } from "./i18n";
import { IconChevronDown } from "./icons";

export type SortState = { key: string; dir: "asc" | "desc" } | null;

/* Tabla genérica con la piel de FilterTable: card `shadow-card`, rejilla con
 * --grid-line, cabecera 12.5px ink-2, filas 13px con hover y colapso animado
 * cuando una fila se filtra. Para la experiencia CRM completa usa RecordsTable. */

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** ancho de la pista en grid-template-columns (p. ej. "minmax(0,1.3fr)" o "120px") */
  width?: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** valor para ordenar; si existe, la cabecera es clicable */
  sortValue?: (row: T) => string | number | null | undefined;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isVisible = () => true,
  selected,
  onSelectedChange,
  toolbar,
  footer,
  minWidth = 560,
  sort: sortProp,
  onSortChange,
  onRowClick,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** filas ocultas se colapsan con la animación de FilterTable */
  isVisible?: (row: T) => boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  minWidth?: number;
  /** orden controlado (si no, la tabla lo gestiona sola) */
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** fila clicable (abrir detalle en un Sheet, navegar…) */
  onRowClick?: (row: T) => void;
  /** contenido cuando no hay filas visibles (p. ej. <EmptyState/>) */
  empty?: ReactNode;
  className?: string;
}) {
  const L = useLabels();
  const [sortInner, setSortInner] = useState<SortState>(null);
  const sort = sortProp !== undefined ? sortProp : sortInner;
  const setSort = (next: SortState) => (onSortChange ? onSortChange(next) : setSortInner(next));
  const sortCol = sort && columns.find((c) => c.key === sort.key && c.sortValue);
  if (sortCol) {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    rows = [...rows].sort((a, b) => {
      const va = sortCol.sortValue!(a);
      const vb = sortCol.sortValue!(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb));
      return sort!.dir === "asc" ? c : -c;
    });
  }
  const selectable = !!selected && !!onSelectedChange;
  const template = [selectable ? "40px" : null, ...columns.map((c) => c.width ?? "minmax(0,1fr)")].filter(Boolean).join(" ");
  const visible = rows.filter(isVisible);
  const allOn = selectable && visible.length > 0 && visible.every((r) => selected!.has(rowKey(r)));
  const someOn = selectable && visible.some((r) => selected!.has(rowKey(r)));

  const toggle = (key: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    onSelectedChange!(next);
  };

  /* los hijos pueden encogerse: un texto largo se trunca en su celda en vez de invadir la siguiente */
  const cell = "flex min-w-0 items-center px-3 py-2 [&>*]:min-w-0";

  return (
    <div className={cn("overflow-hidden rounded-card bg-surface shadow-card", className)}>
      {toolbar && <div className="primitive-card-bar flex items-center justify-between gap-3 border-b border-line">{toolbar}</div>}
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }} role="region" aria-label="Tabla" tabIndex={0}>
        <div style={{ minWidth }} role="table" aria-rowcount={visible.length + 1}>
          <div
            role="row"
            className="grid border-b border-[var(--grid-line)] bg-inset text-label font-medium text-ink-2"
            style={{ gridTemplateColumns: template }}
          >
            {selectable && (
              <span role="columnheader" className={cn(cell, "justify-center")}>
                <Checkbox
                  aria-label="Seleccionar todo"
                  checked={allOn}
                  indeterminate={!allOn && someOn}
                  onChange={(on) => onSelectedChange!(on ? new Set(visible.map(rowKey)) : new Set())}
                />
              </span>
            )}
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <span
                  key={c.key}
                  role="columnheader"
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(cell, c.align === "right" && "justify-end")}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      title={active && sort!.dir === "asc" ? L.sortDesc : L.sortAsc}
                      onClick={() => setSort(!active ? { key: c.key, dir: "asc" } : sort!.dir === "asc" ? { key: c.key, dir: "desc" } : null)}
                      className={cn("-mx-1 inline-flex items-center gap-1 rounded-chip px-1 transition-colors hover:text-ink", active && "text-ink", c.align === "right" && "flex-row-reverse")}
                    >
                      {c.header}
                      <IconChevronDown
                        size={12}
                        className={cn("transition-[transform,opacity] duration-200", active ? "opacity-100" : "opacity-0 group-hover:opacity-50")}
                        style={{ transform: active && sort!.dir === "asc" ? "rotate(180deg)" : undefined }}
                      />
                    </button>
                  ) : (
                    c.header
                  )}
                </span>
              );
            })}
          </div>
          {rows.map((row) => {
            const key = rowKey(row);
            const shown = isVisible(row);
            const on = selectable && selected!.has(key);
            return (
              <div
                key={key}
                className="grid transition-[grid-template-rows,opacity] duration-300"
                style={{ gridTemplateRows: shown ? "1fr" : "0fr", opacity: shown ? 1 : 0, transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
              >
                <div className="overflow-hidden" inert={!shown || undefined}>
                  <div
                    role="row"
                    className={cn(
                      "grid border-b border-[var(--grid-line)] text-body text-ink transition-colors duration-100",
                      on ? "bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))]" : "hover:bg-hover",
                      onRowClick && "cursor-pointer",
                    )}
                    style={{ gridTemplateColumns: template }}
                    onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest("button,a,input,label") && onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === "Enter" && e.target === e.currentTarget && onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                  >
                    {selectable && (
                      <span role="cell" className={cn(cell, "justify-center")}>
                        <Checkbox aria-label="Seleccionar fila" checked={on} onChange={(v) => toggle(key, v)} />
                      </span>
                    )}
                    {columns.map((c) => (
                      <span key={c.key} role="cell" className={cn(cell, c.align === "right" && "justify-end tabular-nums")}>
                        {c.render(row)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {empty && visible.length === 0 && <div style={{ animation: "fade-in 200ms ease-out both" }}>{empty}</div>}
        </div>
      </div>
      {footer && <div className="primitive-card-bar flex items-center justify-between gap-2 text-meta text-ink-3">{footer}</div>}
    </div>
  );
}
