import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* Capa flotante común (Select, Combobox, Menu, Popover, fechas, Tooltip):
 * - se renderiza en un portal: ningún contenedor con overflow (cards, tablas,
 *   Sheet, Dialog, Accordion) puede recortarla;
 * - dentro de un <dialog> modal se monta en el propio diálogo (capa superior,
 *   sin quedar inerte);
 * - posición fija calculada desde el disparador, con volteo arriba/abajo si no
 *   cabe y ajuste horizontal para no salirse de la pantalla;
 * - se recoloca al hacer scroll, al redimensionar y si cambia su tamaño. */

const GAP = 8; // margen mínimo con el borde de la ventana

export type Side = "bottom" | "top";
export type Align = "start" | "center" | "end";

export function Floating({
  anchor,
  open,
  side = "bottom",
  align = "start",
  width,
  offset = 6,
  panelRef,
  className,
  style,
  children,
  ...rest
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  side?: Side;
  align?: Align;
  /** px, o "trigger" para igualar el ancho del disparador (como mínimo) */
  width?: number | "trigger";
  offset?: number;
  panelRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">) {
  const inner = useRef<HTMLDivElement>(null);
  const ref = panelRef ?? inner;
  const [pos, setPos] = useState<{ top: number; left: number; minWidth?: number; side: Side; maxHeight: number } | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const a = anchor.current;
    setContainer((a?.closest("dialog[open]") as HTMLElement | null) ?? document.body);

    const place = () => {
      const el = ref.current;
      const t = anchor.current?.getBoundingClientRect();
      if (!el || !t) return;
      const w = typeof width === "number" ? Math.min(width, innerWidth - GAP * 2) : Math.max(el.offsetWidth, width === "trigger" ? t.width : 0);
      const h = el.scrollHeight;
      const below = innerHeight - t.bottom - offset - GAP;
      const above = t.top - offset - GAP;
      const s: Side = side === "bottom" ? (h > below && above > below ? "top" : "bottom") : h > above && below > above ? "bottom" : "top";
      const room = s === "bottom" ? below : above;
      const top = s === "bottom" ? t.bottom + offset : t.top - offset - Math.min(h, room);
      let left = align === "start" ? t.left : align === "end" ? t.right - w : t.left + t.width / 2 - w / 2;
      left = Math.max(GAP, Math.min(left, innerWidth - w - GAP));
      /* si el contenedor del portal tiene transform, es el bloque contenedor de "fixed": compensa */
      const host = el.parentElement;
      const cb = host && host !== document.body && getComputedStyle(host).transform !== "none" ? host.getBoundingClientRect() : null;
      const y = top - (cb?.top ?? 0);
      const x = left - (cb?.left ?? 0);
      setPos((p) =>
        p && p.top === y && p.left === x && p.side === s && p.maxHeight === room
          ? p
          : { top: y, left: x, side: s, maxHeight: Math.max(120, room), minWidth: width === "trigger" ? t.width : undefined },
      );
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    if (anchor.current) ro.observe(anchor.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      ro.disconnect();
    };
  }, [open, side, align, width, offset, anchor, ref, container]);

  if (!open || !container) return null;
  const s = pos?.side ?? side;
  return createPortal(
    <div
      ref={ref}
      className={cn("bui-pop fixed z-[var(--z-overlay)]", className)}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        minWidth: pos?.minWidth,
        width: typeof width === "number" ? `min(${width}px, calc(100vw - ${GAP * 2}px))` : undefined,
        maxHeight: pos?.maxHeight,
        /* opacity (no visibility) mientras se coloca: así autoFocus funciona en el primer frame */
        opacity: pos ? undefined : 0,
        pointerEvents: pos ? undefined : "none",
        animation: pos ? "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both" : undefined,
        transformOrigin: `${s === "bottom" ? "top" : "bottom"} ${align === "end" ? "right" : align === "center" ? "center" : "left"}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>,
    container,
  );
}

/**
 * Navegación con flechas en listas de botones (Menu, Select, presets):
 * ↑ ↓ Inicio Fin mueven el foco entre `selector`; al abrir enfoca el
 * seleccionado o el primero.
 */
export function useRovingFocus(panel: RefObject<HTMLElement | null>, open: boolean, selector: string) {
  useLayoutEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const items = [...(panel.current?.querySelectorAll<HTMLElement>(selector) ?? [])];
      (items.find((i) => i.getAttribute("aria-selected") === "true" || i.getAttribute("aria-checked") === "true") ?? items[0])?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open, panel, selector]);
  return (e: React.KeyboardEvent) => {
    const items = [...(panel.current?.querySelectorAll<HTMLElement>(selector) ?? [])].filter((i) => !i.hasAttribute("disabled"));
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    items[(next + items.length) % items.length].focus();
  };
}
