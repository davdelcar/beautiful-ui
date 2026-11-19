import { useState, type ReactNode } from "react";
import { DataViz, MoreFoundations, MoreKit, Templates } from "./GalleryMore";
import { Group, Showcase } from "./Showcase";
import { Button } from "@/components/atoms/Button";
import { EntityChip } from "@/components/atoms/EntityChip";
import { Shimmer } from "@/components/atoms/Shimmer";
import { StreamText } from "@/components/atoms/StreamText";
import { ValuePill } from "@/components/atoms/ValuePill";
import ApprovalCard from "@/components/primitives/ApprovalCard";
import ChatComposer from "@/components/primitives/ChatComposer";
import CodeBlock from "@/components/primitives/CodeBlock";
import ContextCards from "@/components/primitives/ContextCards";
import DiffTable from "@/components/primitives/DiffTable";
import FilterTable from "@/components/primitives/FilterTable";
import FineTuneCard from "@/components/primitives/FineTuneCard";
import Flowchart from "@/components/primitives/Flowchart";
import InsightCards from "@/components/primitives/InsightCards";
import LoadingState from "@/components/primitives/LoadingState";
import PromptBar from "@/components/primitives/PromptBar";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import RecordsTable from "@/components/primitives/RecordsTable";
import SearchList from "@/components/primitives/SearchList";
import SelectionActions from "@/components/primitives/SelectionActions";
import SidebarNav from "@/components/primitives/SidebarNav";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import {
  Alert,
  Avatar,
  AvatarStack,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Combobox,
  CommandPalette,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  FilterChips,
  IconButton,
  IconArrowRight,
  IconBell,
  IconCopy,
  IconFilter,
  IconMoon,
  IconInbox,
  IconLink,
  IconMore,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSparkle,
  IconTrash,
  Input,
  Kbd,
  Menu,
  Popover,
  Sheet,
  modKey,
  setTheme,
  useHotkey,
  Progress,
  RadioGroup,
  Segmented,
  Select,
  Spinner,
  Stat,
  StatusPill,
  Switch,
  Tabs,
  Tag,
  Textarea,
  Tooltip,
  useToast,
  type Column,
  type Status,
} from "@/components/ui";

/** Variantes con el Segmented del kit; `key` remonta el primitive al cambiar. */
function useVariants<T extends string>({ options, render }: { options: T[]; render: (v: T) => ReactNode }) {
  const [v, setV] = useState(options[0]);
  return { v, node: render(v), control: <Segmented size="sm" value={v} onChange={setV} options={options.map((o) => ({ value: o, label: o }))} /> };
}

/* ── fundamentos ── */

const SWATCHES: [string, string][] = [
  ["page", "--page"], ["canvas", "--canvas"], ["surface", "--surface"], ["inset", "--inset"], ["field", "--field"], ["hover-2", "--hover-2"],
  ["ink", "--ink"], ["ink-2", "--ink-2"], ["ink-3", "--ink-3"], ["line", "--line"], ["line-strong", "--line-strong"], ["tooltip-bg", "--tooltip-bg"],
];
const SEMANTIC = ["accent", "green", "orange", "red"];

