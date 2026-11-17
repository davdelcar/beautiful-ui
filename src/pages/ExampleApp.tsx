import { useState } from "react";
import ApprovalCard, { type ApprovalQuestion } from "@/components/primitives/ApprovalCard";
import DiffTable from "@/components/primitives/DiffTable";
import InsightCards from "@/components/primitives/InsightCards";
import PromptBar from "@/components/primitives/PromptBar";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import RecordsTable from "@/components/primitives/RecordsTable";
import SidebarNav, { type SidebarRecent } from "@/components/primitives/SidebarNav";
import StreamingText, { type StreamingToken } from "@/components/primitives/StreamingText";
import TaskRows, { type TaskRow } from "@/components/primitives/TaskRows";
import ThinkingState from "@/components/primitives/ThinkingState";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  DataTable,
  FilterChips,
  IconBell,
  IconButton,
  IconChevronRight,
  IconMore,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSparkle,
  IconTrash,
  IconX,
  Input,
  Kbd,
  Menu,
  Segmented,
  Stat,
  StatusPill,
  Tabs,
  ThemeToggle,
  useToast,
  type Column,
  type Status,
} from "@/components/ui";

/* ── datos de ejemplo ─────────────────────────────────── */

const RECENTS: SidebarRecent[] = [
  { id: "proveedores", label: "Registros de proveedores" },
  { id: "urgentes", label: "Urgentes de esta mañana" },
  { id: "sabores", label: "Ticket página de sabores" },
  { id: "carga", label: "Resumen de carga" },
  { id: "baja", label: "Dar de baja a un proveedor" },
  { id: "reposicion", label: "Función de reposición" },
];

const TASKS: TaskRow[] = [
  {
    key: "verify",
    label: "Proveedores verificados",
    amount: "12 proveedores",
    status: "done",
    details: [
      { label: "NIF y contactos coinciden", meta: "12/12" },
      { label: "Registros antiguos marcados", meta: "0" },
    ],
  },
  {
    key: "reorder",
    label: "Lista de reposición",
    amount: "7 SKUs",
    status: "running",
    step: 2,
    details: [
      { label: "Leyendo exportación del TPV", meta: "3 archivos" },
      { label: "Calculando riesgo de rotura", meta: "68%" },
    ],
  },
  {
    key: "emails",
    label: "Borradores a proveedores",
    amount: "2 mensajes",
    status: "sequence",
    step: 3,
    details: [
      { label: "Seguimiento conos", meta: "borrador" },
      { label: "Confirmación lácteos", meta: "borrador" },
    ],
  },
];

type Order = { id: string; task: string; date: string; status: Status; owner: string; color: string; amount: number };
const ORDERS: Order[] = [
  { id: "1", task: "Reponer sorbete de mango", date: "03 dic", status: "todo", owner: "Mango Moon", color: "#e5a321", amount: 1240 },
  { id: "2", task: "Batir sésamo negro", date: "22 sep", status: "progress", owner: "Kumo Creamery", color: "#16a6c7", amount: 860.5 },
  { id: "3", task: "Imprimir menú de verano", date: "02 ene", status: "todo", owner: "Coral Coast", color: "#e0567a", amount: 310 },
  { id: "4", task: "Cata del lote 42", date: "08 nov", status: "progress", owner: "Maple Orbit", color: "#8a6be0", amount: 0 },
  { id: "5", task: "Pedido de conos", date: "14 abr", status: "done", owner: "Cone King", color: "#e08a3c", amount: 2453.44 },
];
const STATUS_LABEL: Record<Status, string> = { todo: "Por hacer", progress: "En curso", done: "Completada" };

const QUESTIONS: ApprovalQuestion[] = [
  { q: "¿Reduzco el pedido de menta para agosto?", type: "radio", options: ["Sí, un 20%", "Sí, un 10%", "Mantener igual"] },
  { q: "¿A quién aviso del cambio?", type: "check", options: ["Cone King", "Kumo Creamery", "Equipo de tienda"] },
];

const words = (s: string): StreamingToken[] => s.split(" ").map((text) => ({ text }));
const FIRST_REPLY: StreamingToken[] = [
  ...words("La menta con chips cayó un 4.4% frente al verano pasado, sobre todo en julio."),
  { text: "", cite: true },
  ...words("El pistacho compensó con +1.2% y mejores picos de fin de semana."),
];

type Msg = { id: number; role: "user" | "agent"; text: string };

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ── vista principal ──────────────────────────────────── */

