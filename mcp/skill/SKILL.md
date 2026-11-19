---
name: beautiful-ui
description: Sistema de diseño Beautiful UI (React 19 + Tailwind v4, registro shadcn en davdelcar.github.io/beautiful-ui). Úsalo al crear o rediseñar interfaces web, pantallas, dashboards, formularios o apps con IA en React/Next.js cuando el usuario pida "Beautiful UI", "mi sistema de diseño", "mi UI" o "con mis componentes", o cuando el proyecto ya tenga components/beautifui/ o components/ui/index.ts de Beautiful UI. Cubre instalación, tokens, kit básico (Button, Input, Select, Card, DataTable, Dialog, Toast…) y los 20 componentes de IA (PromptBar, ThinkingState, ApprovalCard…). No lo uses en proyectos que ya usan otro sistema de diseño salvo que el usuario lo pida.
---

# Beautiful UI

Sistema de diseño para apps con IA: lienzo frío casi blanco, cards blancas con borde hairline, sombras suaves en capas, rampa de tinta neutra y color semántico usado con moderación. Tema claro/oscuro. Basado en beautifului.dev (componentes oficiales MIT © Turbo) más un kit básico propio.

- Galería: https://davdelcar.github.io/beautiful-ui/ · app de ejemplo: https://davdelcar.github.io/beautiful-ui/#/app
- Registro shadcn: https://davdelcar.github.io/beautiful-ui/r/registry.json
- Código: https://github.com/davdelcar/beautiful-ui

Si el MCP `beautiful-ui` está conectado, úsalo para la API exacta en vez de adivinar: `list_components`, `get_component` (código fuente y props), `get_design_tokens`, `get_install_instructions`, `get_example` (app completa de referencia).

## 1. ¿Está instalado?

Busca `components/beautifui/foundation.css` y `components/ui/index.ts` (bajo `src/` si el proyecto lo usa). Si no están, instala:

```bash
npx shadcn@latest init   # solo si no hay components.json (requiere React + Tailwind v4 + alias @/)
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/all.json
# o solo lo necesario: …/r/ui-kit.json, …/r/prompt-bar.json, …/r/<item>.json
```

Después, dos pasos a mano (no los omitas):

1. **CSS global**: sustituye `@import "tailwindcss";` por `@import "<ruta relativa>/components/beautifui/beautiful-ui.css";` (ya importa Tailwind). No dejes los dos imports.
2. **Fuentes Inter + JetBrains Mono**.
   - Vite/HTML: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`
   - Next.js: `Inter({ subsets: ["latin"], variable: "--font-inter" })` y `JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face" })`, con ambas `.variable` en el `className` de `<html>`.

Para actualizar: repite el `add` con `--overwrite`. Si `npx shadcn` falla con ENOTEMPTY: `rm -rf ~/.npm/_npx`.

## 2. Reglas

- **Importa desde `@/components/ui`** (kit + átomos oficiales reexportados). Los componentes de IA: `import PromptBar from "@/components/primitives/PromptBar"` (export default).
- **No edites** `components/atoms`, `components/primitives` ni `components/beautifui`: se sobrescriben al actualizar. Para personalizar, envuelve en un componente propio.
- **Nunca colores sueltos** (`bg-white`, `text-gray-500`, `#hex`, `bg-blue-600`). Usa tokens; así el modo oscuro funciona solo.
- **Modo oscuro** = clase `.dark` en `<html>`. Usa `useTheme()` / `<ThemeToggle />`. Evita el flash con un script inline que ponga `.dark` desde `localStorage["bui-theme"]` o `prefers-color-scheme`.
- **`<ToastProvider>`** envolviendo la app si usas `useToast()`.
- Con Next.js App Router, los componentes interactivos ya llevan `"use client"`; las páginas que usen hooks también lo necesitan.

## 3. Tokens (utilidades Tailwind)

| Rol | Clases |
|---|---|
| Superficies (de fondo a frente) | `bg-page` (app) · `bg-canvas` · `bg-inset` (zonas hundidas) · `bg-surface` (cards, popovers) · `bg-field` (inputs) |
| Hover | `hover:bg-hover`, `hover:bg-hover-2` (más fuerte, sobre `surface`) |
| Texto | `text-ink` (principal) · `text-ink-2` (secundario) · `text-ink-3` (terciario, placeholders, meta) |
| Bordes | `border-line` · `border-line-strong` (divisores: `border-b border-line`) |
| Acento | `bg-accent` `text-accent-ink` `bg-accent-tint` |
| Semántico | `green` / `orange` / `red` + `-tint` (p. ej. `bg-green-tint text-green`) |
| Sombras (incluyen el borde) | `shadow-hairline` · `shadow-btn` · `shadow-card` · `shadow-raised` · `shadow-overlay` · `shadow-inset-field` |
| Radios | `rounded-chip` 6 · `rounded-control` 8 · `rounded-card` 10 · `rounded-window` 14 · `rounded-full` botones |
| Tipografía | `font-sans` (Inter) · `font-mono` (cifras, IDs, código) + `tabular-nums` |
| Easing | `ease-out-strong` · `ease-in-out-strong` |

