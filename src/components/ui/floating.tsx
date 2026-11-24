import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { createRovingFocus, definePrimitive, isComposing } from "@ui-sdk/core";
import { usePrimitive } from "@ui-sdk/react/primitive";
import { cn } from "@/lib/utils";

/* Capa flotante común (Select, Combobox, Menu, Popover, fechas, Tooltip):
 * - se renderiza en un portal: ningún contenedor con overflow (cards, tablas,
 *   Sheet, Dialog, Accordion) puede recortarla;
 * - dentro de un <dialog> modal o de un popup de UI SDK (Dialog, Sheet) se monta
 *   en esa capa superior, sin quedar inerte ni debajo;
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
    setContainer((a?.closest("dialog[open], [popover]:popover-open") as HTMLElement | null) ?? document.body);

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
      const hs = host && host !== document.body ? getComputedStyle(host) : null;
      const cb = hs && (hs.transform !== "none" || hs.translate !== "none" || hs.scale !== "none") ? host!.getBoundingClientRect() : null;
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
        pointerEvents: pos ? "auto" : "none",
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
const floatingFocus = definePrimitive({
  name: "beautiful-ui-floating-focus",
  state: () => ({ focused: null as string | null }),
  api: (context) => ({
    roving: createRovingFocus(context, { slot: "item", key: "focused", loop: () => true }),
  }),
  slots: (slot) => ({ item: slot({}) }),
});

export function useRovingFocus(panel: RefObject<HTMLElement | null>, open: boolean, selector: string, focusOnOpen = true) {
  const { api: { roving } } = usePrimitive(floatingFocus, {});
  const items = useRef(new Map<HTMLElement, () => void>());
  const nextKey = useRef(0);

  const syncItems = () => {
    const candidates = panel.current?.querySelectorAll<HTMLElement>(selector) ?? [];
    const eligible = new Set([...candidates].filter((element) => !element.matches("[disabled], [aria-disabled='true']")));
    for (const [element, unbind] of items.current) {
      if (!eligible.has(element)) {
        unbind();
        items.current.delete(element);
      }
    }
    for (const element of eligible) {
      if (!items.current.has(element)) {
        items.current.set(element, roving.bind(element, { key: String(nextKey.current++), props: {} }));
      }
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      syncItems();
      if (!focusOnOpen) return;
      const options = roving.items();
      const initial = options.find(({ el }) => el.matches("[aria-selected='true'], [aria-checked='true']")) ?? options[0];
      if (initial) roving.focus(initial.key);
    });
    return () => {
      cancelAnimationFrame(id);
      for (const unbind of items.current.values()) unbind();
      items.current.clear();
    };
    // The panel mounts in a portal. Bind its latest options after it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panel, selector, focusOnOpen, roving]);

  return (e: React.KeyboardEvent) => {
    if (!open || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || e.defaultPrevented || isComposing(e.nativeEvent)) return;
    syncItems();
    if (e.target instanceof HTMLElement && roving.keydown(e.nativeEvent, e.target)) e.preventDefault();
  };
}

/**
 * Enlaza `<label htmlFor={id}>` con un control cuyo elemento enfocable lo crea
 * UI SDK (p. ej. los `<input>` de los tiradores de Slider): les pone
 * `aria-labelledby` con el id de la etiqueta, creándolo si no lo tiene.
 */
export function useLabelFor(root: RefObject<HTMLElement | null>, id: string | undefined, selector: string) {
  useLayoutEffect(() => {
    if (!id || !root.current) return;
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (!label) return;
    if (!label.id) label.id = `${id}-label`;
    root.current.querySelectorAll(selector).forEach((el, i) => {
      /* con aria-label propio (tiradores de un rango): «Precio Mínimo» */
      if (el.getAttribute("aria-label")) {
        if (!el.id) el.id = `${id}-${i}`;
        el.setAttribute("aria-labelledby", `${label.id} ${el.id}`);
      } else el.setAttribute("aria-labelledby", label.id);
    });
  });
}
