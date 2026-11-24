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
      P("Select.options", "{ value: T; label: ReactNode; disabled? }[]", "UI SDK: flechas, Inicio/Fin y búsqueda al teclear. Para listas largas usa Combobox."),
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
      P("checked", "boolean", "Checkbox y Switch son controlados (UI SDK: rol ARIA e input nativo para formularios)."),
      P("onChange", "(checked: boolean) => void", "En RadioGroup recibe el valor."),
      P("indeterminate", "boolean", "Solo Checkbox: estado parcial."),
      P("label", "ReactNode", "Etiqueta clicable."),
      P("disabled", "boolean", "También por opción en RadioGroup; flechas mueven y marcan, saltando las deshabilitadas."),
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
      P("Menu.trigger", "({ open }) => ReactNode", "Pinta el disparador (un único elemento); UI SDK lo abre al pulsar y con ↓, y le devuelve el foco. toggle se mantiene por compatibilidad."),
      P("Menu.items", "MenuItem[]", '{ label, icon?, shortcut?, danger?, onSelect? } · { type: "label" } · { type: "separator" }'),
      P("Tooltip", '{ content; side?: "top" | "bottom" }', "Retardo de 250ms."),
      P("Dialog", "{ open; onClose; title; description?; footer? }", "UI SDK: capa superior, foco atrapado, Escape y clic fuera; el foco vuelve al disparador."),
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
      P("open / onClose", "boolean / () => void", "Controlado (Drawer de UI SDK); Escape, clic fuera y deslizar hacia el borde cierran."),
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
  acento: {
    file: "tema.tsx",
    code: `import { setAccent, setTheme, useTheme, ThemeScript } from "@/components/ui";

setAccent("violet");          // blue | violet | green | orange | pink
const { dark, toggle } = useTheme();

// Next.js (app/layout.tsx): sin parpadeo al cargar
<html lang="es" suppressHydrationWarning>
  <head><ThemeScript /></head>
  …
</html>`,
    props: [
      P("setAccent", "(accent: Accent) => void", "Pone data-accent en <html> y lo guarda (bui-accent)."),
      P("setTheme", "(dark: boolean) => void", "Clase .dark + localStorage (bui-theme), sin transiciones durante el cambio."),
      P("useTheme", "() => { dark, toggle, setTheme }", "Estado compartido entre todos los componentes."),
      P("ThemeScript / themeScript", "componente / string", "Script del <head> que aplica tema y acento antes de pintar."),
    ],
  },

  idioma: {
    file: "providers.tsx",
    code: `import { UIProvider, ToastProvider } from "@/components/ui";

<UIProvider locale="en-US" labels={{ noResults: "Nothing here" }}>
  <ToastProvider>
    <App />
  </ToastProvider>
</UIProvider>

const { locale, labels } = useUI();`,
    props: [
      P("locale", "string", "BCP 47. es-* → textos en español; en-* → inglés. Fechas y números con Intl.", '"es-ES"'),
      P("labels", "Partial<Labels>", "Sobrescribe cualquier texto (o traduce a otro idioma)."),
      P("useUI / useLabels", "() => { locale, labels } / Labels", "Para tus propios componentes."),
    ],
  },

  "navegacion-2": {
    file: "Navegacion.tsx",
    code: `import { Breadcrumb, Pagination, Stepper } from "@/components/ui";

<Breadcrumb items={[{ label: "Ventas", href: "/ventas" }, { label: "Pedido #1042" }]} />

<Pagination page={page} total={12} onChange={setPage} />

<Stepper current={step} onStepClick={setStep}
  steps={[{ label: "Cuenta" }, { label: "Equipo", description: "Opcional" }, { label: "Pago" }]} />`,
    props: [
      P("Breadcrumb.items", "{ label; href?; onClick? }[]", "El último es la página actual (aria-current)."),
      P("Breadcrumb.max", "number", "Colapsa el centro con «…».", "4"),
      P("Pagination", "{ page; total; onChange; compact? }", "1-based. compact = «Página X de Y»."),
      P("Stepper", "{ steps; current; onStepClick?; orientation? }", "current 0-based; solo se puede volver a pasos hechos."),
    ],
  },

  "menu-contextual": {
    file: "ContextMenu.tsx",
    code: `import { ContextMenu } from "@/components/ui";

<ContextMenu items={[
  { label: "Renombrar", shortcut: "F2", onSelect: rename },
  { type: "separator" },
  { label: "Eliminar", danger: true, onSelect: remove },
]}>
  <FileRow />
</ContextMenu>`,
    props: [
      P("items", "MenuItem[]", "Mismo formato que Menu."),
      P("children", "ReactNode", "Zona sensible al clic derecho, pulsación larga y Mayús+F10 (UI SDK)."),
    ],
  },

  estructura: {
    file: "Estructura.tsx",
    code: `import { Accordion, Collapsible, Separator, Skeleton, SkeletonText, ScrollArea } from "@/components/ui";

<Accordion defaultOpen={["a"]} items={[
  { value: "a", title: "¿Puedo cambiar de plan?", meta: "Facturación", content: "Sí…" },
]} />

{loading ? <SkeletonText lines={3} /> : <Contenido />}
<Skeleton circle className="size-8" />
<Separator label="o continúa con" />
<ScrollArea maxHeight={240} fade>…</ScrollArea>`,
    props: [
      P("Accordion", "{ items; multiple?; defaultOpen? }", "items: { value, title, content, meta? }."),
      P("Collapsible", "{ title; children; defaultOpen? }", "Sección plegable suelta; Collapse para tu propio disparador."),
      P("Skeleton", "{ className; circle? }", "Dale el tamaño final: sin saltos al cargar."),
      P("Separator", '{ orientation?; label? }', "Hairline line; con label, texto centrado."),
      P("ScrollArea", "{ maxHeight?; fade? }", "Barra fina del sistema; fade difumina los bordes."),
    ],
  },

  entradas: {
    file: "Entradas.tsx",
    code: `import { Slider, NumberInput, MultiSelect, Dropzone } from "@/components/ui";

<Slider value={vol} onChange={setVol} min={0} max={100} showValue format={(v) => v + " %"} />
<Slider value={price} onChange={setPrice} step={5} showValue format={(v) => v + " €"} /> {/* [desde, hasta] */}
<NumberInput value={qty} onChange={setQty} min={0} max={99} suffix="uds" />
<MultiSelect value={mods} onChange={setMods}
  options={[{ value: "crm", label: "CRM" }, { value: "ai", label: "Asistente IA" }]} />
<Dropzone files={files} onFilesChange={setFiles} accept="image/*" maxSize={5e6} hint="Hasta 5 MB" />`,
    props: [
      P("Slider", "{ value: number | [desde, hasta]; onChange; min; max; step; showValue?; format? }", "UI SDK: flechas, RePág/AvPág ×10, Inicio/Fin; con un par, rango de dos tiradores."),
      P("NumberInput", "{ value: number | null; onChange; min?; max?; step?; suffix? }", "UI SDK: ↑ ↓ (Mayús o RePág ×10), mantener pulsado repite; entiende «1.234,5» según el idioma y redondea a `step` (usa 0.1 para decimales)."),
      P("MultiSelect", "{ value: T[]; onChange; options; maxChips? }", "Retroceso en el buscador quita el último."),
      P("Dropzone", "{ files; onFilesChange; accept?; multiple?; maxSize? }", "Controlado; rechaza y avisa de archivos grandes."),
    ],
  },

  acceso: {
    file: "Acceso.tsx",
    code: `import { PasswordInput, OtpInput, Field } from "@/components/ui";

<Field label="Contraseña">
  {(id) => <PasswordInput id={id} value={pw} onChange={setPw} autoComplete="new-password" />}
</Field>
<Field label="Código de verificación">
  {(id) => <OtpInput id={id} value={code} onChange={setCode} onComplete={verify} groupSize={3} />}
</Field>`,
    props: [
      P("PasswordInput", '{ value; onChange; autoComplete?: "current-password" | "new-password"; placeholder?; name?; required? }', "UI SDK: botón ver/ocultar (no envía el formulario), aviso de Bloq Mayús y se oculta al enviar para que el navegador ofrezca guardarla.", '"current-password"'),
      P("OtpInput", '{ value; onChange; onComplete?; length?; groupSize?; pattern?: "digits" | "letters" | "alphanumeric" }', "UI SDK: un único input nativo (pegar, autocompletar del SMS, deshacer) pintado como casillas; onComplete al rellenar todas.", "length 6, digits"),
    ],
  },

  actividad: {
    file: "Actividad.tsx",
    code: `import { Meter, Timeline } from "@/components/ui";

<Meter label="Almacenamiento" value={7.4} max={10} format={(v) => v + " de 10 GB"} thresholds={[7, 9]} />
<Meter label="Llamadas a la API" value={42} /> {/* porcentaje por defecto */}

<Timeline items={[
  { title: "Pedido recibido", time: "09:12", status: "complete" },
  { title: "Preparando envío", time: "Ahora", status: "current", description: "Almacén de Valencia" },
  { title: "En reparto", status: "upcoming" },
]} />`,
    props: [
      P("Meter", "{ value; min?; max?; label; format?; tone?; thresholds?: [aviso, peligro] }", "UI SDK, rol meter: medida dentro de un rango (cuota, uso). Para algo que avanza hasta terminar, Progress.", "max 100, porcentaje"),
      P("Timeline", '{ items: { title; time?; dateTime?; description?; status?: "complete" | "current" | "upcoming"; icon? }[] }', "UI SDK: lista navegable con flechas; el evento current lleva aria-current=\"step\"."),
    ],
  },

  paneles: {
    file: "Paneles.tsx",
    code: `import { Resizable, ResizablePanel, ResizableHandle } from "@/components/ui";

<Resizable autoSaveId="chat-layout" className="h-dvh">
  <ResizablePanel defaultSize={30} minSize={20} collapsible>…</ResizablePanel>
  <ResizableHandle aria-label="Redimensionar lista" />
  <ResizablePanel minSize={40}>…</ResizablePanel>
</Resizable>`,
    props: [
      P("Resizable", '{ orientation?: "horizontal" | "vertical"; autoSaveId?; onLayoutCommit? }', "UI SDK. Dale altura al grupo; los grupos se anidan (editor sobre terminal).", "horizontal"),
      P("ResizablePanel", "{ defaultSize?; minSize?; maxSize?; collapsible?; collapsedSize? }", 'Tamaños en % o con unidad ("240px"). collapsible: Intro o doble clic en el asa lo pliega.'),
      P("ResizableHandle", "{ aria-label? }", "Flechas (Mayús = paso largo), Inicio/Fin; nómbralo por lo que redimensiona."),
    ],
  },

  fechas: {
    file: "Fechas.tsx",
    code: `import { Calendar, DatePicker, DateRangePicker, type DateRange } from "@/components/ui";

<DatePicker value={date} onChange={setDate} min={new Date()} />

const [range, setRange] = useState<DateRange & { preset?: string }>({ from: null, to: null, preset: "30d" });
<DateRangePicker value={range} onChange={setRange} />

<Calendar mode="range" value={range} onChange={setRange} />`,
    props: [
      P("Calendar", '{ mode?: "single" | "range"; value; onChange; min?; max? }', "Flechas día/semana, RePág/AvPág mes, Inicio/Fin."),
      P("DatePicker", "{ value: Date | null; onChange; min?; max?; placeholder? }", "Hoy / Limpiar en el pie."),
      P("DateRangePicker", "{ value: DateRange & { preset? }; onChange; presets? }", "Presets primero; rango personalizado detrás."),
      P("utilidades", "addDays, addMonths, startOfDay, sameDay", "Sin dependencias."),
    ],
  },

  validacion: {
    file: "Registro.tsx",
    code: `// npx shadcn@latest add ${REGISTRY}/form.json  (react-hook-form + zod)
import { z } from "zod";
import { Form, FormField, FormSubmit, FormError, useZodForm } from "@/components/form";

const schema = z.object({ email: z.email("Email no válido"), plan: z.string().min(1) });
const form = useZodForm(schema, { defaultValues: { email: "", plan: "" } });

<Form form={form} onSubmit={async (v) => { await save(v); }}>
  <FormError />
  <FormField name="email" label="Email" required>{(f) => <Input {...f.input} />}</FormField>
  <FormField name="plan" label="Plan">
    {(f) => <Select value={f.value} onChange={(v) => (f.onChange(v), f.onBlur())} options={…} />}
  </FormField>
  <FormSubmit>Guardar</FormSubmit>
</Form>`,
    props: [
      P("useZodForm", "(schema, options?)", "useForm + zodResolver: valida al enviar y luego en vivo (sin saltos de layout al salir de un campo)."),
      P("FormField.children", "(f) => ReactNode", "f.input para Input/Textarea; f.value/f.onChange para el resto."),
      P("FormSubmit", "{ variant?; size? }", "Spinner y deshabilitado mientras envía."),
      P("FormError", "—", 'Muestra form.setError("root", { message }).'),
    ],
  },

  lineas: {
    file: "Ventas.tsx",
    code: `import { LineChart, type Series } from "@/components/ui";

const series: Series[] = [
  { key: "web", label: "Web", color: 1 },      // color fijo por entidad
  { key: "tienda", label: "Tienda", color: 2 },
];

<LineChart title="Unidades vendidas" data={rows} x="mes" series={series}
  area endLabels height={240} format={(v) => v.toLocaleString("es-ES")} />`,
    props: [
      P("data / x", "Record<string, unknown>[] / string", "Una fila por X; una columna por serie."),
      P("series", "{ key; label; color? }[]", "color 1–8 fija la tinta: filtrar no repinta. Máx. 8; agrupa el resto en «Otros»."),
      P("area / endLabels", "boolean", "Velo del 10 %; valor al final de cada serie (≤ 4)."),
      P("format / xFormat", "(v) => string", "Números del eje y tooltip; etiquetas de X."),
      P("title / description / actions", "ReactNode", "Cabecera con conmutador de vista de tabla."),
    ],
  },

  barras: {
    file: "Trimestres.tsx",
    code: `import { BarChart } from "@/components/ui";

<BarChart title="Ventas por trimestre" data={rows} x="t" series={series} stacked />`,
    props: [
      P("stacked", "boolean", "Apiladas con 2px de aire; tooltip con total."),
      P("…", "igual que LineChart", "Un único eje Y siempre: nunca dos escalas."),
    ],
  },

  cuota: {
    file: "KPIs.tsx",
    code: `import { Stat, Sparkline, SegmentedBar } from "@/components/ui";

<Stat label="Errores de pago" value="0,8 %" delta="−0,3 pts" trend="down" goodWhen="down" spark={last12} />

<SegmentedBar tall parts={[{ label: "Web", value: 4200 }, { label: "Tienda", value: 2600 }]} />`,
    props: [
      P("Stat.trend / goodWhen", '"up" | "down" | "flat" / "up" | "down"', "Verde si va en la dirección buena; flecha además del color."),
      P("Stat.spark", "number[]", "Sparkline de los últimos valores."),
      P("SegmentedBar", "{ parts; tall?; format? }", "Un todo en ≤ 6 partes; tall imprime la cuota si cabe. Mejor que un donut."),
    ],
  },
};