function Foundations() {
  return (
    <>
      <Showcase id="color" title="Color" desc="Neutros fríos, un único acento y semánticos sólido + tint.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SWATCHES.map(([name, v]) => (
            <div key={name} className="overflow-hidden rounded-card bg-surface shadow-card">
              <div className="h-12 shadow-[inset_0_-1px_0_var(--line)]" style={{ background: `var(${v})` }} />
              <div className="px-2 py-1.5">
                <div className="text-[12px] font-medium text-ink">{name}</div>
                <div className="font-mono text-[10px] text-ink-3">{v}</div>
              </div>
            </div>
          ))}
          {SEMANTIC.map((c) => (
            <div key={c} className="overflow-hidden rounded-card bg-surface shadow-card">
              <div className="flex h-12">
                <span className="flex-1" style={{ background: `var(--${c})` }} />
                <span className="flex-1" style={{ background: `var(--${c}-tint)` }} />
              </div>
              <div className="px-2 py-1.5">
                <div className="text-[12px] font-medium text-ink">{c}</div>
                <div className="font-mono text-[10px] text-ink-3">--{c} / -tint</div>
              </div>
            </div>
          ))}
        </div>
      </Showcase>
      <Showcase id="tipografia" title="Tipografía" desc="Escala con nombre: tamaño, interlineado, tracking y peso en una sola clase.">
        <Card className="mx-auto max-w-140 divide-y divide-line">
          {[
            ["text-display", <span className="text-display">Beautiful UI</span>],
            ["text-title", <span className="text-title">Buenos días, Ana</span>],
            ["text-heading", <span className="text-heading">Título de diálogo</span>],
            ["text-lead", <span className="text-lead text-ink-2">El agente revisó 12 registros.</span>],
            ["text-body", <span className="text-body">Fila de tabla, botón, menú</span>],
            ["text-meta", <span className="text-meta text-ink-3">Descripción secundaria</span>],
            ["text-micro", <span className="font-mono text-micro tabular-nums">churn.ts · 12/12 · +$2,453.44</span>],
            ["text-overline", <span className="text-overline text-ink-3 uppercase">Etiqueta de grupo</span>],
          ].map(([k, el]) => (
            <div key={k as string} className="grid grid-cols-[96px_1fr] items-baseline gap-3 px-3 py-2.5">
              <span className="font-mono text-[10.5px] text-ink-3">{k}</span>
              {el}
            </div>
          ))}
        </Card>
      </Showcase>
      <Showcase id="forma" title="Radios y sombras" desc="chip 6 · control 8 · card 10 · window 14; anillo de 1px + sombra en capas.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {["shadow-hairline", "shadow-btn", "shadow-card", "shadow-raised", "shadow-overlay"].map((s, i) => (
            <div
              key={s}
              className={`flex h-16 items-center justify-center bg-surface font-mono text-[10.5px] text-ink-3 ${s} ${["rounded-chip", "rounded-control", "rounded-card", "rounded-card", "rounded-window"][i]}`}
            >
              {s.replace("shadow-", "")}
            </div>
          ))}
        </div>
      </Showcase>
    </>
  );
}

/* ── átomos oficiales ── */

