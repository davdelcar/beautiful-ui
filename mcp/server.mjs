#!/usr/bin/env node
/**
 * beautiful-ui-mcp — servidor MCP (stdio, sin dependencias) del sistema de
 * diseño Beautiful UI, más un instalador de la skill para tus agentes.
 *
 *   beautiful-ui-mcp              → servidor MCP por stdio
 *   beautiful-ui-mcp install      → instala la skill y registra el MCP en Claude Code y Codex
 *   beautiful-ui-mcp uninstall    → lo deshace
 *
 * Lee el registro publicado en vivo, así que siempre sirve la última versión.
 * Variables: BEAUTIFUL_UI_URL (por defecto https://davdelcar.github.io/beautiful-ui)
 *            BEAUTIFUL_UI_RAW (fuente de app/galería para registros anteriores)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));
const SITE = (process.env.BEAUTIFUL_UI_URL || "https://davdelcar.github.io/beautiful-ui").replace(/\/$/, "");
const RAW = (process.env.BEAUTIFUL_UI_RAW || "https://raw.githubusercontent.com/davdelcar/beautiful-ui/main").replace(/\/$/, "");
const REGISTRY = `${SITE}/r`;
/* URL versionada: npx cachea por URL, así cada versión se instala de verdad */
const TARBALL = `${SITE}/mcp/beautiful-ui-mcp-${PKG.version}.tgz`;
const BUNDLED_SKILL = join(HERE, "skill", "SKILL.md");

