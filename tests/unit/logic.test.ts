import { describe, expect, it } from "vitest";
import { addDays, addMonths, niceTicks, pageRange, sameDay, startOfDay } from "@/components/ui";
import { matches, normalize, rank } from "@/components/ui/listbox";

describe("búsqueda sin tildes", () => {
  it("normaliza tildes y mayúsculas", () => {
    expect(normalize("Diseño PERÚ")).toBe("diseno peru");
  });
  it("matches busca en cualquiera de los textos", () => {
    expect(matches("peru", "Perú")).toBe(true);
    expect(matches("usa", "Estados Unidos", "usa")).toBe(true);
    expect(matches("xyz", "Perú")).toBe(false);
    expect(matches("  ", "lo que sea")).toBe(true);
  });
  it("rank prioriza el inicio de palabra", () => {
    expect(rank("tema", "Tema oscuro")).toBe(0);
    expect(rank("tema", "Sistema de diseño")).toBe(1);
  });
});

describe("pageRange", () => {
  it("muestra primera, última y vecinas con huecos", () => {
    expect(pageRange(1, 3)).toEqual([1, 2, 3]);
    expect(pageRange(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageRange(3, 10)).toEqual([1, 2, 3, 4, null, 10]);
  });
});

describe("niceTicks", () => {
  it("devuelve marcas redondas que cubren el rango", () => {
    const t = niceTicks(0, 7300);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(7300);
    expect(t.every((v) => v % 1000 === 0 || v % 500 === 0)).toBe(true);
  });
});

describe("fechas", () => {
  it("addMonths no se sale del mes (31 ene + 1 = 28/29 feb)", () => {
    const d = addMonths(new Date(2026, 0, 31), 1);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
  it("addDays y sameDay", () => {
    const d = startOfDay(new Date(2026, 10, 19));
    expect(sameDay(addDays(d, 1), new Date(2026, 10, 20, 15))).toBe(true);
  });
});
