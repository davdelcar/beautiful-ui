import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { Form, FormField, FormSubmit, useZodForm } from "@/components/form";
import { Calendar, Combobox, DataTable, Input, MultiSelect, NumberInput, Select, Stepper, UIProvider, type Column } from "@/components/ui";

const COUNTRIES = [
  { value: "es", label: "España" },
  { value: "pe", label: "Perú" },
  { value: "mx", label: "México" },
];

describe("Combobox", () => {
  it("filtra sin tildes y elige con el teclado", async () => {
    const onChange = vi.fn();
    render(<Combobox value={null} onChange={onChange} options={COUNTRIES} placeholder="País" />);
    await userEvent.click(screen.getByRole("button", { name: /país/i }));
    await userEvent.keyboard("peru");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Perú");
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("pe");
  });

  it("↓ mueve la opción activa (aria-activedescendant)", async () => {
    render(<Combobox value={null} onChange={() => {}} options={COUNTRIES} />);
    await userEvent.click(screen.getByRole("button"));
    const input = screen.getByRole("combobox");
    const first = input.getAttribute("aria-activedescendant");
    await userEvent.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).not.toBe(first);
  });
});

describe("MultiSelect", () => {
  function Harness() {
    const [v, setV] = useState<string[]>(["es"]);
    return <MultiSelect value={v} onChange={setV} options={COUNTRIES} />;
  }
  it("añade con Enter y quita el último con Retroceso", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { expanded: false, name: /selecc|españa/i }));
    await userEvent.keyboard("mex{Enter}");
    expect(screen.getByRole("option", { name: /méxico/i })).toHaveAttribute("aria-selected", "true");
    await userEvent.clear(screen.getByRole("combobox"));
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByRole("option", { name: /méxico/i })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("option", { name: /españa/i })).toHaveAttribute("aria-selected", "true");
  });
});

describe("NumberInput", () => {
  function Harness({ onValue }: { onValue: (v: number | null) => void }) {
    const [v, setV] = useState<number | null>(5);
    return <NumberInput aria-label="n" value={v} onChange={(x) => (setV(x), onValue(x))} min={0} max={20} />;
  }
  it("↑ suma, Mayús+↑ suma 10 y respeta el máximo", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await userEvent.click(screen.getByLabelText("n"));
    await userEvent.keyboard("{ArrowUp}");
    expect(onValue).toHaveBeenLastCalledWith(6);
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onValue).toHaveBeenLastCalledWith(16);
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(onValue).toHaveBeenLastCalledWith(20);
  });
  it("al salir limita lo escrito", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    const input = screen.getByLabelText("n");
    await userEvent.clear(input);
    await userEvent.type(input, "99");
    await userEvent.tab();
    expect(onValue).toHaveBeenLastCalledWith(20);
  });
});

describe("Calendar", () => {
  it("usa el locale (lunes primero en es) y elige un día", async () => {
    const onChange = vi.fn();
    render(<Calendar value={new Date(2026, 10, 19)} onChange={onChange} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveAttribute("aria-label", "lunes");
    await userEvent.click(screen.getByRole("button", { name: /20 de noviembre de 2026/i }));
    expect(onChange.mock.calls[0][0].getDate()).toBe(20);
  });
  it("las flechas mueven el foco por días", async () => {
    render(<Calendar value={new Date(2026, 10, 19)} onChange={() => {}} />);
    screen.getByRole("button", { name: /19 de noviembre/i }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /20 de noviembre/i })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /27 de noviembre/i })).toHaveFocus();
  });
});

describe("DataTable", () => {
  type R = { id: string; name: string; n: number };
  const rows: R[] = [
    { id: "1", name: "Beta", n: 2 },
    { id: "2", name: "Alfa", n: 10 },
    { id: "3", name: "Gamma", n: 1 },
  ];
  const cols: Column<R>[] = [
    { key: "name", header: "Nombre", render: (r) => r.name, sortValue: (r) => r.name },
    { key: "n", header: "Número", render: (r) => r.n, sortValue: (r) => r.n },
  ];
  it("ordena al pulsar la cabecera (asc → desc → original)", async () => {
    render(<DataTable columns={cols} rows={rows} rowKey={(r) => r.id} />);
    const names = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);
    await userEvent.click(screen.getByRole("button", { name: /número/i }));
    expect(names()).toEqual(["Gamma", "Beta", "Alfa"]);
    await userEvent.click(screen.getByRole("button", { name: /número/i }));
    expect(names()).toEqual(["Alfa", "Beta", "Gamma"]);
    await userEvent.click(screen.getByRole("button", { name: /número/i }));
    expect(names()).toEqual(["Beta", "Alfa", "Gamma"]);
  });
});

describe("Stepper", () => {
  it("marca el paso actual", () => {
    render(<Stepper current={1} steps={[{ label: "Uno" }, { label: "Dos" }, { label: "Tres" }]} />);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute("aria-current", "step");
  });
});

describe("UIProvider", () => {
  it("traduce los textos del kit", () => {
    render(
      <UIProvider locale="en-US">
        <Select value={null} onChange={() => {}} options={[]} />
      </UIProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Select");
  });
});

describe("Form + zod", () => {
  const schema = z.object({ email: z.email("Email no válido") });
  function Harness({ onSubmit }: { onSubmit: (v: { email: string }) => void }) {
    const form = useZodForm(schema, { defaultValues: { email: "" } });
    return (
      <Form form={form} onSubmit={onSubmit}>
        <FormField name="email" label="Email">
          {(f) => <Input {...f.input} />}
        </FormField>
        <FormSubmit>Enviar</FormSubmit>
      </Form>
    );
  }
  it("muestra el error de zod y no envía", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Email"), "nope");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email no válido");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("envía con datos válidos", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@acme.com");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ email: "ana@acme.com" });
  });
});
