import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import GlideMenu from "@/components/primitives/GlideMenu";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { IconCheck, IconCheckCircle, IconChevronDown } from "./icons";
import { useLabels } from "./i18n";
import { Floating, useRovingFocus } from "./floating";

const POP = "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both";

/**
 * Abierto/cerrado de un panel flotante: cierra con clic fuera (del disparador
 * y del panel en su portal) y con Escape, devolviendo el foco al disparador.
 * Escape no cierra además el Sheet/Dialog que lo contenga.
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusTrigger = () => ref.current?.querySelector<HTMLElement>("button, [tabindex]:not([tabindex='-1']), input")?.focus();
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => !!t && (ref.current?.contains(t as Node) || panelRef.current?.contains(t as Node));
    const onDown = (e: PointerEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault(); // no dispares el cierre del <dialog> que lo contiene
        e.stopPropagation();
        setOpen(false);
        focusTrigger();
      } else if (e.key === "Tab" && inside(document.activeElement) && panelRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  return { open, setOpen, ref, panelRef, focusTrigger };
}

/* ── Menu ──────────────────────────────────────────────── */

export type MenuItem =
  | { type?: "item"; label: ReactNode; icon?: ReactNode; shortcut?: ReactNode; danger?: boolean; onSelect?: () => void }
  | { type: "label"; label: ReactNode }
  | { type: "separator" };

/** Menú desplegable — panel `shadow-overlay` con resaltado GlideMenu. */
export function Menu({
  trigger,
  items,
  align = "start",
  className,
}: {
  /** recibe `open` para pintar el estado del disparador */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  className?: string;
}) {
  const { open, setOpen, ref, panelRef, focusTrigger } = usePopover();
  const onKeyDown = useRovingFocus(panelRef, open, "[role=menuitem]");
  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <Floating anchor={ref} open={open} align={align} panelRef={panelRef} role="menu" onKeyDown={onKeyDown} className="w-52 rounded-card bg-surface p-1 shadow-overlay">
        <MenuList items={items} onDone={() => (setOpen(false), focusTrigger())} />
      </Floating>
    </div>
  );
}

/** Filas de menú compartidas por Menu y ContextMenu. */
function MenuList({ items, onDone }: { items: MenuItem[]; onDone: () => void }) {
  return (
    <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-chip bg-hover-2">
      {items.map((item, i) => {
        if (item.type === "separator") return <div key={i} role="separator" className="-mx-1 my-1 h-px bg-line" />;
        if (item.type === "label")
          return (
            <div key={i} className="px-2 pt-1.5 pb-1 text-overline text-ink-3 uppercase">
              {item.label}
            </div>
          );
        return (
          <button
            key={i}
            data-menu-row
            role="menuitem"
            type="button"
            onClick={() => {
              item.onSelect?.();
              onDone();
            }}
            className={cn("relative z-10 flex h-8 w-full items-center gap-2 rounded-chip px-2 text-left text-body outline-none focus-visible:bg-hover-2", item.danger ? "text-red" : "text-ink")}
          >
            {item.icon && <span className={cn("flex shrink-0", item.danger ? "text-red" : "text-ink-3")}>{item.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.shortcut && <span className="text-micro text-ink-3">{item.shortcut}</span>}
          </button>
        );
      })}
    </GlideMenu>
  );
}

/**
 * Menú contextual (clic derecho o Mayús+F10) sobre cualquier zona. Mismo panel
 * que Menu, posicionado en el puntero y recolocado para no salirse de la pantalla.
 */
export function ContextMenu({ items, children, className }: { items: MenuItem[]; children: ReactNode; className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const onKeyDown = useRovingFocus(panel, !!pos, "[role=menuitem]");
  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      if (e.type === "pointerdown" && panel.current?.contains(e.target as Node)) return;
      setPos(null);
    };
    const evs = ["pointerdown", "keydown", "scroll", "resize", "blur"];
    evs.forEach((ev) => window.addEventListener(ev, close, true));
    const el = panel.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const x = Math.min(pos.x, window.innerWidth - r.width - 8);
      const y = Math.min(pos.y, window.innerHeight - r.height - 8);
      if (x !== pos.x || y !== pos.y) setPos({ x, y });
    }
    return () => evs.forEach((ev) => window.removeEventListener(ev, close, true));
  }, [pos]);
  return (
    <div
      ref={zone}
      className={className}
      onContextMenu={(e) => {
        e.preventDefault();
        setPos({ x: e.clientX, y: e.clientY });
      }}
      onKeyDown={(e) => {
        if (e.key === "F10" && e.shiftKey) {
          e.preventDefault();
          const r = (e.target as HTMLElement).getBoundingClientRect();
          setPos({ x: r.left + 8, y: r.bottom + 4 });
        }
      }}
    >
      {children}
      {pos &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            onKeyDown={onKeyDown}
            className="bui-pop fixed z-[var(--z-overlay)] w-52 rounded-card bg-surface p-1 shadow-overlay"
            style={{ left: pos.x, top: pos.y, animation: POP, transformOrigin: "top left" }}
          >
            <MenuList items={items} onDone={() => setPos(null)} />
          </div>,
          (zone.current?.closest("dialog[open]") as HTMLElement | null) ?? document.body,
        )}
    </div>
  );
}

/* ── Select ────────────────────────────────────────────── */