function Dashboard() {
  const toast = useToast();
  const [range, setRange] = useState<"d" | "w" | "m">("w");
  const [tab, setTab] = useState<"orders" | "records" | "diff">("orders");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const count = (s: Status) => ORDERS.filter((o) => o.status === s).length;
  const columns: Column<Order>[] = [
    { key: "task", header: "Tarea", width: "minmax(0,1.5fr)", render: (r) => <span className="truncate font-medium">{r.task}</span> },
    { key: "date", header: "Fecha", width: "84px", render: (r) => <span className="text-ink-2 tabular-nums">{r.date}</span> },
    { key: "status", header: "Estado", width: "124px", render: (r) => <StatusPill status={r.status}>{STATUS_LABEL[r.status]}</StatusPill> },
    {
      key: "owner",
      header: "Proveedor",
      width: "minmax(0,1fr)",
      render: (r) => (
        <span className="flex min-w-0 items-center gap-2 text-ink-2">
          <Avatar name={r.owner} color={r.color} size="sm" square />
          <span className="truncate">{r.owner}</span>
        </span>
      ),
    },
    { key: "amount", header: "Importe", width: "104px", align: "right", render: (r) => <span className="font-mono text-[12px]">{money(r.amount)}</span> },
    {
      key: "more",
      header: "",
      width: "44px",
      render: () => (
        <Menu
          align="end"
          trigger={({ toggle }) => (
            <IconButton label="Acciones" onClick={toggle} tooltip={false}>
              <IconMore size={15} />
            </IconButton>
          )}
          items={[
            { label: "Editar", icon: <IconPencil size={14} /> },
            { label: "Preguntar al agente", icon: <IconSparkle size={13} /> },
            { type: "separator" },
            { label: "Eliminar", icon: <IconTrash size={14} />, danger: true, onSelect: () => toast("Tarea eliminada", { label: "Deshacer", onClick: () => {} }) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Buenos días, Ana</h1>
          <p className="text-[13px] text-ink-3">El agente completó 3 tareas mientras no estabas.</p>
        </div>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: "d", label: "Hoy" },
            { value: "w", label: "7 días" },
            { value: "m", label: "30 días" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}>
        <Stat label="Ingresos" value="$48,210" delta="+12.4%" trend="up" />
        <Stat label="Pedidos" value="1,284" delta="+4.0%" trend="up" />
        <Stat label="Ticket medio" value="$37.55" delta="−1.8%" trend="down" />
        <Stat label="Stock crítico" value="7" delta="SKUs" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 120ms both" }}>
        <Card className="primitive-card-pad flex justify-center">
          <InsightCards />
        </Card>
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader title="Actividad del agente" icon={<IconSparkle className="text-accent" />} />
            <div className="primitive-card-pad flex justify-center">
              <TaskRows rows={TASKS} labels={{ completed: "Completada", failed: "Fallida" }} className="w-full" />
            </div>
          </Card>
          <div className="flex justify-center [&>*]:max-w-none">
            <RecommendationCard />
          </div>
        </div>
      </div>

      <div style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 180ms both" }}>
        <Tabs
          className="mb-3"
          value={tab}
          onChange={setTab}
          options={[
            { value: "orders", label: "Tareas", count: ORDERS.length },
            { value: "records", label: "Proveedores" },
            { value: "diff", label: "Cambios propuestos", count: 3 },
          ]}
        />
        {tab === "orders" && (
          <DataTable
            columns={columns}
            rows={ORDERS}
            rowKey={(r) => r.id}
            isVisible={(r) => filter === "all" || r.status === filter}
            selected={sel}
            onSelectedChange={setSel}
            minWidth={680}
            toolbar={
              <>
                <FilterChips
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "Todas", count: ORDERS.length },
                    { value: "todo", label: "Por hacer", dot: "#f09a2f", count: count("todo") },
                    { value: "progress", label: "En curso", dot: "#16a6c7", count: count("progress") },
                    { value: "done", label: "Completadas", dot: "#25a878", count: count("done") },
                  ]}
                />
                <Button size="xs" variant="accent" onClick={() => toast("Tarea creada")}>
                  <IconPlus size={12} /> Nueva
                </Button>
              </>
            }
            footer={
              <>
                <span>{sel.size ? `${sel.size} seleccionadas` : `${ORDERS.length} tareas`}</span>
                {sel.size > 0 && (
                  <Button size="xs" variant="quiet" onClick={() => setSel(new Set())}>
                    Limpiar selección
                  </Button>
                )}
              </>
            }
          />
        )}
        {tab === "records" && <RecordsTable />}
        {tab === "diff" && (
          <div className="flex justify-center">
            <DiffTable />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── panel del asistente ──────────────────────────────── */

function Assistant({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-line bg-page" aria-label="Asistente">
      <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line pr-2 pl-3.5">
        <IconSparkle className="text-accent" />
        <span className="flex-1 text-[13px] font-semibold text-ink">Asistente</span>
        <IconButton label="Nuevo chat" onClick={() => setMsgs([])}>
          <IconPlus size={15} />
        </IconButton>
        <IconButton label="Cerrar" onClick={onClose}>
          <IconX size={15} />
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3.5 py-4">
        <div className="self-end rounded-[14px] rounded-br-[4px] bg-hover-2 px-3 py-2 text-[14px] text-ink">Compara la menta con chips con el verano pasado</div>
        <ThinkingState
          variant="Steps"
          active="Pensando"
          done="Pensó durante 4s"
          rows={[
            { primary: "Leí 3 veranos de ventas", secondary: "ventas_2024.csv", mono: true },
            { primary: "Consulté tendencias", secondary: "trends.google.com" },
            { primary: "Comparé con la media de temporada" },
          ]}
        />
        <StreamingText fill loop={false} content={FIRST_REPLY} labels={{ sources: "fuentes", followUps: "Siguientes preguntas" }} followUps={["¿Qué sabores venden mejor en invierno?", "Prepara el pedido de agosto"]} />
        <div className="[&>*]:max-w-none">
          <ApprovalCard
            questions={QUESTIONS}
            labels={{ skip: "Omitir", continue: "Continuar", send: "Enviar", customPlaceholder: "Otra respuesta…", sentMessage: "Respuestas enviadas" }}
            onSubmitted={() => toast("Pedido de agosto actualizado", { label: "Deshacer", onClick: () => {} })}
          />
        </div>
        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="self-end rounded-[14px] rounded-br-[4px] bg-hover-2 px-3 py-2 text-[14px] text-ink">
              {m.text}
            </div>
          ) : (
            <StreamingText key={m.id} fill loop={false} content={words(m.text)} sources={[]} followUps={[]} />
          ),
        )}
      </div>
      <div className="shrink-0 px-3 pb-3">
        <PromptBar
          demo={false}
          placeholder="Pregunta, @ fuentes, / comandos"
          onSend={(text) =>
            setMsgs((xs) => [
              ...xs,
              { id: Date.now(), role: "user", text },
              { id: Date.now() + 1, role: "agent", text: "Entendido. Reviso los datos de ventas y te propongo los siguientes pasos en un momento." },
            ])
          }
        />
      </div>
    </aside>
  );
}

/* ── shell ────────────────────────────────────────────── */

export default function ExampleApp() {
  const [nav, setNav] = useState("home");
  const [chat, setChat] = useState<string | null>(null);
  const [assistant, setAssistant] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <div className="hidden md:flex">
        <SidebarNav
          fill
          recents={RECENTS}
          activeNav={nav}
          onNavigate={(k) => {
            setNav(k);
            setChat(null);
          }}
          activeTitle={chat}
          onPick={(_, label) => setChat(label)}
          onNewChat={() => setAssistant(true)}
          footerLabel="Mejorar plan"
          className="border-r border-line"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-page pr-3 pl-4">
          <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-3" aria-label="Ruta">
            <span>Creamery Ops</span>
            <IconChevronRight size={12} />
            <span className="truncate font-semibold text-ink">{chat ?? "Inicio"}</span>
          </nav>
          <Input className="ml-auto hidden w-60 sm:flex" placeholder="Buscar…" aria-label="Buscar" leading={<IconSearch size={14} />} trailing={<Kbd>⌘K</Kbd>} />
          <IconButton label="Notificaciones">
            <IconBell size={16} />
          </IconButton>
          <ThemeToggle />
          {!assistant && (
            <IconButton label="Abrir asistente" onClick={() => setAssistant(true)}>
              <IconSparkle className="text-accent" />
            </IconButton>
          )}
          <a href="#/" className="hidden sm:block">
            <Button size="sm">Sistema de diseño</Button>
          </a>
        </header>
        <main className="flex-1 overflow-y-auto bg-canvas">
          <Dashboard />
        </main>
      </div>

      {assistant && (
        <div className="hidden xl:flex">
          <Assistant onClose={() => setAssistant(false)} />
        </div>
      )}
    </div>
  );
}