function Atoms() {
  const [run, setRun] = useState(0);
  return (
    <>
      <Showcase id="button" title="Button" desc="Átomo oficial: pill por defecto, 6 variantes × 3 tamaños.">
        <div className="flex flex-col items-center gap-3">
          {(["md", "sm", "xs"] as const).map((size) => (
            <div key={size} className="flex flex-wrap items-center justify-center gap-2">
              {(["primary", "secondary", "accent", "success", "ghost", "quiet"] as const).map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="accent" size="sm">
              <IconPlus size={13} /> Nuevo
            </Button>
            <Button size="sm" disabled>
              Deshabilitado
            </Button>
            <Button variant="primary" size="sm">
              <Spinner size={12} /> Guardando
            </Button>
          </div>
        </div>
      </Showcase>
      <Showcase id="pills" title="ValuePill · EntityChip" desc="Valores y entidades en línea con el texto.">
        <p className="mx-auto max-w-105 text-center text-[14px] leading-7 text-ink-2">
          Reponer conos con <EntityChip name="Cone King" color="#e08a3c" /> antes del <ValuePill>12 dic</ValuePill>: stock{" "}
          <ValuePill tone="red">−18%</ValuePill>, margen <ValuePill tone="green">+4.2%</ValuePill>, revisión{" "}
          <ValuePill tone="orange">pendiente</ValuePill> por <EntityChip name="Ana López" color="#2f6fec" />.
        </p>
      </Showcase>
      <Showcase
        id="shimmer"
        title="Shimmer · StreamText"
        desc="Etiqueta de procesamiento y revelado de texto en streaming."
        controls={
          <Button size="xs" onClick={() => setRun((r) => r + 1)}>
            Repetir
          </Button>
        }
      >
        <div className="mx-auto flex max-w-105 flex-col gap-3 text-[14px]">
          <Shimmer>Analizando ventas de temporada…</Shimmer>
          <StreamText key={run} text="El pistacho lidera el fin de semana con un 18% más que la media. Bátelo el sábado temprano." />
        </div>
      </Showcase>
    </>
  );
}

/* ── kit de elementos básicos ── */

type Row = { id: string; task: string; date: string; status: Status; owner: string; color: string; amount: number };
const ROWS: Row[] = [
  { id: "1", task: "Reponer sorbete de mango", date: "03 dic", status: "todo", owner: "Mango Moon", color: "#e5a321", amount: 1240 },
  { id: "2", task: "Batir sésamo negro", date: "22 sep", status: "progress", owner: "Kumo Creamery", color: "#16a6c7", amount: 860.5 },
  { id: "3", task: "Verificar proveedores", date: "14 sep", status: "done", owner: "Alpine Churn", color: "#25a878", amount: 0 },
  { id: "4", task: "Pedido de conos", date: "10 sep", status: "progress", owner: "Cone King", color: "#e08a3c", amount: 2453.44 },
];
const STATUS_LABEL: Record<Status, string> = { todo: "Por hacer", progress: "En curso", done: "Completada" };
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Kit() {
  const toast = useToast();
  const [role, setRole] = useState<"admin" | "editor" | "viewer" | null>("editor");
  const [email, setEmail] = useState("ana@");
  const [checks, setChecks] = useState({ notif: true, digest: false });
  const [plan, setPlan] = useState<"m" | "y" | "t">("m");
  const [sw, setSw] = useState({ agent: true, auto: false });
  const [seg, setSeg] = useState<"d" | "w" | "m">("w");
  const [tab, setTab] = useState<"sum" | "act" | "set">("sum");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [sel, setSel] = useState<Set<string>>(new Set(["2"]));
  const [dialog, setDialog] = useState(false);
  const [country, setCountry] = useState<string | null>("es");
  const [owner, setOwner] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"right" | "bottom" | null>(null);
  const [palette, setPalette] = useState(false);
  useHotkey("k", () => setPalette((o) => !o));

  const columns: Column<Row>[] = [
    { key: "task", header: "Tarea", width: "minmax(0,1.4fr)", render: (r) => <span className="truncate font-medium">{r.task}</span> },
    { key: "date", header: "Fecha", width: "80px", render: (r) => <span className="text-ink-2 tabular-nums">{r.date}</span> },
    { key: "status", header: "Estado", width: "120px", render: (r) => <StatusPill status={r.status}>{STATUS_LABEL[r.status]}</StatusPill> },
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
    { key: "amt", header: "Importe", width: "100px", align: "right", render: (r) => <span className="font-mono text-[12px]">{money(r.amount)}</span> },
  ];

  return (
    <>
      <Showcase id="campos" title="Campos" desc="Input, Textarea y Select — pozo field que se eleva con anillo de acento al enfocar.">
        <Card className="mx-auto max-w-120 primitive-card-pad">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">{(id) => <Input id={id} placeholder="Ej. Ana López" />}</Field>
            <Field label="Rol">
              {(id) => (
                <Select
                  id={id}
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "admin", label: "Administrador" },
                    { value: "editor", label: "Editor" },
                    { value: "viewer", label: "Lector" },
                  ]}
                />
              )}
            </Field>
            <Field label="Buscar">
              {(id) => <Input id={id} placeholder="Buscar registros…" leading={<IconSearch size={14} />} trailing={<Kbd>⌘K</Kbd>} />}
            </Field>
            <Field label="Email" error={email.includes(".") ? undefined : "Introduce un email válido."}>
              {(id) => <Input id={id} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!email.includes(".")} />}
            </Field>
            <Field label="Notas" hint="Admite Markdown." className="sm:col-span-2">
              {(id) => <Textarea id={id} placeholder="Describe la tarea…" />}
            </Field>
          </div>
        </Card>
      </Showcase>

      <Showcase id="seleccion" title="Selección" desc="Checkbox, RadioGroup y Switch accesibles con la piel de la librería.">
        <Card className="primitive-card-pad mx-auto flex max-w-120 flex-wrap justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Checkbox checked={checks.notif} onChange={(v) => setChecks((c) => ({ ...c, notif: v }))} label="Notificaciones" />
            <Checkbox checked={checks.digest} onChange={(v) => setChecks((c) => ({ ...c, digest: v }))} label="Resumen diario" />
            <Checkbox checked={false} indeterminate onChange={() => {}} label="Parcial" />
            <Checkbox checked={false} onChange={() => {}} label="Deshabilitado" disabled />
          </div>
          <RadioGroup
            value={plan}
            onChange={setPlan}
            options={[
              { value: "m", label: "Mensual" },
              { value: "y", label: "Anual" },
              { value: "t", label: "Equipo" },
            ]}
          />
          <div className="flex flex-col gap-2">
            <Switch checked={sw.agent} onChange={(v) => setSw((s) => ({ ...s, agent: v }))} label="Modo agente" />
            <Switch checked={sw.auto} onChange={(v) => setSw((s) => ({ ...s, auto: v }))} label="Auto-aprobar" />
          </div>
        </Card>
      </Showcase>

      <Showcase id="navegacion" title="Segmented · Tabs · Filtros" desc="Indicadores que se deslizan con ease-out-strong.">
        <div className="mx-auto flex max-w-120 flex-col items-center gap-4">
          <Card className="w-full">
            <Tabs
              className="px-2"
              value={tab}
              onChange={setTab}
              options={[
                { value: "sum", label: "Resumen" },
                { value: "act", label: "Actividad", count: 12 },
                { value: "set", label: "Ajustes" },
              ]}
            />
            <CardBody className="text-[13px] text-ink-2">
              {{ sum: "Métricas clave del espacio de trabajo.", act: "Historial de acciones del agente.", set: "Preferencias y miembros." }[tab]}
            </CardBody>
          </Card>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Segmented
              value={seg}
              onChange={setSeg}
              options={[
                { value: "d", label: "Día" },
                { value: "w", label: "Semana" },
                { value: "m", label: "Mes" },
              ]}
            />
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Todas", count: 4 },
                { value: "todo", label: "Por hacer", dot: "#f09a2f", count: 1 },
                { value: "progress", label: "En curso", dot: "#16a6c7", count: 2 },
              ]}
            />
          </div>
        </div>
      </Showcase>

      <Showcase id="estados" title="Estado · Tag · Avatar" desc="StatusPill con los colores de FilterTable; Avatar sobre el Monogram oficial.">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <StatusPill status="todo">Por hacer</StatusPill>
            <StatusPill status="progress">En curso</StatusPill>
            <StatusPill status="done">Completada</StatusPill>
            <Tag>B2B</Tag>
            <Tag>Mayorista</Tag>
            <Tag>+3</Tag>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Avatar name="Ana López" color="#2f6fec" size="sm" />
            <Avatar name="Bruno Díaz" color="#1f7a5f" />
            <Avatar name="Carla M" color="#e56d24" size="lg" />
            <Avatar name="Kumo" color="#16a6c7" size="xl" square />
            <AvatarStack
              people={[
                { name: "Ana López", color: "#2f6fec" },
                { name: "Bruno Díaz", color: "#1f7a5f" },
                { name: "Carla M", color: "#e56d24" },
                { name: "Dani R" },
                { name: "Eva S" },
              ]}
            />
          </div>
        </div>
      </Showcase>

      <Showcase id="cards" title="Card · Stat · Progress" desc="Contenedores con las paddings ópticas primitive-card-*.">
        <div className="mx-auto flex max-w-140 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Ingresos" value="$48,210" delta="+12.4%" trend="up" />
            <Stat label="Pedidos" value="1,284" delta="−3.1%" trend="down" />
            <Card className="primitive-card-pad flex flex-col gap-2">
              <span className="text-[12px] text-ink-3">Tareas del agente</span>
              <span className="text-[22px] leading-tight font-semibold tabular-nums">86%</span>
              <Progress value={86} tone="green" />
            </Card>
          </div>
          <Card elevation="raised">
            <CardHeader
              title="Pedido de reposición"
              icon={<IconSparkle className="text-accent" />}
              action={
                <Menu
                  align="end"
                  trigger={({ toggle }) => (
                    <IconButton label="Más opciones" onClick={toggle} tooltip={false}>
                      <IconMore />
                    </IconButton>
                  )}
                  items={[
                    { label: "Editar", icon: <IconPencil size={14} /> },
                    { label: "Duplicar", icon: <IconCopy size={14} /> },
                    { type: "separator" },
                    { label: "Eliminar", icon: <IconTrash size={14} />, danger: true },
                  ]}
                />
              }
            />
            <CardBody className="text-[13px] text-ink-2">
              Reponer conos con <EntityChip name="Cone King" color="#e08a3c" /> — plazo de entrega <ValuePill>7 días</ValuePill>.
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="quiet">
                Descartar
              </Button>
              <Button size="sm" variant="accent" onClick={() => toast("Pedido enviado a Cone King", { label: "Deshacer", onClick: () => {} })}>
                Hacer pedido
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Showcase>

      <Showcase id="feedback" title="Alert · Empty state" desc="Mensajes en línea sobre tint y vacío sin datos.">
        <div className="mx-auto grid max-w-140 gap-2 sm:grid-cols-2">
          <Alert title="Sincronización programada">Los datos se actualizan cada 15 min.</Alert>
          <Alert tone="success" title="Todo verificado">12 de 12 proveedores coinciden.</Alert>
          <Alert tone="warning" title="2 registros antiguos">Revisa los contactos inactivos.</Alert>
          <Alert tone="danger" title="Fallo de conexión" action={<Button size="xs">Reintentar</Button>}>
            No se pudo leer el TPV.
          </Alert>
          <Card className="sm:col-span-2">
            <EmptyState
              icon={<IconInbox size={15} />}
              title="Bandeja vacía"
              hint="Cuando el agente necesite tu aprobación aparecerá aquí."
              action={
                <Button size="xs">
                  <IconPlus size={12} /> Nueva tarea
                </Button>
              }
            />
          </Card>
        </div>
      </Showcase>

      <Showcase id="overlays" title="Menu · Tooltip · Dialog · Toast" desc="Paneles shadow-overlay con pop-in de 180ms y resaltado GlideMenu.">
        <div className="flex flex-wrap items-start justify-center gap-2">
          <Menu
            trigger={({ open, toggle }) => (
              <Button size="sm" aria-expanded={open} onClick={toggle}>
                Acciones
              </Button>
            )}
            items={[
              { type: "label", label: "Registro" },
              { label: "Editar", icon: <IconPencil size={14} />, shortcut: "E" },
              { label: "Copiar enlace", icon: <IconLink size={14} />, onSelect: () => toast("Enlace copiado") },
              { type: "separator" },
              { label: "Eliminar", icon: <IconTrash size={14} />, danger: true, onSelect: () => setDialog(true) },
            ]}
          />
          <Tooltip content="Tooltip con retardo de 250ms">
            <Button size="sm">Pasa el ratón</Button>
          </Tooltip>
          <Button size="sm" variant="ghost" onClick={() => setDialog(true)}>
            Abrir diálogo
          </Button>
          <Button size="sm" variant="primary" onClick={() => toast("Cambios guardados")}>
            Mostrar toast
          </Button>
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title="¿Eliminar «Creamery Ops»?"
            description="Se borrarán 32 chats y 128 registros. Esta acción no se puede deshacer."
            footer={
              <>
                <Button size="sm" onClick={() => setDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-red-solid text-white hover:brightness-110"
                  onClick={() => {
                    setDialog(false);
                    toast("Proyecto eliminado");
                  }}
                >
                  Eliminar
                </Button>
              </>
            }
          />
        </div>
      </Showcase>

      <Showcase id="popover" title="Popover · Combobox" desc="Panel flotante genérico y select con buscador navegable con teclado.">
        <div className="flex flex-wrap items-start justify-center gap-3">
          <div className="w-52">
            <Combobox
              value={country}
              onChange={setCountry}
              placeholder="País"
              options={[
                { value: "es", label: "España", hint: "+34", keywords: ["spain"] },
                { value: "mx", label: "México", hint: "+52", keywords: ["mexico"] },
                { value: "ar", label: "Argentina", hint: "+54" },
                { value: "co", label: "Colombia", hint: "+57" },
                { value: "cl", label: "Chile", hint: "+56" },
                { value: "pe", label: "Perú", hint: "+51", keywords: ["peru"] },
                { value: "us", label: "Estados Unidos", hint: "+1", keywords: ["usa", "eeuu"] },
              ]}
            />
          </div>
          <div className="w-52">
            <Combobox
              value={owner}
              onChange={setOwner}
              placeholder="Asignar a…"
              searchPlaceholder="Buscar persona…"
              options={[
                { value: "ana", label: "Ana López", icon: <Avatar name="Ana López" color="#2f6fec" size="sm" /> },
                { value: "bruno", label: "Bruno Díaz", icon: <Avatar name="Bruno Díaz" color="#1f7a5f" size="sm" /> },
                { value: "carla", label: "Carla Martín", icon: <Avatar name="Carla Martín" color="#e56d24" size="sm" /> },
              ]}
            />
          </div>
          <Popover
            align="end"
            trigger={({ open, toggle }) => (
              <Button size="sm" aria-expanded={open} onClick={toggle}>
                <IconFilter size={13} /> Filtros
              </Button>
            )}
          >
            {(close) => (
              <div className="flex flex-col gap-3">
                <div className="text-heading">Filtrar pedidos</div>
                <Field label="Importe mínimo">{(id) => <Input id={id} placeholder="$0.00" />}</Field>
                <Checkbox checked onChange={() => {}} label="Solo pendientes" />
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="quiet" onClick={close}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      close();
                      toast("Filtros aplicados");
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </Popover>
        </div>
      </Showcase>

      <Showcase id="sheet" title="Sheet" desc="Panel lateral o inferior sobre <dialog> nativo; también la navegación en móvil.">
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => setSheet("right")}>
            Panel lateral
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSheet("bottom")}>
            Hoja inferior
          </Button>
          <Sheet
            open={sheet !== null}
            side={sheet ?? "right"}
            onClose={() => setSheet(null)}
            title="Editar pedido"
            description="Cone King · #1042"
            footer={
              <>
                <Button size="sm" onClick={() => setSheet(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    setSheet(null);
                    toast("Pedido actualizado");
                  }}
                >
                  Guardar
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-3">
              <Field label="Producto">{(id) => <Input id={id} defaultValue="Conos de barquillo" />}</Field>
              <Field label="País de envío">
                {(id) => (
                  <Combobox
                    id={id}
                    value={country}
                    onChange={setCountry}
                    options={[
                      { value: "es", label: "España" },
                      { value: "mx", label: "México" },
                      { value: "ar", label: "Argentina" },
                    ]}
                  />
                )}
              </Field>
              <Field label="Notas">{(id) => <Textarea id={id} placeholder="Instrucciones de entrega…" />}</Field>
              <Alert tone="info" title="Plazo de entrega">7 días laborables.</Alert>
            </div>
          </Sheet>
        </div>
      </Showcase>

      <Showcase id="comandos" title="Command palette" desc="⌘K / Ctrl+K: busca y ejecuta acciones solo con el teclado.">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setPalette(true)}
            className="flex h-9 w-full max-w-80 items-center gap-2 rounded-control bg-surface px-3 text-body text-ink-3 shadow-btn transition-colors hover:bg-inset"
          >
            <IconSearch size={14} />
            <span className="flex-1 text-left">Buscar o ejecutar…</span>
            <Kbd>{modKey()}</Kbd>
            <Kbd>K</Kbd>
          </button>
          <span className="text-meta text-ink-3">Prueba a escribir «tema», «nuevo» o «notificacion» (sin tilde).</span>
          <CommandPalette
            open={palette}
            onOpenChange={setPalette}
            groups={[
              {
                label: "Navegar",
                items: [
                  { id: "app", label: "App de ejemplo", icon: <IconArrowRight size={15} />, onSelect: () => (location.hash = "#/app") },
                  { id: "campos", label: "Campos", hint: "Elementos básicos", icon: <IconArrowRight size={15} />, onSelect: () => document.getElementById("campos")?.scrollIntoView() },
                  { id: "color", label: "Color", hint: "Sistema de diseño", icon: <IconArrowRight size={15} />, onSelect: () => document.getElementById("color")?.scrollIntoView() },
                ],
              },
              {
                label: "Acciones",
                items: [
                  { id: "new", label: "Nueva tarea", icon: <IconPlus size={15} />, shortcut: [modKey(), "N"], keywords: ["crear"], onSelect: () => toast("Tarea creada") },
                  { id: "theme", label: "Cambiar tema", icon: <IconMoon size={15} />, keywords: ["oscuro", "claro", "dark"], onSelect: () => setTheme(!document.documentElement.classList.contains("dark")) },
                  { id: "notif", label: "Ver notificaciones", icon: <IconBell size={15} />, onSelect: () => toast("Sin notificaciones nuevas") },
                  { id: "copy", label: "Copiar enlace", icon: <IconLink size={15} />, onSelect: () => toast("Enlace copiado") },
                ],
              },
            ]}
          />
        </div>
      </Showcase>

      <Showcase id="datatable" title="DataTable" desc="Tabla genérica con la rejilla de FilterTable, selección y filas que colapsan al filtrar.">
        <DataTable
          className="mx-auto max-w-160"
          columns={columns}
          rows={ROWS}
          rowKey={(r) => r.id}
          isVisible={(r) => filter === "all" || r.status === filter}
          selected={sel}
          onSelectedChange={setSel}
          toolbar={
            <>
              <FilterChips
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "Todas", count: 4 },
                  { value: "todo", label: "Por hacer", dot: "#f09a2f", count: 1 },
                  { value: "progress", label: "En curso", dot: "#16a6c7", count: 2 },
                  { value: "done", label: "Completadas", dot: "#25a878", count: 1 },
                ]}
              />
              <Button size="xs" variant="accent">
                <IconPlus size={12} /> Nueva
              </Button>
            </>
          }
          footer={
            <>
              <span>{sel.size ? `${sel.size} seleccionadas` : `${ROWS.length} filas`}</span>
              <span className="flex gap-1">
                <Button size="xs" variant="quiet">
                  Anterior
                </Button>
                <Button size="xs">Siguiente</Button>
              </span>
            </>
          }
        />
      </Showcase>
    </>
  );
}

