import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown, IconSearch } from "./icons";
import { matches, useListNav } from "./listbox";
import { usePopover } from "./Overlay";

const POP = "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both";

/* ── Popover ───────────────────────────────────────────── */

/**
 * Panel flotante genérico (`surface` + `shadow-overlay` + pop-in): filtros,
 * formularios cortos, detalles. Se cierra con clic fuera o Escape.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  width = 280,
  className,
}: {
  /** recibe `open` para pintar el estado del disparador */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  /** contenido, o función que recibe `close` */
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "center" | "end";
  side?: "bottom" | "top";
  width?: number | "trigger";
  className?: string;
}) {
  const { open, setOpen, ref } = usePopover();
  const close = () => setOpen(false);
  return (
    <div ref={ref} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="dialog"
          className={cn(
            "bui-pop absolute z-40 rounded-card bg-surface p-3 text-body text-ink shadow-overlay",
            side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5",
            align === "start" && "left-0",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            width === "trigger" && "right-0 left-0",
            className,
          )}
          style={{
            width: width === "trigger" ? undefined : `min(${width}px, calc(100vw - 32px))`,
            animation: POP,
            transformOrigin: `${side === "bottom" ? "top" : "bottom"} ${align === "end" ? "right" : align === "center" ? "center" : "left"}`,
          }}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

/* ── Combobox ──────────────────────────────────────────── */

export type ComboboxOption<T extends string> = {
  value: T;
  label: string;
  /** texto secundario a la derecha */
  hint?: ReactNode;
  icon?: ReactNode;
  /** términos extra para el buscador */
  keywords?: string[];
  disabled?: boolean;
};

/**
 * Select con buscador: filtra sin tildes, navegación con ↑ ↓ Enter, y
 * `aria-activedescendant` para lectores de pantalla. Misma piel que Select.
 */
export function Combobox<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados",
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: ComboboxOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: ReactNode;
  className?: string;
}) {
  const { open, setOpen, ref } = usePopover();
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value);
  const visible = options.filter((o) => !o.disabled && matches(query, o.label, ...(o.keywords ?? [])));

  const pick = (o: ComboboxOption<T>) => {
    onChange(o.value);
    setOpen(false);
    triggerRef.current?.focus();
  };
  const nav = useListNav(visible, pick);

  const toggle = () => {
    setQuery("");
    const i = visible.findIndex((o) => o.value === value);
    nav.setActive(Math.max(0, i));
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            toggle();
          }
        }}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-control bg-surface pr-2 pl-2.5 text-body
          shadow-btn transition-[background-color,box-shadow] duration-150 hover:bg-inset aria-expanded:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_var(--accent-tint)]"
      >
        <span className={cn("flex min-w-0 items-center gap-2", current ? "text-ink" : "text-ink-3")}>
          {current?.icon && <span className="flex shrink-0 text-ink-3">{current.icon}</span>}
          <span className="truncate">{current?.label ?? placeholder}</span>
        </span>
        <IconChevronDown size={13} className="shrink-0 text-ink-3 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>

      {open && (
        <div
          className="bui-pop absolute top-full right-0 left-0 z-40 mt-1.5 min-w-56 overflow-hidden rounded-card bg-surface shadow-overlay"
          style={{ animation: POP, transformOrigin: "top center" }}
        >
          <div className="flex items-center gap-2 border-b border-line px-2.5">
            <IconSearch size={14} className="shrink-0 text-ink-3" />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={nav.listId}
              aria-activedescendant={nav.activeId}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                nav.setActive(0);
              }}
              onKeyDown={nav.onKeyDown}
              placeholder={searchPlaceholder}
              className="h-9 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none"
            />
          </div>
          <div id={nav.listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {visible.length === 0 && <div className="px-2 py-6 text-center text-meta text-ink-3">{emptyText}</div>}
            {visible.map((o, i) => (
              <div
                key={o.value}
                id={nav.optionId(i)}
                role="option"
                aria-selected={o.value === value}
                onPointerMove={() => nav.setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className={cn(
                  "flex h-8 cursor-pointer items-center gap-2 rounded-chip px-2 text-body text-ink",
                  i === nav.active && "bg-hover-2",
                )}
              >
                {o.icon && <span className="flex shrink-0 text-ink-3">{o.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-meta text-ink-3">{o.hint}</span>}
                <IconCheck size={13} className={cn("shrink-0 text-accent-ink", o.value !== value && "invisible")} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
