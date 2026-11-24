import type { ReactNode } from "react";
import { Meter as SDKMeter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/react/meter";
import { Progress as SDKProgress, ProgressIndicator } from "@ui-sdk/react/progress";
import {
  Timeline as SDKTimeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react/timeline";
import { Monogram } from "@/components/atoms/EntityChip";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Charts";
import { IconAlert, IconCheck, IconCheckCircle, IconInfo } from "./icons";
import { useUI } from "./i18n";

/* ── Card ──────────────────────────────────────────────────
 * Las cards de la librería: `rounded-card bg-surface` + sombra semántica y
 * las paddings ópticas compartidas `primitive-card-*`. */

export function Card({
  elevation = "card",
  className,
  children,
}: {
  elevation?: "hairline" | "card" | "raised";
  className?: string;
  children: ReactNode;
}) {
  const shadow = { hairline: "shadow-hairline", card: "shadow-card", raised: "shadow-raised" }[elevation];
  return <div className={cn("min-w-0 rounded-card bg-surface", shadow, className)}>{children}</div>;
}

export function CardHeader({ title, action, icon, className }: { title: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("primitive-card-bar flex items-center gap-2 border-b border-line", className)}>
      {icon && <span className="flex shrink-0 text-ink-3">{icon}</span>}
      <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{title}</span>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("primitive-card-pad", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("primitive-card-footer flex items-center justify-end gap-1.5 border-t border-line", className)}>{children}</div>;
}

/* ── StatusPill ────────────────────────────────────────────
 * Estado con punto. Usa los mismos colores "eléctricos" que FilterTable
 * (.filter-status-*) para que tablas y pills hablen igual. */

const STATUS = {
  todo: { cls: "filter-status-todo", dot: "#f09a2f" },
  progress: { cls: "filter-status-progress", dot: "#16a6c7" },
  done: { cls: "filter-status-done", dot: "#25a878" },
} as const;

export type Status = keyof typeof STATUS;

export function StatusPill({ status, children, className }: { status: Status; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[23px] shrink-0 items-center gap-1.5 rounded-[8px] border px-[7px] text-label font-medium whitespace-nowrap",
        STATUS[status].cls,
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: STATUS[status].dot }} />
      {children}
    </span>
  );
}

/** Tag neutro — etiqueta de categoría en tablas y cards. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center rounded-chip bg-surface px-[7px] text-meta font-medium text-ink-2 shadow-btn", className)}>
      {children}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────────
 * Construido sobre el Monogram de EntityChip. */

const AVATAR_SIZE = {
  sm: "size-5! text-[9px]!",
  md: "size-6! text-[10px]!",
  lg: "size-8! text-[12px]!",
  xl: "size-10! text-[14px]!",
} as const;

export function Avatar({
  name,
  color = "var(--ink-3)",
  size = "md",
  square = false,
  className,
}: {
  name: string;
  color?: string;
  size?: keyof typeof AVATAR_SIZE;
  square?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    /* el fondo se oscurece un poco para que las iniciales blancas pasen AA con cualquier color */
    <Monogram
      color={color.startsWith("var(") ? color : `color-mix(in oklab, ${color} 74%, black)`}
      className={cn(AVATAR_SIZE[size], square && "rounded-[6px]!", className)}
    >
      {initials}
    </Monogram>
  );
}

