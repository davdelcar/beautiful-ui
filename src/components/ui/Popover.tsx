import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Floating } from "./floating";
import { IconCheck, IconSearch } from "./icons";
import { matches, useListNav } from "./listbox";
import { Chevron, TRIGGER, usePopover } from "./Overlay";
import { useLabels } from "./i18n";

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
  const { open, setOpen, ref, panelRef, focusTrigger } = usePopover();
  const close = () => (setOpen(false), focusTrigger());
  return (
    <div ref={ref} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <Floating
        anchor={ref}
        open={open}
        side={side}
        align={align}
        width={width}
        panelRef={panelRef}
        role="dialog"
        className={cn("overflow-y-auto rounded-card bg-surface p-3 text-body text-ink shadow-overlay", className)}
      >
        {typeof children === "function" ? children(close) : children}
      </Floating>
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
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  id?: string;
  "aria-label"?: string;
  value: T | null;
  onChange: (value: T) => void;
  options: ComboboxOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: ReactNode;
  className?: string;
}) {
  const { open, setOpen, ref, panelRef } = usePopover();
  const L = useLabels();
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
        id={id}
        aria-label={ariaLabel}
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
        className={TRIGGER}
      >
        <span className={cn("flex min-w-0 items-center gap-2", current ? "text-ink" : "text-ink-3")}>
          {current?.icon && <span className="flex shrink-0 text-ink-3">{current.icon}</span>}
          <span className="truncate">{current?.label ?? placeholder ?? L.select}</span>
        </span>
        <Chevron open={open} />
      </button>

      <Floating anchor={ref} open={open} width="trigger" panelRef={panelRef} className="flex min-w-56 flex-col overflow-hidden rounded-card bg-surface shadow-overlay">
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
              placeholder={searchPlaceholder ?? L.search}
              className="h-9 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none"
            />
          </div>
          <div id={nav.listId} role="listbox" className="max-h-64 min-h-0 flex-1 overflow-y-auto p-1">
            {visible.length === 0 && <div className="px-2 py-6 text-center text-meta text-ink-3">{emptyText ?? L.noResults}</div>}
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
      </Floating>
    </div>
  );
}
