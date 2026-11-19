#!/usr/bin/env node
/**
 * Genera el registro shadcn de este sistema de diseño en public/r/.
 *
 *   npm run registry:build
 *   REGISTRY_URL=https://mi-dominio/r npm run registry:build
 *
 * Instalación en cualquier proyecto (React + Tailwind v4 + components.json):
 *   npx shadcn@latest add <REGISTRY_URL>/all.json        → todo
 *   npx shadcn@latest add <REGISTRY_URL>/ui-kit.json     → solo el kit básico
 *   npx shadcn@latest add <REGISTRY_URL>/prompt-bar.json → un componente
 *
 * El registro es autocontenido: republica los componentes oficiales de
 * beautifului.dev (MIT, © Turbo) ya parcheados, para que sus dependencias no
 * traigan de vuelta el foundation.css roto del registro original.
 * Las dependencias npm y entre items se deducen de los imports de cada archivo.
 */
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
/* REGISTRY_OUT: escribe solo el registro en otra carpeta (snapshots versionados en CI) */
const OUT = process.env.REGISTRY_OUT || join(ROOT, "public", "r");
const ONLY_REGISTRY = !!process.env.REGISTRY_OUT;
const BASE = (process.env.REGISTRY_URL || "https://davdelcar.github.io/beautiful-ui/r").replace(/\/$/, "");
const HOMEPAGE = BASE.replace(/\/r$/, "");
const SCHEMA_ITEM = "https://ui.shadcn.com/schema/registry-item.json";

const CENTRAL = "@central-icons-react/round-outlined-radius-2-stroke-2";
const ATTRIBUTION = "Componente oficial de Beautiful UI (beautifului.dev) · MIT © Turbo.";

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
/* nombres de los items oficiales que no coinciden con el archivo */
const RENAME = { "search-list": "search" };
const itemNameFor = (file) => {
  const k = kebab(basename(file).replace(/\.(tsx|ts)$/, ""));
  return RENAME[k] ?? k;
};

/* import "@/…" → item del registro que lo provee */
function itemForImport(spec) {
  if (spec === "@/lib/utils") return "utils";
  if (spec.startsWith("@/components/ui")) return "ui-kit";
  if (spec.startsWith("@/components/form")) return "form";
  const b = spec.match(/^@\/components\/blocks\/(.+)$/);
  if (b) return kebab(b[1]);
  if (spec === "@/components/vendor/central-icons") return "central-icons";
  const m = spec.match(/^@\/components\/(atoms|primitives)\/(.+)$/);
  return m ? itemNameFor(m[2]) : null;
}

/* paquete npm a partir de un import ("a/b" → "a", "@s/p/x" → "@s/p") */
function packageFor(spec) {
  if (spec.startsWith(".") || spec.startsWith("@/")) return null;
  const parts = spec.split("/");
  const pkg = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  return ["react", "react-dom"].includes(pkg) ? null : pkg;
}

