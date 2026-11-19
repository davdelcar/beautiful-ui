import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Kbd } from "./Field";
import { IconSearch } from "./icons";
import { matches, rank, useListNav } from "./listbox";
import { useLabels } from "./i18n";

export type CommandItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** texto secundario tras la etiqueta */
  hint?: ReactNode;
  /** teclas a mostrar, p. ej. ["⌘", "N"] */
  shortcut?: string[];
  keywords?: string[];
  onSelect: () => void;
};
export type CommandGroup = { label: string; items: CommandItem[] };

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
/** "⌘" en Mac, "Ctrl" en el resto — para pintar atajos. */
export const modKey = () => (isMac() ? "⌘" : "Ctrl");

/** Atajo global: `useHotkey("k", abrir)` → ⌘K / Ctrl+K. Con `mod: false`, la tecla sola (ignora campos de texto). */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, { mod = true }: { mod?: boolean } = {}) {
  const saved = useRef(handler);
  saved.current = handler;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (mod ? !(isMac() ? e.metaKey : e.ctrlKey) : e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (!mod && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      saved.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, mod]);
}

/**
 * Paleta de comandos (⌘K): buscador + acciones agrupadas, navegable solo
 * con teclado. Ábrela con `useHotkey("k", () => setOpen(true))`.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder,
  emptyText,
  footer = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyText?: ReactNode;
  /** muestra la ayuda de teclas abajo */
  footer?: boolean;
}) {
  const L = useLabels();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const score = (it: CommandItem) => Math.min(rank(query, it.label), ...(it.keywords ?? []).map((k) => rank(query, k)));
  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items
        .filter((it) => matches(query, it.label, g.label, ...(it.keywords ?? [])))
        .sort((a, b) => score(a) - score(b)),
    }))
    .filter((g) => g.items.length)
    .sort((a, b) => Math.min(...a.items.map(score)) - Math.min(...b.items.map(score)));
  const flat = filtered.flatMap((g) => g.items);

  const run = (it: CommandItem) => {
    onOpenChange(false);
    it.onSelect();
  };
  const nav = useListNav(flat, run);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      nav.setActive(0);
      d.showModal();
      inputRef.current?.focus();
    }
    if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  let index = -1;
  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={(e) => e.target === ref.current && onOpenChange(false)}
      aria-label={L.commandPalette}
      className="bui-dialog mx-auto mt-[12vh] w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-window bg-surface p-0 text-ink shadow-overlay"
      style={{ animation: open ? "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both" : undefined }}
    >
      <div className="flex items-center gap-2.5 border-b border-line px-4">
        <IconSearch size={16} className="shrink-0 text-ink-3" />
        <input
          ref={inputRef}
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
          placeholder={placeholder ?? L.commandPlaceholder}
          className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none"
        />
        <Kbd>esc</Kbd>
      </div>

      <div id={nav.listId} role="listbox" className="max-h-[min(360px,50dvh)] overflow-y-auto p-1.5">
        {flat.length === 0 && <div className="px-3 py-10 text-center text-body text-ink-3">{emptyText ?? L.noResults}</div>}
        {filtered.map((g) => (
          <Fragment key={g.label}>
            <div className="px-2.5 pt-2.5 pb-1 text-overline text-ink-3 uppercase">{g.label}</div>
            {g.items.map((it) => {
              const i = ++index;
              const active = i === nav.active;
              return (
                <div
                  key={it.id}
                  id={nav.optionId(i)}
                  role="option"
                  aria-selected={active}
                  onPointerMove={() => nav.setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => run(it)}
                  className={cn("flex h-9 cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-body", active ? "bg-hover-2 text-ink" : "text-ink-2")}
                >
                  {it.icon && <span className={cn("flex shrink-0", active ? "text-ink" : "text-ink-3")}>{it.icon}</span>}
                  <span className="min-w-0 truncate">{it.label}</span>
                  {it.hint && <span className="min-w-0 truncate text-meta text-ink-3">{it.hint}</span>}
                  {it.shortcut && (
                    <span className="ml-auto flex shrink-0 gap-0.5">
                      {it.shortcut.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {footer && (
        <div className="flex items-center gap-3 border-t border-line bg-inset px-4 py-2 text-micro text-ink-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {L.commandNavigate}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> {L.commandRun}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>{modKey()}</Kbd>
            <Kbd>K</Kbd> {L.commandToggle}
          </span>
        </div>
      )}
    </dialog>
  );
}