/* ── primitives oficiales ── */

function Primitives() {
  const loading = useVariants({ options: ["Drive", "Dots", "Orbit"], render: (v) => <LoadingState key={v} variant={v} /> });
  const thinking = useVariants({ options: ["Steps", "Reasoning", "Search", "Coding"], render: (v) => <ThinkingState key={v} variant={v} /> });
  const prompt = useVariants({ options: ["Rounded", "Pill"], render: (v) => <PromptBar key={v} variant={v} /> });
  const tasks = useVariants({ options: ["Capsules", "List"], render: (v) => <TaskRows key={v} variant={v} /> });
  const code = useVariants({ options: ["Listing", "Diff"], render: (v) => <CodeBlock key={v} variant={v} /> });

  const center = "flex w-full justify-center";
  return (
    <>
      <Showcase id="loading-state" title="Loading State" desc="Loader de cuadrícula de píxeles con shimmer y tiempo." controls={loading.control}>
        <div className={center}>{loading.node}</div>
      </Showcase>
      <Showcase id="thinking-state" title="Thinking" desc="Trazas expandibles: pasos, razonamiento, búsqueda, código." controls={thinking.control}>
        <div className={center}>{thinking.node}</div>
      </Showcase>
      <Showcase id="streaming-text" title="Streaming Text" desc="Respuesta en streaming con fuentes, acciones y follow-ups.">
        <div className={center}><StreamingText /></div>
      </Showcase>
      <Showcase id="approval-card" title="Approval Card" desc="Preguntas human-in-the-loop antes de actuar.">
        <div className={center}><ApprovalCard /></div>
      </Showcase>
      <Showcase id="tool-chips" title="Tool Chips" desc="Ediciones de código y llamadas a herramientas como chips.">
        <div className={center}><ToolChips /></div>
      </Showcase>
      <Showcase id="task-rows" title="Task Rows" desc="Estado de tareas en vivo: en curso, fallida, completada." controls={tasks.control}>
        <div className={center}>{tasks.node}</div>
      </Showcase>
      <Showcase id="chat" title="Chat" desc="Panel de chat con pestañas, respuestas razonadas y composer.">
        <div className={center}><ChatComposer /></div>
      </Showcase>
      <Showcase id="prompt-bar" title="Prompt Bar" desc="Composer con @ fuentes, / comandos, modelo y dictado." controls={prompt.control}>
        <div className={center}>{prompt.node}</div>
      </Showcase>
      <Showcase id="recommendation-card" title="Recommendation Card" desc="Sugerencia del agente con medidor de confianza.">
        <div className={center}><RecommendationCard /></div>
      </Showcase>
      <Showcase id="context-cards" title="Context Cards" desc="Fragmentos de conocimiento recuperados con su fuente.">
        <div className={center}><ContextCards /></div>
      </Showcase>
      <Showcase id="diff-table" title="Diff Table" desc="Ediciones propuestas por la IA sobre datos tabulares.">
        <div className={center}><DiffTable /></div>
      </Showcase>
      <Showcase id="records-table" title="Records Table" desc="Rejilla tipo CRM con tags, orden y fuerza de relación." bare>
        <RecordsTable />
      </Showcase>
      <Showcase id="filter-table" title="Filter Table" desc="Chips de estado que reorganizan datos en vivo.">
        <div className={center}><FilterTable /></div>
      </Showcase>
      <Showcase id="sidebar-nav" title="Sidebar Nav" desc="Navegación colapsable de workspace y chats con hover deslizante.">
        <div className={center}>
          <div className="overflow-hidden rounded-window bg-page shadow-card"><SidebarNav /></div>
        </div>
      </Showcase>
      <Showcase id="search" title="Search" desc="Búsqueda de comandos con filtrado en vivo y estado vacío.">
        <div className={center}><SearchList /></div>
      </Showcase>
      <Showcase id="flowchart" title="Flowchart" desc="Pasos de disparador y condición sobre un lienzo punteado.">
        <div className={center}><Flowchart /></div>
      </Showcase>
      <Showcase id="insight-cards" title="Insight Cards" desc="Insights paginados con gráficas en vivo.">
        <div className={center}><InsightCards /></div>
      </Showcase>
      <Showcase id="code-block" title="Code Block" desc="Listado numerado y diff unificado." controls={code.control}>
        <div className={center}>{code.node}</div>
      </Showcase>
      <Showcase id="fine-tune-card" title="Fine-tune Card" desc="El agente ajusta propiedades en un inspector.">
        <div className={center}><FineTuneCard /></div>
      </Showcase>
      <Showcase id="selection-actions" title="Selection Actions" desc="Resalta un pasaje y pásalo al agente para reescribirlo.">
        <div className={center}><SelectionActions /></div>
      </Showcase>
    </>
  );
}

