"use client";

import type { ReactNode } from "react";
import { Button, IconArrowRight, IconSearch, Input } from "@/components/ui";

/* Plantilla: páginas de error y estados de sistema. */

const VARIANTS = {
  404: { title: "No encontramos esta página", text: "Puede que el enlace esté roto o que la página se haya movido." },
  403: { title: "No tienes acceso", text: "Pide acceso a un administrador de este espacio." },
  500: { title: "Algo ha fallado", text: "Ya estamos en ello. Prueba de nuevo en unos minutos." },
  mantenimiento: { title: "Volvemos enseguida", text: "Estamos mejorando el servicio. No se ha perdido ningún dato." },
} as const;

export default function ErrorPage({
  code = 404,
  title,
  text,
  actions,
}: {
  code?: keyof typeof VARIANTS;
  title?: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
}) {
  const v = VARIANTS[code];
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-4 py-16">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-5 text-center" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <span className="font-mono text-[64px] leading-none font-medium tracking-[-0.04em] text-ink-3 select-none" aria-hidden>
          {typeof code === "number" ? code : "· · ·"}
        </span>
        <div>
          <h1 className="text-title text-ink">{title ?? v.title}</h1>
          <p className="mt-2 text-lead text-ink-2">{text ?? v.text}</p>
        </div>
        {code === 404 && (
          <form className="w-full max-w-80" onSubmit={(e) => e.preventDefault()} role="search">
            <Input leading={<IconSearch size={14} />} placeholder="Buscar en la app…" aria-label="Buscar" />
          </form>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {actions ?? (
            <>
              <Button size="sm" onClick={() => history.back()}>
                Volver
              </Button>
              <a href="#/">
                <Button size="sm" variant="primary">
                  Ir al inicio <IconArrowRight size={13} />
                </Button>
              </a>
            </>
          )}
        </div>
        {code === 500 && <p className="font-mono text-micro text-ink-3">ID de incidencia: 7f3a-91c2</p>}
      </div>
    </div>
  );
}
