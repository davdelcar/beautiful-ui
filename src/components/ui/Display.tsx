import type { ReactNode } from "react";
import { Monogram } from "@/components/atoms/EntityChip";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Charts";
import { IconAlert, IconCheckCircle, IconInfo } from "./icons";

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
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{title}</span>
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
        "inline-flex h-[23px] shrink-0 items-center gap-1.5 rounded-[8px] border px-[7px] text-[12.5px] font-medium whitespace-nowrap",
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
    <span className={cn("inline-flex h-[22px] items-center rounded-chip bg-surface px-[7px] text-[12px] font-medium text-ink-2 shadow-btn", className)}>
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
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-card px-3 py-2.5 text-[13px]", t.bg)}>
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
      <span className="text-[13px] font-medium text-ink">{title}</span>
      {hint && <span className="max-w-64 text-[12px] text-ink-3">{hint}</span>}
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
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className={cn("h-1 overflow-hidden rounded-full bg-hover-2", className)}>
      <div
        className={cn("h-full rounded-full", { accent: "bg-accent", green: "bg-green", orange: "bg-orange", red: "bg-red" }[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, transition: "width 500ms cubic-bezier(0.23,1,0.32,1)" }}
      />
    </div>
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
      <span className="text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">{value}</span>
      {delta && (
        <span className={cn("font-mono text-[11px] tabular-nums", good === null ? "text-ink-3" : good ? "text-green" : "text-red")}>
          {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
          {delta}
        </span>
      )}
      {spark && spark.length > 1 && <Sparkline values={spark} className="mt-1" />}
    </Card>
  );
}
