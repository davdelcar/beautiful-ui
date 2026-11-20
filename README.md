<img src="public/assets/icon.svg" width="64" height="64" alt="">

# Beautiful UI

Sistema de diseño completo para apps en React, basado en [beautifului.dev](https://www.beautifului.dev/). Usa **los componentes oficiales de la librería** (los 20 de IA, sus átomos y su fundación) y añade todo lo necesario para construir cualquier app: kit de formularios, fechas, tablas, overlays, navegación y gráficas; validación con zod; plantillas de página; tokens con contraste AA; acentos de marca; i18n; tests y versiones.

React 19 · Tailwind CSS v4 · TypeScript · v2.1.1

- **Galería:** https://davdelcar.github.io/beautiful-ui/ — app de ejemplo en `#/app`, plantillas en `#plantillas`
- **Registro shadcn:** https://davdelcar.github.io/beautiful-ui/r/registry.json
- **Tokens (DTCG):** https://davdelcar.github.io/beautiful-ui/tokens.json

## Usar el sistema en otro proyecto

En un proyecto con React + Tailwind v4 y el alias `@/` (Next.js o Vite), desde cualquier máquina:

```bash
npx shadcn@latest init        # solo si el proyecto aún no tiene components.json

npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/all.json         # todo
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/ui-kit.json      # solo el kit
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/login-page.json  # una plantilla
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/v2.1.1/all.json  # versión fijada
```

Después:

1. **Estilos.** En tu CSS global sustituye `@import "tailwindcss";` por `@import "./components/beautifui/beautiful-ui.css";` (ajusta la ruta). Ya importa Tailwind, la fundación y `kit.css`.
2. **Fuentes.** Inter y JetBrains Mono: `<link>` de Google Fonts, o con `next/font` las variables `--font-inter` y `--font-mono-face` en `<html>`.
3. **Providers.** `<UIProvider locale="es-ES"><ToastProvider>…</ToastProvider></UIProvider>` en la raíz.
4. **Sin parpadeo de tema.** Next: `<html suppressHydrationWarning><head><ThemeScript /></head>`. Vite: el contenido de `themeScript` en un `<script>` de `index.html`.

```tsx
import { Button, Card, DataTable, DatePicker, LineChart, useToast } from "@/components/ui";
import { Form, FormField, useZodForm } from "@/components/form";
import PromptBar from "@/components/primitives/PromptBar";
import LoginPage from "@/components/blocks/LoginPage";
```

### Items del registro

| Item | Contenido |
|---|---|
| `all` | Todo |
| `foundation` | Tokens, `@theme`, keyframes, `kit.css` (tipografía, AA, acentos, paleta de gráficas) |
| `ui-kit` | El kit completo de `@/components/ui` (abajo) |
| `form` | `Form`, `FormField`, `FormSubmit`, `FormError`, `useZodForm` (react-hook-form + zod) |
| `login-page` · `list-detail-page` · `analytics-page` · `settings-page` · `wizard-page` · `error-page` | Plantillas de página |
| `button` · `entity-chip` · `value-pill` · `shimmer` · `stream-text` · `glide-menu` | Átomos oficiales |
| `approval-card` · `chat-composer` · `code-block` · `context-cards` · `diff-table` · `filter-table` · `fine-tune-card` · `flowchart` · `insight-cards` · `loading-state` · `prompt-bar` · `recommendation-card` · `records-table` · `search` · `selection-actions` · `sidebar-nav` · `streaming-text` · `task-rows` · `thinking-state` · `tool-chips` | Los 20 componentes oficiales de IA |
| `utils` · `central-icons` | `cn()` y el sustituto de los iconos de SidebarNav |

Cada item arrastra solo lo que necesita (dependencias npm e items). Para actualizar, repite el `add` con `--overwrite`; para fijar una versión usa `/r/vX.Y.Z/`.

## Usarlo desde tus agentes (skill + MCP)

```bash
npx -y https://davdelcar.github.io/beautiful-ui/mcp/beautiful-ui-mcp-2.1.1.tgz install
# --skill-only | --mcp-only   ·   uninstall para quitarlo
```

Para actualizar, ejecuta el mismo comando con la versión nueva (`version` en `/r/registry.json`). npx cachea por URL, así que la URL sin versión (`beautiful-ui-mcp.tgz`) puede servir una copia vieja en máquinas donde ya se usó.

Instala la **skill** `beautiful-ui` en `~/.claude/skills`, `~/.codex/skills` y `~/.agents/skills` (según existan) y registra el **MCP** `beautiful-ui` en Claude Code y Codex.

- **Skill** ([`mcp/skill/SKILL.md`](mcp/skill/SKILL.md)): instalación, reglas, tokens, API completa del kit, gráficas, formularios, plantillas, componentes de IA, composición y checklist.
- **MCP** ([`mcp/server.mjs`](mcp/server.mjs), sin dependencias, lee el registro en vivo): `list_components`, `get_component`, `get_design_tokens`, `get_install_instructions`, `get_guidelines`, `get_example` (app, galería y las 6 plantillas) y el prompt `beautiful-ui`.
- Otros clientes MCP: `{ "mcpServers": { "beautiful-ui": { "command": "npx", "args": ["-y", "https://davdelcar.github.io/beautiful-ui/mcp/beautiful-ui-mcp-2.1.1.tgz"] } } }`. En Windows: `"command": "cmd", "args": ["/c", "npx", "-y", "…"]` (el instalador ya lo hace así).

## El kit (`@/components/ui`)

| Grupo | Componentes |
|---|---|
| Acciones | `Button` (oficial), `IconButton`, `ThemeToggle` |
| Campos | `Field`, `Input`, `Textarea`, `Select`, `Combobox`, `MultiSelect`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `NumberInput`, `Dropzone`, `Kbd` |
| Fechas | `Calendar` (single/range), `DatePicker`, `DateRangePicker` (presets) |
| Navegación | `Tabs`, `Segmented`, `FilterChips`, `Breadcrumb`, `Pagination`, `Stepper`, `CommandPalette` + `useHotkey` |
| Overlays | `Menu`, `ContextMenu`, `Popover`, `Tooltip`, `Dialog`, `Sheet`, `ToastProvider` / `useToast` |
| Datos | `DataTable` (orden, selección, fila clicable, vacío), `Card`, `Stat` (+ sparkline), `StatusPill`, `Tag`, `Avatar`, `AvatarStack`, `Progress`, `Spinner`, `Alert`, `EmptyState` |
| Estructura | `Accordion`, `Collapsible`, `Separator`, `Skeleton`, `SkeletonText`, `ScrollArea` |
| Gráficas | `LineChart` (área), `BarChart` (agrupadas/apiladas), `SegmentedBar`, `Sparkline` — leyenda, tooltip y vista de tabla incluidos |
| Sistema | `UIProvider` (es/en), `useTheme`, `setTheme`, `setAccent`, `ThemeScript`, iconos |

Cada sección de la galería tiene un botón **«</> Código»** con ejemplo copiable y tabla de props.

## Fundamentos

- **Tokens** de superficie, tinta, borde, acento y semánticos, en claro y oscuro (`foundation.css` oficial + ajustes en `src/styles/kit.css`).
- **Contraste AA.** `kit.css` ajusta `ink-2`, `ink-3`, acento y semánticos para que todo el texto pase 4.5:1. Lo verifica axe en claro y oscuro en cada build.
- **Tipografía con nombre:** `text-display`, `text-title`, `text-heading`, `text-lead`, `text-body`, `text-meta`, `text-micro`, `text-overline`.
- **Acentos:** `setAccent("blue" | "violet" | "green" | "orange" | "pink")`.
- **Paleta de gráficas** `--chart-1…8` validada para daltonismo, con texto interior elegido por luminancia.
- **Capas y duraciones:** `--z-*`, `--duration-*`.
- **Exportación** en `tokens.json` (formato DTCG) para Figma Tokens Studio o Style Dictionary.

## Calidad

```bash
npm test            # vitest: lógica y componentes (teclado, filtros, orden, validación)
npm run test:e2e    # Playwright sobre la build: axe en 8 rutas × claro/oscuro, solapes a 390/768/1280 px, desplegables y flujos clave
```

El workflow ejecuta ambos antes de publicar; si fallan, no se despliega.

## Desarrollo

```bash
npm install
npm run dev               # http://localhost:5173 → galería · #/app · #/plantillas/<id>
npm run build             # registro (public/r) + tokens + skill/MCP + sitio
npm run registry:sync     # trae la última versión de los componentes oficiales
npm run registry:build    # solo regenera public/r
```

**Versiones:** sube `version` en `package.json`, añade la entrada en `CHANGELOG.md`, crea la etiqueta `vX.Y.Z` y haz push de la etiqueta y de `main`. Cada despliegue regenera `/r/vX.Y.Z/` para todas las etiquetas.

## Estructura

```
src/
  app/beautifui/        ← OFICIAL: foundation.css, records-table.css, sidebar-nav.css
  components/atoms/     ← OFICIAL: Button, EntityChip, ValuePill, Shimmer, StreamText
  components/primitives/← OFICIAL: los 20 componentes de IA + GlideMenu
  components/ui/        ← kit propio (sobre los átomos oficiales)
  components/form/      ← formularios con react-hook-form + zod
  components/blocks/    ← plantillas de página
  styles/kit.css        ← tipografía, AA, acentos, paleta de gráficas, keyframes del kit
  pages/                   galería (DesignSystem, GalleryMore, docs), app de ejemplo
  vendor/central-icons.tsx sustituto de los iconos de pago de SidebarNav
tests/unit · tests/e2e     vitest · Playwright + axe
scripts/                   sync del registro oficial y build del registro propio
mcp/                       servidor MCP y skill para agentes
```

Las carpetas **OFICIAL** no se editan a mano (`npm run registry:sync` las sobrescribe). Para cambiar su aspecto se usan tokens en `kit.css`; para cambiar su comportamiento, se envuelven en `components/ui`.

## Notas

- **Central Icons** (lo usa SidebarNav) es de pago. `vite.config.ts` redirige sus imports a `src/vendor/central-icons.tsx`. Con licencia: `npm i @central-icons-react/round-outlined-radius-2-stroke-2` y quita el alias.
- **Parche del registro oficial:** publica el último `@media` de `records-table.css` partido. El script de sync lo recoloca.
- **Licencia:** MIT. Componentes oficiales © Turbo (beautifului.dev), MIT.
