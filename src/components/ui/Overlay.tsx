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

const POP = "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both";

/** Abierto/cerrado con cierre por clic fuera y Escape. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
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
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn("absolute top-full z-40 mt-1.5 w-52 rounded-card bg-surface p-1 shadow-overlay", align === "end" ? "right-0" : "left-0")}
          style={{ animation: POP, transformOrigin: align === "end" ? "top right" : "top left" }}
        >
          <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[6px] bg-hover-2">
            {items.map((item, i) => {
              if (item.type === "separator") return <div key={i} className="-mx-1 my-1 h-px bg-line" />;
              if (item.type === "label")
                return (
                  <div key={i} className="px-2 pt-1.5 pb-1 text-[10.5px] font-medium tracking-[0.04em] text-ink-3 uppercase">
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
                    setOpen(false);
                  }}
                  className={cn(
                    "relative z-10 flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px]",
                    item.danger ? "text-red" : "text-ink",
                  )}
                >
                  {item.icon && <span className={cn("flex shrink-0", item.danger ? "text-red" : "text-ink-3")}>{item.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.shortcut && <span className="text-[11.5px] text-ink-3">{item.shortcut}</span>}
                </button>
              );
            })}
          </GlideMenu>
        </div>
      )}
    </div>
  );
}

/* ── Select ────────────────────────────────────────────── */

/** Select propio: botón `surface` + `shadow-btn`, lista con GlideMenu y check. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  placeholder?: string;
  className?: string;
}) {
  const { open, setOpen, ref } = usePopover();
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-control bg-surface pr-2 pl-2.5 text-[13px]
          shadow-btn transition-[background-color,box-shadow] duration-150 hover:bg-inset aria-expanded:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_var(--accent-tint)]"
      >
        <span className={cn("truncate", current ? "text-ink" : "text-ink-3")}>{current?.label ?? placeholder}</span>
        <IconChevronDown size={13} className="shrink-0 text-ink-3 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full right-0 left-0 z-40 mt-1.5 rounded-card bg-surface p-1 shadow-overlay"
          style={{ animation: POP, transformOrigin: "top center" }}
        >
          <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[6px] bg-hover-2">
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
                }}
                className="relative z-10 flex h-8 w-full items-center justify-between rounded-[6px] px-2 text-left text-[13px] text-ink"
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <IconCheck size={13} className="text-accent-ink" />}
              </button>
            ))}
          </GlideMenu>
        </div>
      )}
    </div>
  );
}

/* ── Tooltip ───────────────────────────────────────────── */

/** Tooltip oscuro (tokens --tooltip-*) con retardo de entrada. */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [show, setShow] = useState(false);
  const timer = useRef<number>(undefined);
  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(true), 250);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    setShow(false);
  };
  return (
    <span className="relative inline-flex" onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave}>
      {children}
      {show && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-[7px] border px-2 py-1 text-[11.5px] font-medium whitespace-nowrap",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
          style={{
            background: "var(--tooltip-bg)",
            color: "var(--tooltip-fg)",
            borderColor: "var(--tooltip-border)",
            boxShadow: "var(--shadow-overlay)",
            animation: "fade-in 120ms ease-out both",
          }}
        >
          {content}
        </span>
      )}
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
      className="m-auto w-[min(440px,calc(100vw-32px))] overflow-hidden rounded-window bg-surface p-0 text-ink shadow-overlay
        backdrop:bg-[oklch(0.2_0.004_264/0.35)] backdrop:backdrop-blur-[2px]"
      style={{ animation: open ? POP : undefined }}
    >
      <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="text-[13px] text-ink-2">{description}</p>}
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
  const push = useCallback((text: ReactNode, action?: ToastItem["action"]) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text, action }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2" aria-live="polite">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex min-w-[280px] items-center gap-2.5 rounded-card border py-2 pr-2 pl-3 text-[13px]"
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
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