/* ── red con caché en memoria (5 min) ─────────────────────────────────── */
const cache = new Map();
async function get(url, as = "json") {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < 300_000) return hit.v;
  const res = await fetch(url, { headers: { "user-agent": `beautiful-ui-mcp/${PKG.version}` } });
  if (!res.ok) throw Object.assign(new Error(`${res.status} al pedir ${url}`), { status: res.status });
  const v = as === "json" ? await res.json() : await res.text();
  cache.set(url, { t: Date.now(), v });
  return v;
}
const item = (name) => get(`${REGISTRY}/${encodeURIComponent(name)}.json`);
const depName = (url) => url.replace(/^.*\//, "").replace(/\.json$/, "");
const registry = () => get(`${REGISTRY}/registry.json`);
async function optionalJson(url) {
  try {
    return await get(url);
  } catch (error) {
    if (error.status !== 404) throw error;
    return null;
  }
}
const componentIndex = async () => (await optionalJson(`${REGISTRY}/component-index.json`)) ?? {};
function resolveComponent(name, reg, index) {
  if (typeof name !== "string" || !name.trim()) throw new Error("Indica el nombre de un componente o item del registro.");
  const query = name.trim();
  if (Object.hasOwn(index, query)) return { symbol: query, ...index[query] };
  const id = query.toLowerCase();
  if (reg.items.some((i) => i.name === id)) return { item: id, sourceItem: id };
  const symbol = Object.keys(index).find((key) => key.toLowerCase() === id);
  if (symbol) return { symbol, ...index[symbol] };
  throw new Error(`Componente o item desconocido: «${query}». Usa list_components para consultar los IDs y los exports de la biblioteca.`);
}

async function skillText() {
  try {
    return await get(`${SITE}/skill/SKILL.md`, "text");
  } catch {
    return readFileSync(BUNDLED_SKILL, "utf8");
  }
}

/* ── herramientas ─────────────────────────────────────────────────────── */
const INSTALL_STEPS = `Después de instalar los componentes:
1. Si instalaste \`foundation\`, sustituye el \`@import "tailwindcss";\` del CSS global por \`@import "<ruta relativa>/components/beautifui/beautiful-ui.css";\` (ya importa Tailwind).
2. Para la fundación, carga Inter y JetBrains Mono mediante Google Fonts (Inter:wght@400;500;600;700 y JetBrains+Mono:wght@400;500), o con next/font \`variable: "--font-inter"\` y \`variable: "--font-mono-face"\` en <html>.
3. Si la instalación incluye \`ui-kit\`, importa \`UIProvider\` y \`ToastProvider\` desde \`@/components/ui\`. Monta \`<UIProvider locale="es-ES"><ToastProvider>{app}</ToastProvider></UIProvider>\` en la raíz y elige el idioma del producto. En App Router monta los callbacks y render props en componentes cliente.
4. Si usas el tema del kit, monta \`<ThemeScript />\` en el head de Next.js (con \`suppressHydrationWarning\` en html). En Vite, coloca el contenido de \`themeScript\` dentro de un script en el head de index.html.

Requisitos: React 19, Tailwind CSS v4, alias \`@/\` y components.json (\`npx shadcn@latest init\`).
Si la biblioteca ya está instalada, revisa sus imports y API locales. Usa \`--overwrite\` solo para una actualización deliberada.

Opcional — namespace en components.json para \`npx shadcn add @beautiful-ui/<item>\`:
"registries": { "@beautiful-ui": "${REGISTRY}/{name}.json" }`;

/** Firma de props del export default / funciones exportadas de un archivo. */
function signatures(code) {
  const out = [];
  const re = /export (?:default )?function (\w+)(?:<[^>]*>)?\(/g;
  let m;
  while ((m = re.exec(code))) {
    let depth = 0;
    let i = m.index + m[0].length - 1;
    const start = i;
    for (; i < code.length; i++) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")" && --depth === 0) break;
    }
    out.push(`${m[1]}${code.slice(start, i + 1)}`);
  }
  for (const [, name, types] of code.matchAll(/^export const (\w+) = forwardRef<(.+)>\(/gm))
    out.push(`${name} = forwardRef<${types}>`);
  return out;
}

function cssBlock(css, selector) {
  const i = css.indexOf(`${selector} {`);
  if (i < 0) return "";
  return css.slice(i, css.indexOf("\n}", i) + 2);
}

const tools = {
  list_components: {
    description:
      "Lista todos los items del registro Beautiful UI (kit básico, átomos, los 20 componentes de IA, fundación) con su descripción. Úsalo primero para saber qué existe.",
    inputSchema: { type: "object", properties: {} },
    async run() {
      const [reg, index] = await Promise.all([registry(), componentIndex()]);
      const rows = reg.items.map((i) => `- **${i.name}** (${i.type.replace("registry:", "")}) — ${i.title}${i.description ? `: ${i.description}` : ""}`);
      const exports = ["ui-kit", "form"].map((id) => {
        const entries = Object.entries(index).filter(([, entry]) => entry.item === id);
        const components = entries.filter(([, entry]) => !entry.kind || entry.kind === "component").map(([name]) => name);
        const hooks = entries.filter(([, entry]) => entry.kind === "hook").map(([name]) => name);
        const icons = entries.filter(([, entry]) => entry.kind === "icon").length;
        const other = entries.length - components.length - hooks.length - icons;
        return [
          components.length && `\n${id}: ${components.join(", ")}`,
          hooks.length && `\nHooks: ${hooks.join(", ")}`,
          icons > 0 && `\n${icons} iconos con prefijo Icon.`,
          other > 0 && `\n${other} tipos y utilidades consultables por export.`,
        ].filter(Boolean).join("");
      });
      return `Registro: ${REGISTRY}/registry.json\n\n${rows.join("\n")}\n\nConsulta por export con get_component (p. ej. "Select"), o por ID (p. ej. "search").${exports.join("")}`;
    },
  },

  get_component: {
    description:
      "Consulta por export de React (Button, Select, SearchList) o ID del registro (ui-kit, prompt-bar). Devuelve instalación, firmas y notas de uso cuando están disponibles. Para una consulta breve, usa include_source: false.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Export público (Select, FormField) o ID del registro (ui-kit, prompt-bar)." },
        file: { type: "string", description: "Opcional: solo los archivos cuya ruta contenga este texto (p. ej. 'Overlay')." },
        include_source: { type: "boolean", description: "Incluir código fuente. Por defecto se omite en items de más de tres archivos sin filtro y se incluye en consultas concretas." },
      },
      required: ["name"],
    },
    async run({ name, file, include_source }) {
      const [reg, index] = await Promise.all([registry(), componentIndex()]);
      const resolved = resolveComponent(name, reg, index);
      const it = await item(resolved.item);
      const source = resolved.sourceItem === resolved.item ? it : await item(resolved.sourceItem);
      const files = source.files.filter((f) => file
        ? f.path.toLowerCase().includes(String(file).toLowerCase())
        : !resolved.target || f.target === resolved.target);
      if (file && !files.length) throw new Error(`Ningún archivo de ${source.name} coincide con «${file}».`);
      const overview = !resolved.target && !file && (files.length === 0 || files.length > 3);
      const includeSource = include_source ?? !overview;
      const usage = resolved.usage ?? (source.files.length === 1
        ? Object.values(index).find((entry) => entry.sourceItem === source.name && entry.usage)?.usage
        : undefined);
      const parts = [
        `# ${resolved.symbol ?? it.title} (\`${it.name}\`)`,
        it.description ?? "",
        ...(resolved.import ? [`Import: \`${resolved.import}\``] : []),
        `Instalar: \`npx shadcn@latest add ${REGISTRY}/${it.name}.json\``,
        `Dependencias npm: ${(it.dependencies ?? []).join(", ") || "—"}`,
        `Depende de: ${it.registryDependencies.map(depName).join(", ") || "—"}`,
        `Archivos: ${(resolved.target || file ? files : it.files).map((f) => f.target).join(", ") || "— (meta-item)"}`,
        ...(usage ? [`\n## Uso\n${usage}`] : []),
      ];
      if (overview) {
        parts.push("Consulta un export concreto o usa `file` para elegir un archivo. `list_components` muestra el catálogo.");
      }
      const api = !overview && await optionalJson(`${REGISTRY}/api/${source.name}.json`);
      for (const f of overview ? [] : files) {
        if (!/\.tsx?$/.test(f.path)) continue;
        const docs = api?.[f.target];
        const doc = docs?.[resolved.symbol ?? source.title];
        const selected = doc ? [doc] : !resolved.symbol && docs ? Object.values(docs) : [];
        if (selected.length) {
          const declarations = new Set(selected.flatMap((entry) => [entry.signature, ...entry.types]));
          parts.push(`\n## Firmas — ${f.target}\n\`\`\`ts\n${[...declarations].join("\n\n")}\n\`\`\``);
          continue;
        }
        const sig = signatures(f.content).filter((signature) => !resolved.symbol
          || signature.startsWith(`${resolved.symbol}(`) || signature.startsWith(`${resolved.symbol} =`));
        if (sig.length) parts.push(`\n## Firmas — ${f.target}\n\`\`\`ts\n${sig.join("\n\n")}\n\`\`\``);
      }
      if (includeSource)
        for (const f of files) parts.push(`\n## ${f.target}\n\`\`\`${f.path.split(".").pop()}\n${f.content}\n\`\`\``);
      return parts.join("\n");
    },
  },

  get_design_tokens: {
    description:
      "Tokens de diseño de Beautiful UI: variables CSS de tema claro (:root) y oscuro (.dark) y el mapeo @theme a utilidades de Tailwind (bg-surface, text-ink-2, shadow-card, rounded-card…).",
    inputSchema: { type: "object", properties: {} },
    async run() {
      const files = (await item("foundation")).files;
      const css = files.find((x) => x.path.endsWith("foundation.css")).content;
      const kit = files.find((x) => x.path.endsWith("kit.css"))?.content ?? "";
      return [
        "Usa siempre estas utilidades en lugar de colores, sombras o radios sueltos. El tema oscuro se activa con la clase .dark en <html>.",
        "```css",
        cssBlock(css, "@theme inline"),
        "",
        cssBlock(css, ":root"),
        "",
        cssBlock(css, ".dark"),
        "```",
        kit && "\nExtensión del kit (kit.css): escala tipográfica text-display…text-overline, paleta de series --chart-1…8, acentos [data-accent], contraste AA:",
        kit && "```css\n" + kit + "\n```",
        `Tokens en formato DTCG (Figma/Style Dictionary): ${SITE}/tokens.json`,
        "Clases de la fundación: primitive-card-bar, primitive-card-pad, primitive-card-footer, primitive-icon-button, filter-status-{todo,progress,done}.",
        `Keyframes globales: ${[...css.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1]).join(", ")}.`,
      ].join("\n");
    },
  },

  get_install_instructions: {
    description: "Comandos de instalación para exports o IDs del registro, con configuración de CSS, fuentes, providers y tema.",
    inputSchema: {
      type: "object",
      properties: {
        components: { type: "array", items: { type: "string" }, description: "Exports o IDs a instalar. Pasa los que requiere tu pantalla (por defecto 'all')." },
      },
    },
    async run({ components } = {}) {
      const [reg, index] = await Promise.all([registry(), componentIndex()]);
      const resolved = (components?.length ? components : ["all"]).map((name) => resolveComponent(name, reg, index));
      const names = [...new Set(resolved.map((component) => component.item))];
      return [
        "```bash",
        "npx shadcn@latest init   # solo si el proyecto no tiene components.json",
        `npx shadcn@latest add ${names.map((n) => `${REGISTRY}/${n}.json`).join(" ")}`,
        "```",
        INSTALL_STEPS,
      ].join("\n");
    },
  },

  get_guidelines: {
    description: "Guía de Beautiful UI. Usa detail: 'quick' para el flujo de trabajo y 'full' para la skill completa.",
    inputSchema: { type: "object", properties: { detail: { type: "string", enum: ["quick", "full"] } } },
    async run({ detail = "full" } = {}) {
      const text = await skillText();
      if (detail !== "quick") return text;
      const workflow = (guide) => guide.replace(/\r\n/g, "\n").match(/^## Flujo de trabajo\n\n([\s\S]*?)(?=^## )/m)?.[1].trim();
      return workflow(text) ?? workflow(readFileSync(BUNDLED_SKILL, "utf8")) ?? text;
    },
  },

  get_example: {
    description:
      "Código fuente de referencia. 'app' = sidebar, ⌘K, dashboard y asistente; 'gallery' = galería; ejemplos instalables: 'login', 'listado', 'analitica', 'ajustes', 'alta', 'error', 'chat'.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string", enum: ["app", "gallery", "login", "listado", "analitica", "ajustes", "alta", "error", "chat"], description: "Por defecto 'app'." },
        file: { type: "string", description: "En app o gallery, nombre del archivo de referencia (p. ej. GalleryMore.tsx). Gallery lista los archivos al omitirlo." },
      },
    },
    async run({ page = "app", file: filename } = {}) {
      const templates = { login: "login-page", listado: "list-detail-page", analitica: "analytics-page", ajustes: "settings-page", alta: "wizard-page", error: "error-page", chat: "chat-recipe" };
      if (Object.hasOwn(templates, page)) {
        const id = templates[page];
        const { files: [file] } = await item(id);
        return [
          page === "chat" ? "Receta: chat con datos de la aplicación" : `Plantilla: ${SITE}/#/plantillas/${page}`,
          `Instalar: \`npx shadcn@latest add ${REGISTRY}/${id}.json\``,
          `Archivo: \`${file.target}\``,
          "Adapta los datos y conecta las acciones al producto antes de usar la plantilla.",
          `\n\`\`\`tsx\n${file.content}\n\`\`\``,
        ].join("\n");
      }
      const example = page === "gallery" ? "gallery" : "app";
      const live = example === "gallery" ? SITE : `${SITE}/#/app`;
      const published = `${REGISTRY}/examples/${example}.json`;
      const snapshot = await optionalJson(published);
      if (snapshot) {
        const files = snapshot.files.map((f) => f.path).join(", ");
        const selected = filename ? snapshot.files.find((f) => f.path === filename || f.path.endsWith(`/${filename}`)) : snapshot.files[0];
        if (!selected) throw new Error(`Archivo desconocido: «${filename}». Disponibles: ${files}`);
        const parts = [`Fuente: ${published} (en vivo: ${live})`, `Archivos: ${files}`];
        if (example === "gallery") {
          parts.push("La galería usa archivos internos del sitio. Para una pantalla instalable, consulta listado, login u otra plantilla.");
          if (!filename) return [...parts, "Pasa `file` para leer uno de los archivos."].join("\n");
        }
        return [...parts, `\n\`\`\`${selected.path.split(".").at(-1)}\n${selected.content}\n\`\`\``].join("\n");
      }
      const path = example === "gallery" ? "src/pages/DesignSystem.tsx" : "src/pages/ExampleApp.tsx";
      if (filename && filename !== path.slice(4) && filename !== path.split("/").at(-1)) {
        throw new Error("Este registro anterior solo ofrece el archivo principal.");
      }
      return `Fuente: ${RAW}/${path} (en vivo: ${live})\n\n\`\`\`tsx\n${await get(`${RAW}/${path}`, "text")}\n\`\`\``;
    },
  },
};

