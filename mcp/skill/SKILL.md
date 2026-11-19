---
name: beautiful-ui
description: Sistema de diseño Beautiful UI (React 19 + Tailwind v4, registro shadcn en davdelcar.github.io/beautiful-ui). Úsalo al crear o rediseñar interfaces web, pantallas, dashboards, formularios, gráficas o apps con IA en React/Next.js cuando el usuario pida "Beautiful UI", "mi sistema de diseño", "mi UI" o "con mis componentes", o cuando el proyecto ya tenga components/beautifui/ o components/ui/index.ts de Beautiful UI. Cubre instalación, tokens (AA), kit completo (formularios, fechas, tablas, overlays, navegación, gráficas), validación con zod, plantillas de página (login, listado, analítica, ajustes, alta, error) y los 20 componentes de IA. No lo uses en proyectos que ya usan otro sistema de diseño salvo que el usuario lo pida.
---

# Beautiful UI

Sistema de diseño para apps: lienzo frío casi blanco, cards blancas con borde hairline, sombras suaves en capas, tinta neutra y color semántico con moderación. Claro/oscuro, 5 acentos, contraste WCAG AA verificado con axe, textos en español o inglés.

- Galería: https://davdelcar.github.io/beautiful-ui/ · app: `#/app` · plantillas: `#/plantillas/<login|listado|analitica|ajustes|alta|error>`
- Registro shadcn: https://davdelcar.github.io/beautiful-ui/r/registry.json (versionado: `/r/v2.0.0/<item>.json`)
- Tokens DTCG: https://davdelcar.github.io/beautiful-ui/tokens.json · Código: https://github.com/davdelcar/beautiful-ui

Con el MCP `beautiful-ui` conectado, no adivines la API: `list_components`, `get_component <item>` (fuente + firmas), `get_design_tokens`, `get_install_instructions`, `get_example <app|login|listado|analitica|ajustes|alta|error>`.

## 1. Instalar

Comprueba si existen `components/beautifui/foundation.css` y `components/ui/index.ts` (bajo `src/` si aplica). Si no:

```bash
npx shadcn@latest init        # solo si no hay components.json (React + Tailwind v4 + alias @/)
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/all.json
# o por partes: ui-kit.json (kit) · form.json (zod) · login-page.json … · prompt-bar.json …
```

Pasos a mano, siempre:
1. **CSS global**: sustituye `@import "tailwindcss";` por `@import "<ruta>/components/beautifui/beautiful-ui.css";` (ya importa Tailwind, la fundación y `kit.css`).
2. **Fuentes Inter + JetBrains Mono**. Vite: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`. Next: `Inter({ variable: "--font-inter" })`, `JetBrains_Mono({ variable: "--font-mono-face" })` en `<html className>`.
3. **Providers en la raíz**: `<UIProvider locale="es-ES"><ToastProvider>{app}</ToastProvider></UIProvider>`.
4. **Sin parpadeo de tema**: Next → `<html suppressHydrationWarning><head><ThemeScript /></head>`; Vite → pega `themeScript` en un `<script>` de index.html.

Actualizar: el mismo `add` con `--overwrite`. Si `npx shadcn` falla con ENOTEMPTY: `rm -rf ~/.npm/_npx`.

## 2. Reglas

- Importa del kit: `import { … } from "@/components/ui"`; formularios: `@/components/form`; IA: `import X from "@/components/primitives/X"`; plantillas: `@/components/blocks/XPage`.
- **No edites** `components/atoms`, `components/primitives`, `components/beautifui` (se sobrescriben). Personaliza envolviendo.
- **Solo tokens**: nada de `bg-white`, `text-gray-500`, `#hex`, `text-[13px]`, `rounded-lg`, `shadow-md`. El modo oscuro sale solo.
- **Accesibilidad**: `IconButton` siempre con `label`; `Checkbox`/`Switch` sin texto visible → `aria-label`; `Progress` → `label`; nada de botones dentro de botones; textos de ayuda en `text-ink-3` (ya pasa AA, no lo aclares más).
- `IconButton`/`primitive-icon-button` fijan `display`: para ocultarlo por breakpoint, envuélvelo (`<span className="flex md:hidden">…</span>`).
- Next App Router: los componentes ya llevan `"use client"` donde hace falta; tus páginas con hooks también.

## 3. Tokens

| Rol | Clases |
|---|---|
| Superficies | `bg-page` (app) · `bg-canvas` · `bg-inset` (hundido, pies de card) · `bg-surface` (cards, popovers) · `bg-field` (inputs) |
| Hover | `hover:bg-hover` · `hover:bg-hover-2` |
| Texto | `text-ink` · `text-ink-2` (secundario) · `text-ink-3` (meta, placeholders) |
| Bordes | `border-line` · `border-line-strong` |
| Acento | `bg-accent` (con `text-white`) · `text-accent-ink` · `bg-accent-tint` |
| Semántico | `text-green/orange/red` sobre `bg-*-tint`; rellenos con texto blanco: `bg-green-solid`, `bg-red-solid` |
| Sombras (incluyen borde) | `shadow-hairline` · `shadow-btn` · `shadow-card` · `shadow-raised` · `shadow-overlay` |
| Radios | `rounded-chip` 6 · `rounded-control` 8 · `rounded-card` 10 · `rounded-window` 14 · `rounded-full` |
| Fuente | `font-sans` · `font-mono` (+ `tabular-nums` solo en columnas alineadas) |
| Easing | `ease-out-strong` · `ease-in-out-strong` |

