import { useState, type ReactNode } from "react";
import CodeBlock from "@/components/primitives/CodeBlock";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/ui";
import { DOCS, primitiveDoc, type Doc } from "./docs";

/* ── marco de cada sección (copiado del showcase de beautifului.dev) ── */

export function Showcase({
  id,
  title,
  desc,
  children,
  controls,
  bare = false,
}: {
  id: string;
  title: string;
  desc: string;
  children: ReactNode;
  controls?: ReactNode;
  /** sin superficie canvas (para demos que ya traen la suya) */
  bare?: boolean;
}) {
  const doc = DOCS[id] ?? primitiveDoc(id);
  const [showDoc, setShowDoc] = useState(false);
  return (
    <section id={id} className="primitive-showcase group flex [counter-increment:showcase] w-full scroll-mt-8 flex-col border-b border-dashed border-line px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2 sm:items-baseline">
          <span aria-hidden className="mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums before:content-[counter(showcase,decimal-leading-zero)] sm:mt-0" />
          <div className="min-w-0 sm:flex sm:items-baseline sm:gap-2">
            <h2 className="text-[13px] font-semibold whitespace-nowrap text-ink">{title}</h2>
            <p className="mt-0.5 text-[12.5px] text-pretty text-ink-3 sm:mt-0">{desc}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {controls}
          {doc && (
            <Button size="xs" variant={showDoc ? "ghost" : "quiet"} aria-expanded={showDoc} onClick={() => setShowDoc((v) => !v)}>
              <span className="font-mono text-[11px]">&lt;/&gt;</span> Código
            </Button>
          )}
        </div>
      </div>
      {bare ? (
        children
      ) : (
        <div className="primitive-demo-surface relative flex min-h-40 items-center justify-center overflow-hidden rounded-window bg-canvas p-3 shadow-hairline sm:p-6">
          <div className="w-full">{children}</div>
        </div>
      )}
      {doc && showDoc && <DocPanel doc={doc} />}
    </section>
  );
}

/** Ejemplo copiable (CodeBlock oficial) + tabla de props. */
function DocPanel({ doc }: { doc: Doc }) {
  return (
    <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]" style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
      <CodeBlock filename={doc.file ?? "Ejemplo.tsx"} code={doc.code} lines={doc.code.split("\n")} />
      {doc.props && (
        <Card className="overflow-hidden">
          <div className="primitive-card-bar border-b border-line text-overline text-ink-3 uppercase">Props</div>
          <dl className="divide-y divide-line">
            {doc.props.map((p) => (
              <div key={p.name} className="flex flex-col gap-0.5 px-3.5 py-2">
                <dt className="flex flex-wrap items-baseline gap-x-2 font-mono text-micro">
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="text-accent-ink">{p.type}</span>
                  {p.def && <span className="text-ink-3">= {p.def}</span>}
                </dt>
                {p.desc && <dd className="text-meta text-ink-2">{p.desc}</dd>}
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}

export function Group({ id, title }: { id: string; title: string }) {
  return (
    <div id={id} className="scroll-mt-4 border-b border-dashed border-line px-5 pt-10 pb-2 sm:px-8">
      <h2 className="text-[10.5px] font-medium tracking-[0.06em] text-ink-3 uppercase">{title}</h2>
    </div>
  );
}