/* ── protocolo MCP (JSON-RPC por líneas sobre stdio) ──────────────────── */
const INSTRUCTIONS =
  "Si el usuario pide Beautiful UI o el proyecto ya lo usa, revisa primero las dependencias e imports locales. Consulta get_guidelines con detail: 'quick' y usa get_component por nombre React para comprobar el import y la API. Busca una plantilla con get_example si la tarea es una pantalla completa. Instala solo los items que falten y utiliza los tokens del sistema.";

const PROMPT = { name: "beautiful-ui", description: "Carga la guía de Beautiful UI para construir interfaces con el sistema de diseño." };

async function handle(msg) {
  const { method, params = {} } = msg;
  switch (method) {
    case "initialize":
      return {
        protocolVersion: params.protocolVersion || "2025-06-18",
        capabilities: { tools: {}, prompts: {} },
        serverInfo: { name: "beautiful-ui", version: PKG.version },
        instructions: INSTRUCTIONS,
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) };
    case "tools/call": {
      const t = tools[params.name];
      if (!t) throw Object.assign(new Error(`Herramienta desconocida: ${params.name}`), { code: -32602 });
      try {
        return { content: [{ type: "text", text: await t.run(params.arguments ?? {}) }] };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Error: ${e.message}` }] };
      }
    }
    case "prompts/list":
      return { prompts: [PROMPT] };
    case "prompts/get":
      if (params.name !== PROMPT.name) throw Object.assign(new Error(`Prompt desconocido: ${params.name}`), { code: -32602 });
      return { description: PROMPT.description, messages: [{ role: "user", content: { type: "text", text: await skillText() } }] };
    default:
      throw Object.assign(new Error(`Método no soportado: ${method}`), { code: -32601 });
  }
}

function serve() {
  const send = (o) => process.stdout.write(JSON.stringify(o) + "\n");
  const rl = createInterface({ input: process.stdin });
  rl.on("line", async (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } });
    }
    if (msg.id === undefined || msg.id === null) return; // notificación
    try {
      send({ jsonrpc: "2.0", id: msg.id, result: await handle(msg) });
    } catch (e) {
      send({ jsonrpc: "2.0", id: msg.id, error: { code: e.code ?? -32603, message: e.message } });
    }
  });
  rl.on("close", () => process.exit(0));
}

/* ── instalador ───────────────────────────────────────────────────────── */
const HOME = homedir();
const SKILL_DIRS = [
  { agent: "Claude Code", root: join(HOME, ".claude"), dir: join(HOME, ".claude", "skills", "beautiful-ui") },
  { agent: "Codex", root: join(HOME, ".codex"), dir: join(HOME, ".codex", "skills", "beautiful-ui") },
  { agent: "Agentes (.agents)", root: join(HOME, ".agents"), dir: join(HOME, ".agents", "skills", "beautiful-ui") },
];

function has(cmd) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const WIN = process.platform === "win32";
function run(cmd, args) {
  try {
    /* en Windows claude/codex suelen ser .cmd: sin shell, Node no puede lanzarlos */
    execFileSync(cmd, args, { stdio: "pipe", shell: WIN });
    return true;
  } catch (e) {
    return String(e.stderr || e.message).trim().split("\n")[0];
  }
}

async function install() {
  const args = process.argv.slice(3);
  const onlySkill = args.includes("--skill-only");
  const onlyMcp = args.includes("--mcp-only");
  /* en Windows npx es npx.cmd: los clientes MCP necesitan lanzarlo vía cmd /c */
  const launch = WIN ? ["cmd", "/c", "npx", "-y", TARBALL] : ["npx", "-y", TARBALL];

  if (!onlyMcp) {
    const text = await skillText();
    for (const s of SKILL_DIRS) {
      if (!existsSync(s.root)) continue;
      mkdirSync(s.dir, { recursive: true });
      writeFileSync(join(s.dir, "SKILL.md"), text);
      console.log(`✓ skill → ${s.dir} (${s.agent})`);
    }
  }
  if (!onlySkill) {
    if (has("claude")) {
      run("claude", ["mcp", "remove", "-s", "user", "beautiful-ui"]);
      const r = run("claude", ["mcp", "add", "-s", "user", "beautiful-ui", "--", ...launch]);
      console.log(r === true ? "✓ MCP registrado en Claude Code (scope user)" : `✗ Claude Code: ${r}`);
    }
    if (has("codex")) {
      run("codex", ["mcp", "remove", "beautiful-ui"]);
      const r = run("codex", ["mcp", "add", "beautiful-ui", "--", ...launch]);
      console.log(r === true ? "✓ MCP registrado en Codex" : `✗ Codex: ${r}`);
    }
    console.log(`\nOtros clientes MCP (Cursor, VS Code, Claude Desktop…):\n${JSON.stringify(
      { mcpServers: { "beautiful-ui": { command: launch[0], args: launch.slice(1) } } },
      null,
      2,
    )}`);
  }
  console.log(`\nMCP ${PKG.version}. Reinicia tus agentes para que carguen la skill y el MCP.`);
  console.log("Para actualizar más adelante: npx -y " + SITE + "/mcp/beautiful-ui-mcp-<versión>.tgz install (versión en " + SITE + "/r/registry.json)");
}

function uninstall() {
  for (const s of SKILL_DIRS)
    if (existsSync(s.dir)) {
      rmSync(s.dir, { recursive: true, force: true });
      console.log(`✓ skill eliminada de ${s.dir}`);
    }
  if (has("claude") && run("claude", ["mcp", "remove", "-s", "user", "beautiful-ui"]) === true) console.log("✓ MCP eliminado de Claude Code");
  if (has("codex") && run("codex", ["mcp", "remove", "beautiful-ui"]) === true) console.log("✓ MCP eliminado de Codex");
}

const cmd = process.argv[2];
if (cmd === "install") await install();
else if (cmd === "uninstall") uninstall();
else if (cmd === "--version" || cmd === "-v") console.log(PKG.version);
else if (cmd === "--help" || cmd === "-h")
  console.log("beautiful-ui-mcp [install [--skill-only|--mcp-only] | uninstall]\nSin argumentos arranca el servidor MCP por stdio.");
else serve();
