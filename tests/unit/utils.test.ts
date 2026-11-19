import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() conoce los tokens del sistema", () => {
  it("no descarta el tamaño de texto al combinarlo con un color", () => {
    expect(cn("text-body text-ink")).toBe("text-body text-ink");
    expect(cn("text-meta", "text-ink-3")).toBe("text-meta text-ink-3");
  });
  it("resuelve conflictos dentro del mismo grupo", () => {
    expect(cn("text-body", "text-meta")).toBe("text-meta");
    expect(cn("rounded-card", "rounded-control")).toBe("rounded-control");
    expect(cn("shadow-card", "shadow-raised")).toBe("shadow-raised");
    expect(cn("text-ink", "text-ink-2")).toBe("text-ink-2");
  });
});
