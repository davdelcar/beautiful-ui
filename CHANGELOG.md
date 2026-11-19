# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Cada versión tiene su registro fijo en `https://davdelcar.github.io/beautiful-ui/r/vX.Y.Z/`.

## 2.1.0 — 2026-11-19

Revisión completa de coherencia visual y solapes.

### Corregido
- **Desplegables recortados**: Select, Combobox, MultiSelect, Menu, Popover, DatePicker, DateRangePicker y Tooltip se pintan ahora en un portal con posición fija (`Floating`). Antes, dentro de un Sheet solo se veía el 27 % del panel, y también quedaban cortados en Dialog, Accordion o DataTable. Además voltean hacia arriba si no caben, se ajustan al ancho de la ventana y se recolocan al hacer scroll.
- **Escape** en un desplegable dentro de un Sheet o Dialog ya no cierra también el Sheet, y el foco vuelve al disparador.
- **Foco al abrir**: el buscador de Combobox/MultiSelect y el calendario reciben el foco al abrirse (el primer frame invisible lo impedía).
- **Validación de formularios**: ahora se valida al enviar y luego en vivo. Antes validaba al salir de cada campo, el mensaje de error desplazaba el layout y el clic siguiente caía en otro sitio.
- **`cn()` y los tokens**: tailwind-merge descartaba `text-body`/`text-meta` al combinarlos con `text-ink` (el texto volvía al tamaño por defecto). `cn()` ya conoce la escala tipográfica, los radios y las sombras.
- **Animaciones de Sheet, Dialog y paleta**: ya no dejan un `transform` residual que atrapaba a los paneles fijos.
- **App de ejemplo**: el dashboard usa container queries (la fila «Proveedores verificados» se truncaba a «P» con la barra lateral y el asistente abiertos) y Insights ya no desborda en móvil.
- **Galería**: los controles de cada sección bajan de línea en estrecho en vez de pisar el título; se quitan alturas reservadas que dejaban huecos.
- **Plantillas**: el botón flotante «Galería» tapaba contenido y pasa a ser una barra en el flujo. En login, el botón de tema ya no puede caer sobre la card.
- **DataTable**: un texto largo se trunca en su celda en vez de invadir la siguiente.
- **Etiquetas**: Select, Combobox, MultiSelect y DateRangePicker aceptan `id`; las plantillas enlazan cada etiqueta con su control.

### Cambiado
- **Misma piel para todos los campos**: Select, Combobox, MultiSelect, DatePicker y DateRangePicker usan la del Input (pozo `field`, borde y anillo de 3px), antes con aspecto de botón.
- **Nuevo token `text-label`** (12.5px). Todos los tamaños sueltos del kit pasan a la escala; menús y tooltips usan `rounded-chip`/`rounded-control`.
- **Checkbox de MultiSelect** idéntico al de `Checkbox`; check de presets en acento como en Select; chevrons que giran en todos los desplegables.
- **Teclado**: Select, Menu, ContextMenu y presets de fecha se navegan con ↑ ↓ Inicio Fin.

### Añadido
- `Floating`, `useRovingFocus`, `usePopover`, `TRIGGER` y `Chevron` exportados para desplegables propios.
- **Tests**: `tests/e2e/layout.spec.ts` comprueba que no hay solapes, recortes ni scroll horizontal en 8 rutas × 390/768/1280 px, y que los desplegables dentro de Sheet y cards se ven y son clicables. En total, 49 pruebas E2E + 21 unitarias.

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