const importsOf = (code) => [...code.matchAll(/(?:import|export)[^"']*?from\s+["']([^"']+)["']/g)].map((m) => m[1]);

/** SidebarNav usa Central Icons (de pago): en el registro se reescribe al sustituto local. */
const transform = (code) =>
  code.replace(new RegExp(`["']${CENTRAL.replace(/[/.]/g, "\\$&")}/[A-Za-z0-9]+["']`, "g"), '"@/components/vendor/central-icons"');

const items = new Map();

async function addItem({ name, type, title, description, files, extraDeps = [], extraRegistryDeps = [] }) {
  const deps = new Set(extraDeps);
  const reg = new Set(extraRegistryDeps);
  const out = [];
  for (const f of files) {
    let content = f.content ?? (await readFile(join(SRC, f.from), "utf8"));
    if (f.transform) content = transform(content);
    for (const spec of importsOf(content)) {
      const it = itemForImport(spec);
      if (it && it !== name) reg.add(it);
      const pkg = packageFor(spec);
      if (pkg) deps.add(pkg);
    }
    out.push({ path: f.to, content, type: f.type ?? type, target: f.to });
  }
  items.set(name, {
    $schema: SCHEMA_ITEM,
    name,
    type,
    title,
    description,
    ...(deps.size && { dependencies: [...deps].sort() }),
    registryDependencies: [...reg].sort(),
    files: out,
  });
}

/* ── foundation: tokens + estilos de componentes + fuentes ───────────── */
const ENTRY_CSS = `/* Beautiful UI — punto de entrada de estilos.
 * Impórtalo UNA vez en tu CSS global EN LUGAR de \`@import "tailwindcss"\`
 * (foundation.css ya lo importa):
 *
 *   @import "../components/beautifui/beautiful-ui.css";
 */
@import "./foundation.css";
@import "./records-table.css";
@import "./sidebar-nav.css";
@import "./kit.css";

/* Fuentes: carga Inter y JetBrains Mono (Google Fonts o next/font). Con
 * next/font usa variable: "--font-inter" y "--font-mono-face"; :where() deja
 * especificidad 0 para que esas variables ganen sobre estos valores por defecto. */
:where(:root) {
  --font-inter: "Inter";
  --font-mono-face: "JetBrains Mono";
}

body {
  font-family: var(--font-sans);
}
`;

await addItem({
  name: "foundation",
  type: "registry:style",
  title: "Foundation",
  description: "Tokens (claro/oscuro), @theme de Tailwind v4, keyframes, escala tipográfica (text-display…text-overline) y estilos de RecordsTable y SidebarNav. " + ATTRIBUTION,
  extraDeps: ["shadow-plugin"],
  files: [
    { from: "app/beautifui/foundation.css", to: "components/beautifui/foundation.css", type: "registry:file" },
    { from: "app/beautifui/records-table.css", to: "components/beautifui/records-table.css", type: "registry:file" },
    { from: "app/beautifui/sidebar-nav.css", to: "components/beautifui/sidebar-nav.css", type: "registry:file" },
    { from: "styles/kit.css", to: "components/beautifui/kit.css", type: "registry:file" },
    { content: ENTRY_CSS, to: "components/beautifui/beautiful-ui.css", type: "registry:file" },
  ],
});

await addItem({
  name: "utils",
  type: "registry:lib",
  title: "cn()",
  description: "clsx + tailwind-merge.",
  files: [{ from: "lib/utils.ts", to: "lib/utils.ts" }],
});

await addItem({
  name: "central-icons",
  type: "registry:lib",
  title: "Iconos de SidebarNav",
  description: "Sustituto libre de los 12 iconos de Central Icons (de pago) que usa SidebarNav. Misma API.",
  files: [{ from: "vendor/central-icons.tsx", to: "components/vendor/central-icons.tsx" }],
});

/* ── átomos y primitives oficiales ───────────────────────────────────── */
for (const dir of ["atoms", "primitives"]) {
  for (const file of (await readdir(join(SRC, "components", dir))).sort()) {
    const name = itemNameFor(file);
    await addItem({
      name,
      type: dir === "atoms" || name === "glide-menu" ? "registry:ui" : "registry:component",
      title: file.replace(/\.tsx$/, ""),
      description: ATTRIBUTION,
      extraRegistryDeps: ["foundation"],
      files: [{ from: `components/${dir}/${file}`, to: `components/${dir}/${file}`, transform: name === "sidebar-nav" }],
    });
  }
}

/* ── kit de elementos básicos ────────────────────────────────────────── */
const kitFiles = (await readdir(join(SRC, "components", "ui"))).sort();
await addItem({
  name: "ui-kit",
  type: "registry:ui",
  title: "Elementos básicos",
  description:
    "Input, Select, Combobox, Checkbox, Switch, Segmented, Tabs, Card, StatusPill, Avatar, Alert, Menu, Popover, Tooltip, Dialog, Sheet, CommandPalette (⌘K), Toast, DataTable… sobre los átomos oficiales.",
  extraRegistryDeps: ["foundation"],
  files: kitFiles.map((f) => ({ from: `components/ui/${f}`, to: `components/ui/${f}` })),
});

/* ── formularios con validación (deps aparte: react-hook-form + zod) ───── */
await addItem({
  name: "form",
  type: "registry:ui",
  title: "Formularios",
  description: "Form, FormField, FormSubmit, FormError y useZodForm: react-hook-form + zod sobre los campos del kit.",
  extraRegistryDeps: ["ui-kit"],
  files: (await readdir(join(SRC, "components", "form"))).sort().map((f) => ({ from: `components/form/${f}`, to: `components/form/${f}` })),
});

/* ── plantillas de página ────────────────────────────────────────────── */
const BLOCK_INFO = {
  LoginPage: "Login y registro con validación y proveedores sociales.",
  ListDetailPage: "Listado con filtros, tabla ordenable/paginada, detalle en Sheet y menú contextual.",
  AnalyticsPage: "Analítica: filtros de fecha, KPIs con sparkline, línea, barras apiladas y cuota.",
  SettingsPage: "Ajustes: subnavegación, perfil con formulario, notificaciones, tema y acento.",
  WizardPage: "Alta por pasos con Stepper y validación por paso.",
  ErrorPage: "Páginas 404 / 403 / 500 / mantenimiento.",
};
for (const file of (await readdir(join(SRC, "components", "blocks"))).sort()) {
  const base = file.replace(/\.tsx$/, "");
  await addItem({
    name: kebab(base),
    type: "registry:block",
    title: base,
    description: `Plantilla. ${BLOCK_INFO[base] ?? ""}`.trim(),
    extraRegistryDeps: ["ui-kit"],
    files: [{ from: `components/blocks/${file}`, to: `components/blocks/${file}`, type: "registry:component" }],
  });
}

/* ── all ─────────────────────────────────────────────────────────────── */
items.set("all", {
  $schema: SCHEMA_ITEM,
  name: "all",
  type: "registry:block",
  title: "Beautiful UI completo",
  description: "Fundación, átomos, los 20 componentes de IA, el kit básico, formularios y plantillas.",
  registryDependencies: [...items.keys()].sort(),
  files: [],
});

/* las dependencias entre items se publican como URL absolutas */
const known = new Set(items.keys());
for (const it of items.values()) {
  for (const d of it.registryDependencies) if (!known.has(d)) throw new Error(`${it.name} depende de "${d}", que no existe`);
  it.registryDependencies = it.registryDependencies.map((d) => `${BASE}/${d}.json`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const it of items.values()) await writeFile(join(OUT, `${it.name}.json`), JSON.stringify(it, null, 2) + "\n");
const PKG = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
await writeFile(
  join(OUT, "registry.json"),
  JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "beautiful-ui",
      version: PKG.version,
      homepage: HOMEPAGE,
      items: [...items.values()].map(({ name, type, title, description }) => ({ name, type, title, description })),
    },
    null,
    2,
  ) + "\n",
);

console.log(`✓ ${items.size} items en public/r (base ${BASE})`);
for (const it of items.values())
  console.log(`  ${it.name.padEnd(20)} ${String(it.files.length).padStart(2)} archivos  deps: ${(it.dependencies ?? []).join(", ") || "—"}`);

if (ONLY_REGISTRY) process.exit(0);

/* ── tokens en formato DTCG (Figma Tokens Studio, Style Dictionary…) ──── */
const cssVars = (css, selector) => {
  const out = {};
  for (const m of css.matchAll(new RegExp(`(?:^|\\n)${selector.replace(/[.[\]]/g, "\\$&")} \\{([^}]*)\\}`, "g")))
    for (const v of m[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) out[v[1]] = v[2].replace(/\s+/g, " ").trim();
  return out;
};
const foundationCss = await readFile(join(SRC, "app/beautifui/foundation.css"), "utf8");
const kitCss = await readFile(join(SRC, "styles/kit.css"), "utf8");
const light = { ...cssVars(foundationCss, ":root"), ...cssVars(kitCss, ":root") };
const dark = { ...cssVars(foundationCss, ".dark"), ...cssVars(kitCss, ".dark") };
const theme = { ...cssVars(foundationCss, "@theme inline"), ...cssVars(kitCss, "@theme") };
const group = (name) =>
  /^(page|canvas|surface|inset|hover|hover-2|field|stripe|stripe-bg)$/.test(name) ? "surface"
  : /^ink/.test(name) ? "ink"
  : /^(line|grid-line)/.test(name) ? "border"
  : /^(accent|green|orange|red)/.test(name) ? "semantic"
  : /^tooltip/.test(name) ? "tooltip"
  : /^chart/.test(name) ? "chart"
  : /^shadow/.test(name) ? "shadow"
  : /^(z|duration)-/.test(name) ? name.split("-")[0]
  : null;
const tokens = { $description: `Beautiful UI ${PKG.version} — generado de foundation.css + kit.css. Modo oscuro en $extensions.mode.dark.` };
for (const [k, v] of Object.entries(light)) {
  const g = group(k);
  if (!g) continue;
  const type = g === "shadow" ? "shadow" : g === "z" ? "number" : g === "duration" ? "duration" : "color";
  (tokens[g] ??= {})[k] = { $type: type, $value: v, ...(dark[k] && dark[k] !== v && { $extensions: { mode: { dark: dark[k] } } }) };
}
for (const [k, v] of Object.entries(theme)) {
  if (k.startsWith("radius-")) (tokens.radius ??= {})[k.slice(7)] = { $type: "dimension", $value: v };
  else if (k.startsWith("ease-")) (tokens.easing ??= {})[k.slice(5)] = { $type: "cubicBezier", $value: v };
  else if (k.startsWith("font-")) (tokens.font ??= {})[k.slice(5)] = { $type: "fontFamily", $value: v };
  else if (/^text-[a-z]+$/.test(k))
    (tokens.typography ??= {})[k.slice(5)] = {
      $type: "typography",
      $value: {
        fontSize: v,
        lineHeight: theme[`${k}--line-height`] ?? "normal",
        letterSpacing: theme[`${k}--letter-spacing`] ?? "0",
        fontWeight: theme[`${k}--font-weight`] ?? "400",
      },
    };
}
await writeFile(join(ROOT, "public", "tokens.json"), JSON.stringify(tokens, null, 2) + "\n");
console.log(`✓ tokens.json (${Object.keys(tokens).length - 1} grupos)`);

/* ── MCP + skill para agentes ────────────────────────────────────────────
 * public/skill/SKILL.md        → skill publicada (el instalador la lee en vivo)
 * public/mcp/beautiful-ui-mcp.tgz → npx -y <url>.tgz [install]                */
const SKILL_OUT = join(ROOT, "public", "skill");
const MCP_OUT = join(ROOT, "public", "mcp");
await rm(SKILL_OUT, { recursive: true, force: true });
await rm(MCP_OUT, { recursive: true, force: true });
await mkdir(SKILL_OUT, { recursive: true });
await mkdir(MCP_OUT, { recursive: true });
await copyFile(join(ROOT, "mcp", "skill", "SKILL.md"), join(SKILL_OUT, "SKILL.md"));
const packed = execFileSync("npm", ["pack", join(ROOT, "mcp"), "--pack-destination", MCP_OUT, "--silent"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .pop();
await rename(join(MCP_OUT, packed), join(MCP_OUT, "beautiful-ui-mcp.tgz"));
console.log(`✓ skill en public/skill · MCP en public/mcp/beautiful-ui-mcp.tgz`);