**Tipografía** (una clase = tamaño + interlineado + tracking + peso): `text-display` 32 · `text-title` 22 (uno por vista) · `text-heading` 15 (card/diálogo) · `text-lead` 15 · `text-body` 13 (base) · `text-meta` 12 · `text-micro` 11 · `text-overline` 10.5 (+ `uppercase`).

**Acento de marca**: `setAccent("blue" | "violet" | "green" | "orange" | "pink")`. **Tema**: `useTheme()` → `{ dark, toggle, setTheme }`, `<ThemeToggle />`.

**Gráficas**: `--chart-1…8` (orden fijo validado para daltonismo); usa los componentes de gráficas, no pintes a mano.

Animaciones: `pop-in` (menús), `fade-up` (entradas, escalonadas), `fade-in`, `skeleton-pulse`, `shimmer-text`, `spin`. 120–300 ms con `cubic-bezier(0.23,1,0.32,1)`; el kit respeta `prefers-reduced-motion`.

## 4. Kit (`@/components/ui`)

**Acciones**: `Button` (`variant` primary · secondary · ghost · accent · success · quiet; `size` xs · sm · md; un solo primary por vista) · `IconButton` (`label`, `tone`) · `ThemeToggle`.

**Campos**: `Field` (`label`, `hint`, `error`, hijos `(id) => …`) · `Input` (`leading`, `trailing`) · `Textarea` · `Select` (≤ 7 opciones) · `Combobox` (con buscador, `hint`, `icon`, `keywords`) · `MultiSelect` (chips) · `Checkbox` · `RadioGroup` · `Switch` · `Slider` (`showValue`, `format`) · `NumberInput` (`min`, `max`, `step`, `suffix`) · `Dropzone` (`files`, `onFilesChange`, `accept`, `maxSize`) · `Kbd`.

**Fechas**: `DatePicker` (`value: Date | null`, `min`, `max`) · `DateRangePicker` (`value: { from, to, preset? }`, presets Hoy/7/30/90 días/mes) · `Calendar` (`mode="single" | "range"`) · utilidades `addDays`, `addMonths`, `startOfDay`, `sameDay`.

**Validación** (`@/components/form`, item `form`):
```tsx
const schema = z.object({ email: z.email("Email no válido"), plan: z.string().min(1, "Elige un plan") });
const form = useZodForm(schema, { defaultValues: { email: "", plan: "" } });
<Form form={form} onSubmit={async (v) => save(v)}>
  <FormError />                                   {/* form.setError("root", { message }) */}
  <FormField name="email" label="Email" required>{(f) => <Input {...f.input} />}</FormField>
  <FormField name="plan" label="Plan">{(f) => <Select value={f.value} onChange={(v) => (f.onChange(v), f.onBlur())} options={…} />}</FormField>
  <FormSubmit>Guardar</FormSubmit>
</Form>
```
Para controles no nativos usa `f.value` / `f.onChange` y llama `f.onBlur()` al elegir. Formularios por pasos: un schema y `form.trigger([campos del paso])` antes de avanzar.

**Navegación**: `Tabs` · `Segmented` · `FilterChips` · `Breadcrumb` (`items`, `max`) · `Pagination` (`page`, `total`, `onChange`, `compact`) · `Stepper` (`steps`, `current`, `onStepClick`, `orientation`) · `CommandPalette` + `useHotkey("k", …)` + `modKey()` (toda app con navegación debería tener ⌘K).

**Overlays**: `Menu` (`trigger={({open,toggle}) => …}`, `items: MenuItem[]`) · `ContextMenu` (clic derecho) · `Popover` (`width`, `align`, hijos o `(close) => …`) · `Tooltip` · `Dialog` (`open`, `onClose`, `title`, `footer`) · `Sheet` (`side` right · left · bottom, `bare`) · `useToast()` → `toast(texto, { label, onClick }?)`.

**Datos**: `DataTable<T>` (`columns: { key, header, width, align, render, sortValue? }[]`, `rows`, `rowKey`, `isVisible`, `selected`/`onSelectedChange`, `onRowClick`, `empty`, `toolbar`, `footer`) · `Card` + `CardHeader`/`CardBody`/`CardFooter` · `Stat` (`label`, `value`, `delta`, `trend`, `goodWhen`, `spark`) · `StatusPill` (todo · progress · done) · `Tag` · `Avatar`/`AvatarStack` · `Progress` (`label`) · `Spinner` · `Alert` (`tone`) · `EmptyState` · `Skeleton`/`SkeletonText` · `Accordion` · `Collapsible` · `Separator` (`label`) · `ScrollArea`.

