import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { bindLayer } from "@ui-sdk/core";
import { Tooltip as SDKTooltip, TooltipContent, TooltipTrigger } from "@ui-sdk/react/tooltip";
import { Menu as SDKMenu, MenuContent, MenuContextTrigger, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu";
import { Dialog as SDKDialog, DialogBackdrop, DialogContent, DialogDescription, DialogTitle } from "@ui-sdk/react/dialog";
import { Select as SDKSelect, SelectContent, SelectItem, SelectTrigger } from "@ui-sdk/react/select";
import GlideMenu from "@/components/primitives/GlideMenu";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { IconCheck, IconCheckCircle, IconChevronDown } from "./icons";
import { useLabels } from "./i18n";

/**
 * Abierto/cerrado de un panel flotante: cierra con clic fuera (del disparador
 * y del panel en su portal) y con Escape, devolviendo el foco al disparador.
 * Escape no cierra además el Sheet/Dialog que lo contenga.
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusTrigger = () => {
    const trigger = ref.current?.querySelector<HTMLElement>("[aria-expanded]") ??
      ref.current?.querySelector<HTMLElement>("button, [tabindex]:not([tabindex='-1']), input");
    trigger?.focus();
  };
  useEffect(() => {
    if (!open || !ref.current) return;
    const unbind = bindLayer(ref.current, {
      contains: (target) => panelRef.current?.contains(target) ?? false,
      onDismiss: (reason) => {
        setOpen(false);
        if (reason === "escape-key") focusTrigger();
      },
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" && panelRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      unbind();
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

/** Panel de menú y lista (Menu, ContextMenu y Select): superficie `shadow-overlay`, entrada pop-in desde el disparador. */
export const PANEL = `rounded-card bg-surface p-1 shadow-overlay outline-none origin-(--transform-origin)
  transition-[opacity,scale] duration-[180ms] ease-[var(--ease-out-strong)]
  data-starting-style:scale-96 data-starting-style:opacity-0 data-ending-style:scale-96 data-ending-style:opacity-0 motion-reduce:transition-none`;
const ROW = "relative z-10 flex h-8 w-full items-center gap-2 rounded-chip px-2 text-left text-body outline-none select-none";

/** Menú desplegable sobre UI SDK (flechas, búsqueda al teclear, foco de vuelta al disparador) con resaltado GlideMenu. */
export function Menu({
  trigger,
  items,
  align = "start",
  className,
}: {
  /** recibe `open` para pintar el estado del disparador; `toggle` se mantiene por compatibilidad (el SDK ya abre al pulsar) */
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const el = trigger({ open, toggle: () => {} });
  return (
    <span className={cn("relative inline-flex", className)}>
      <SDKMenu open={open} onOpenChange={setOpen}>
        <MenuTrigger render={isValidElement(el) ? el : <span className="inline-flex">{el}</span>} />
        <MenuContent align={align} sideOffset={6} className={cn(PANEL, "w-52")}>
          <MenuList items={items} />
        </MenuContent>
      </SDKMenu>
    </span>
  );
}

/** Filas de menú compartidas por Menu y ContextMenu. */
function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-chip bg-hover-2">
      {items.map((item, i) => {
        if (item.type === "separator") return <MenuSeparator key={i} className="-mx-1 my-1 h-px bg-line" />;
        if (item.type === "label")
          return (
            <div key={i} role="presentation" className="px-2 pt-1.5 pb-1 text-overline text-ink-3 uppercase">
              {item.label}
            </div>
          );
        return (
          <MenuItem
            key={i}
            data-menu-row
            destructive={item.danger}
            label={typeof item.label === "string" ? item.label : undefined}
            onSelect={() => item.onSelect?.()}
            className={cn(ROW, item.danger ? "text-red" : "text-ink", "data-disabled:opacity-50")}
          >
            {item.icon && <span className={cn("flex shrink-0", item.danger ? "text-red" : "text-ink-3")}>{item.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.shortcut && <span className="text-micro text-ink-3">{item.shortcut}</span>}
          </MenuItem>
        );
      })}
    </GlideMenu>
  );
}

/**
 * Menú contextual (clic derecho, pulsación larga o Mayús+F10) sobre cualquier zona.
 * Mismo panel que Menu, en el puntero y recolocado por el SDK para no salirse de la pantalla.
 */
export function ContextMenu({ items, children, className }: { items: MenuItem[]; children: ReactNode; className?: string }) {
  return (
    <SDKMenu>
      <MenuContextTrigger render={<div className={className} />}>{children}</MenuContextTrigger>
      <MenuContent className={cn(PANEL, "w-52")}>
        <MenuList items={items} />
      </MenuContent>
    </SDKMenu>
  );
}

/* ── Select ────────────────────────────────────────────── */

/** Select sobre UI SDK: botón con la piel de Input, lista con GlideMenu y check; flechas, Inicio/Fin y búsqueda al teclear. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const L = useLabels();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className={cn("relative", className)}>
      <SDKSelect<T> value={value} onValueChange={(v) => v != null && onChange(v as T)} open={open} onOpenChange={setOpen} disabled={disabled}>
        <SelectTrigger id={id} aria-label={ariaLabel} className={TRIGGER}>
          <span className={cn("truncate", current ? "text-ink" : "text-ink-3")}>{current?.label ?? placeholder ?? L.select}</span>
          <Chevron open={open} />
        </SelectTrigger>
        <SelectContent sideOffset={6} className={cn(PANEL, "max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto")}>
          <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-chip bg-hover-2">
            {options.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                label={typeof o.label === "string" ? o.label : undefined}
                data-menu-row
                className={cn(ROW, "justify-between gap-3 text-ink data-disabled:opacity-50")}
              >
                <span className="truncate">{o.label}</span>
                <IconCheck size={13} className={cn("shrink-0 text-accent-ink", o.value !== value && "invisible")} />
              </SelectItem>
            ))}
          </GlideMenu>
        </SelectContent>
      </SDKSelect>
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
  const canRenderTrigger = isValidElement(children) && (typeof children.type === "string" || children.type === Button);
  const trigger = canRenderTrigger ? children : <span className="inline-flex">{children}</span>;
  return (
    <span className="relative inline-flex">
      <SDKTooltip delay={250} closeOnPress type="description">
        <TooltipTrigger render={trigger} />
        <TooltipContent
          side={side}
          sideOffset={6}
          className="rounded-control border px-2 py-1 text-micro font-medium whitespace-nowrap data-open:animate-[fade-in_120ms_ease-out_both]"
          style={{
            background: "var(--tooltip-bg)",
            color: "var(--tooltip-fg)",
            borderColor: "var(--tooltip-border)",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {content}
        </TooltipContent>
      </SDKTooltip>
    </span>
  );
}

/* ── Dialog ────────────────────────────────────────────── */

/** Modal sobre UI SDK (<dialog> en la capa superior): foco atrapado, Escape, clic fuera y el foco vuelve al disparador. */
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
  return (
    <SDKDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogBackdrop className="bui-backdrop fixed inset-0 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
      <DialogContent
        className={`bui-ring fixed inset-0 m-auto h-fit max-h-[calc(100dvh-32px)] w-[min(440px,calc(100vw-32px))] overflow-hidden rounded-window bg-surface p-0 text-ink shadow-overlay outline-none
          transition-[opacity,scale] duration-200 ease-[var(--ease-out-strong)] data-starting-style:scale-96 data-starting-style:opacity-0
          data-ending-style:scale-96 data-ending-style:opacity-0 motion-reduce:transition-none`}
      >
        <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-4">
          <DialogTitle className="text-heading">{title}</DialogTitle>
          {description && <DialogDescription className="text-body text-ink-2">{description}</DialogDescription>}
          {children}
        </div>
        {footer && <div className="primitive-card-footer flex justify-end gap-1.5 border-t border-line bg-inset">{footer}</div>}
      </DialogContent>
    </SDKDialog>
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