export const NAV = [
  { group: "Fundamentos", items: [["color", "Color"], ["tipografia", "Tipografía"], ["forma", "Radios y sombras"], ["acento", "Acento de marca"], ["iconos", "Iconos"], ["idioma", "Idioma"]] },
  { group: "Átomos", items: [["button", "Button"], ["pills", "ValuePill · EntityChip"], ["shimmer", "Shimmer · StreamText"]] },
  {
    group: "Elementos básicos",
    items: [["campos", "Campos"], ["seleccion", "Selección"], ["navegacion", "Segmented · Tabs"], ["estados", "Estado · Avatar"], ["cards", "Cards"], ["feedback", "Alert · Empty"], ["overlays", "Overlays"], ["popover", "Popover · Combobox"], ["sheet", "Sheet"], ["comandos", "Command palette"], ["datatable", "DataTable"], ["navegacion-2", "Breadcrumb · Pagination"], ["menu-contextual", "Menú contextual"], ["estructura", "Accordion · Skeleton"], ["entradas", "Slider · MultiSelect"], ["fechas", "Fechas"], ["validacion", "Formularios"]],
  },
  { group: "Datos", items: [["lineas", "LineChart"], ["barras", "BarChart"], ["cuota", "Stat · SegmentedBar"]] },
  { group: "Plantillas", items: [["plantillas", "Páginas completas"]] },
  {
    group: "Componentes de IA",
    items: [
      ["loading-state", "Loading State"], ["thinking-state", "Thinking"], ["streaming-text", "Streaming Text"], ["approval-card", "Approval Card"],
      ["tool-chips", "Tool Chips"], ["task-rows", "Task Rows"], ["chat", "Chat"], ["prompt-bar", "Prompt Bar"], ["recommendation-card", "Recommendation"],
      ["context-cards", "Context Cards"], ["diff-table", "Diff Table"], ["records-table", "Records Table"], ["filter-table", "Filter Table"],
      ["sidebar-nav", "Sidebar Nav"], ["search", "Search"], ["flowchart", "Flowchart"], ["insight-cards", "Insight Cards"], ["code-block", "Code Block"],
      ["fine-tune-card", "Fine-tune Card"], ["selection-actions", "Selection Actions"],
    ],
  },
] as const;

