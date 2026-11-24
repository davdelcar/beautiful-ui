import type { ReactNode } from "react";
import { Drawer, DrawerBackdrop, DrawerContent, DrawerDescription, DrawerTitle } from "@ui-sdk/react/drawer";
import { cn } from "@/lib/utils";
import { IconButton } from "./Actions";
import { IconX } from "./icons";
import { useLabels } from "./i18n";

const SIDE = {
  right: "h-dvh border-l",
  left: "h-dvh border-r",
  bottom: "w-full max-h-[85dvh] rounded-t-window border-t",
} as const;

/**
 * Panel lateral o inferior sobre el Drawer de UI SDK: foco atrapado, Escape,
 * clic fuera y deslizar para cerrar (dedo, ratón o lápiz). Para detalles,
 * edición rápida, filtros… y para la navegación en móvil (`bare` + SidebarNav).
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
  const L = useLabels();
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} side={side}>
      <DrawerBackdrop className="bui-backdrop fixed inset-0" />
      <DrawerContent
        aria-label={bare && typeof title === "string" ? title : undefined}
        className={cn("bui-ring overflow-hidden border-line bg-surface text-ink shadow-overlay outline-none", SIDE[side], className)}
        style={{ width: side === "bottom" ? undefined : `min(${width}px, 100vw)` }}
      >
        {bare ? (
          <div className="h-full">{children}</div>
        ) : (
          <div className="flex h-full max-h-[inherit] flex-col">
            <div className="flex shrink-0 items-start gap-3 border-b border-line py-3 pr-2.5 pl-[18px]">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                {title && <DrawerTitle className="text-heading text-ink">{title}</DrawerTitle>}
                {description && <DrawerDescription className="text-meta text-ink-2">{description}</DrawerDescription>}
              </div>
              <IconButton label={L.close} tooltip={false} onClick={onClose}>
                <IconX size={15} />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-4">{children}</div>
            {footer && <div className="primitive-card-footer flex shrink-0 justify-end gap-1.5 border-t border-line bg-inset">{footer}</div>}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