**Gráficas** (todas con leyenda desde 2 series, tooltip con todas las series y botón «Ver tabla»):
- `LineChart` (`data`, `x`, `series: { key, label, color? }[]`, `area`, `endLabels`, `format`, `xFormat`, `title`, `description`, `height`) para evolución.
- `BarChart` (igual + `stacked`) para comparar categorías o partes en el tiempo.
- `SegmentedBar` (`parts`, `tall`) para el reparto de un todo (en lugar de donut/pie).
- `Sparkline` (`values`) dentro de `Stat` vía `spark`.
- Reglas: un solo eje Y (nunca doble eje); máximo 8 series (agrupa el resto en «Otros»); fija `color` por entidad para que filtrar no repinte; si el dato es un número, usa `Stat`, no una gráfica; filtros en una fila encima de todo lo que filtran (fechas primero).

**Idioma**: `UIProvider` (`locale`, `labels`), `useUI()`, `useLabels()`.

## 5. Componentes de IA (`@/components/primitives/*`)

Traen datos de demo; pásales los tuyos (`rows`, `questions`, `content`, `labels`, `recents`…). Props exactas: `get_component <nombre>`.

| Necesidad | Componente |
|---|---|
| Entrada de prompt / chat | `PromptBar` (`demo={false}`, `onSend`), `ChatComposer` |
| El agente piensa / trabaja | `ThinkingState`, `LoadingState`, `ToolChips`, `TaskRows` |
| Respuesta en streaming | `StreamingText` (`content`, `followUps`), átomo `StreamText` |
| Confirmación humana | `ApprovalCard` (`questions`, `onSubmitted`) |
| Sugerencias | `RecommendationCard`, `ContextCards`, `FineTuneCard` |
| Datos | `RecordsTable`, `FilterTable`, `DiffTable`, `InsightCards` |
| Navegación | `SidebarNav` (`fill`), `SearchList` (item `search`), `SelectionActions` |
| Otros | `CodeBlock` (`code`, `lines`, `filename`), `Flowchart` |

## 6. Plantillas (empieza por aquí para pantallas completas)

| Pantalla | Item | Incluye |
|---|---|---|
| Login / registro | `login-page` | zod, proveedores sociales, error de servidor |
| Listado + detalle | `list-detail-page` | búsqueda, MultiSelect, DateRangePicker, tabla ordenable y paginada, Sheet de detalle, ContextMenu |
| Analítica | `analytics-page` | filtros, Stat + sparkline, LineChart, BarChart apilado, SegmentedBar, tabla |
| Ajustes | `settings-page` | subnav (Select en móvil), formulario de perfil, notificaciones, tema/acento/idioma, zona de peligro |
| Alta por pasos | `wizard-page` | Stepper, validación por paso (`trigger`), resumen |
| Errores | `error-page` | 404 / 403 / 500 / mantenimiento |

Instala (`npx shadcn add …/r/<item>.json`), móntala en tu ruta y sustituye los datos de ejemplo y los `onSubmit`.

## 7. Composición

```tsx
<div className="flex h-screen overflow-hidden bg-page">
  <div className="hidden md:flex"><SidebarNav fill … className="border-r border-line" /></div>
  <Sheet open={menu} onClose={…} side="left" width={224} bare><SidebarNav fill … /></Sheet>
  <div className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-page pr-3 pl-4">
      <span className="flex md:hidden"><IconButton label="Menú" onClick={…}><IconMenu /></IconButton></span>
      <Breadcrumb items={…} />
      {/* buscador que abre CommandPalette, ThemeToggle… */}
    </header>
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 p-4 sm:p-6">
        <h1 className="text-title text-ink">…</h1>
        <div className="flex flex-wrap items-center gap-2">{/* filtros */}</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{/* <Stat/> */}</div>
        <Card>…</Card>
      </div>
    </main>
  </div>
  <CommandPalette open={…} onOpenChange={…} groups={…} />
</div>
```

- Contenido en `Card`; dentro de una card usa `bg-inset` o divisores `border-line`, no cards con sombra anidadas.
- Espaciado denso: `gap-3`/`gap-4` entre bloques; rejillas con `minmax(0,1fr)`.
- Color como condimento: acento solo en foco, selección y la acción clave; semánticos solo para estado.
- Carga: `Skeleton` con el tamaño final; al refrescar datos, mantén lo anterior con opacidad (sin parpadeo). Vacío: `EmptyState` con acción.
- Breakpoints de Tailwind: `sm` 640 · `md` 768 (sidebar) · `lg` 1024 · `xl` 1280 (paneles laterales).

## 8. Antes de terminar

- [ ] Solo tokens (color, texto, sombra, radio); probado en claro y oscuro.
- [ ] CSS global importa `beautiful-ui.css` (y no `tailwindcss` además); fuentes y providers montados.
- [ ] Funciona a 390px: navegación en `Sheet`, sin scroll horizontal.
- [ ] Teclado: todo alcanzable con Tab, foco visible, Escape cierra overlays, ⌘K si hay navegación.
- [ ] Formularios con zod y mensajes en el idioma del usuario.
- [ ] Nada editado en `atoms/`, `primitives/` ni `beautifui/`; compila (`tsc`/`build`).
