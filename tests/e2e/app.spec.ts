import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/* Rutas a auditar en claro y oscuro: sin errores de consola y sin
 * infracciones de accesibilidad graves (axe: serious / critical). */
const ROUTES = ["#/", "#/app", "#/plantillas/login", "#/plantillas/listado", "#/plantillas/analitica", "#/plantillas/ajustes", "#/plantillas/alta", "#/plantillas/error"];

/* Los componentes oficiales (beautifului.dev) no se editan aquí: se auditan
 * aparte para no bloquear por algo que no controlamos. */
const OFFICIAL = ["#loading-state", "#thinking-state", "#streaming-text", "#approval-card", "#tool-chips", "#task-rows", "#chat", "#prompt-bar", "#recommendation-card", "#context-cards", "#diff-table", "#records-table", "#filter-table", "#sidebar-nav", "#search", "#flowchart", "#insight-cards", "#code-block", "#fine-tune-card", "#selection-actions", "#pills", "#shimmer", "#button", ".sidebar-nav", "aside[aria-label=Asistente]", ".insight-chart-stage", "[class*=insight-]"];

async function audit(page: Page) {
  const r = await OFFICIAL.reduce((b, sel) => b.exclude(sel), new AxeBuilder({ page })).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`tema ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const route of ROUTES) {
      test(`${route} carga sin errores y pasa axe`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(600);
        expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(scheme === "dark");
        expect(errors).toEqual([]);
        expect(await audit(page)).toEqual([]);
      });
    }
  });
}

test("⌘K abre la paleta y ejecuta una acción", async ({ page }) => {
  await page.goto("#/app");
  await expect(page.getByRole("button", { name: "Notificaciones" })).toBeVisible();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: /paleta de comandos/i });
  await expect(dialog).toBeVisible();
  await page.keyboard.type("oscuro");
  await expect(dialog.getByRole("option").first()).toContainText("Tema oscuro");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("app de ejemplo: cambia de periodo y permite deshacer al eliminar una tarea", async ({ page }) => {
  await page.goto("#/app");
  await expect(page.getByText("$48,210", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Hoy" }).click();
  await expect(page.getByText("$6,230", { exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Reponer sorbete de mango" });
  await row.getByRole("button", { name: "Acciones" }).click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(row).toBeVisible();
});

test("galería: pestañas, segmentos y filtros funcionan con flechas", async ({ page }) => {
  await page.goto("#/");
  const navigation = page.locator("#navegacion");
  const summary = navigation.getByRole("tab", { name: "Resumen" });
  const activity = navigation.getByRole("tab", { name: /Actividad/ });
  await summary.focus();
  await summary.press("ArrowRight");
  await expect(activity).toBeFocused();
  await expect(activity).toHaveAttribute("aria-selected", "true");
  await expect(summary).toHaveAttribute("tabindex", "-1");
  await expect(navigation.getByText("Historial de acciones del agente.")).toBeVisible();

  const day = navigation.getByRole("tab", { name: "Día", exact: true });
  const month = navigation.getByRole("tab", { name: "Mes", exact: true });
  await day.focus();
  await day.press("ArrowLeft");
  await expect(month).toBeFocused();
  await expect(month).toHaveAttribute("aria-selected", "true");

  const all = navigation.getByRole("button", { name: /Todas/ });
  const todo = navigation.getByRole("button", { name: /Por hacer/ });
  await all.focus();
  await all.press("ArrowRight");
  await expect(todo).toBeFocused();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await todo.press("Enter");
  await expect(todo).toHaveAttribute("aria-pressed", "true");
});

test("galería: Escape devuelve el foco al disparador de selección múltiple", async ({ page }) => {
  await page.goto("#/");
  const select = page.locator("#entradas").getByRole("button", { name: /Seleccionar: CRM/ });
  await select.click();
  await expect(page.getByRole("combobox", { expanded: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(select).toHaveAttribute("aria-expanded", "false");
  await expect(select).toBeFocused();
});

test("galería: los paneles plegables mantienen su contenido accesible al abrir", async ({ page }) => {
  await page.goto("#/");
  const plan = page.getByRole("button", { name: /Puedo cambiar de plan/ });
  const data = page.getByRole("button", { name: /Dónde se guardan/ });
  await expect(plan).toHaveAttribute("aria-expanded", "true");
  await plan.focus();
  await plan.press("ArrowDown");
  await expect(data).toBeFocused();
  await data.press("Enter");
  await expect(data).toHaveAttribute("aria-expanded", "true");
  await expect(plan).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("region", { name: /Dónde se guardan/ })).toContainText("cifrados");

  const details = page.getByRole("button", { name: "Detalles técnicos" });
  await details.click();
  await expect(page.getByText(/Modelo v3/)).toBeVisible();
  await details.press("Space");
  await expect(page.getByText(/Modelo v3/)).toBeHidden();
});

test("galería: el tooltip abre con el puntero y Escape lo cierra", async ({ page }) => {
  await page.goto("#/");
  const trigger = page.getByRole("button", { name: "Pasa el ratón" });
  await trigger.hover();
  const tooltip = page.getByRole("tooltip").filter({ hasText: "Tooltip con retardo de 250ms" });
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
});

test("galería: Menu, Select y Dialog de UI SDK con teclado", async ({ page }) => {
  await page.goto("#/");
  const overlays = page.locator("#overlays");
  const actions = overlays.getByRole("button", { name: "Acciones" });
  await actions.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Editar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(actions).toBeFocused();

  const role = page.locator("#campos").getByRole("combobox", { name: "Rol" });
  await role.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(role).toHaveText(/Lector/);

  const open = overlays.getByRole("button", { name: "Abrir diálogo" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: /Eliminar/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test("galería: el Sheet de UI SDK admite un Combobox dentro y se cierra con clic fuera", async ({ page }) => {
  await page.goto("#/");
  await page.locator("#sheet").getByRole("button", { name: "Panel lateral" }).click();
  const sheet = page.getByRole("dialog", { name: "Editar pedido" });
  await expect(sheet).toBeVisible();
  await sheet.locator("button", { hasText: "España" }).click();
  await page.getByRole("option", { name: "México" }).click();
  await expect(sheet.locator("button", { hasText: "México" })).toBeVisible();
  await page.mouse.click(100, 450);
  await expect(sheet).toHaveCount(0);
});

test("galería: contraseña, código, medidas y paneles", async ({ page }) => {
  await page.goto("#/");
  const pw = page.getByLabel("Contraseña", { exact: true });
  await pw.fill("s3creto");
  await page.locator("#acceso").getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(pw).toHaveAttribute("type", "text");

  const otp = page.getByLabel("Código de verificación");
  await otp.click();
  await page.keyboard.type("123456");
  await expect(page.getByText("Código completo: verificando…")).toBeVisible();

  await expect(page.getByRole("meter", { name: "Almacenamiento" })).toHaveAttribute("aria-valuetext", "7,4 de 10 GB");

  const handle = page.getByRole("separator", { name: "Redimensionar archivos" });
  const before = Number(await handle.getAttribute("aria-valuenow"));
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(handle).not.toHaveAttribute("aria-valuenow", String(before));
});

test("móvil: el menú abre la navegación en un Sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/app");
  await page.getByRole("button", { name: "Menú" }).click();
  await expect(page.locator("[role=dialog]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("móvil: nuevo chat abre el asistente y conserva la conversación al cerrarlo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/app");
  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByRole("dialog", { name: "Navegación" }).getByRole("button", { name: "New chat" }).click();
  const assistant = page.getByRole("dialog", { name: "Asistente" });
  await expect(assistant).toBeVisible();
  await expect(assistant.getByText("Escribe un mensaje para empezar.")).toBeVisible();
  await assistant.getByRole("textbox", { name: "Prompt" }).fill("Mensaje de prueba");
  await assistant.getByRole("button", { name: "Send" }).click();
  await expect(assistant.getByText("Mensaje de prueba", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(assistant).toBeHidden();
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(assistant.getByText("Mensaje de prueba", { exact: true })).toBeVisible();
});

test("login: valida con zod antes de enviar", async ({ page }) => {
  await page.goto("#/plantillas/login");
  await page.getByLabel("Email").fill("no-es-email");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Introduce un email válido")).toBeVisible();
  await page.getByLabel("Email").fill("ana@acme.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("¡Hola de nuevo!")).toBeVisible();
});

test("login: las acciones de demo mantienen el formulario en su ruta", async ({ page }) => {
  await page.goto("#/plantillas/login");
  await page.getByLabel("Email").fill("ana@example.test");
  await page.getByRole("button", { name: "¿Olvidaste la contraseña?" }).click();
  await expect(page.getByText("La recuperación de contraseña no está conectada en esta demo.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("ana@example.test");
  await page.getByRole("button", { name: "Google" }).click();
  await expect(page.getByText("Google no está conectado en esta demo.")).toBeVisible();
  await expect(page).toHaveURL(/#\/plantillas\/login$/);
});

test("enlaces desconocidos conservan una galería navegable", async ({ page }) => {
  await page.goto("#/plantillas/constructor");
  await expect(page.getByRole("heading", { name: "Beautiful UI", exact: true })).toBeVisible();
  await page.goto("#/app-invalida");
  await expect(page.getByRole("heading", { name: "Beautiful UI", exact: true })).toBeVisible();
  await page.goto("#/plantillas/listado");
  await expect(page.getByRole("heading", { name: "Pedidos", exact: true })).toBeVisible();
});

test("error: permite volver al inicio y a la sección de plantillas", async ({ page }) => {
  await page.goto("#/plantillas/error");
  await page.getByRole("link", { name: "Ir al inicio" }).click();
  await expect(page.getByRole("heading", { name: "Beautiful UI", exact: true })).toBeVisible();
  await page.goto("#/plantillas/error");
  await page.getByRole("link", { name: "Galería" }).click();
  await expect(page).toHaveURL(/#plantillas$/);
  await expect(page.locator("#plantillas").getByRole("heading").first()).toBeInViewport();
});

test("ajustes: guardar y descartar conservan el perfil de la sesión", async ({ page }) => {
  await page.goto("#/plantillas/ajustes");
  const name = page.getByLabel("Nombre");
  await name.fill("Ana Demo");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Perfil de Ana Demo guardado en esta sesión")).toBeVisible();
  await name.fill("Cambio pendiente");
  await page.getByRole("button", { name: "Descartar" }).click();
  await expect(name).toHaveValue("Ana Demo");
});

test("ajustes: cancelar o cerrar impide reutilizar la confirmación", async ({ page }) => {
  await page.goto("#/plantillas/ajustes");
  const open = page.getByRole("button", { name: "Eliminar cuenta" });
  const dialog = page.getByRole("dialog", { name: "¿Eliminar tu cuenta?" });
  const confirmation = dialog.getByLabel("Confirmación");
  const remove = dialog.getByRole("button", { name: "Eliminar", exact: true });
  await open.click();
  await confirmation.fill("ELIMINAR");
  await expect(remove).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toHaveCount(0); // la página sigue inerte mientras anima la salida
  await open.click();
  await expect(confirmation).toHaveValue("");
  await expect(remove).toBeDisabled();
  await confirmation.fill("ELIMINAR");
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await expect(dialog).toHaveCount(0);
  await open.click();
  await expect(confirmation).toHaveValue("");
});

test("alta: no avanza sin datos y sí con ellos", async ({ page }) => {
  await page.goto("#/plantillas/alta");
  await page.getByRole("button", { name: /continuar/i }).click();
  await expect(page.getByText("Nombre de la empresa").last()).toBeVisible();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await page.getByLabel(/nombre de la empresa/i).fill("Acme");
  await page.getByLabel("País").click();
  await page.keyboard.type("peru");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /continuar/i }).click();
  await expect(page.getByText("Puestos", { exact: true })).toBeVisible();
});

test("alta: termina el flujo y borra el logo al empezar de nuevo", async ({ page }) => {
  await page.goto("#/plantillas/alta");
  const next = page.getByRole("button", { name: /continuar/i });
  const reachDate = async () => {
    await page.getByLabel(/nombre de la empresa/i).fill("Acme");
    await page.getByLabel("País").click();
    await page.keyboard.type("peru");
    await page.keyboard.press("Enter");
    await next.click();
    await expect(page.getByText("Puestos", { exact: true })).toBeVisible();
    await next.click();
    await expect(page.getByLabel("Fecha de inicio")).toBeVisible();
  };
  await reachDate();
  await page.getByLabel("Fecha de inicio").click();
  await page.locator('button[aria-current="date"]').click();
  await page.locator('input[type="file"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: Buffer.from("demo") });
  await next.click();
  await expect(page.getByText("logo.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Crear espacio" }).click();
  await expect(page.getByRole("heading", { name: "Acme está listo" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar de nuevo" }).click();
  await expect(page.getByLabel(/nombre de la empresa/i)).toHaveValue("");
  await reachDate();
  await expect(page.getByText("logo.png", { exact: true })).toHaveCount(0);
});

test("listado: filtrar, ordenar y abrir detalle", async ({ page }) => {
  await page.goto("#/plantillas/listado");
  await page.getByLabel("Buscar").fill("Mango");
  const rows = page.getByRole("row").filter({ hasText: "Mango Moon" });
  await expect(rows.first()).toBeVisible();
  await page.getByRole("button", { name: "Total" }).click();
  await expect(page.getByRole("columnheader", { name: "Total" })).toHaveAttribute("aria-sort", "ascending");
  await rows.first().press("Enter");
  await expect(page.locator("[role=dialog]")).toContainText("Mango Moon");
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).toHaveCount(0);
  await expect(rows.first()).toBeFocused();
});

test("listado: borrar la búsqueda con teclado devuelve el foco y restablece los resultados", async ({ page }) => {
  await page.goto("#/plantillas/listado");
  const input = page.getByRole("textbox", { name: "Buscar" });
  const clear = page.getByRole("button", { name: "Borrar búsqueda" });
  await expect(clear).toHaveCount(0);
  await input.fill("sin coincidencias");
  await expect(page.getByText("Sin resultados", { exact: true })).toBeVisible();
  await input.press("Tab");
  await expect(clear).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(clear).toHaveCount(0);
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(page.getByRole("row").filter({ hasText: "#1040" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1", exact: true })).toHaveAttribute("aria-current", "page");
});

test("listado: seleccionar toda una página conserva la selección de otras páginas", async ({ page }) => {
  await page.goto("#/plantillas/listado");
  const firstOrder = page.getByRole("row").filter({ hasText: "#1040" }).getByRole("checkbox");
  const selectPage = page.getByRole("checkbox", { name: "Seleccionar todo" });
  await firstOrder.press("Space");
  await expect(firstOrder).toBeChecked();
  await page.getByRole("button", { name: "2", exact: true }).click();
  await selectPage.press("Space");
  await expect(selectPage).toBeChecked();
  await page.getByRole("button", { name: "1", exact: true }).click();
  await expect(firstOrder).toBeChecked();
  await page.getByRole("button", { name: "2", exact: true }).click();
  await selectPage.press("Space");
  await expect(selectPage).not.toBeChecked();
  await page.getByRole("button", { name: "1", exact: true }).click();
  await expect(firstOrder).toBeChecked();
  await page.getByLabel("Buscar").fill("sin-pedidos-coincidentes");
  await expect(selectPage).toBeDisabled();
  await page.getByText("Sin resultados", { exact: true }).click({ button: "right" });
  await expect(page.getByRole("menu")).toContainText("Selecciona algún pedido");
  await expect(page.getByRole("menuitem", { name: "Eliminar" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Quitar filtros" }).click();
  await expect(firstOrder).toBeChecked();
});

test("galería: el calendario conserva un día alcanzable tras cambiar de mes", async ({ page }) => {
  await page.goto("#fechas");
  const dates = page.locator("#fechas");
  const nextMonth = dates.getByRole("button", { name: "Mes siguiente", exact: true }).first();
  const calendar = dates.getByRole("grid").first();
  await nextMonth.click();
  await nextMonth.click();
  const tabStop = calendar.locator('button[tabindex="0"]');
  await expect(tabStop).toHaveCount(1);
  await tabStop.press("ArrowRight");
  await expect(calendar.locator('button[tabindex="0"]')).toBeFocused();
});

test("gráficas: vista de tabla accesible", async ({ page }) => {
  await page.goto("#/plantillas/analitica");
  await page.getByRole("button", { name: "Ver tabla" }).first().click();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("analítica: una semana parcial conserva los datos del día elegido", async ({ page }) => {
  await page.goto("#/plantillas/analitica");
  await page.getByRole("button", { name: "Últimos 30 días" }).click();
  await page.getByRole("menuitemradio", { name: "Hoy" }).click();
  await page.getByRole("tab", { name: "Semana" }).click();
  await page.getByRole("button", { name: "Ver tabla" }).first().click();
  const chart = page.getByRole("table").first();
  await expect(chart.getByRole("row")).toHaveCount(2);
  await expect(chart.getByRole("row").last().getByRole("rowheader")).toBeVisible();
  await expect(chart.getByRole("row").last().getByRole("cell")).toHaveCount(3);
});
