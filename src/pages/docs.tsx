/* Documentación de cada sección de la galería: ejemplo copiable + tabla de props.
 * Clave = id del Showcase. Los componentes oficiales generan su ficha sola. */

export type PropDoc = { name: string; type: string; def?: string; desc: string };
export type Doc = { file?: string; code: string; props?: PropDoc[] };

const P = (name: string, type: string, desc: string, def?: string): PropDoc => ({ name, type, desc, def });

/* id del showcase → componente oficial (export default) */
export const PRIMITIVE_DOCS: Record<string, { component: string; item: string; usage: string }> = {
  "loading-state": { component: "LoadingState", item: "loading-state", usage: `<LoadingState />` },
  "thinking-state": { component: "ThinkingState", item: "thinking-state", usage: `<ThinkingState />` },
  "streaming-text": { component: "StreamingText", item: "streaming-text", usage: `<StreamingText content={tokens} followUps={[…]} onFollowUp={(text) => …} />` },
  "approval-card": { component: "ApprovalCard", item: "approval-card", usage: `<ApprovalCard questions={questions} onSubmitted={(answers) => …} />` },
  "tool-chips": { component: "ToolChips", item: "tool-chips", usage: `<ToolChips />` },
  "task-rows": { component: "TaskRows", item: "task-rows", usage: `<TaskRows rows={rows} />` },
  chat: { component: "ChatComposer", item: "chat-composer", usage: `<ChatComposer />` },
  "prompt-bar": { component: "PromptBar", item: "prompt-bar", usage: `<PromptBar demo={false} placeholder="Pregunta lo que quieras…" onSend={(text) => …} />` },
  "recommendation-card": { component: "RecommendationCard", item: "recommendation-card", usage: `<RecommendationCard />` },
  "context-cards": { component: "ContextCards", item: "context-cards", usage: `<ContextCards />` },
  "diff-table": { component: "DiffTable", item: "diff-table", usage: `<DiffTable />` },
  "records-table": { component: "RecordsTable", item: "records-table", usage: `<RecordsTable rows={rows} fill />` },
  "filter-table": { component: "FilterTable", item: "filter-table", usage: `<FilterTable />` },
  "sidebar-nav": { component: "SidebarNav", item: "sidebar-nav", usage: `<SidebarNav fill recents={recents} activeNav={nav} onNavigate={setNav} />` },
  search: { component: "SearchList", item: "search", usage: `<SearchList />` },
  flowchart: { component: "Flowchart", item: "flowchart", usage: `<Flowchart steps={steps} />` },
  "insight-cards": { component: "InsightCards", item: "insight-cards", usage: `<InsightCards />` },
  "code-block": { component: "CodeBlock", item: "code-block", usage: `<CodeBlock filename="app.ts" code={source} />` },
  "fine-tune-card": { component: "FineTuneCard", item: "fine-tune-card", usage: `<FineTuneCard />` },
  "selection-actions": { component: "SelectionActions", item: "selection-actions", usage: `<SelectionActions />` },
};

export const REGISTRY = "https://davdelcar.github.io/beautiful-ui/r";

export function primitiveDoc(id: string): Doc | undefined {
  const p = PRIMITIVE_DOCS[id];
  if (!p) return;
  return {
    file: `${p.component}.tsx`,
    code: `// npx shadcn@latest add ${REGISTRY}/${p.item}.json
import ${p.component} from "@/components/primitives/${p.component}";

${p.usage}

// Sin props muestra sus datos de demo; pásale los tuyos.
// Props exactas: MCP get_component "${p.item}" o el archivo fuente.`,
  };
}

