import { expect, test, type Page } from "@playwright/test";

/* Revisión de layout: ningún texto pisa a otro texto, ningún control pisa a
 * otro, nada se recorta sin elipsis y no hay scroll horizontal de página.
 * Mide solo lo visible (tras los recortes de overflow de los ancestros). */
const detect = () => {
  /* rect visible tras recortes de ancestros (overflow ≠ visible) y opacidad 0 en la cadena */
  const clip = (el, r) => {
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (+s.opacity < 0.05 || s.visibility === "hidden") return null;
      if ((s.overflow !== "visible" || s.overflowX !== "visible" || s.overflowY !== "visible") && s.display !== "contents") {
        const ar = a.getBoundingClientRect();
        box = { left: Math.max(box.left, ar.left), top: Math.max(box.top, ar.top), right: Math.min(box.right, ar.right), bottom: Math.min(box.bottom, ar.bottom) };
      }
      if (box.right - box.left < 1 || box.bottom - box.top < 1) return null;
    }
    return box;
  };
  const vis = (el) => { const s = getComputedStyle(el); if (s.display === "none") return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && !!clip(el, r); };
  const hiddenAnc = (el) => el.closest("[aria-hidden=true],.sr-only,[inert],dialog:not([open])");
  const label = (el) => { const id = el.closest("section[id]")?.id ?? ""; const t = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30); return `${id ? "#" + id + " " : ""}<${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 3).join(".") : ""}> "${t}"`; };
  const texts = [...document.querySelectorAll("body *")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && vis(el) && !hiddenAnc(el));
  const ctrls = [...document.querySelectorAll("button,a[href],input:not([type=hidden]):not(.sr-only),select,textarea,[role=button],[role=option],[role=menuitem]")].filter((el) => vis(el) && !hiddenAnc(el) && !el.classList.contains("sr-only"));
  const issues = [];
  const rectOf = (el) => { const r = document.createRange(); r.selectNodeContents(el); const rr = [...r.getClientRects()].filter((x) => x.width > 0); const raw = rr.length ? rr.reduce((a, b) => ({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) })) : el.getBoundingClientRect(); return clip(el, raw) ?? { left: 0, top: 0, right: 0, bottom: 0 }; };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); const rr = [...r.getClientRects()].filter((x) => x.width > 0 && x.height > 0); return (rr.length ? rr : [el.getBoundingClientRect()]).map((x) => clip(el, x)).filter(Boolean); };
  const pairs = (list, rect, min, kind) => {
    const R = list.map((el) => [el, kind.startsWith("texto") ? lines(el) : [rect(el)]]);
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const [a, la] = R[i], [b, lb] = R[j];
      if (a.contains(b) || b.contains(a)) continue;
      let ov = 0; for (const ra of la) for (const rb of lb) ov += inter(ra, rb);
      if (ov > min) issues.push({ kind, a: label(a), b: label(b), px: Math.round(ov) });
    }
  };
  pairs(texts.slice(0, 1500), rectOf, 6, "texto-sobre-texto");
  pairs(ctrls.slice(0, 900), (e) => clip(e, e.getBoundingClientRect()) ?? { left: 0, top: 0, right: 0, bottom: 0 }, 12, "control-sobre-control");
  for (const el of texts) {
    const s = getComputedStyle(el);
    if ((s.overflow === "hidden" || s.overflowX === "hidden") && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && s.whiteSpace !== "normal")
      issues.push({ kind: "texto-recortado", a: label(el), px: el.scrollWidth - el.clientWidth });
  }
  for (const el of texts) { const r = clip(el, el.getBoundingClientRect()); if (r && (r.right > innerWidth + 1 || r.left < -1)) issues.push({ kind: "fuera-de-viewport", a: label(el), px: Math.round(Math.max(r.right - innerWidth, -r.left)) }); }
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push({ kind: "scroll-horizontal-página", px: document.documentElement.scrollWidth - innerWidth });
  return issues;
};

const ROUTES = ["#/", "#/app", "#/plantillas/login", "#/plantillas/listado", "#/plantillas/analitica", "#/plantillas/ajustes", "#/plantillas/alta", "#/plantillas/error"];

for (const width of [390, 768, 1280]) {
  test.describe(`layout a ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    for (const route of ROUTES) {
      test(`${route} sin solapes`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(route === "#/" ? 1500 : 700);
        const issues = await page.evaluate(detect);
        expect(issues.map((i) => `${i.kind} ${i.a}${i.b ? " <-> " + i.b : ""}`)).toEqual([]);
      });
    }
  });
}

/* Los desplegables viven en un portal: dentro de Sheet, Dialog, cards o
 * tablas deben verse enteros y ser clicables (elementFromPoint). */
async function optionsReachable(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[role=option],[role=menuitem],[role=menuitemradio]")]
      .filter((o) => o.getBoundingClientRect().height > 0)
      .map((o) => {
        const r = o.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!top && (o === top || o.contains(top));
      }),
  );
}

test("desplegable dentro de un Sheet: visible, clicable y Escape no cierra el Sheet", async ({ page }) => {
  await page.goto("#sheet");
  await page.getByRole("button", { name: "Hoja inferior" }).click();
  await page.locator("[role=dialog] button[aria-haspopup=listbox]").click();
  const ok = await optionsReachable(page);
  expect(ok.length).toBeGreaterThan(0);
  expect(ok.every(Boolean)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).toHaveCount(1);
  await expect(page.locator("[role=dialog] [role=listbox]")).toHaveCount(0);
});

test("menú dentro de una card: visible y clicable", async ({ page }) => {
  await page.goto("#cards");
  await page.locator("#cards").getByRole("button", { name: "Más opciones" }).click();
  const ok = await optionsReachable(page);
  expect(ok.length).toBe(3);
  expect(ok.every(Boolean)).toBe(true);
});

test("Select: flechas y Enter eligen, el foco vuelve al disparador", async ({ page }) => {
  await page.goto("#/plantillas/ajustes");
  const rol = page.getByLabel("Rol");
  await rol.click();
  await expect(page.getByRole("option", { name: "Administrador" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(rol).toBeFocused();
  await expect(rol).toHaveText("Editor");
});
