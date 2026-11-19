import { useMemo, useState } from "react";
import {
  Avatar,
  Breadcrumb,
  Button,
  ContextMenu,
  DataTable,
  DateRangePicker,
  EmptyState,
  IconCopy,
  IconInbox,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  Input,
  MultiSelect,
  Pagination,
  Separator,
  Sheet,
  StatusPill,
  Tag,
  addDays,
  startOfDay,
  useToast,
  type Column,
  type DateRange,
  type Status,
} from "@/components/ui";

/* Plantilla: listado con filtros arriba (búsqueda, estado, fechas), tabla
 * ordenable y paginada, y detalle en Sheet al pulsar una fila. Clic derecho
 * en la tabla abre acciones. Sustituye ORDERS por tus datos. */

type Order = { id: string; customer: string; color: string; email: string; status: Status; total: number; items: number; date: Date; tags: string[] };

const NAMES = ["Mango Moon", "Kumo Creamery", "Alpine Churn", "Cone King", "Gelato Lab", "Frost & Co", "Vanilla Sky", "Polar Scoop", "Berry Bowl", "Cocoa Club", "Mint Hill", "Nube Dulce"];
const COLORS = ["#e5a321", "#16a6c7", "#25a878", "#e08a3c", "#2f6fec", "#7a5af8", "#d55181", "#1f7a5f"];
const STATUS: Status[] = ["todo", "progress", "done"];
const STATUS_LABEL: Record<Status, string> = { todo: "Pendiente", progress: "En curso", done: "Entregado" };
const TAGS = ["B2B", "Mayorista", "Urgente", "Nuevo"];

