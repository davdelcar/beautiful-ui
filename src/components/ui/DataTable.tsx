import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./Choice";

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
  className?: string;
}) {
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

  const cell = "flex min-w-0 items-center px-3 py-2";

  return (
    <div className={cn("overflow-hidden rounded-card bg-surface shadow-card", className)}>
      {toolbar && <div className="primitive-card-bar flex items-center justify-between gap-3 border-b border-line">{toolbar}</div>}
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }} role="region" aria-label="Tabla" tabIndex={0}>
        <div style={{ minWidth }}>
          <div
            className="grid border-b border-[var(--grid-line)] bg-inset text-[12.5px] font-medium text-ink-2"
            style={{ gridTemplateColumns: template }}
          >
            {selectable && (
              <span className={cn(cell, "justify-center")}>
                <Checkbox
                  checked={allOn}
                  indeterminate={!allOn && someOn}
                  onChange={(on) => onSelectedChange!(on ? new Set(visible.map(rowKey)) : new Set())}
                />
              </span>
            )}
            {columns.map((c) => (
              <span key={c.key} className={cn(cell, c.align === "right" && "justify-end")}>
                {c.header}
              </span>
            ))}
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
                <div className="overflow-hidden">
                  <div
                    className={cn(
                      "grid border-b border-[var(--grid-line)] text-[13px] text-ink transition-colors duration-100",
                      on ? "bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))]" : "hover:bg-hover",
                    )}
                    style={{ gridTemplateColumns: template }}
                  >
                    {selectable && (
                      <span className={cn(cell, "justify-center")}>
                        <Checkbox checked={on} onChange={(v) => toggle(key, v)} />
                      </span>
                    )}
                    {columns.map((c) => (
                      <span key={c.key} className={cn(cell, c.align === "right" && "justify-end tabular-nums")}>
                        {c.render(row)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {footer && <div className="primitive-card-bar flex items-center justify-between gap-2 text-[12px] text-ink-3">{footer}</div>}
    </div>
  );
}
