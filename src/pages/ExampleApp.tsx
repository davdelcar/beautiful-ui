import { useEffect, useRef, useState } from "react";
import { createStickToBottom } from "@ui-sdk/core";
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
  CommandPalette,
  IconHome,
  IconInbox,
  IconMenu,
  IconMoon,
  IconSettings,
  Sheet,
  modKey,
  useHotkey,
  useTheme,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
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
  buttonVariants,
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
const PERIOD_STATS = {
  d: { revenue: "$6,230", orders: "164", average: "$37.99" },
  w: { revenue: "$48,210", orders: "1,284", average: "$37.55" },
  m: { revenue: "$203,840", orders: "5,396", average: "$37.78" },
};

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
  const [orders, setOrders] = useState(ORDERS);
  const stats = PERIOD_STATS[range];

  const count = (s: Status) => orders.filter((o) => o.status === s).length;
  const removeOrder = (order: Order) => {
    setOrders((previous) => previous.filter((item) => item.id !== order.id));
    setSel((previous) => new Set([...previous].filter((id) => id !== order.id)));
    toast("Tarea eliminada", { label: "Deshacer", onClick: () => {
      setOrders((previous) => [...previous, order].sort((a, b) => Number(a.id) - Number(b.id)));
    } });
  };
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
      render: (order) => (
        <Menu
          align="end"
          trigger={({ toggle }) => (
            <IconButton label="Acciones" onClick={toggle} tooltip={false}>
              <IconMore size={15} />
            </IconButton>
          )}
          items={[
            { label: "Editar", icon: <IconPencil size={14} />, onSelect: () => toast("La edición de tareas no está conectada en esta demo.") },
            { label: "Preguntar al agente", icon: <IconSparkle size={13} />, onSelect: () => toast("Abre el asistente para probar una conversación.") },
            { type: "separator" },
            { label: "Eliminar", icon: <IconTrash size={14} />, danger: true, onSelect: () => removeOrder(order) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 p-4 @xl:p-6">
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

      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}>
        <Stat label="Ingresos" value={stats.revenue} delta={range === "w" ? "+12.4%" : undefined} trend="up" />
        <Stat label="Pedidos" value={stats.orders} delta={range === "w" ? "+4.0%" : undefined} trend="up" />
        <Stat label="Ticket medio" value={stats.average} delta={range === "w" ? "−1.8%" : undefined} trend="down" />
        <Stat label="Stock crítico" value="7" delta="SKUs" />
      </div>

      <div className="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 120ms both" }}>
        <Card className="primitive-card-pad flex justify-center [&>*]:max-w-none [&>*]:min-w-0">
          <InsightCards />
        </Card>
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader title="Actividad del agente" icon={<IconSparkle className="text-accent" />} />
            <div className="primitive-card-pad flex justify-center [&>*]:max-w-none">
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
            { value: "orders", label: "Tareas", count: orders.length },
            { value: "records", label: "Proveedores" },
            { value: "diff", label: "Cambios propuestos", count: 3 },
          ]}
        />
        {tab === "orders" && (
          <DataTable
            columns={columns}
            rows={orders}
            rowKey={(r) => r.id}
            isVisible={(r) => filter === "all" || r.status === filter}
            selected={sel}
            onSelectedChange={setSel}
            empty={<EmptyState icon={<IconInbox />} title="Sin tareas con este estado" />}
            minWidth={680}
            toolbar={
              <>
                <FilterChips
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "Todas", count: orders.length },
                    { value: "todo", label: "Por hacer", dot: "#f09a2f", count: count("todo") },
                    { value: "progress", label: "En curso", dot: "#16a6c7", count: count("progress") },
                    { value: "done", label: "Completadas", dot: "#25a878", count: count("done") },
                  ]}
                />
                <Button size="xs" variant="accent" onClick={() => toast("La creación de tareas no está conectada en esta demo.")}>
                  <IconPlus size={12} /> Nueva
                </Button>
              </>
            }
            footer={
              <>
                <span>{sel.size ? `${sel.size} seleccionadas` : `${filter === "all" ? orders.length : count(filter)} tareas`}</span>
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

function Assistant({ onClose, onNewChat, title, messages, onSend }: {
  onClose: () => void;
  onNewChat: () => void;
  title: string | null;
  messages: Msg[];
  onSend: (text: string) => void;
}) {
  const toast = useToast();
  const threadRef = useRef<HTMLDivElement>(null);
  const [thread] = useState(() => createStickToBottom({ initial: title !== null }));
  useEffect(() => {
    if (threadRef.current) return thread.connect(threadRef.current);
  }, [thread]);
  const send = (text: string) => {
    thread.scrollToBottom();
    onSend(text);
  };
  return (
    <aside className="flex h-full w-full flex-col bg-page" aria-label="Asistente">
      <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line pr-2 pl-3.5">
        <IconSparkle className="text-accent" />
        <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink">{title ?? "Asistente"}</span>
        <IconButton label="Nuevo chat" onClick={onNewChat}>
          <IconPlus size={15} />
        </IconButton>
        <IconButton label="Cerrar" onClick={onClose}>
          <IconX size={15} />
        </IconButton>
      </div>
      <div ref={threadRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-3.5 py-4">
        {title === null && <>
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
          <StreamingText fill loop={false} content={FIRST_REPLY} labels={{ sources: "fuentes", followUps: "Siguientes preguntas" }} followUps={["¿Qué sabores venden mejor en invierno?", "Prepara el pedido de agosto"]} onFollowUp={send} />
          <div className="[&>*]:max-w-none">
            <ApprovalCard
              questions={QUESTIONS}
              labels={{ skip: "Omitir", continue: "Continuar", send: "Enviar", customPlaceholder: "Otra respuesta…", sentMessage: "Respuestas enviadas" }}
              onSubmitted={() => toast("Respuestas registradas en esta demo.")}
            />
          </div>
        </>}
        {title !== null && messages.length === 0 && <p className="text-body text-ink-3">Escribe un mensaje para empezar.</p>}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="self-end rounded-[14px] rounded-br-[4px] bg-hover-2 px-3 py-2 text-[14px] text-ink">
              {m.text}
            </div>
          ) : (
            <StreamingText key={m.id} fill loop={false} content={words(m.text)} sources={[]} followUps={[]} showActions={false} />
          ),
        )}
      </div>
      <div className="shrink-0 px-3 pb-3">
        <PromptBar
          demo={false}
          textOnly
          placeholder="Escribe un mensaje"
          onSend={send}
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
  const [assistantModal, setAssistantModal] = useState(false);
  const [histories, setHistories] = useState<Record<string, Msg[]>>({});
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const toast = useToast();
  const theme = useTheme();
  useHotkey("k", () => setPalette((o) => !o));

  const openAssistant = () => {
    if (window.matchMedia("(min-width: 80rem)").matches) setAssistant(true);
    else setAssistantModal(true);
  };
  const newChat = () => {
    setHistories((previous) => ({ ...previous, "Nuevo chat": [] }));
    setChat("Nuevo chat");
    setMobileNav(false);
    openAssistant();
  };
  const pickChat = (label: string) => {
    setChat(label);
    setMobileNav(false);
    openAssistant();
  };
  const key = chat ?? "example";
  const assistantView = (onClose: () => void) => (
    <Assistant key={key} title={chat} messages={histories[key] ?? []} onNewChat={newChat} onClose={onClose} onSend={(text) => {
      setHistories((previous) => {
        const history = previous[key] ?? [];
        return {
          ...previous,
          [key]: [
            ...history,
            { id: history.length, role: "user", text },
            { id: history.length + 1, role: "agent", text: "Respuesta de ejemplo. La demo no consulta datos ni ejecuta acciones." },
          ],
        };
      });
    }} />
  );

  const sidebar = (mobile: boolean) => (
    <SidebarNav
      fill
      recents={RECENTS}
      activeNav={nav}
      onNavigate={(k) => {
        setNav(k);
        setChat(null);
        if (mobile) setMobileNav(false);
      }}
      activeTitle={chat}
      onPick={(_, label) => pickChat(label)}
      onNewChat={newChat}
      footerLabel="Mejorar plan"
      onFooterClick={() => toast("El cambio de plan no está conectado en esta demo.")}
      className={mobile ? undefined : "border-r border-line"}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <div className="hidden md:flex">{sidebar(false)}</div>
      <Sheet open={mobileNav} onClose={() => setMobileNav(false)} side="left" width={224} title="Navegación" bare>
        {sidebar(true)}
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-page pr-3 pl-4">
          <span className="-ml-1.5 flex md:hidden">
            <IconButton label="Menú" tooltip={false} onClick={() => setMobileNav(true)}>
              <IconMenu size={16} />
            </IconButton>
          </span>
          <nav className="flex min-w-0 items-center gap-1.5 text-body whitespace-nowrap text-ink-3" aria-label="Ruta">
            <span className="hidden lg:inline">Creamery Ops</span>
            <IconChevronRight size={12} className="hidden shrink-0 lg:block" />
            <span className="truncate font-semibold text-ink">{chat ?? "Inicio"}</span>
          </nav>
          <button
            type="button"
            onClick={() => setPalette(true)}
            className="ml-auto hidden h-8 w-44 shrink-0 items-center gap-2 rounded-control bg-field px-2.5 text-body text-ink-3 shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-hover sm:flex"
          >
            <IconSearch size={14} />
            <span className="flex-1 text-left">Buscar…</span>
            <Kbd>{modKey()} K</Kbd>
          </button>
          <span className="ml-auto flex sm:hidden">
            <IconButton label="Buscar" onClick={() => setPalette(true)}>
              <IconSearch size={16} />
            </IconButton>
          </span>
          <IconButton label="Notificaciones" onClick={() => toast("Sin notificaciones nuevas")}>
            <IconBell size={16} />
          </IconButton>
          <ThemeToggle />
          <span className={assistant ? "flex xl:hidden" : "flex"}>
            <IconButton label="Abrir asistente" onClick={openAssistant}>
              <IconSparkle className="text-accent" />
            </IconButton>
          </span>
          <span className="hidden shrink-0 2xl:flex">
            <a href="#/" className={buttonVariants({ size: "sm", className: "whitespace-nowrap" })}>Sistema de diseño</a>
          </span>
        </header>
        <main className="@container flex-1 overflow-y-auto bg-canvas">
          <Dashboard />
        </main>
      </div>

      {assistant && (
        <div className="hidden w-[380px] shrink-0 border-l border-line xl:flex">
          {assistantView(() => setAssistant(false))}
        </div>
      )}
      <Sheet open={assistantModal} onClose={() => setAssistantModal(false)} title="Asistente" bare>
        {assistantView(() => setAssistantModal(false))}
      </Sheet>

      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        placeholder="Buscar chats, páginas o acciones…"
        groups={[
          {
            label: "Navegar",
            items: [
              { id: "home", label: "Inicio", icon: <IconHome size={15} />, onSelect: () => (setNav("home"), setChat(null)) },
              { id: "settings", label: "Ajustes", icon: <IconSettings size={15} />, onSelect: () => (location.hash = "#/plantillas/ajustes") },
              { id: "ds", label: "Sistema de diseño", icon: <IconChevronRight size={15} />, onSelect: () => (location.hash = "#/") },
            ],
          },
          {
            label: "Chats recientes",
            items: RECENTS.map((r, i) => ({
              id: `chat-${i}`,
              label: r.label,
              icon: <IconSparkle size={15} />,
              onSelect: () => pickChat(r.label),
            })),
          },
          {
            label: "Acciones",
            items: [
              { id: "new", label: "Nuevo chat con el asistente", icon: <IconPlus size={15} />, keywords: ["crear", "preguntar"], onSelect: newChat },
              { id: "theme", label: theme.dark ? "Tema claro" : "Tema oscuro", icon: <IconMoon size={15} />, keywords: ["tema", "dark", "modo"], onSelect: theme.toggle },
              { id: "notif", label: "Ver notificaciones", icon: <IconBell size={15} />, onSelect: () => toast("Sin notificaciones nuevas") },
            ],
          },
        ]}
      />
    </div>
  );
}