export function AvatarStack({ people, max = 3 }: { people: { name: string; color?: string }[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.name} className="rounded-full shadow-[0_0_0_2px_var(--surface)]" style={{ marginLeft: i ? -6 : 0 }}>
          <Avatar name={p.name} color={p.color} size="md" />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="flex size-6 items-center justify-center rounded-full bg-field text-[10px] font-medium text-ink-2 shadow-[0_0_0_2px_var(--surface)]"
          style={{ marginLeft: -6 }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

/* ── Alert ─────────────────────────────────────────────── */

const ALERT = {
  info: { bg: "bg-accent-tint", fg: "text-accent-ink", icon: <IconInfo size={15} /> },
  success: { bg: "bg-green-tint", fg: "text-green", icon: <IconCheckCircle size={15} /> },
  warning: { bg: "bg-orange-tint", fg: "text-orange", icon: <IconAlert size={15} /> },
  danger: { bg: "bg-red-tint", fg: "text-red", icon: <IconAlert size={15} /> },
};

export function Alert({ tone = "info", title, children, action }: { tone?: keyof typeof ALERT; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const t = ALERT[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-card px-3 py-2.5 text-body", t.bg)}>
      <span className={cn("mt-px flex shrink-0", t.fg)}>{t.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-ink">{title}</div>
        {children && <div className="text-ink-2">{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────
 * El estado vacío de SearchList, generalizado. */

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center" style={{ animation: "fade-in 250ms ease-out both" }}>
      <span className="mb-1.5 flex size-8 items-center justify-center rounded-control bg-inset text-ink-3 shadow-hairline">{icon}</span>
      <span className="text-body font-medium text-ink">{title}</span>
      {hint && <span className="max-w-64 text-meta text-ink-3">{hint}</span>}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}

/* ── Progress / Meter / Spinner ────────────────────────── */

export function Progress({
  value,
  tone = "accent",
  label = "Progreso",
  className,
}: {
  value: number;
  tone?: "accent" | "green" | "orange" | "red";
  /** nombre accesible de la barra */
  label?: string;
  className?: string;
}) {
  return (
    <SDKProgress value={value} aria-label={label} className={cn("h-1 overflow-hidden rounded-full bg-hover-2", className)}>
      <ProgressIndicator
        className={cn("h-full rounded-full", { accent: "bg-accent", green: "bg-green", orange: "bg-orange", red: "bg-red" }[tone])}
        style={{ transition: "width 500ms cubic-bezier(0.23,1,0.32,1)" }}
      />
    </SDKProgress>
  );
}

/* ── Meter ─────────────────────────────────────────────── */

const TONE_BG = { accent: "bg-accent", green: "bg-green", orange: "bg-orange", red: "bg-red" } as const;

/**
 * Medida dentro de un rango conocido (cuota, almacenamiento, uso del plan) sobre
 * UI SDK: rol `meter`, valor formateado con Intl en el idioma del kit. Con
 * `thresholds` el relleno pasa a naranja y a rojo al cruzar cada umbral.
 * Para tareas que avanzan hasta terminar, usa Progress.
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  format,
  tone = "accent",
  thresholds,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  /** nombre visible (y accesible) de la medida */
  label: ReactNode;
  /** opciones de Intl.NumberFormat o función; por defecto, porcentaje */
  format?: Intl.NumberFormatOptions | ((value: number) => string);
  tone?: keyof typeof TONE_BG;
  /** [aviso, peligro] en unidades del valor: naranja desde el primero, rojo desde el segundo */
  thresholds?: [number, number];
  className?: string;
}) {
  const { locale } = useUI();
  const t = thresholds ? (value >= thresholds[1] ? "red" : value >= thresholds[0] ? "orange" : tone) : tone;
  return (
    <SDKMeter value={value} min={min} max={max} format={format ?? { style: "percent" }} locale={locale} className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <MeterLabel className="text-meta text-ink-2">{label}</MeterLabel>
        <MeterValue className="text-meta font-medium text-ink tabular-nums" />
      </div>
      <MeterTrack className="h-1.5 overflow-hidden rounded-full bg-hover-2">
        <MeterIndicator className={cn("h-full rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-out-strong)]", TONE_BG[t])} />
      </MeterTrack>
    </SDKMeter>
  );
}

/* ── Timeline ──────────────────────────────────────────── */

export type TimelineEvent = {
  title: ReactNode;
  time?: ReactNode;
  /** fecha de máquina para <time datetime> */
  dateTime?: string;
  description?: ReactNode;
  /** en un proceso: hecho, en curso o pendiente */
  status?: "complete" | "current" | "upcoming";
  /** icono propio en el marcador (sustituye al punto) */
  icon?: ReactNode;
};

/**
 * Historial de actividad o pasos de un proceso sobre UI SDK: lista navegable
 * con flechas, `aria-current="step"` en el evento en curso. Línea `line`,
 * tramos hechos en acento.
 */
export function Timeline({ items, className }: { items: TimelineEvent[]; className?: string }) {
  return (
    <SDKTimeline className={cn("flex flex-col", className)}>
      {items.map((e, i) => (
        <TimelineItem
          key={i}
          status={e.status}
          className="bui-ring group/tl relative grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 rounded-control pb-5 outline-none last:pb-0 focus-visible:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]"
        >
          <TimelineMarker
            className={cn(
              "relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full",
              e.icon
                ? "bg-surface text-ink-2 shadow-btn data-complete:text-accent-ink data-current:text-accent-ink"
                : "before:size-2 before:rounded-full before:bg-line-strong data-complete:bg-accent data-complete:before:hidden data-current:before:size-2.5 data-current:before:bg-accent data-current:before:shadow-[0_0_0_4px_var(--accent-tint)]",
            )}
          >
            {e.icon ?? (e.status === "complete" && <IconCheck size={11} strokeWidth={3} className="text-white" />)}
          </TimelineMarker>
          {i < items.length - 1 && (
            <TimelineConnector className="absolute top-6 bottom-0.5 left-[9.5px] w-px bg-line data-complete:bg-accent" />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <TimelineTitle className="text-body font-medium text-ink group-data-upcoming/tl:text-ink-2">{e.title}</TimelineTitle>
              {e.time && <TimelineTime dateTime={e.dateTime} className="text-micro text-ink-3 tabular-nums">{e.time}</TimelineTime>}
            </div>
            {e.description && <TimelineDescription className="text-meta text-ink-2">{e.description}</TimelineDescription>}
          </div>
        </TimelineItem>
      ))}
    </SDKTimeline>
  );
}

export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn("inline-block shrink-0 rounded-full border-[1.75px] border-current border-r-transparent opacity-80", className)}
      style={{ width: size, height: size, animation: "spin 700ms linear infinite" }}
    />
  );
}

/* ── Stat ──────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  delta,
  trend,
  goodWhen = "up",
  spark,
}: {
  label: ReactNode;
  value: ReactNode;
  /** variación firmada frente a un periodo con nombre: "+12% vs. mes pasado" */
  delta?: ReactNode;
  trend?: "up" | "down" | "flat";
  /** si subir es bueno (ingresos) o malo (costes, errores): decide verde/rojo */
  goodWhen?: "up" | "down";
  /** últimos valores para una sparkline */
  spark?: number[];
}) {
  const good = trend === "flat" || !trend ? null : trend === goodWhen;
  return (
    <Card className="primitive-card-pad flex flex-col gap-1">
      <span className="text-meta text-ink-3">{label}</span>
      <span className="text-title leading-tight text-ink">{value}</span>
      {delta && (
        <span className={cn("font-mono text-micro tabular-nums", good === null ? "text-ink-3" : good ? "text-green" : "text-red")}>
          {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
          {delta}
        </span>
      )}
      {spark && spark.length > 1 && <Sparkline values={spark} className="mt-1" />}
    </Card>
  );
}
