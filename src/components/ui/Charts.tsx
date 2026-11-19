import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useUI } from "./i18n";

/* Gráficas SVG sin dependencias, con las reglas del sistema:
 * - color por entidad en orden fijo (--chart-1…8), nunca por rango;
 * - marcas finas (línea 2px, barras ≤ 24px con 4px redondeado en el extremo),
 *   rejilla en línea fina sólida, separación de 2px en el color de superficie;
 * - leyenda siempre con ≥ 2 series; tooltip con todas las series en esa X;
 * - vista de tabla en cada gráfica (accesible y para paletas < 3:1);
 * - texto siempre en tinta, nunca en el color de la serie. */

export type Series = {
  key: string;
  label: string;
  /** posición fija en la paleta (1–8). Mantenla al filtrar para que el color no cambie. */
  color?: number;
};
type Row = Record<string, unknown>;

const color = (s: Series, i: number) => `var(--chart-${Math.min(8, s.color ?? i + 1)})`;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Marcas «redondas» del eje: 0 / 1.000 / 2.000 o 0 / 10K / 20K. */
export function niceTicks(min: number, max: number, count = 4) {
  if (max === min) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

function useFormatters(locale: string, format?: (v: number) => string) {
  return useMemo(() => {
    const full = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    return {
      value: format ?? ((v: number) => full.format(v)),
      tick: (v: number, axisMax: number) => (format && Math.abs(axisMax) < 10000 ? format(v) : Math.abs(axisMax) >= 10000 ? compact.format(v) : full.format(v)),
    };
  }, [locale, format]);
}

/* ── marco: título, leyenda, conmutador de tabla ── */

export function ChartFrame({
  title,
  description,
  series,
  data,
  x,
  xFormat,
  format,
  legend = "auto",
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  series: Series[];
  data: Row[];
  x: string;
  xFormat?: (v: string | number) => string;
  format?: (v: number) => string;
  legend?: "auto" | "always" | "never";
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { labels: L, locale } = useUI();
  const [table, setTable] = useState(false);
  const fmt = useFormatters(locale, format);
  const showLegend = legend === "always" || (legend === "auto" && series.length >= 2);
  return (
    <figure className={cn("flex min-w-0 flex-col gap-3", className)}>
      {(title || description || actions) && (
        <figcaption className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            {title && <span className="text-body font-medium text-ink">{title}</span>}
            {description && <span className="text-meta text-ink-3">{description}</span>}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {actions}
            <button
              type="button"
              aria-pressed={table}
              onClick={() => setTable((t) => !t)}
              className="h-6 rounded-chip px-1.5 text-micro text-ink-3 transition-colors hover:bg-hover-2 hover:text-ink"
            >
              {table ? L.showChart : L.showTable}
            </button>
          </span>
        </figcaption>
      )}
      {showLegend && !table && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {series.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5 text-meta text-ink-2">
              <span className="size-2 rounded-[2px]" style={{ background: color(s, i) }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {table ? (
        <div className="overflow-x-auto rounded-control shadow-hairline">
          <table className="w-full text-meta">
            <thead className="bg-inset text-ink-3">
              <tr>
                <th className="px-2.5 py-1.5 text-left font-medium" scope="col" />
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-2.5 py-1.5 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((r, i) => (
                <tr key={i}>
                  <th scope="row" className="px-2.5 py-1.5 text-left font-normal text-ink-2">
                    {xFormat ? xFormat(r[x] as string) : String(r[x])}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-2.5 py-1.5 text-right text-ink tabular-nums">
                      {typeof r[s.key] === "number" ? fmt.value(r[s.key] as number) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

/* ── tooltip compartido ── */

function Tooltip({ left, top, title, rows, width }: { left: number; top: number; title: string; rows: { label: string; value: string; color: string }[]; width: number }) {
  const flip = left > width - 170;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-36 rounded-[8px] border px-2.5 py-2 text-meta"
      style={{
        left: flip ? undefined : left + 12,
        right: flip ? width - left + 12 : undefined,
        top,
        background: "var(--tooltip-bg)",
        color: "var(--tooltip-fg)",
        borderColor: "var(--tooltip-border)",
        boxShadow: "var(--shadow-overlay)",
      }}
    >
      <div className="mb-1 text-micro" style={{ color: "var(--tooltip-muted)" }}>
        {title}
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="h-0.5 w-2.5 rounded-full" style={{ background: r.color }} />
          <span className="font-medium tabular-nums">{r.value}</span>
          <span className="ml-auto pl-3" style={{ color: "var(--tooltip-muted)" }}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

type PlotProps = {
  data: Row[];
  x: string;
  series: Series[];
  height?: number;
  format?: (v: number) => string;
  xFormat?: (v: string | number) => string;
  /** etiqueta en el último punto de cada serie (≤ 4 series) */
  endLabels?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

const PAD = { top: 8, right: 12, bottom: 24, left: 40 };

/** Navegación con teclado sobre las X: ← → Inicio Fin. */
function useCursor(n: number) {
  const [i, setI] = useState<number | null>(null);
  const onKeyDown = (e: KeyboardEvent) => {
    const next = { ArrowRight: (i ?? -1) + 1, ArrowLeft: (i ?? n) - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setI(Math.max(0, Math.min(n - 1, next)));
  };
  return { i, setI, onKeyDown };
}

/* ── LineChart / AreaChart ─────────────────────────────── */

/** Evolución en el tiempo. `area` añade un velo del 10 %. Un único eje Y (nunca dos). */
export function LineChart({ area = false, ...p }: PlotProps & { area?: boolean }) {
  const { locale } = useUI();
  const fmt = useFormatters(locale, p.format);
  const [box, width] = useWidth<HTMLDivElement>();
  const height = p.height ?? 200;
  const cur = useCursor(p.data.length);
  const gid = useId().replace(/:/g, "");

  const values = p.data.flatMap((r) => p.series.map((s) => r[s.key])).filter((v): v is number => typeof v === "number");
  const ticks = niceTicks(Math.min(0, ...values), Math.max(...values, 1));
  const [y0, y1] = [ticks[0], ticks[ticks.length - 1]];
  const iw = Math.max(0, width - PAD.left - PAD.right);
  const ih = height - PAD.top - PAD.bottom;
  const X = (i: number) => PAD.left + (p.data.length < 2 ? iw / 2 : (i / (p.data.length - 1)) * iw);
  const Y = (v: number) => PAD.top + ih - ((v - y0) / (y1 - y0)) * ih;
  const step = Math.max(1, Math.ceil(p.data.length / Math.max(1, Math.floor(iw / 72))));
  const xl = (r: Row) => (p.xFormat ? p.xFormat(r[p.x] as string) : String(r[p.x]));

  const path = (s: Series) => {
    let d = "";
    p.data.forEach((r, i) => {
      const v = r[s.key];
      if (typeof v !== "number") return;
      d += `${d ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`;
    });
    return d;
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left - PAD.left) / (iw || 1);
    cur.setI(Math.max(0, Math.min(p.data.length - 1, Math.round(rel * (p.data.length - 1)))));
  };

  return (
    <ChartFrame {...p} data={p.data} x={p.x} xFormat={p.xFormat} format={p.format} series={p.series}>
      <div ref={box} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            tabIndex={0}
            aria-label={typeof p.title === "string" ? p.title : "Gráfica"}
            onPointerMove={onMove}
            onPointerLeave={() => cur.setI(null)}
            onKeyDown={cur.onKeyDown}
            onBlur={() => cur.setI(null)}
            className="overflow-visible outline-none"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? "var(--chart-axis)" : "var(--chart-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.left - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                  {fmt.tick(t, y1)}
                </text>
              </g>
            ))}
            {p.data.map((r, i) =>
              i % step === 0 || i === p.data.length - 1 ? (
                i === p.data.length - 1 && i % step !== 0 && p.data.length - 1 - (i - (i % step)) < step / 2 ? null : (
                  <text key={i} x={X(i)} y={height - 6} textAnchor={i === 0 && p.data.length > 1 ? "start" : i === p.data.length - 1 ? "end" : "middle"} className="fill-ink-3 text-[11px]">
                    {xl(r)}
                  </text>
                )
              ) : null,
            )}
            {area &&
              p.series.map((s, i) => (
                <g key={s.key}>
                  <defs>
                    <linearGradient id={`${gid}-${i}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor={color(s, i)} stopOpacity={0.14} />
                      <stop offset="1" stopColor={color(s, i)} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <path d={`${path(s)}L${X(p.data.length - 1)},${Y(Math.max(0, y0))}L${X(0)},${Y(Math.max(0, y0))}Z`} fill={`url(#${gid}-${i})`} />
                </g>
              ))}
            {p.series.map((s, i) => (
              <path key={s.key} d={path(s)} fill="none" stroke={color(s, i)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {cur.i !== null && <line x1={X(cur.i)} x2={X(cur.i)} y1={PAD.top} y2={PAD.top + ih} stroke="var(--chart-axis)" strokeWidth={1} shapeRendering="crispEdges" />}
            {p.series.map((s, i) => {
              const at = cur.i ?? p.data.length - 1;
              const v = p.data[at]?.[s.key];
              if (typeof v !== "number" || (cur.i === null && !p.endLabels)) return null;
              return <circle key={s.key} cx={X(at)} cy={Y(v)} r={4} fill={color(s, i)} stroke="var(--surface)" strokeWidth={2} />;
            })}
            {p.endLabels &&
              cur.i === null &&
              p.series.length <= 4 &&
              (() => {
                /* etiquetas que chocarían (< 16px) no se apilan: se omiten y quedan en tooltip y tabla */
                const placed: number[] = [];
                const last = p.data[p.data.length - 1] ?? {};
                return [...p.series]
                  .filter((s) => typeof last[s.key] === "number")
                  .sort((a, b) => (last[b.key] as number) - (last[a.key] as number))
                  .map((s) => {
                    const v = last[s.key] as number;
                    const y = Y(v) - 9;
                    if (placed.some((py) => Math.abs(py - y) < 16)) return null;
                    placed.push(y);
                    return (
                      <text key={s.key} x={X(p.data.length - 1) - 8} y={y} textAnchor="end" className="fill-ink-2 text-[11px] font-medium tabular-nums">
                        {fmt.value(v)}
                      </text>
                    );
                  });
              })()}
          </svg>
        )}
        {cur.i !== null && width > 0 && (
          <Tooltip
            width={width}
            left={X(cur.i)}
            top={PAD.top}
            title={xl(p.data[cur.i])}
            rows={p.series.map((s, i) => ({ label: s.label, color: color(s, i), value: typeof p.data[cur.i!][s.key] === "number" ? fmt.value(p.data[cur.i!][s.key] as number) : "—" }))}
          />
        )}
      </div>
    </ChartFrame>
  );
}

/* ── BarChart ──────────────────────────────────────────── */

/** Columnas agrupadas o apiladas desde una sola línea base. Barras ≤ 24px, 2px de aire entre ellas. */
export function BarChart({ stacked = false, ...p }: PlotProps & { stacked?: boolean }) {
  const { locale } = useUI();
  const fmt = useFormatters(locale, p.format);
  const [box, width] = useWidth<HTMLDivElement>();
  const height = p.height ?? 200;
  const cur = useCursor(p.data.length);

  const num = (r: Row, k: string) => (typeof r[k] === "number" ? (r[k] as number) : 0);
  const maxV = Math.max(1, ...p.data.map((r) => (stacked ? p.series.reduce((a, s) => a + num(r, s.key), 0) : Math.max(...p.series.map((s) => num(r, s.key))))));
  const ticks = niceTicks(0, maxV);
  const y1 = ticks[ticks.length - 1];
  const iw = Math.max(0, width - PAD.left - PAD.right);
  const ih = height - PAD.top - PAD.bottom;
  const band = iw / Math.max(1, p.data.length);
  const groups = stacked ? 1 : p.series.length;
  const bw = Math.max(2, Math.min(24, (band * 0.7 - (groups - 1) * 2) / groups));
  const Y = (v: number) => PAD.top + ih - (v / y1) * ih;
  const step = Math.max(1, Math.ceil(p.data.length / Math.max(1, Math.floor(iw / 56))));
  const xl = (r: Row) => (p.xFormat ? p.xFormat(r[p.x] as string) : String(r[p.x]));

  /** rectángulo con las esquinas superiores redondeadas (extremo de dato) y base recta */
  const bar = (x: number, yTop: number, yBot: number, w: number, round: boolean) => {
    const h = yBot - yTop;
    if (h <= 0) return "";
    const r = round ? Math.min(4, w / 2, h) : 0;
    return `M${x},${yBot}V${yTop + r}Q${x},${yTop} ${x + r},${yTop}H${x + w - r}Q${x + w},${yTop} ${x + w},${yTop + r}V${yBot}Z`;
  };

  return (
    <ChartFrame {...p} data={p.data} x={p.x} xFormat={p.xFormat} format={p.format} series={p.series}>
      <div ref={box} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            tabIndex={0}
            aria-label={typeof p.title === "string" ? p.title : "Gráfica"}
            onPointerLeave={() => cur.setI(null)}
            onKeyDown={cur.onKeyDown}
            onBlur={() => cur.setI(null)}
            className="overflow-visible outline-none"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? "var(--chart-axis)" : "var(--chart-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.left - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tabular-nums">
                  {fmt.tick(t, y1)}
                </text>
              </g>
            ))}
            {p.data.map((r, i) => {
              const cx = PAD.left + band * i + band / 2;
              const dim = cur.i !== null && cur.i !== i;
              let acc = 0;
              const top = stacked ? p.series.map((s) => num(r, s.key)).reduce((last, v, k) => (v > 0 ? k : last), -1) : -1;
              return (
                <g key={i} style={{ opacity: dim ? 0.45 : 1, transition: "opacity 150ms" }}>
                  <rect x={PAD.left + band * i} y={PAD.top} width={band} height={ih} fill="transparent" onPointerEnter={() => cur.setI(i)} />
                  {p.series.map((s, k) => {
                    const v = num(r, s.key);
                    if (stacked) {
                      const yBot = Y(acc) - (acc > 0 ? 2 : 0);
                      acc += v;
                      return <path key={s.key} d={bar(cx - bw / 2, Y(acc), yBot, bw, k === top)} fill={color(s, k)} pointerEvents="none" />;
                    }
                    const x0 = cx - (groups * bw + (groups - 1) * 2) / 2 + k * (bw + 2);
                    return <path key={s.key} d={bar(x0, Y(v), Y(0), bw, true)} fill={color(s, k)} pointerEvents="none" />;
                  })}
                  {(i % step === 0 || p.data.length <= 12) && (
                    <text x={cx} y={height - 6} textAnchor="middle" className="fill-ink-3 text-[11px]">
                      {xl(r)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {cur.i !== null && width > 0 && (
          <Tooltip
            width={width}
            left={PAD.left + band * cur.i + band / 2}
            top={PAD.top}
            title={xl(p.data[cur.i])}
            rows={[...p.series.map((s, i) => ({ label: s.label, color: color(s, i), value: fmt.value(num(p.data[cur.i!], s.key)) }))].concat(
              stacked && p.series.length > 1 ? [{ label: "Total", color: "transparent", value: fmt.value(p.series.reduce((a, s) => a + num(p.data[cur.i!], s.key), 0)) }] : [],
            )}
          />
        )}
      </div>
    </ChartFrame>
  );
}

/* ── Sparkline ─────────────────────────────────────────── */

/** Tendencia mínima para Stat/tablas: línea en tono atenuado y el último punto en acento. */
export function Sparkline({ values, height = 28, className, label }: { values: number[]; height?: number; className?: string; label?: string }) {
  const [box, width] = useWidth<HTMLSpanElement>();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const X = (i: number) => 3 + (i / Math.max(1, values.length - 1)) * (width - 6);
  const Y = (v: number) => 3 + (1 - (v - min) / (max - min || 1)) * (height - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  return (
    <span ref={box} className={cn("block w-full", className)} style={{ height }} role="img" aria-label={label ?? values.join(", ")}>
      {width > 0 && values.length > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <path d={d} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={X(values.length - 1)} cy={Y(values[values.length - 1])} r={3} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
        </svg>
      )}
    </span>
  );
}

/* ── SegmentedBar ──────────────────────────────────────── */

/**
 * Un todo repartido en partes (≤ 6). `tall` (28px) imprime la cuota dentro si cabe;
 * fino (8px) sin texto. Leyenda en el orden de los bloques. Sustituye al donut.
 */
export function SegmentedBar({
  parts,
  tall = false,
  format,
  className,
}: {
  parts: { label: string; value: number; color?: number }[];
  tall?: boolean;
  format?: (v: number) => string;
  className?: string;
}) {
  const { locale } = useUI();
  const [box, width] = useWidth<HTMLDivElement>();
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const visible = parts.map((p, i) => ({ ...p, i })).filter((p) => p.value > 0);
  const gaps = (visible.length - 1) * 2;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div ref={box} className={cn("flex gap-0.5", tall ? "h-7" : "h-2")} role="img" aria-label={parts.map((p) => `${p.label}: ${pct.format(p.value / total)}`).join(", ")}>
        {visible.map((p) => {
          const w = (p.value / total) * (width - gaps);
          const share = pct.format(p.value / total);
          const fits = tall && w > share.length * 7 + 14;
          return (
            <span
              key={p.label}
              title={`${p.label}: ${format ? format(p.value) : p.value} (${share})`}
              onPointerEnter={() => setHover(p.i)}
              onPointerLeave={() => setHover(null)}
              className={cn("flex items-center overflow-hidden transition-opacity duration-150", tall ? "rounded-[4px] px-2" : "rounded-full")}
              style={{ flexBasis: `${(p.value / total) * 100}%`, background: color({ key: p.label, label: p.label, color: p.color }, p.i), opacity: hover !== null && hover !== p.i ? 0.5 : 1 }}
            >
              {fits && (
                <span className="text-micro font-medium tabular-nums" style={{ color: `var(--chart-on-${Math.min(8, p.color ?? p.i + 1)}, #fff)` }}>
                  {share}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {parts.map((p, i) => (
          <li key={p.label} className="flex items-center gap-1.5 text-meta text-ink-2" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <span className="size-2 rounded-[2px]" style={{ background: color({ key: p.label, label: p.label, color: p.color }, i) }} />
            {p.label}
            {!tall && <span className="text-ink-3 tabular-nums">{pct.format(p.value / total)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
