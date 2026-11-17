#!/usr/bin/env node
/**
 * Descarga los componentes oficiales de Beautiful UI desde su registro shadcn
 * (https://www.beautifului.dev/r/registry.json) y los escribe en src/ tal cual.
 *
 *   npm run registry:sync            → todos los items
 *   npm run registry:sync -- button  → solo los indicados
 *
 * No edites los archivos de src/components/atoms, src/components/primitives ni
 * src/app/beautifui a mano: se sobrescriben en cada sync. Los elementos propios
 * del proyecto viven en src/components/ui.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://www.beautifului.dev/r";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

const get = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

/* Arreglos mínimos sobre el contenido publicado. Cada uno se documenta y se
 * aplica solo si el texto original sigue presente. */
const PATCHES = {
  /* El registro corta el último @media de records-table.css y deja su cierre
   * (`.records-footer-hint{display:none}}`) suelto dentro de foundation.css.
   * Se quita de foundation y se devuelve a records-table. */
  "app/beautifui/foundation.css": [
    {
      why: "quita el cierre de @media de records-table que quedó suelto aquí",
      find: /\/\* The sidebar is one persistent 224px tree clipped by a 52px shell\.\n \* Every rail glyph remains centered at x=26 in both states\. \*\/\n\s*\.records-footer-hint \{\n\s*display: none;\n\s*\}\n\}\n/,
      replace: "",
    },
  ],
  "app/beautifui/records-table.css": [
    {
      why: "cierra el @media (max-width: 640px) final que el registro dejó abierto",
      find: /(@media \(max-width: 640px\) \{(?:(?!@media)[\s\S])*\.records-toolbar-right \{\n\s*justify-content: flex-end;\n\s*\}\n)$/,
      replace: "$1\n  .records-footer-hint {\n    display: none;\n  }\n}\n",
    },
  ],
};

const index = await get(`${BASE}/registry.json`);
const wanted = process.argv.slice(2);
const items = index.items.filter((i) => !wanted.length || wanted.includes(i.name));
const deps = new Set();

for (const { name } of items) {
  const item = await get(`${BASE}/${name}.json`);
  for (const d of item.dependencies ?? []) deps.add(d);
  for (const file of item.files ?? []) {
    const target = file.target || file.path;
    let content = file.content;
    for (const p of PATCHES[target] ?? []) {
      if (p.find.test(content)) {
        content = content.replace(p.find, p.replace);
        console.log(`  parche ${target}: ${p.why}`);
      }
    }
    const out = join(ROOT, target);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, content);
    console.log(`✓ ${name.padEnd(20)} → src/${target}`);
  }
}

console.log(`\nDependencias npm requeridas: ${[...deps].join(", ") || "ninguna"}`);