export default function DesignSystem() {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1120px] bg-page shadow-[0_0_0_1px_var(--line)] lg:grid-cols-[208px_minmax(0,1fr)]">
      <nav className="component-nav-scroll sticky top-0 hidden h-screen overflow-y-auto border-r border-dashed border-line px-3 py-6 lg:block" aria-label="Secciones">
        {NAV.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-2 pb-1 text-[10.5px] font-medium tracking-[0.04em] text-ink-3 uppercase">{g.group}</div>
            {g.items.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block rounded-[6px] px-2 py-1 text-[13px] text-ink-2 transition-colors duration-100 hover:bg-hover-2 hover:text-ink">
                {label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <main className="min-w-0 [counter-reset:showcase]">
        <header className="border-b border-dashed border-line px-5 pt-12 pb-9 sm:px-8" style={{ animation: "fade-up 600ms cubic-bezier(0.23,1,0.32,1) both" }}>
          <p className="text-[10.5px] font-medium tracking-[0.06em] text-ink-3 uppercase">Sistema de diseño</p>
          <h1 className="mt-2 text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink">Beautiful UI</h1>
          <p className="mt-3 max-w-140 text-[15px] text-ink-2">
            Los componentes oficiales de beautifului.dev más todo lo necesario para construir cualquier app: formularios con validación,
            fechas, tablas, overlays, navegación, gráficas y plantillas de página. Contraste AA, claro/oscuro, acentos de marca y español/inglés.
          </p>
          <div className="mt-5 flex gap-2">
            <a href="#/app">
              <Button variant="primary" size="sm">
                Ver app de ejemplo
              </Button>
            </a>
            <a href="#plantillas">
              <Button size="sm">Plantillas</Button>
            </a>
            <a href="#campos">
              <Button size="sm" variant="quiet">Elementos básicos</Button>
            </a>
          </div>
        </header>
        <Group id="g-fundamentos" title="Fundamentos" />
        <Foundations />
        <MoreFoundations />
        <Group id="g-atomos" title="Átomos oficiales" />
        <Atoms />
        <Group id="g-kit" title="Elementos básicos" />
        <Kit />
        <MoreKit />
        <Group id="g-datos" title="Datos y gráficas" />
        <DataViz />
        <Group id="g-plantillas" title="Plantillas" />
        <Templates />
        <Group id="g-primitives" title="Componentes oficiales" />
        <Primitives />
        <footer className="flex items-center justify-between px-5 py-8 text-[12px] text-ink-3 sm:px-8">
          <span>Componentes © Turbo · MIT · beautifului.dev</span>
          <a href="#/app" className="text-accent-ink">App de ejemplo →</a>
        </footer>
      </main>
    </div>
  );
}