**Escala tipográfica** (una clase = tamaño + interlineado + tracking + peso; úsala en vez de `text-[13px]`):

| Clase | Medida | Uso |
|---|---|---|
| `text-display` | 32 / 600 | portada, héroe |
| `text-title` | 22 / 600 | título de página (uno por vista) |
| `text-heading` | 15 / 600 | título de card, diálogo, sheet |
| `text-lead` | 15 | párrafo introductorio |
| `text-body` | 13 | texto base de la UI |
| `text-meta` | 12 | secundario, celdas, ayudas |
| `text-micro` | 11 | pies, contadores, atajos |
| `text-overline` | 10.5 / 500 | etiqueta de grupo, siempre con `uppercase` |

Pesos 400/500/600; nada de `font-bold` grande. Capas: `--z-dropdown` 40, `--z-overlay` 50, `--z-toast` 60.

Utilidades de la fundación: `primitive-card-bar` (cabecera de card), `primitive-card-pad`, `primitive-card-footer`, `primitive-icon-button`, `filter-status-{todo,progress,done}`.

Animaciones (keyframes globales): `pop-in` (menús), `fade-up` (entrada de bloques, escalona con delay), `fade-in`, `shimmer-text`, `spin`, `caret-blink`. Ej.: `style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}`. Duraciones cortas (120–300 ms); respeta `prefers-reduced-motion`.

## 4. Kit básico (`@/components/ui`)

- `Button` — `variant`: `primary` (tinta, acción principal) · `secondary` (por defecto) · `ghost` · `accent` · `success` · `quiet` (barras densas); `size`: `xs` `sm` `md`. Píldora. Un solo `primary` por vista.
- `IconButton` — `label` (obligatorio, accesible + tooltip), `tone="quiet"|"secondary"`, `tooltip={false}` para quitarlo.
- `Input` (`leading`, `trailing` nodos; resto de props nativos, `forwardRef`), `Textarea`, `Kbd`.
- `Field` — `label`, `hint`, `error`, hijos como función: `<Field label="Email">{(id) => <Input id={id} />}</Field>`.
- `Checkbox` (`checked`, `onChange(bool)`, `label`, `indeterminate`), `Switch` (igual), `RadioGroup` (`value`, `onChange`, `options: {value,label,disabled?}[]`).
- `Select` — `value | null`, `onChange`, `options: {value,label}[]`, `placeholder`.
- `Menu` — `trigger={({open,toggle}) => …}`, `items: MenuItem[]` (`{label, icon?, shortcut?, danger?, onSelect?}` · `{type:"label", label}` · `{type:"separator"}`), `align`.
- `Segmented` (selector compacto, `size="sm"|"md"`), `Tabs` (con contador `count`), `FilterChips` (con `dot` de color). Todos: `value`, `onChange`, `options: {value,label,count?}[]`.
- `Tooltip` — `content`, envuelve un elemento.
- `Popover` — panel flotante genérico: `trigger={({open,toggle}) => …}`, hijos o `(close) => …`, `align="start"|"center"|"end"`, `side`, `width` (px o `"trigger"`). Para filtros y formularios cortos.
- `Combobox` — select con buscador (filtra sin tildes, ↑ ↓ Enter): `value`, `onChange`, `options: {value,label,hint?,icon?,keywords?,disabled?}[]`, `searchPlaceholder`, `emptyText`. Úsalo en vez de `Select` con más de ~7 opciones.
- `Sheet` — panel lateral/inferior: `open`, `onClose`, `side="right"|"left"|"bottom"`, `title`, `description`, `footer`, `width`, `bare`. Para detalle/edición sin salir de la vista y para la navegación en móvil (`<Sheet side="left" width={224} bare><SidebarNav fill /></Sheet>`).
- `CommandPalette` + `useHotkey` — paleta ⌘K: `open`, `onOpenChange`, `groups: {label, items: {id,label,icon?,hint?,shortcut?,keywords?,onSelect}[]}[]`. Ábrela con `useHotkey("k", () => setOpen(o => !o))`; `modKey()` da "⌘" o "Ctrl". Toda app con navegación debería tenerla.
- `Dialog` — `open`, `onClose`, `title`, `description`, `footer`, hijos. Usa `<dialog>` nativo.
- `const toast = useToast()` → `toast(texto, { label, onClick }?)` (acción opcional, p. ej. "Deshacer"). Requiere `<ToastProvider>`.
- `Card` (`elevation="hairline"|"card"|"raised"`) + `CardHeader` (`title`, `icon`, `action`) + `CardBody` + `CardFooter`.
- `Stat` (`label`, `value`, `delta`, `trend="up"|"down"|"flat"`), `Progress` (`value` 0–100, `tone`), `Spinner` (`size`).
- `StatusPill` (`status="todo"|"progress"|"done"`), `Tag`, `Avatar` (`name`, `color`, `size="sm"|"md"|"lg"|"xl"`, `square`), `AvatarStack` (`people`, `max`).
- `Alert` (`tone="info"|"success"|"warning"|"danger"`, `title`, `action`), `EmptyState` (`icon`, `title`, `hint`, `action`).
- `DataTable<T>` — `columns: Column<T>[]` (`key`, `header`, `width`, `align`, `render(row)`), `rows`, `rowKey`, `isVisible`, `selected`/`onSelectedChange` (Set de keys), `toolbar`, `footer`, `minWidth`.
- `ThemeToggle`, `useTheme()` → `{ dark, toggle, setTheme }` (estado compartido entre componentes), `setTheme(dark)` fuera de React.
- Átomos oficiales: `EntityChip`, `Monogram`, `ValuePill`, `Shimmer`, `StreamText`, `GlideMenu`.
- Iconos: `IconSearch IconPlus IconCheck IconX IconChevronDown IconChevronRight IconArrowRight IconMore IconInfo IconAlert IconCheckCircle IconCopy IconTrash IconPencil IconBell IconSun IconMoon IconInbox IconFilter IconLink IconSparkle IconMenu IconHome IconSettings` (prop `size`). Para más, `iconoir-react` (ya es dependencia) con `width`/`height` 16 y `strokeWidth={1.6}`.

