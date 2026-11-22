import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// TypeScript emits one unindented declaration per symbol. Keep its type
// information, including generics and inferred consts, without shipping tsc in the MCP.
function readDeclarations(code) {
  const statement = /^(?:(?:export )?(?:default )?(?:declare )?(?:function|const|let|class|type|interface|enum) (\w+)|import\b|export\s*\{)/gm;
  const starts = [...code.matchAll(statement)];
  return new Map(starts.flatMap((match, index) => match[1]
    ? [[match[1], code.slice(match.index, starts[index + 1]?.index).trim()]]
    : []));
}

function describe(declarations, symbol) {
  const signature = declarations.get(symbol);
  if (!signature) return;
  const related = new Map();
  function visit(declaration) {
    for (const name of new Set(declaration.match(/\b[A-Za-z_$][\w$]*\b/g))) {
      if (name === symbol || related.has(name) || !declarations.has(name)) continue;
      const text = declarations.get(name);
      related.set(name, text);
      visit(text);
    }
  }
  visit(signature);
  return { signature, types: [...related.values()] };
}

export async function writeRegistryApi(root, output, componentIndex, sources) {
  const temporary = await mkdtemp(join(tmpdir(), "beautiful-ui-declarations-"));
  try {
    execFileSync(process.execPath, [
      join(root, "node_modules", "typescript", "bin", "tsc"),
      "-p", join(root, "tsconfig.json"), "--rootDir", root,
      "--noEmit", "false", "--declaration", "--emitDeclarationOnly",
      "--removeComments", "--outDir", temporary,
    ], { cwd: root, stdio: "inherit" });
    const api = new Map();
    const declarations = new Map();
    for (const [symbol, component] of Object.entries(componentIndex)) {
      const { target, sourceItem } = component;
      if (!declarations.has(target)) {
        const source = sources.get(target);
        const declarationPath = source.replace(/\.tsx?$/, ".d.ts");
        declarations.set(target, readDeclarations(await readFile(join(temporary, "src", declarationPath), "utf8")));
      }
      const description = describe(declarations.get(target), symbol);
      if (!description) throw new Error(`No se encontró la declaración de ${symbol} en ${target}`);
      if (!api.has(sourceItem)) api.set(sourceItem, Object.create(null));
      const item = api.get(sourceItem);
      item[target] ??= Object.create(null);
      item[target][symbol] = description;
    }
    const directory = join(output, "api");
    await mkdir(directory, { recursive: true });
    for (const [item, apiByFile] of api) {
      await writeFile(join(directory, `${item}.json`), JSON.stringify(apiByFile) + "\n");
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