export const DOCS: Record<string, Doc> = {
  tipografia: {
    file: "tipografia.tsx",
    code: `<h1 className="text-title text-ink">Buenos días, Ana</h1>
<p className="text-lead text-ink-2">Resumen de la semana.</p>
<h2 className="text-heading">Pedidos</h2>
<p className="text-body text-ink-2">El agente revisó 12 registros.</p>
<span className="text-meta text-ink-3">Hace 5 min</span>
<span className="text-overline text-ink-3 uppercase">Grupo</span>
<span className="font-mono text-micro tabular-nums">+$2,453.44</span>`,
    props: [
      P("text-display", "32 / 1.1 / 600", "Portadas y héroes."),
      P("text-title", "22 / 1.2 / 600", "Título de página (uno por vista)."),
      P("text-heading", "15 / 1.35 / 600", "Títulos de card, diálogo y sheet."),
      P("text-lead", "15 / 1.55", "Párrafo introductorio."),
      P("text-body", "13 / 1.5", "Texto base de la interfaz."),
      P("text-meta", "12 / 1.45", "Secundario, celdas, ayudas."),
      P("text-micro", "11 / 1.35", "Pies, contadores, atajos."),
      P("text-overline", "10.5 / 500 / +0.06em", "Etiquetas de grupo, con `uppercase`."),
    ],
  },

  button: {
    file: "Button.tsx",
    code: `import { Button, IconPlus, Spinner } from "@/components/ui";

<Button variant="primary">Guardar</Button>
<Button variant="accent" size="sm"><IconPlus size={13} /> Nuevo</Button>
<Button size="sm" disabled><Spinner size={12} /> Guardando</Button>`,
    props: [
      P("variant", '"primary" | "secondary" | "ghost" | "accent" | "success" | "quiet"', "Un solo primary por vista; quiet para barras densas.", '"secondary"'),
      P("size", '"xs" | "sm" | "md"', "xs 28px · sm 27px · md 36px de alto.", '"md"'),
      P("…button", "ButtonHTMLAttributes", "onClick, disabled, type…"),
    ],
  },

  campos: {
    file: "Formulario.tsx",
    code: `import { Field, Input, Select, Textarea, Kbd, IconSearch } from "@/components/ui";

<Field label="Email" hint="No lo compartimos." error={invalid && "Email no válido"}>
  {(id) => <Input id={id} value={email} onChange={(e) => setEmail(e.target.value)} />}
</Field>

<Input placeholder="Buscar…" leading={<IconSearch size={14} />} trailing={<Kbd>⌘K</Kbd>} />

<Select value={role} onChange={setRole} placeholder="Rol"
  options={[{ value: "admin", label: "Administrador" }, { value: "editor", label: "Editor" }]} />`,
    props: [
      P("Field.label / hint / error", "ReactNode", "error sustituye a hint y se pinta en rojo."),
      P("Field.children", "(id: string) => ReactNode", "Recibe el id para enlazar label e input."),
      P("Input.leading / trailing", "ReactNode", "Icono o Kbd dentro del campo."),
      P("Select.value", "T | null", "Valor controlado."),
      P("Select.options", "{ value: T; label: ReactNode }[]", "Para listas largas usa Combobox."),
      P("Select.placeholder", "string", "Texto sin selección.", '"Seleccionar"'),
    ],
  },

  seleccion: {
    file: "Seleccion.tsx",
    code: `import { Checkbox, RadioGroup, Switch } from "@/components/ui";

<Checkbox checked={notif} onChange={setNotif} label="Notificaciones" />
<Switch checked={agent} onChange={setAgent} label="Modo agente" />
<RadioGroup value={plan} onChange={setPlan}
  options={[{ value: "m", label: "Mensual" }, { value: "y", label: "Anual" }]} />`,
    props: [
      P("checked", "boolean", "Checkbox y Switch son controlados."),
      P("onChange", "(checked: boolean) => void", "En RadioGroup recibe el valor."),
      P("indeterminate", "boolean", "Solo Checkbox: estado parcial."),
      P("label", "ReactNode", "Etiqueta clicable."),
      P("disabled", "boolean", "También por opción en RadioGroup."),
    ],
  },

  navegacion: {
    file: "Navegacion.tsx",
    code: `import { Segmented, Tabs, FilterChips } from "@/components/ui";

<Tabs value={tab} onChange={setTab}
  options={[{ value: "sum", label: "Resumen" }, { value: "act", label: "Actividad", count: 12 }]} />

<Segmented size="sm" value={range} onChange={setRange}
  options={[{ value: "d", label: "Día" }, { value: "w", label: "Semana" }]} />

<FilterChips value={filter} onChange={setFilter}
  options={[{ value: "all", label: "Todas", count: 4 }, { value: "todo", label: "Por hacer", dot: "#f09a2f" }]} />`,
    props: [
      P("value / onChange", "T / (v: T) => void", "Controlados; T es la unión de valores."),
      P("options", "{ value; label; count? }[]", "count pinta un contador."),
      P("Segmented.size", '"sm" | "md"', "", '"md"'),
      P("FilterChips.options[].dot", "string", "Color del punto de estado."),
    ],
  },

  estados: {
    file: "Estados.tsx",
    code: `import { StatusPill, Tag, Avatar, AvatarStack } from "@/components/ui";

<StatusPill status="progress">En curso</StatusPill>
<Tag>B2B</Tag>
<Avatar name="Ana López" color="#2f6fec" size="lg" />
<AvatarStack max={3} people={[{ name: "Ana López" }, { name: "Bruno Díaz" }]} />`,
    props: [
      P("StatusPill.status", '"todo" | "progress" | "done"', "Colores filter-status-* de la fundación."),
      P("Avatar.name", "string", "Se muestran las iniciales."),
      P("Avatar.size", '"sm" | "md" | "lg" | "xl"', "20 · 24 · 32 · 40 px.", '"md"'),
      P("Avatar.square", "boolean", "Esquinas de 6px (organizaciones)."),
      P("AvatarStack.max", "number", "Resto como +N.", "3"),
    ],
  },

  cards: {
    file: "Tarjeta.tsx",
    code: `import { Card, CardHeader, CardBody, CardFooter, Stat, Progress, Button } from "@/components/ui";

<Stat label="Ingresos" value="$48,210" delta="+12.4%" trend="up" />

<Card elevation="raised">
  <CardHeader title="Pedido" action={<Button size="xs">Ver</Button>} />
  <CardBody>…</CardBody>
  <CardFooter><Button size="sm" variant="accent">Hacer pedido</Button></CardFooter>
</Card>

<Progress value={86} tone="green" />`,
    props: [
      P("Card.elevation", '"hairline" | "card" | "raised"', "No anides cards con sombra.", '"card"'),
      P("CardHeader", "{ title; icon?; action? }", "Barra superior primitive-card-bar."),
      P("Stat", "{ label; value; delta?; trend? }", 'trend: "up" | "down" | "flat".'),
      P("Progress", "{ value: 0–100; tone? }", '"accent" | "green" | "orange" | "red".'),
    ],
  },

  feedback: {
    file: "Feedback.tsx",
    code: `import { Alert, EmptyState, Button, IconInbox } from "@/components/ui";

<Alert tone="danger" title="Fallo de conexión" action={<Button size="xs">Reintentar</Button>}>
  No se pudo leer el TPV.
</Alert>

<EmptyState icon={<IconInbox size={15} />} title="Bandeja vacía"
  hint="Aquí aparecerán las aprobaciones." action={<Button size="xs">Nueva tarea</Button>} />`,
    props: [
      P("Alert.tone", '"info" | "success" | "warning" | "danger"', "danger usa role=alert.", '"info"'),
      P("Alert.title / action", "ReactNode", "children es el detalle."),
      P("EmptyState", "{ icon; title; hint?; action? }", "Va dentro de una Card o tabla."),
    ],
  },

  overlays: {
    file: "Overlays.tsx",
    code: `import { Menu, Tooltip, Dialog, useToast, Button } from "@/components/ui";

<Menu align="end"
  trigger={({ open, toggle }) => <Button size="sm" aria-expanded={open} onClick={toggle}>Acciones</Button>}
  items={[
    { type: "label", label: "Registro" },
    { label: "Editar", icon: <IconPencil size={14} />, shortcut: "E", onSelect: edit },
    { type: "separator" },
    { label: "Eliminar", danger: true, onSelect: () => setOpen(true) },
  ]} />

<Dialog open={open} onClose={() => setOpen(false)} title="¿Eliminar?"
  footer={<Button size="sm" onClick={() => setOpen(false)}>Cancelar</Button>} />

const toast = useToast(); // requiere <ToastProvider> en la raíz
toast("Cambios guardados", { label: "Deshacer", onClick: undo });`,
    props: [
      P("Menu.trigger", "({ open, toggle }) => ReactNode", "Pinta el disparador."),
      P("Menu.items", "MenuItem[]", '{ label, icon?, shortcut?, danger?, onSelect? } · { type: "label" } · { type: "separator" }'),
      P("Tooltip", '{ content; side?: "top" | "bottom" }', "Retardo de 250ms."),
      P("Dialog", "{ open; onClose; title; description?; footer? }", "<dialog> nativo: foco atrapado y Escape."),
      P("toast", "(text, action?) => void", "action = { label, onClick }."),
    ],
  },

  popover: {
    file: "Popover.tsx",
    code: `import { Popover, Combobox, Button } from "@/components/ui";

<Popover align="end" width={300}
  trigger={({ open, toggle }) => <Button size="sm" aria-expanded={open} onClick={toggle}>Filtros</Button>}>
  {(close) => <form onSubmit={() => { apply(); close(); }}>…</form>}
</Popover>

<Combobox value={country} onChange={setCountry} placeholder="País"
  options={[
    { value: "es", label: "España", hint: "+34", keywords: ["spain"] },
    { value: "mx", label: "México", hint: "+52" },
  ]} />`,
    props: [
      P("Popover.trigger", "({ open, toggle }) => ReactNode", "Igual que Menu."),
      P("Popover.children", "ReactNode | (close) => ReactNode", "Contenido libre."),
      P("Popover.align / side", '"start" | "center" | "end" / "bottom" | "top"', "", '"start" / "bottom"'),
      P("Popover.width", 'number | "trigger"', "px, o el ancho del disparador.", "280"),
      P("Combobox.options", "ComboboxOption<T>[]", "{ value, label, hint?, icon?, keywords?, disabled? }"),
      P("Combobox.searchPlaceholder / emptyText", "string / ReactNode", "Textos del buscador.", '"Buscar…" / "Sin resultados"'),
    ],
  },

  sheet: {
    file: "Sheet.tsx",
    code: `import { Sheet, Button } from "@/components/ui";

<Sheet open={open} onClose={() => setOpen(false)} side="right"
  title="Editar pedido" description="Cone King · #1042"
  footer={<Button size="sm" variant="accent">Guardar</Button>}>
  …formulario…
</Sheet>

// Navegación en móvil
<Sheet open={menu} onClose={() => setMenu(false)} side="left" width={224} bare>
  <SidebarNav fill />
</Sheet>`,
    props: [
      P("open / onClose", "boolean / () => void", "Controlado; Escape y clic fuera cierran."),
      P("side", '"right" | "left" | "bottom"', "bottom = hoja inferior (móvil).", '"right"'),
      P("title / description / footer", "ReactNode", "Cabecera con botón de cerrar."),
      P("width", "number", "Ancho en px, limitado al viewport.", "400"),
      P("bare", "boolean", "Sin cabecera ni paddings."),
    ],
  },

  comandos: {
    file: "Comandos.tsx",
    code: `import { CommandPalette, useHotkey, modKey } from "@/components/ui";

const [open, setOpen] = useState(false);
useHotkey("k", () => setOpen((o) => !o)); // ⌘K / Ctrl+K

<CommandPalette open={open} onOpenChange={setOpen}
  groups={[
    { label: "Navegar", items: [
      { id: "home", label: "Inicio", icon: <IconHome />, onSelect: () => go("/") },
    ]},
    { label: "Acciones", items: [
      { id: "new", label: "Nueva tarea", shortcut: [modKey(), "N"], keywords: ["crear"], onSelect: create },
    ]},
  ]} />`,
    props: [
      P("open / onOpenChange", "boolean / (open) => void", "Controlado."),
      P("groups", "{ label; items: CommandItem[] }[]", "Los grupos vacíos se ocultan al filtrar."),
      P("CommandItem", "{ id; label; icon?; hint?; shortcut?; keywords?; onSelect }", "keywords amplía la búsqueda (sin tildes)."),
      P("useHotkey", '(key, handler, { mod = true })', "mod:false = tecla sola, ignorando campos de texto."),
      P("placeholder / emptyText / footer", "string / ReactNode / boolean", "", '"Buscar o ejecutar…"'),
    ],
  },

  datatable: {
    file: "Tabla.tsx",
    code: `import { DataTable, StatusPill, type Column } from "@/components/ui";

const columns: Column<Order>[] = [
  { key: "task", header: "Tarea", width: "minmax(0,1fr)", render: (r) => r.task },
  { key: "status", header: "Estado", width: "120px", render: (r) => <StatusPill status={r.status}>…</StatusPill> },
  { key: "amount", header: "Importe", width: "100px", align: "right", render: (r) => money(r.amount) },
];

<DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
  isVisible={(r) => filter === "all" || r.status === filter}
  selected={sel} onSelectedChange={setSel} toolbar={<FilterChips … />} />`,
    props: [
      P("columns", "Column<T>[]", "{ key, header, width (grid), align?, render(row) }"),
      P("rows / rowKey", "T[] / (row) => string", ""),
      P("isVisible", "(row) => boolean", "Las filas ocultas colapsan animadas."),
      P("selected / onSelectedChange", "Set<string>", "Activa la columna de checkbox."),
      P("toolbar / footer / minWidth", "ReactNode / ReactNode / number", "minWidth activa scroll horizontal."),
    ],
  },
};
