import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Tabs as SDKTabs, TabsList, TabsTab } from "@ui-sdk/react/tabs";
import { Toolbar, ToolbarButton } from "@ui-sdk/react/toolbar";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.23,1,0.32,1)";

type Option<T extends string> = { value: T; label: ReactNode; count?: number };

/** Mide el botón activo para que el indicador se deslice hasta él. */
function useIndicator(active: string, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(active)}"]`);
    if (el) setBox({ left: el.offsetLeft, width: el.offsetWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
  return { ref, box };
}

/** Control segmentado — pista `field`, pulgar `surface` elevado que se desliza
 *  (mismo patrón que el de FineTuneCard, pero con anchos libres). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  size?: "sm" | "md";
  className?: string;
}) {
  const { ref, box } = useIndicator(value, [options.length]);
  return (
    <SDKTabs
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      activation="automatic"
      loop
      className="contents"
    >
      <TabsList ref={ref} className={cn("relative inline-flex rounded-control bg-field p-0.5", className)}>
        {box && (
          <span
            aria-hidden
            className="absolute inset-y-0.5 rounded-chip bg-surface shadow-btn"
            style={{ left: box.left, width: box.width, transition: `left 300ms ${EASE}, width 300ms ${EASE}` }}
          />
        )}
        {options.map((o) => {
          const on = o.value === value;
          return (
            <TabsTab
              key={o.value}
              value={o.value}
              data-value={o.value}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 rounded-chip font-medium transition-colors duration-200",
                size === "sm" ? "h-6 px-2 text-meta" : "h-7 px-2.5 text-label",
                on ? "text-ink" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {o.label}
              {o.count !== undefined && <span className="text-micro tabular-nums text-ink-3">{o.count}</span>}
            </TabsTab>
          );
        })}
      </TabsList>
    </SDKTabs>
  );
}

/** Pestañas con subrayado que se desliza entre opciones. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}) {
  const { ref, box } = useIndicator(value, [options.length]);
  return (
    <SDKTabs
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      activation="automatic"
      loop
      className="contents"
    >
      <TabsList ref={ref} className={cn("relative flex gap-1 border-b border-line", className)}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <TabsTab
              key={o.value}
              value={o.value}
              data-value={o.value}
              className={cn(
                "relative flex h-9 items-center gap-1.5 px-2 text-body font-medium transition-colors duration-150",
                on ? "text-ink" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {o.label}
              {o.count !== undefined && (
                <span className={cn("rounded-[4px] px-1 text-micro tabular-nums", on ? "bg-field text-ink-2" : "text-ink-3")}>
                  {o.count}
                </span>
              )}
            </TabsTab>
          );
        })}
        {box && (
          <span
            aria-hidden
            className="absolute -bottom-px h-[2px] rounded-full bg-ink"
            style={{ left: box.left + 6, width: box.width - 12, transition: `left 300ms ${EASE}, width 300ms ${EASE}` }}
          />
        )}
      </TabsList>
    </SDKTabs>
  );
}

/** Chips de filtro con conteo — el patrón de FilterTable, reutilizable. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: (Option<T> & { dot?: string })[];
  className?: string;
}) {
  return (
    <Toolbar loop className={cn("-mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1", className)} style={{ scrollbarWidth: "none" }}>
      {options.map((f) => {
        const active = value === f.value;
        return (
          <ToolbarButton
            key={f.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.value)}
            className={`flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-meta
              font-medium transition-[background-color,box-shadow,color] duration-200
              ${active ? "bg-surface text-ink shadow-btn" : "text-ink-2 hover:bg-hover"}`}
          >
            {f.dot && <span className="size-1.5 rounded-full" style={{ background: f.dot }} />}
            {f.label}
            {f.count !== undefined && (
              <span className={`rounded-[4px] px-1 text-micro tabular-nums ${active ? "bg-field text-ink-2" : "text-ink-3"}`}>
                {f.count}
              </span>
            )}
          </ToolbarButton>
        );
      })}
    </Toolbar>
  );
}
