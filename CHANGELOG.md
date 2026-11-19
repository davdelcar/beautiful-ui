# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Cada versión tiene su registro fijo en `https://davdelcar.github.io/beautiful-ui/r/vX.Y.Z/`.

## 2.0.0 — 2026-11-19

Sistema completo para cualquier tipo de app.

### Añadido
- **Campos:** `MultiSelect`, `Slider`, `NumberInput`, `Dropzone`.
- **Fechas:** `Calendar` (single/range, teclado completo), `DatePicker`, `DateRangePicker` con presets.
- **Formularios:** item `form` con `Form`, `FormField`, `FormSubmit`, `FormError` y `useZodForm` (react-hook-form + zod).
- **Navegación:** `Breadcrumb`, `Pagination`, `Stepper`, `ContextMenu`.
- **Estructura:** `Accordion`, `Collapsible`, `Separator`, `Skeleton`, `SkeletonText`, `ScrollArea`.
- **Gráficas:** `LineChart`, `BarChart`, `SegmentedBar`, `Sparkline`, `ChartFrame`. Incluyen leyenda, tooltip con todas las series, teclado y vista de tabla. La paleta `--chart-1…8` está validada para daltonismo.
- **`DataTable`:** orden por columna (`sortValue`), `onRowClick`, `empty` y semántica de tabla ARIA.
- **`Stat`:** `goodWhen` y `spark`, con flecha además del color.
- **Plantillas:** `login-page`, `list-detail-page`, `analytics-page`, `settings-page`, `wizard-page` y `error-page`.
- **Idioma:** `UIProvider` con textos en español e inglés, sobrescribibles, y fechas y números con Intl.
- **Marca:** `setAccent()` con 5 acentos, `ThemeScript` / `themeScript` contra el parpadeo y `setTheme()`.
- **Tokens:** `tokens.json` en formato DTCG, capas `--z-*` y duraciones `--duration-*`.
- **Iconos:** `IconMenu`, `IconHome` e `IconSettings`.
- **Tests:** vitest (19 unitarios) y Playwright + axe (8 rutas × claro/oscuro y 6 flujos). En CI bloquean el despliegue si fallan.
- **Registro versionado** en `/r/vX.Y.Z/`.
- **MCP:** `get_example` sirve las plantillas y `get_design_tokens` incluye `kit.css`.

### Cambiado
- **Contraste AA:** `ink-2`, `ink-3`, acento, semánticos y pills de estado tienen ahora contraste ≥ 4.5:1 en claro y oscuro. Los rellenos con texto blanco usan `*-solid`.
- **`useTheme`:** el estado se comparte entre componentes (`useSyncExternalStore`).
- **`MultiSelect`:** ya no anida botones dentro de botones.
- **`Avatar`:** oscurece el fondo para que las iniciales pasen AA.
- **`Stat`:** el valor usa cifras proporcionales.

## 1.1.0

- `Popover`, `Combobox`, `Sheet`, `CommandPalette` (⌘K), escala tipográfica `text-*` y docs con código y props en la galería.
- App de ejemplo con paleta ⌘K y navegación móvil.

## 1.0.0

- Componentes oficiales de beautifului.dev, kit básico, registro shadcn propio, skill y servidor MCP.
