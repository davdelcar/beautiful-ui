import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "beautiful-ui-next-"));
const registry = join(temporary, "registry");
const consumer = join(temporary, "consumer");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const site = createServer(async ({ url }, response) => {
  const item = url?.match(/^\/r\/([\w-]+\.json)$/)?.[1];
  try {
    if (!item) throw new Error("Recurso desconocido");
    const body = await readFile(join(registry, item));
    response.writeHead(200, { "content-type": "application/json" }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

async function run(command, args, cwd, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...extraEnv },
    stdio: "inherit",
    shell: process.platform === "win32" && command === npm,
  });
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`${command} ${args.join(" ")} terminó con código ${code}`);
}

try {
  site.listen(0, "127.0.0.1");
  await once(site, "listening");
  const registryUrl = `http://127.0.0.1:${site.address().port}/r`;
  await run(process.execPath, ["scripts/build-registry.mjs"], root, { REGISTRY_OUT: registry, REGISTRY_URL: registryUrl });

  await mkdir(join(consumer, "src", "app"), { recursive: true });
  const { packages } = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const installedVersion = (name) => packages[`node_modules/${name}`].version;
  const fixture = {
    "package.json": JSON.stringify({
      name: "beautiful-ui-next-smoke",
      private: true,
      scripts: { build: "next build" },
      dependencies: { next: "16.4.6", react: installedVersion("react"), "react-dom": installedVersion("react-dom") },
      devDependencies: {
        "@tailwindcss/postcss": installedVersion("tailwindcss"),
        tailwindcss: installedVersion("tailwindcss"),
        typescript: "5.9.3",
        ...Object.fromEntries(["@types/node", "@types/react", "@types/react-dom"].map((name) => [name, installedVersion(name)])),
      },
    }),
    "components.json": JSON.stringify({
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: { css: "src/app/globals.css", baseColor: "neutral", cssVariables: true },
      aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", utils: "@/lib/utils", hooks: "@/hooks" },
    }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, skipLibCheck: true,
        noEmit: true, module: "esnext", moduleResolution: "bundler", isolatedModules: true,
        jsx: "react-jsx", esModuleInterop: true, paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
    }),
    "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
    "src/app/globals.css": '@import "tailwindcss";\n',
    "src/app/layout.tsx": `import type { ReactNode } from "react";
import { ThemeScript, ToastProvider, UIProvider } from "@/components/ui";
import "./globals.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><UIProvider><ToastProvider>{children}</ToastProvider></UIProvider></body>
    </html>
  );
}
`,
    "src/app/page.tsx": `import { Button } from "@/components/ui";
import ListDetailPage from "@/components/blocks/ListDetailPage";
import LoginPage from "@/components/blocks/LoginPage";
import ChatDemo from "./ChatDemo";

export default function Page() {
  return <main><Button>Beautiful UI</Button><ListDetailPage orders={[]} /><LoginPage /><ChatDemo /></main>;
}
`,
    "src/app/ChatDemo.tsx": `"use client";
import { useState } from "react";
import ChatRecipe, { type ChatRecipeMessage } from "@/components/blocks/ChatRecipe";

export default function ChatDemo() {
  const [messages, setMessages] = useState<ChatRecipeMessage[]>([]);
  return <ChatRecipe messages={messages} onSend={(text) => setMessages([...messages, { id: String(messages.length), role: "user", text }])} />;
}
`,
  };
  for (const [filename, body] of Object.entries(fixture)) await writeFile(join(consumer, filename), body);

  await run(npm, ["install", "--no-audit", "--no-fund"], consumer);
  const items = ["list-detail-page", "login-page", "chat-recipe"].map((name) => `${registryUrl}/${name}.json`);
  await run(npm, ["exec", "--yes", "--package=shadcn@4.23.0", "--", "shadcn", "add", ...items, "--yes"], consumer);
  await writeFile(join(consumer, "src", "app", "globals.css"), '@import "../components/beautifui/beautiful-ui.css";\n');

  await run(npm, ["run", "build"], consumer);
  const output = join(consumer, ".next");
  const html = await readFile(join(output, "server", "app", "index.html"), "utf8");
  for (const text of ["Beautiful UI", "Pedidos", "Asistente", "bui-theme"]) {
    if (!html.includes(text)) throw new Error(`Falta «${text}» en la página prerenderizada`);
  }
  const styles = (await readdir(join(output, "static"), { recursive: true })).filter((path) => path.endsWith(".css"));
  const css = await Promise.all(styles.map((path) => readFile(join(output, "static", path), "utf8")));
  if (!css.some((text) => /\.bg-page\s*\{\s*background-color:\s*var\(--page\)/.test(text) && /--page\s*:/.test(text))) {
    throw new Error("La compilación de Next no contiene las utilidades de Beautiful UI.");
  }
  console.log("✓ Next.js App Router: instalación shadcn, build, HTML prerenderizado y tokens verificados.");
} finally {
  if (site.listening) {
    const closed = once(site, "close");
    site.close();
    await closed;
  }
  await rm(temporary, { recursive: true, force: true });
}