/* datos de ejemplo deterministas */
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const r = rnd(7);
const today = startOfDay(new Date());
export const ORDERS: Order[] = Array.from({ length: 48 }, (_, i) => {
  const name = NAMES[i % NAMES.length];
  return {
    id: `#${1040 + i}`,
    customer: name,
    color: COLORS[i % COLORS.length],
    email: `pedidos@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    status: STATUS[Math.floor(r() * 3)],
    total: Math.round(r() * 480000) / 100 + 40,
    items: 1 + Math.floor(r() * 24),
    date: addDays(today, -Math.floor(r() * 80)),
    tags: TAGS.filter(() => r() > 0.7),
  };
});

const PAGE = 10;

export default function ListDetailPage({ orders = ORDERS }: { orders?: Order[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status[]>([]);
  const [range, setRange] = useState<DateRange & { preset?: string }>({ from: addDays(today, -89), to: today, preset: "90d" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Order | null>(null);

  const money = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const date = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (!q || o.customer.toLowerCase().includes(q) || o.id.includes(q)) &&
        (!status.length || status.includes(o.status)) &&
        (!range.from || o.date >= range.from) &&
        (!range.to || o.date <= range.to),
    );
  }, [orders, query, status, range]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);

  const columns: Column<Order>[] = [
    { key: "id", header: "Pedido", width: "84px", render: (o) => <span className="font-mono text-meta text-ink-2">{o.id}</span>, sortValue: (o) => o.id },
    {
      key: "customer",
      header: "Cliente",
      width: "minmax(0,1.4fr)",
      sortValue: (o) => o.customer,
      render: (o) => (
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={o.customer} color={o.color} size="sm" square />
          <span className="truncate font-medium">{o.customer}</span>
          {o.tags.slice(0, 1).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </span>
      ),
    },
    { key: "status", header: "Estado", width: "120px", sortValue: (o) => STATUS.indexOf(o.status), render: (o) => <StatusPill status={o.status}>{STATUS_LABEL[o.status]}</StatusPill> },
    { key: "date", header: "Fecha", width: "84px", sortValue: (o) => o.date.getTime(), render: (o) => <span className="text-ink-2">{date.format(o.date)}</span> },
    { key: "total", header: "Total", width: "110px", align: "right", sortValue: (o) => o.total, render: (o) => <span className="font-mono text-meta">{money(o.total)}</span> },
  ];

  const pageRows = filtered.slice((current - 1) * PAGE, current * PAGE);

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 py-6 sm:px-6">
        <Breadcrumb items={[{ label: "Acme", href: "#" }, { label: "Ventas", href: "#" }, { label: "Pedidos" }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-title text-ink">Pedidos</h1>
            <p className="mt-1 text-body text-ink-3">{filtered.length} pedidos en el periodo seleccionado.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => toast("Nuevo pedido (conecta tu formulario)")}>
            <IconPlus size={13} /> Nuevo pedido
          </Button>
        </div>

        {/* filtros: una fila, encima de lo que filtran */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-full sm:w-64"
            placeholder="Buscar cliente o nº…"
            aria-label="Buscar"
            leading={<IconSearch size={14} />}
            value={query}
            onChange={(e) => (setQuery(e.target.value), setPage(1))}
          />
          <MultiSelect
            className="w-full sm:w-56"
            placeholder="Estado"
            value={status}
            onChange={(v) => (setStatus(v), setPage(1))}
            options={STATUS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <DateRangePicker value={range} onChange={(v) => (setRange(v), setPage(1))} />
          {(query || status.length > 0) && (
            <Button size="xs" variant="quiet" onClick={() => (setQuery(""), setStatus([]))}>
              Limpiar filtros
            </Button>
          )}
        </div>

        <ContextMenu
          items={[
            { type: "label", label: `${selected.size || "Sin"} seleccionados` },
            { label: "Duplicar", icon: <IconCopy size={14} />, onSelect: () => toast("Duplicado") },
            { label: "Exportar CSV", icon: <IconPencil size={14} />, onSelect: () => toast("Exportando…") },
            { type: "separator" },
            { label: "Eliminar", icon: <IconTrash size={14} />, danger: true, onSelect: () => toast("Eliminados") },
          ]}
        >
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(o) => o.id}
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={setOpen}
            minWidth={640}
            empty={
              <EmptyState
                icon={<IconInbox size={15} />}
                title="Sin resultados"
                hint="Prueba con otro filtro o amplía el rango de fechas."
                action={
                  <Button size="xs" onClick={() => (setQuery(""), setStatus([]), setRange({ from: null, to: null }))}>
                    Quitar filtros
                  </Button>
                }
              />
            }
            footer={
              <>
                <span className="tabular-nums">
                  {filtered.length ? `${(current - 1) * PAGE + 1}–${Math.min(current * PAGE, filtered.length)} de ${filtered.length}` : "0 resultados"}
                </span>
                <Pagination page={current} total={pages} onChange={setPage} />
              </>
            }
          />
        </ContextMenu>
      </div>

      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `Pedido ${open.id}` : ""}
        description={open?.customer}
        footer={
          <>
            <Button size="sm" variant="quiet" onClick={() => setOpen(null)}>
              Cerrar
            </Button>
            <Button size="sm" variant="accent" onClick={() => (toast(`Factura de ${open?.id} enviada`), setOpen(null))}>
              Enviar factura
            </Button>
          </>
        }
      >
        {open && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={open.customer} color={open.color} size="lg" square />
              <div className="min-w-0">
                <div className="truncate text-body font-medium text-ink">{open.customer}</div>
                <div className="truncate text-meta text-ink-3">{open.email}</div>
              </div>
              <StatusPill status={open.status} className="ml-auto">
                {STATUS_LABEL[open.status]}
              </StatusPill>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-card bg-inset p-3">
              {[
                ["Total", money(open.total)],
                ["Artículos", String(open.items)],
                ["Fecha", new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(open.date)],
                ["Etiquetas", open.tags.join(", ") || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-meta text-ink-3">{k}</dt>
                  <dd className="text-body text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <Separator />
            <div>
              <h3 className="mb-2 text-overline text-ink-3 uppercase">Actividad</h3>
              <ol className="flex flex-col gap-3 border-l border-line pl-4">
                {["Pedido creado", "Pago confirmado", open.status === "done" ? "Entregado" : "Preparando envío"].map((e, i) => (
                  <li key={e} className="relative text-body text-ink-2">
                    <span className="absolute top-1.5 -left-[20.5px] size-2 rounded-full bg-surface shadow-[0_0_0_1.5px_var(--line-strong)]" />
                    {e}
                    <span className="ml-2 text-meta text-ink-3">{date.format(addDays(open.date, i))}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