## 5. Componentes de IA (`@/components/primitives/*`)

Todos traen datos de demo; pásales los tuyos por props (`rows`, `questions`, `content`, `labels`, `recents`…). Revisa props exactas con `get_component <nombre>`.

| Necesidad | Componente |
|---|---|
| Entrada de prompt / chat | `PromptBar` (`demo={false}` para usarlo de verdad), `ChatComposer` |
| El agente piensa / trabaja | `ThinkingState`, `LoadingState`, `ToolChips`, `TaskRows` |
| Respuesta en streaming | `StreamingText`, átomo `StreamText` |
| Pedir confirmación / preguntas | `ApprovalCard` |
| Sugerencias | `RecommendationCard`, `ContextCards`, `FineTuneCard` |
| Datos | `RecordsTable`, `FilterTable`, `DiffTable` (cambios propuestos), `InsightCards` (gráficas) |
| Navegación | `SidebarNav` (`fill` para altura completa), `SearchList` (item `search`), `SelectionActions` |
| Otros | `CodeBlock`, `Flowchart` |

## 6. Composición

Esqueleto de app (igual que la app de ejemplo, que además monta `CommandPalette` con ⌘K y un `Sheet` para el menú móvil):

```tsx
<div className="flex h-screen overflow-hidden bg-page">
  <SidebarNav fill recents={…} activeNav={nav} onNavigate={setNav} className="border-r border-line" />
  <div className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-page pr-3 pl-4">…</header>
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 p-4 sm:p-6">
        <h1 className="text-title text-ink">…</h1>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{/* <Stat/> en Cards */}</div>
        <Card><CardHeader title="…" action={<Button size="xs">…</Button>} /><CardBody>…</CardBody></Card>
      </div>
    </main>
  </div>
</div>
```

- Fondo `bg-page`; contenido en `Card` (`bg-surface` + `shadow-card`). No anides cards con sombra: dentro de una card usa `bg-inset` o divisores `border-line`.
- Espaciado denso: `gap-3`/`gap-4` entre bloques, `px-3 py-2.5` dentro. Rejillas con `minmax(0,1fr)`.
- Color como condimento: neutros por defecto; acento solo en foco/selección/acción clave; semánticos solo para estado.
- `IconButton` y `primitive-icon-button` fijan `display`: para ocultarlo por breakpoint envuélvelo (`<span className="flex md:hidden"><IconButton …/></span>`).
- Responsive: sidebar visible desde `md`; en móvil, botón `IconMenu` que abre un `Sheet` con la `SidebarNav`.
- Accesibilidad: `IconButton` siempre con `label`; foco visible ya lo da la fundación; `aria-label` en navs.

## 7. Antes de terminar

- [ ] Ningún color/sombra/radio/tamaño de texto fuera de los tokens; probado en claro y oscuro.
- [ ] Funciona a 390px de ancho (navegación en `Sheet`, sin scroll horizontal).
- [ ] CSS global importa `beautiful-ui.css` (y no `tailwindcss` además) y las fuentes cargan.
- [ ] Nada editado dentro de `atoms/`, `primitives/` o `beautifui/`.
- [ ] El proyecto compila (`tsc`/`build`).
