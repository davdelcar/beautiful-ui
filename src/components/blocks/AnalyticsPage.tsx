"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Card,
  DataTable,
  DateRangePicker,
  LineChart,
  MultiSelect,
  Progress,
  SegmentedBar,
  Segmented,
  Stat,
  addDays,
  startOfDay,
  type Column,
  type DateRange,
  type Series,
} from "@/components/ui";

/* Plantilla: analítica. Filtros en UNA fila encima de todo lo que filtran
 * (fechas primero); KPIs con sparkline; evolución en línea; reparto apilado;
 * cuota en barra segmentada; tabla de detalle. Cada gráfica trae vista de tabla. */

const CHANNELS: Series[] = [
  { key: "web", label: "Web", color: 1 },
  { key: "tienda", label: "Tienda", color: 2 },
  { key: "mayorista", label: "Mayorista", color: 3 },
];

const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function makeDays(n: number) {
  const r = rnd(11);
  const today = startOfDay(new Date());
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i - n + 1);
    const wave = 1 + 0.25 * Math.sin(i / 4) + (d.getDay() === 6 || d.getDay() === 0 ? 0.3 : 0);
    return {
      date: d,
      label: d.toISOString().slice(0, 10),
      web: Math.round(900 * wave + r() * 300 + i * 6),
      tienda: Math.round(620 * wave + r() * 220),
      mayorista: Math.round(380 + r() * 260 + i * 3),
    };
  });
}

const PRODUCTS = [
  { name: "Pistacho", units: 1840, revenue: 9200, share: 0.82 },
  { name: "Menta con chips", units: 1420, revenue: 7100, share: 0.64 },
  { name: "Sésamo negro", units: 980, revenue: 5880, share: 0.47 },
  { name: "Mango", units: 860, revenue: 4300, share: 0.38 },
  { name: "Vainilla", units: 640, revenue: 2560, share: 0.29 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange & { preset?: string }>({ from: addDays(startOfDay(new Date()), -29), to: startOfDay(new Date()), preset: "30d" });
  const [grain, setGrain] = useState<"day" | "week">("day");
  const [channels, setChannels] = useState(CHANNELS.map((c) => c.key));
  const all = useMemo(() => makeDays(120), []);

  const days = all.filter((d) => (!range.from || d.date >= range.from) && (!range.to || d.date <= range.to));
  const data = useMemo(() => (grain === "day" ? days : makeWeeks(days)), [days, grain]);

  /* color sigue a la entidad: filtrar canales no repinta los que quedan */
  const series = CHANNELS.filter((c) => channels.includes(c.key));
  const sum = (k: string) => days.reduce((a, d) => a + (d[k as "web"] ?? 0), 0);
  const total = series.reduce((a, s) => a + sum(s.key), 0);
  const fmt = new Intl.NumberFormat("es-ES");
  const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
  const xFormat = (v: string | number) => dayFmt.format(new Date(String(v) + "T00:00"));
  const spark = (k: "web" | "tienda" | "mayorista") => days.slice(-12).map((d) => d[k]);

  const columns: Column<(typeof PRODUCTS)[number]>[] = [
    { key: "name", header: "Sabor", render: (p) => <span className="font-medium">{p.name}</span>, sortValue: (p) => p.name },
    { key: "units", header: "Unidades", width: "110px", align: "right", render: (p) => fmt.format(p.units), sortValue: (p) => p.units },
    { key: "revenue", header: "Ingresos", width: "120px", align: "right", render: (p) => eur.format(p.revenue), sortValue: (p) => p.revenue },
    { key: "share", header: "Objetivo", width: "minmax(0,1fr)", render: (p) => <span className="flex w-full items-center gap-2"><Progress value={p.share * 100} className="flex-1" /><span className="w-9 text-right text-meta text-ink-3 tabular-nums">{Math.round(p.share * 100)}%</span></span> },
  ];

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-title text-ink">Analítica</h1>
          <p className="mt-1 text-body text-ink-3">Unidades vendidas por canal en el periodo elegido.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <Segmented
            size="sm"
            value={grain}
            onChange={setGrain}
            options={[
              { value: "day", label: "Día" },
              { value: "week", label: "Semana" },
            ]}
          />
          <MultiSelect className="w-full sm:w-64" value={channels} onChange={(v) => setChannels(v.length ? v : channels)} options={CHANNELS.map((c) => ({ value: c.key, label: c.label }))} placeholder="Canales" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Unidades totales" value={fmt.format(total)} delta="+8,2 % vs. periodo anterior" trend="up" spark={days.slice(-12).map((d) => d.web + d.tienda + d.mayorista)} />
          <Stat label="Web" value={fmt.format(sum("web"))} delta="+12,4 %" trend="up" spark={spark("web")} />
          <Stat label="Tienda" value={fmt.format(sum("tienda"))} delta="−3,1 %" trend="down" spark={spark("tienda")} />
          <Stat label="Devoluciones" value="1,8 %" delta="−0,4 pts" trend="down" goodWhen="down" />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="primitive-card-pad">
            <LineChart title="Unidades por canal" description={grain === "day" ? "Diario" : "Semanal"} data={data} x="label" xFormat={xFormat} series={series} area height={240} endLabels />
          </Card>
          <Card className="primitive-card-pad">
            <BarChart title="Reparto semanal" description="Apilado por canal" data={makeWeeks(days).slice(-8)} x="label" xFormat={xFormat} series={series} stacked height={240} />
          </Card>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Card className="primitive-card-pad flex flex-col gap-3">
            <div>
              <div className="text-body font-medium text-ink">Cuota por canal</div>
              <div className="text-meta text-ink-3">Del total del periodo</div>
            </div>
            <SegmentedBar tall parts={series.map((s) => ({ label: s.label, value: sum(s.key), color: s.color }))} format={(n) => fmt.format(n)} />
            <dl className="mt-auto divide-y divide-line">
              {series.map((s) => (
                <div key={s.key} className="flex items-center gap-2 py-2 text-body">
                  <dt className="flex flex-1 items-center gap-2 text-ink-2">
                    <span className="size-2 rounded-[2px]" style={{ background: `var(--chart-${s.color})` }} />
                    {s.label}
                  </dt>
                  <dd className="text-ink tabular-nums">{fmt.format(sum(s.key))}</dd>
                  <dd className="w-12 text-right text-meta text-ink-3 tabular-nums">{Math.round((sum(s.key) / (total || 1)) * 100)} %</dd>
                </div>
              ))}
            </dl>
          </Card>
          <DataTable columns={columns} rows={PRODUCTS} rowKey={(p) => p.name} minWidth={520} toolbar={<span className="text-body font-medium text-ink">Sabores más vendidos</span>} />
        </div>
      </div>
    </div>
  );
}

/** Semanas completas contadas desde el final: nunca una última barra a medias. */
function makeWeeks(days: ReturnType<typeof makeDays>) {
  const out: ReturnType<typeof makeDays> = [];
  for (let end = days.length; end - 7 >= 0; end -= 7) {
    const chunk = days.slice(end - 7, end);
    out.unshift({
      ...chunk[0],
      web: chunk.reduce((a, d) => a + d.web, 0),
      tienda: chunk.reduce((a, d) => a + d.tienda, 0),
      mayorista: chunk.reduce((a, d) => a + d.mayorista, 0),
    });
  }
  return out;
}
