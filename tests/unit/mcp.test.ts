import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { afterAll, beforeAll, expect, it } from "vitest";

type RegistryItem = {
  name: string;
  dependencies?: string[];
  registryDependencies: string[];
  files: { target: string; content: string }[];
};

type Index = Record<string, { item: string; sourceItem: string; target: string; kind: string; usage?: string }>;

let directory: string;
let site: Server;
let origin: string;

async function readItem(name: string): Promise<RegistryItem> {
  return JSON.parse(await readFile(join(directory, `${name}.json`), "utf8"));
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "beautiful-ui-registry-"));
  site = createServer(async ({ url }, response) => {
    try {
      const path = url?.match(/^\/(?:legacy\/)?r\/((?:(?:api|examples)\/)?[\w-]+\.json)$/)?.[1];
      const legacyMissing = url?.startsWith("/legacy/") && (path === "component-index.json" || path?.includes("/"));
      if (path && !legacyMissing) {
        response.end(await readFile(join(directory, path)));
      } else if (url === "/skill/SKILL.md") {
        response.end(await readFile("mcp/skill/SKILL.md"));
      } else if (url === "/raw/src/pages/ExampleApp.tsx") {
        response.end(await readFile("src/pages/ExampleApp.tsx"));
      } else {
        response.writeHead(404).end();
      }
    } catch {
      response.writeHead(404).end();
    }
  });
  site.listen(0, "127.0.0.1");
  await once(site, "listening");
  const address = site.address();
  if (!address || typeof address === "string") throw new Error("No se asignó un puerto de prueba");
  origin = `http://127.0.0.1:${address.port}`;
  execFileSync(process.execPath, ["scripts/build-registry.mjs"], {
    env: { ...process.env, REGISTRY_OUT: directory, REGISTRY_URL: `${origin}/r` },
  });
});