/** Select propio: botón `surface` + `shadow-btn`, lista con GlideMenu, check y flechas ↑ ↓. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const { open, setOpen, ref, panelRef, focusTrigger } = usePopover();
  const L = useLabels();
  const onKeyDown = useRovingFocus(panelRef, open, "[role=option]");
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={TRIGGER}
      >
        <span className={cn("truncate", current ? "text-ink" : "text-ink-3")}>{current?.label ?? placeholder ?? L.select}</span>
        <Chevron open={open} />
      </button>
      <Floating anchor={ref} open={open} width="trigger" panelRef={panelRef} role="listbox" onKeyDown={onKeyDown} className="overflow-y-auto rounded-card bg-surface p-1 shadow-overlay">
        <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-chip bg-hover-2">
          {options.map((o) => (
            <button
              key={o.value}
              data-menu-row
              role="option"
              aria-selected={o.value === value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                focusTrigger();
              }}
              className="relative z-10 flex h-8 w-full items-center justify-between gap-3 rounded-chip px-2 text-left text-body text-ink outline-none focus-visible:bg-hover-2"
            >
              <span className="truncate">{o.label}</span>
              <IconCheck size={13} className={cn("shrink-0 text-accent-ink", o.value !== value && "invisible")} />
            </button>
          ))}
        </GlideMenu>
      </Floating>
    </div>
  );
}

/** Disparador común de Select, Combobox, MultiSelect y fechas: misma piel que Input (pozo `field`). */
export const TRIGGER = `flex h-8 w-full items-center justify-between gap-2 rounded-control border border-line bg-field pr-2 pl-2.5 text-body text-ink
  shadow-[0_1px_2px_rgba(0,0,0,0.035)] outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-line-strong
  aria-expanded:border-accent aria-expanded:bg-surface aria-expanded:shadow-[0_0_0_3px_var(--accent-tint)]
  focus-visible:border-accent focus-visible:bg-surface focus-visible:shadow-[0_0_0_3px_var(--accent-tint)] focus-visible:outline-none
  disabled:pointer-events-none disabled:opacity-55`;

/** Chevron que gira al abrir (todos los desplegables). */
export function Chevron({ open }: { open: boolean }) {
  return <IconChevronDown size={13} className="shrink-0 text-ink-3 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : undefined }} />;
}

/* ── Tooltip ───────────────────────────────────────────── */

/** Tooltip oscuro (tokens --tooltip-*) con retardo de entrada; en portal, nunca queda recortado. */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [show, setShow] = useState(false);
  const timer = useRef<number>(undefined);
  const anchor = useRef<HTMLSpanElement>(null);
  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(true), 250);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    setShow(false);
  };
  return (
    <span ref={anchor} className="relative inline-flex" onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave} onPointerDown={leave}>
      {children}
      <Floating
        anchor={anchor}
        open={show}
        side={side}
        align="center"
        role="tooltip"
        className="pointer-events-none rounded-control border px-2 py-1 text-micro font-medium whitespace-nowrap"
        style={{
          background: "var(--tooltip-bg)",
          color: "var(--tooltip-fg)",
          borderColor: "var(--tooltip-border)",
          boxShadow: "var(--shadow-overlay)",
          animation: "fade-in 120ms ease-out both",
        }}
      >
        {content}
      </Floating>
    </span>
  );
}

/* ── Dialog ────────────────────────────────────────────── */

/** Modal sobre <dialog> nativo: foco atrapado, Escape y backdrop gratis. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="bui-dialog m-auto w-[min(440px,calc(100vw-32px))] overflow-hidden rounded-window bg-surface p-0 text-ink shadow-overlay"
      style={{ animation: open ? "dialog-in 200ms cubic-bezier(0.23,1,0.32,1) backwards" : undefined }}
    >
      <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-4">
        <h2 className="text-heading">{title}</h2>
        {description && <p className="text-body text-ink-2">{description}</p>}
        {children}
      </div>
      {footer && <div className="primitive-card-footer flex justify-end gap-1.5 border-t border-line bg-inset">{footer}</div>}
    </dialog>
  );
}

/* ── Toast ─────────────────────────────────────────────── */

type ToastItem = { id: number; text: ReactNode; action?: { label: string; onClick: () => void } };
const ToastCtx = createContext<(text: ReactNode, action?: ToastItem["action"]) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  const push = useCallback((text: ReactNode, action?: ToastItem["action"]) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text, action }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {host && createPortal(
        <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2" aria-live="polite">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex min-w-[280px] items-center gap-2.5 rounded-card border py-2 pr-2 pl-3 text-body"
              style={{
                background: "var(--tooltip-bg)",
                color: "var(--tooltip-fg)",
                borderColor: "var(--tooltip-border)",
                boxShadow: "var(--shadow-overlay)",
                animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both",
              }}
            >
              <IconCheckCircle size={16} className="shrink-0 text-green" />
              <span className="flex-1">{t.text}</span>
              {t.action && (
                <Button
                  size="xs"
                  variant="quiet"
                  className="text-[var(--tooltip-fg)] hover:bg-white/10"
                  onClick={() => {
                    t.action!.onClick();
                    setItems((xs) => xs.filter((x) => x.id !== t.id));
                  }}
                >
                  {t.action.label}
                </Button>
              )}
            </div>
          ))}
        </div>,
        host,
      )}
    </ToastCtx.Provider>
  );
}
