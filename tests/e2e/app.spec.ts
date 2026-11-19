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

test("móvil: el menú abre la navegación en un Sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#/app");
  await page.getByRole("button", { name: "Menú" }).click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("login: valida con zod antes de enviar", async ({ page }) => {
  await page.goto("#/plantillas/login");
  await page.getByLabel("Email").fill("no-es-email");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Introduce un email válido")).toBeVisible();
  await page.getByLabel("Email").fill("ana@acme.com");
  await page.getByLabel("Contraseña").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("¡Hola de nuevo!")).toBeVisible();
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

test("listado: filtrar, ordenar y abrir detalle", async ({ page }) => {
  await page.goto("#/plantillas/listado");
  await page.getByLabel("Buscar").fill("Mango");
  const rows = page.getByRole("row").filter({ hasText: "Mango Moon" });
  await expect(rows.first()).toBeVisible();
  await page.getByRole("button", { name: "Total" }).click();
  await rows.first().click();
  await expect(page.locator("dialog[open]")).toContainText("Mango Moon");
});

test("gráficas: vista de tabla accesible", async ({ page }) => {
  await page.goto("#/plantillas/analitica");
  await page.getByRole("button", { name: "Ver tabla" }).first().click();
  await expect(page.getByRole("table").first()).toBeVisible();
});