afterAll(async () => {
  if (site?.listening) {
    const closed = once(site, "close");
    site.close();
    await closed;
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

type Reply = {
  result?: {
    isError?: boolean;
    content?: { text: string }[];
    tools?: { name: string }[];
    instructions?: string;
    messages?: { content: { text: string } }[];
  };
  error?: { code: number };
};

async function withMcp(sitePath: string, verify: (client: {
  request: (method: string, params?: object) => Promise<Reply>;
  call: (name: string, args?: object) => Promise<string>;
}) => Promise<void>) {
  const child = spawn(process.execPath, ["mcp/server.mjs"], {
    env: { ...process.env, BEAUTIFUL_UI_URL: `${origin}${sitePath}`, BEAUTIFUL_UI_RAW: `${origin}/raw` },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const closed = once(child, "close");
  const lines = createInterface({ input: child.stdout });
  let id = 0;
  async function request(method: string, params?: object): Promise<Reply> {
    const next = once(lines, "line", { signal: AbortSignal.timeout(3_000) });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) + "\n");
    const [line] = await next;
    const reply = JSON.parse(line);
    expect(reply.id).toBe(id);
    return reply;
  }
  async function call(name: string, args = {}) {
    const { result } = await request("tools/call", { name, arguments: args });
    expect(result?.isError, result?.content?.[0].text).toBeUndefined();
    return result?.content?.[0].text ?? "";
  }
  try {
    await verify({ request, call });
  } finally {
    child.stdin.end();
    await closed;
  }
}

it("genera un índice de exports con notas y dependencias válidas", async () => {
  const { items }: { items: { name: string }[] } = JSON.parse(await readFile(join(directory, "registry.json"), "utf8"));
  const entries = await Promise.all(items.map(({ name }) => readItem(name)));
  const byName = new Map(entries.map((item) => [item.name, item]));
  const index: Index = JSON.parse(await readFile(join(directory, "component-index.json"), "utf8"));

  for (const item of entries) {
    for (const dependency of item.registryDependencies) {
      expect(dependency.startsWith(`${origin}/r/`)).toBe(true);
      expect(byName.has(dependency.slice(`${origin}/r/`.length, -".json".length))).toBe(true);
    }
  }
  for (const { item, sourceItem, target } of Object.values(index)) {
    expect(byName.has(item)).toBe(true);
    expect(byName.get(sourceItem)?.files.some((file) => file.target === target)).toBe(true);
  }
  expect(index.Button).toMatchObject({ item: "ui-kit", sourceItem: "button", kind: "component" });
  expect(index.IconSearch.kind).toBe("icon");
  expect(index.useToast.kind).toBe("hook");
  expect(index.MenuItem.kind).toBe("type");
  expect(index.Select.usage).toContain("id={f.id}");
  expect(index.SearchField.item).toBe("search-field");
  const { dependencies } = JSON.parse(await readFile("package.json", "utf8"));
  expect(byName.get("search-field")?.dependencies).toEqual([
    `@ui-sdk/core@${dependencies["@ui-sdk/core"]}`,
    `@ui-sdk/react@${dependencies["@ui-sdk/react"]}`,
  ]);
  expect(byName.get("list-detail-page")?.registryDependencies).toContain(`${origin}/r/search-field.json`);
  for (const name of ["ui-kit", "prompt-bar", "chat-composer", "search", "sidebar-nav"]) {
    expect(byName.get(name)?.dependencies).toContain(`@ui-sdk/core@${dependencies["@ui-sdk/core"]}`);
  }
  expect(byName.get("ui-kit")?.dependencies).toContain(`@ui-sdk/react@${dependencies["@ui-sdk/react"]}`);
  expect(byName.get("ui-kit")?.registryDependencies).not.toContain(`${origin}/r/search-field.json`);
  expect(byName.get("chat-recipe")?.registryDependencies).toEqual(
    ["prompt-bar", "streaming-text", "ui-kit"].map((name) => `${origin}/r/${name}.json`),
  );
});

it("compila los ejemplos instalados desde el registro fuera de la app", async () => {
  const consumer = await mkdtemp(join(tmpdir(), "beautiful-ui-consumer-"));
  const installed = new Set<string>();
  async function install(name: string) {
    if (installed.has(name)) return;
    installed.add(name);
    const item = await readItem(name);
    for (const dependency of item.registryDependencies) {
      await install(dependency.slice(`${origin}/r/`.length, -".json".length));
    }
    for (const file of item.files) {
      const path = join(consumer, "src", file.target);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.content);
    }
  }

  try {
    for (const name of ["list-detail-page", "login-page", "chat-recipe"]) await install(name);
    await symlink(resolve("node_modules"), join(consumer, "node_modules"), "junction");
    await writeFile(join(consumer, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
    }));
    execFileSync(process.execPath, [resolve("node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"], {
      cwd: consumer,
      stdio: "inherit",
    });
  } finally {
    await rm(consumer, { recursive: true, force: true });
  }
});

it("responde por stdio con imports, notas, instalación y errores recuperables", async () => {
  await withMcp("", async ({ request, call }) => {
    const init = await request("initialize");
    expect(init.result?.instructions).toContain("get_guidelines");
    const { result } = await request("tools/list");
    expect(result?.tools?.map((tool) => tool.name)).toEqual([
      "list_components", "get_component", "get_design_tokens", "get_install_instructions", "get_guidelines", "get_example",
    ]);
    const catalog = await call("list_components");
    expect(catalog).toMatch(/ui-kit:.*Select/);
    expect(catalog).toMatch(/Hooks:.*useToast/);
    expect(catalog).toMatch(/\d+ iconos con prefijo Icon/);
    expect(catalog).not.toMatch(/IconSearch|TRIGGER/);

    const select = await call("get_component", { name: "Select", include_source: false });
    expect(select).toContain('import { Select } from "@/components/ui"');
    expect(select).toContain("id={f.id}");
    expect(select).toContain("onChange: (value: T) => void");
    expect(select).not.toContain("return (");
    expect(await call("get_component", { name: "prompt-bar", include_source: false })).toContain("demo={false}");
    expect(await call("get_component", { name: "SearchList", include_source: false })).toContain('import SearchList from "@/components/primitives/SearchList"');
    expect(await call("get_component", { name: "Input", include_source: false })).toContain("ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement>");

    const install = await call("get_install_instructions", { components: ["Button", "Select", "SearchList"] });
    expect(install.match(/ui-kit\.json/g)).toHaveLength(1);
    expect(install).toContain("search.json");
    expect(install).toContain("ToastProvider");
    expect(install).toContain("ThemeScript");

    const missing = await request("tools/call", { name: "get_component", arguments: { name: "ImaginaryWidget" } });
    expect(missing.result).toMatchObject({ isError: true, content: [{ text: expect.stringContaining("list_components") }] });
    const unknownTool = await request("tools/call", { name: "imaginary_tool" });
    expect(unknownTool.error?.code).toBe(-32602);
  });
});

it("devuelve tipos auxiliares y acota el código de items grandes", async () => {
  await withMcp("", async ({ call }) => {
    for (const [name, fragments] of [
      ["DataTable", ["function DataTable<T>", "type Column<T>", "type SortState"]],
      ["Menu", ["function Menu(", "type MenuItem"]],
      ["FormField", ["function FormField<T", "type FieldControl"]],
      ["useZodForm", ["function useZodForm<S extends z.ZodType"]],
      ["useToast", ["const useToast", "type ToastItem"]],
      ["StreamingText", ["function StreamingText", "type StreamingToken", "type StreamingSource"]],
      ["IconSearch", ["const IconSearch", 'import { IconSearch } from "@/components/ui"']],
      ["MenuItem", ["type MenuItem", 'import type { MenuItem } from "@/components/ui"']],
    ] as const) {
      const result = await call("get_component", { name, include_source: false });
      for (const fragment of fragments) expect(result).toContain(fragment);
    }
    const overview = await call("get_component", { name: "ui-kit" });
    expect(overview).toContain("Consulta un export concreto");
    expect(overview.length).toBeLessThan(4_000);
    expect(await call("get_component", { name: "all" })).toContain("list_components");
    expect(await call("get_component", { name: "ui-kit", file: "DataTable", include_source: false })).toContain("type Column<T>");
    expect(await call("get_component", { name: "ui-kit", file: "DataTable" })).toContain("const selectable");
    expect(await call("get_component", { name: "ui-kit", include_source: true })).toContain("const selectable");
  });
});

it("sirve el CSS completo, la guía breve y los ejemplos del registro", async () => {
  await withMcp("", async ({ request, call }) => {
    const kit = (await readItem("foundation")).files.find((file) => file.target.endsWith("/kit.css"));
    expect(kit).toBeDefined();
    expect(await call("get_design_tokens")).toContain(kit!.content);
    const full = await call("get_guidelines");
    const quick = await call("get_guidelines", { detail: "quick" });
    expect(quick).toContain("include_source: false");
    expect(full.length).toBeGreaterThan(quick.length);
    const prompt = await request("prompts/get", { name: "beautiful-ui" });
    expect(prompt.result?.messages?.[0].content.text).toBe(full);

    for (const [page, id] of [["listado", "list-detail-page"], ["login", "login-page"], ["chat", "chat-recipe"]]) {
      const recipe = await call("get_example", { page });
      expect(recipe).toContain(`/r/${id}.json`);
      expect(recipe).toContain((await readItem(id)).files[0].content);
    }
    const app = await call("get_example", { page: "app" });
    expect(app).toContain("/r/examples/app.json");
    expect(app).toContain(await readFile("src/pages/ExampleApp.tsx", "utf8"));
    const gallery = await call("get_example", { page: "gallery" });
    expect(gallery).toContain("/r/examples/gallery.json");
    expect(gallery).toContain("GalleryMore.tsx");
    expect(gallery).not.toContain("import { useState");
    expect(await call("get_example", { page: "gallery", file: "GalleryMore.tsx" }))
      .toContain(await readFile("src/pages/GalleryMore.tsx", "utf8"));
  });
});

it("acepta IDs en un registro anterior sin índice de exports", async () => {
  await withMcp("/legacy", async ({ call }) => {
    expect(await call("get_component", { name: "search" })).toContain("function SearchList");
    expect(await call("get_example", { page: "app" })).toContain("/raw/src/pages/ExampleApp.tsx");
  });
});
