import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./Actions";
import { IconX } from "./icons";
import { useLabels } from "./i18n";

const SIDE = {
  right: { box: "inset-y-0 right-0 left-auto h-dvh border-l", anim: "sheet-in-right" },
  left: { box: "inset-y-0 left-0 right-auto h-dvh border-r", anim: "sheet-in-left" },
  bottom: { box: "inset-x-0 bottom-0 top-auto w-full max-h-[85dvh] rounded-t-window border-t", anim: "sheet-in-bottom" },
} as const;

/**
 * Panel lateral sobre <dialog> nativo (foco atrapado, Escape y backdrop).
 * Para detalles, edición rápida, filtros… y para la navegación en móvil
 * (`bare` + SidebarNav). Se cierra al pulsar fuera.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  description,
  children,
  footer,
  width = 400,
  bare = false,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: keyof typeof SIDE;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** ancho en px para los lados (se limita al viewport) */
  width?: number;
  /** sin cabecera ni paddings: el contenido ocupa todo el panel */
  bare?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const L = useLabels();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const s = SIDE[side];
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={typeof title === "string" ? title : undefined}
      className={cn("bui-dialog fixed m-0 max-h-none max-w-none overflow-hidden border-line bg-surface p-0 text-ink shadow-overlay", s.box, className)}
      style={{
        width: side === "bottom" ? undefined : `min(${width}px, 100vw)`,
        animation: open ? `${s.anim} 320ms cubic-bezier(0.23,1,0.32,1) both` : undefined,
      }}
    >
      {bare ? (
        <div className="h-full">{open && children}</div>
      ) : (
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex shrink-0 items-start gap-3 border-b border-line py-3 pr-2.5 pl-[18px]">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              {title && <h2 className="text-heading text-ink">{title}</h2>}
              {description && <p className="text-meta text-ink-2">{description}</p>}
            </div>
            <IconButton label={L.close} tooltip={false} onClick={onClose}>
              <IconX size={15} />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">{open && children}</div>
          {footer && <div className="primitive-card-footer flex shrink-0 justify-end gap-1.5 border-t border-line bg-inset">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
