<img src="public/assets/icon.svg" width="64" height="64" alt="">

# Beautiful UI

Sistema de diseño para apps con IA basado en [beautifului.dev](https://www.beautifului.dev/). Usa **los componentes oficiales de la librería** (descargados de su registro shadcn) y añade un kit de elementos básicos construido sobre sus átomos y su fundación.

React 19 · Tailwind CSS v4 · TypeScript.

- **Galería:** https://davdelcar.github.io/beautiful-ui/ (app de ejemplo en `#/app`)
- **Registro shadcn:** https://davdelcar.github.io/beautiful-ui/r/registry.json

## Usar el sistema en otro proyecto

Desde cualquier máquina, en un proyecto con React + Tailwind v4 y el alias `@/` (Next.js o Vite):

```bash
npx shadcn@latest init        # solo si el proyecto aún no tiene components.json

npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/all.json        # todo
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/ui-kit.json     # solo el kit básico
npx shadcn@latest add https://davdelcar.github.io/beautiful-ui/r/prompt-bar.json # un componente suelto
```

El CLI copia el código a tu proyecto (`components/atoms`, `components/primitives`, `components/ui`, `components/beautifui`, `lib/utils.ts`) e instala las dependencias npm que hagan falta. Cada item arrastra solo lo que necesita.

Después, dos pasos a mano:

1. **Estilos.** En tu CSS global sustituye `@import "tailwindcss";` por:
   ```css
   @import "./components/beautifui/beautiful-ui.css"; /* ajusta la ruta relativa */
   ```
   (`foundation.css` ya importa Tailwind y define tokens, tema oscuro con `.dark` y animaciones).
2. **Fuentes.** Carga Inter y JetBrains Mono. Con Google Fonts basta el `<link>`; con `next/font`, declara `variable: "--font-inter"` y `variable: "--font-mono-face"` y pon sus clases en `<html>`.

Y a usarlo:

```tsx
import { Button, Card, Input, Select, DataTable, useToast } from "@/components/ui";
import PromptBar from "@/components/primitives/PromptBar";
```

Items disponibles: `all`, `ui-kit`, `foundation`, `utils`, `central-icons`, los átomos (`button`, `entity-chip`, `value-pill`, `shimmer`, `stream-text`, `glide-menu`) y los 20 componentes (`approval-card`, `chat-composer`, `code-block`, `context-cards`, `diff-table`, `filter-table`, `fine-tune-card`, `flowchart`, `insight-cards`, `loading-state`, `prompt-bar`, `recommendation-card`, `records-table`, `search`, `selection-actions`, `sidebar-nav`, `streaming-text`, `task-rows`, `thinking-state`, `tool-chips`).

## Usarlo desde tus agentes (skill + MCP)

Un comando instala la **skill** `beautiful-ui` (en `~/.claude/skills`, `~/.codex/skills` y `~/.agents/skills`, según existan) y registra el **servidor MCP** `beautiful-ui` en Claude Code y Codex (scope de usuario):

```bash
npx -y https://davdelcar.github.io/beautiful-ui/mcp/beautiful-ui-mcp.tgz install
# --skill-only | --mcp-only   ·   uninstall para quitarlo
```

- **Skill** ([`mcp/skill/SKILL.md`](mcp/skill/SKILL.md)): cuándo usar el sistema, instalación, reglas, tokens, API del kit, qué componente de IA usar para cada caso, composición y checklist.
- **MCP** ([`mcp/server.mjs`](mcp/server.mjs), sin dependencias): lee el registro publicado en vivo. Herramientas `list_components`, `get_component` (fuente + firmas de props), `get_design_tokens`, `get_install_instructions`, `get_guidelines`, `get_example` (app de ejemplo / galería) y el prompt `beautiful-ui`.
- Otros clientes MCP (Cursor, VS Code, Claude Desktop…):
  ```json
  { "mcpServers": { "beautiful-ui": { "command": "npx", "args": ["-y", "https://davdelcar.github.io/beautiful-ui/mcp/beautiful-ui-mcp.tgz"] } } }
  ```

El build publica la skill en `/skill/SKILL.md` y el paquete en `/mcp/beautiful-ui-mcp.tgz`; edita `mcp/` y haz push.

## Desarrollo

```bash
npm install
npm run dev               # http://localhost:5173 → galería · /#/app → app de ejemplo
npm run build             # genera el registro (public/r) + compila el sitio
npm run registry:sync     # trae la última versión de los componentes oficiales
npm run registry:build    # solo regenera public/r
```

Cada push a `main` publica galería y registro en GitHub Pages (`.github/workflows/pages.yml`). Para actualizar el sistema en tus proyectos, vuelve a ejecutar el `npx shadcn add …` con `--overwrite`.

## Estructura

```
src/
  app/beautifui/        ← OFICIAL: foundation.css (tokens, @theme, keyframes), records-table.css, sidebar-nav.css
  components/atoms/     ← OFICIAL: Button, EntityChip (+Monogram), ValuePill, Shimmer, StreamText
  components/primitives/← OFICIAL: los 20 componentes + GlideMenu
  components/ui/        ← PROPIO: elementos básicos sobre los átomos oficiales
  pages/DesignSystem.tsx   galería: fundamentos, átomos, kit y los 20 componentes con sus variantes
  pages/ExampleApp.tsx     app completa compuesta solo con piezas del sistema
  vendor/central-icons.tsx sustituto de los iconos de pago que usa SidebarNav
scripts/sync-registry.mjs   descarga / actualiza los componentes oficiales desde beautifului.dev
scripts/build-registry.mjs  genera tu registro shadcn en public/r (+ skill y paquete MCP)
mcp/                        servidor MCP y skill para agentes
```

Las carpetas **OFICIAL** no se editan a mano: `npm run registry:sync` las sobrescribe con la última versión publicada (o `npm run registry:sync -- button prompt-bar` para unas concretas). Para personalizar algo, envuélvelo en `components/ui` en lugar de tocar el original.

## Componentes oficiales

Loading State · Thinking · Streaming Text · Approval Card · Tool Chips · Task Rows · Chat (ChatComposer) · Prompt Bar · Recommendation Card · Context Cards · Diff Table · Records Table · Filter Table · Sidebar Nav · Search (SearchList) · Flowchart · Insight Cards · Code Block · Fine-tune Card · Selection Actions.

Casi todos aceptan props para sustituir los datos de demo (`rows`, `questions`, `content`, `labels`, `recents`…). Algunos textos están fijos en inglés dentro del original (p. ej. los items "Home / Invite users" de SidebarNav o los filtros de FilterTable).

## Elementos básicos (`@/components/ui`)

Todo se importa desde `@/components/ui`, incluidos los átomos oficiales reexportados.

| Elemento | Construido sobre |
|---|---|
| `Button` | átomo oficial (`primary secondary ghost accent success quiet` × `xs sm md`) |
| `Input` (`leading`/`trailing`), `Textarea`, `Field`, `Kbd` | pozo `bg-field` del composer de ChatComposer |
| `Select`, `Menu` | `GlideMenu` + `shadow-overlay` + `pop-in`, como los menús de FineTuneCard y SidebarNav |
| `Checkbox`, `RadioGroup`, `Switch` | inputs nativos accesibles con `shadow-btn` y `ease-out-strong` |
| `Segmented`, `Tabs`, `FilterChips` | pulgar deslizante de FineTuneCard y chips de FilterTable |
| `Card` (+ `CardHeader/Body/Footer`), `Stat` | `rounded-card` + `primitive-card-bar/pad/footer` |
| `StatusPill`, `Tag` | colores `.filter-status-*` de la fundación |
| `Avatar`, `AvatarStack` | `Monogram` de EntityChip |
| `Alert`, `EmptyState`, `Progress`, `Spinner` | tints semánticos y el estado vacío de SearchList |
| `Tooltip`, `Dialog`, `ToastProvider` / `useToast` | tokens `--tooltip-*`, `<dialog>` nativo |
| `DataTable` | rejilla `--grid-line` y colapso animado de FilterTable, con selección |
| `IconButton`, `ThemeToggle` / `useTheme` | `primitive-icon-button`; alterna `.dark` con `.theme-switching` |

## Notas

- **Central Icons** (lo usa SidebarNav) es un pack de pago que exige `CENTRAL_LICENSE_KEY`. `vite.config.ts` redirige sus imports a `src/vendor/central-icons.tsx` (dibujos propios, misma API). Con licencia: `npm i @central-icons-react/round-outlined-radius-2-stroke-2` y borra el alias en `vite.config.ts` y `tsconfig.json`.
- **Parches del registro**: el registro publica el último `@media` de `records-table.css` partido, con su cierre suelto dentro de `foundation.css`. El script de sync lo recoloca automáticamente y lo anuncia por consola.
- **Fuentes**: Inter y JetBrains Mono desde Google Fonts (en el original las inyecta `next/font`); se mapean a `--font-inter` y `--font-mono-face` en `src/index.css`.
- **Licencia**: los componentes oficiales son MIT, © Turbo (beautifului.dev).
