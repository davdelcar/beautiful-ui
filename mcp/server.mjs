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
 *            BEAUTIFUL_UI_RAW (por defecto https://raw.githubusercontent.com/davdelcar/beautiful-ui/main)
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
const TARBALL = `${SITE}/mcp/beautiful-ui-mcp.tgz`;
const BUNDLED_SKILL = join(HERE, "skill", "SKILL.md");

/* ── red con caché en memoria (5 min) ─────────────────────────────────── */
const cache = new Map();
async function get(url, as = "json") {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < 300_000) return hit.v;
  const res = await fetch(url, { headers: { "user-agent": `beautiful-ui-mcp/${PKG.version}` } });
  if (!res.ok) throw new Error(`${res.status} al pedir ${url}`);
  const v = as === "json" ? await res.json() : await res.text();
  cache.set(url, { t: Date.now(), v });
  return v;
}
const item = (name) => get(`${REGISTRY}/${encodeURIComponent(name)}.json`);
const depName = (url) => url.replace(/^.*\//, "").replace(/\.json$/, "");

async function skillText() {
  try {
    return await get(`${SITE}/skill/SKILL.md`, "text");
  } catch {
    return readFileSync(BUNDLED_SKILL, "utf8");
  }
}

/* ── herramientas ─────────────────────────────────────────────────────── */
const INSTALL_STEPS = `Después de instalar, dos pasos a mano:
1. CSS global: sustituye \`@import "tailwindcss";\` por \`@import "<ruta relativa>/components/beautifui/beautiful-ui.css";\` (ya importa Tailwind).
2. Fuentes Inter y JetBrains Mono: <link> de Google Fonts (Inter:wght@400;500;600;700 y JetBrains+Mono:wght@400;500), o con next/font \`variable: "--font-inter"\` y \`variable: "--font-mono-face"\` en <html>.

Requisitos: React 18/19, Tailwind CSS v4, alias \`@/\` y components.json (\`npx shadcn@latest init\`).
Actualizar: repite el \`add\` con \`--overwrite\`.

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
      const reg = await get(`${REGISTRY}/registry.json`);
      const rows = reg.items.map((i) => `- **${i.name}** (${i.type.replace("registry:", "")}) — ${i.title}${i.description ? `: ${i.description}` : ""}`);
      return `Registro: ${REGISTRY}/registry.json\n\n${rows.join("\n")}\n\nKit: importa desde "@/components/ui". Componentes de IA: import X from "@/components/primitives/X".`;
    },
  },

  get_component: {
    description:
      "Devuelve un item del registro: archivos destino, dependencias, comando de instalación, firmas de props y (por defecto) el código fuente completo. Usa 'ui-kit' para el kit básico o el nombre kebab de un componente (prompt-bar, approval-card, sidebar-nav, search…).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del item, p. ej. 'prompt-bar' o 'ui-kit'." },
        file: { type: "string", description: "Opcional: solo los archivos cuya ruta contenga este texto (p. ej. 'Overlay')." },
        include_source: { type: "boolean", description: "Incluir el código fuente (por defecto true)." },
      },
      required: ["name"],
    },
    async run({ name, file, include_source = true }) {
      const it = await item(name);
      const files = it.files.filter((f) => !file || f.path.toLowerCase().includes(String(file).toLowerCase()));
      const parts = [
        `# ${it.title} (\`${it.name}\`)`,
        it.description ?? "",
        `Instalar: \`npx shadcn@latest add ${REGISTRY}/${it.name}.json\``,
        `Dependencias npm: ${(it.dependencies ?? []).join(", ") || "—"}`,
        `Depende de: ${it.registryDependencies.map(depName).join(", ") || "—"}`,
        `Archivos: ${it.files.map((f) => f.target).join(", ") || "— (meta-item)"}`,
      ];
      for (const f of files) {
        if (!/\.tsx?$/.test(f.path)) continue;
        const sig = signatures(f.content);
        if (sig.length) parts.push(`\n## Firmas — ${f.target}\n\`\`\`ts\n${sig.join("\n\n")}\n\`\`\``);
      }
      if (include_source)
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
        kit && "```css\n" + kit.slice(0, 6000) + "\n```",
        `Tokens en formato DTCG (Figma/Style Dictionary): ${SITE}/tokens.json`,
        "Clases de la fundación: primitive-card-bar, primitive-card-pad, primitive-card-footer, primitive-icon-button, filter-status-{todo,progress,done}.",
        `Keyframes globales: ${[...css.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1]).join(", ")}.`,
      ].join("\n");
    },
  },

  get_install_instructions: {
    description: "Comandos para instalar Beautiful UI (todo o items concretos) en un proyecto React + Tailwind v4, y los pasos manuales de CSS y fuentes.",
    inputSchema: {
      type: "object",
      properties: {
        components: { type: "array", items: { type: "string" }, description: "Items a instalar (por defecto 'all')." },
      },
    },
    async run({ components } = {}) {
      const names = components?.length ? components : ["all"];
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
    description: "Guía completa de uso de Beautiful UI (la skill): reglas, tokens, API del kit, cuándo usar cada componente de IA, composición y checklist.",
    inputSchema: { type: "object", properties: {} },
    run: () => skillText(),
  },

  get_example: {
    description:
      "Código fuente de referencia hecho solo con el sistema. 'app' = app con sidebar, ⌘K, dashboard y asistente; 'gallery' = galería; plantillas de página: 'login', 'listado' (tabla+filtros+Sheet), 'analitica' (gráficas), 'ajustes', 'alta' (wizard), 'error'. Instálalas con get_component '<x>-page'.",
    inputSchema: {
      type: "object",
      properties: { page: { type: "string", enum: ["app", "gallery", "login", "listado", "analitica", "ajustes", "alta", "error"], description: "Por defecto 'app'." } },
    },
    async run({ page = "app" } = {}) {
      const TPL = { login: "LoginPage", listado: "ListDetailPage", analitica: "AnalyticsPage", ajustes: "SettingsPage", alta: "WizardPage", error: "ErrorPage" };
      const path = page === "gallery" ? "src/pages/DesignSystem.tsx" : TPL[page] ? `src/components/blocks/${TPL[page]}.tsx` : "src/pages/ExampleApp.tsx";
      const live = page === "app" ? "#/app" : TPL[page] ? `#/plantillas/${page}` : "";
      return `Fuente: ${RAW}/${path} (en vivo: ${SITE}/${live})\n\n\`\`\`tsx\n${await get(`${RAW}/${path}`, "text")}\n\`\`\``;
    },
  },
};

/* ── protocolo MCP (JSON-RPC por líneas sobre stdio) ──────────────────── */
const INSTRUCTIONS =
  "Beautiful UI es el sistema de diseño del usuario (React + Tailwind v4, registro shadcn). Antes de construir UI con él, llama a get_guidelines; usa list_components / get_component para la API exacta, get_design_tokens para colores, tipografía, sombras y radios, y get_example para partir de una plantilla de página (login, listado, analítica, ajustes, alta, error). Nunca uses colores sueltos: solo tokens.";

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
function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "pipe" });
    return true;
  } catch (e) {
    return String(e.stderr || e.message).trim().split("\n")[0];
  }
}

async function install() {
  const args = process.argv.slice(3);
  const onlySkill = args.includes("--skill-only");
  const onlyMcp = args.includes("--mcp-only");
  const launch = ["npx", "-y", TARBALL];

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
      { mcpServers: { "beautiful-ui": { command: "npx", args: launch.slice(1) } } },
      null,
      2,
    )}`);
  }
  console.log("\nReinicia tus agentes para que carguen la skill y el MCP.");
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
