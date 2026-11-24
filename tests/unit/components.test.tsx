import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { Form, FormField, FormSubmit, useZodForm } from "@/components/form";
import PromptBar from "@/components/primitives/PromptBar";
import SearchList from "@/components/primitives/SearchList";
import {
  Calendar,
  Checkbox,
  Combobox,
  DataTable,
  Input,
  Meter,
  MultiSelect,
  NumberInput,
  OtpInput,
  PasswordInput,
  Progress,
  RadioGroup,
  Select,
  Slider,
  Field,
  Stepper,
  Switch,
  Timeline,
  UIProvider,
  type Column,
} from "@/components/ui";

const COUNTRIES = [
  { value: "es", label: "España" },
  { value: "pe", label: "Perú" },
  { value: "mx", label: "México" },
];

it("PromptBar espera a que la composición de texto termine antes de enviar", () => {
  const send = vi.fn();
  render(<PromptBar demo={false} textOnly onSend={send} />);
  const input = screen.getByRole("textbox", { name: "Prompt" });
  fireEvent.change(input, { target: { value: "Consulta" } });
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  expect(send).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(send).toHaveBeenCalledOnce();
  expect(send).toHaveBeenCalledWith("Consulta");
});

it("SearchList devuelve el foco al campo al borrar por teclado", async () => {
  render(<SearchList />);
  const search = screen.getByRole("textbox");
  await userEvent.type(search, "seasonal");
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Clear search" })).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  expect(search).toHaveValue("");
  expect(search).toHaveFocus();
});

it("Progress comunica el mismo valor limitado que dibuja", () => {
  render(<Progress label="Importación" value={125} />);
  const progress = screen.getByRole("progressbar", { name: "Importación" });
  expect(progress).toHaveAttribute("aria-valuenow", "100");
  expect(progress.firstElementChild).toHaveStyle({ width: "100%" });
});

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

describe("NumberInput (idioma)", () => {
  it("interpreta 1.234,5 en español", async () => {
    const onValue = vi.fn();
    function H() {
      const [v, setV] = useState<number | null>(null);
      return <NumberInput aria-label="n" value={v} onChange={(x) => (setV(x), onValue(x))} step={0.1} />;
    }
    render(<UIProvider locale="es-ES"><H /></UIProvider>);
    const input = screen.getByRole("spinbutton", { name: "n" });
    await userEvent.type(input, "1.234,5");
    await userEvent.tab();
    expect(onValue).toHaveBeenLastCalledWith(1234.5);
  });
});

describe("Slider", () => {
  it("se enlaza con la etiqueta de Field y responde al teclado", async () => {
    const onValue = vi.fn();
    function H() {
      const [v, setV] = useState(40);
      return <Field label="Volumen">{(id) => <Slider id={id} value={v} onChange={(x) => (setV(x), onValue(x))} />}</Field>;
    }
    render(<H />);
    const slider = screen.getByRole("slider", { name: "Volumen" });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValue).toHaveBeenLastCalledWith(41);
    await userEvent.keyboard("{PageUp}");
    expect(onValue).toHaveBeenLastCalledWith(51);
  });
  it("con [desde, hasta] pinta dos tiradores con nombre", async () => {
    const onValue = vi.fn();
    function H() {
      const [v, setV] = useState<[number, number]>([20, 80]);
      return <Slider aria-label="Precio" value={v} onChange={(x) => (setV(x), onValue(x))} />;
    }
    render(<H />);
    const [from, to] = screen.getAllByRole("slider");
    expect(from).toHaveAccessibleName("Precio: Mínimo");
    expect(to).toHaveAccessibleName("Precio: Máximo");
    to.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onValue).toHaveBeenLastCalledWith([20, 79]);
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
  it("mantiene el foco en días habilitados al alcanzar los límites", async () => {
    const first = new Date(2026, 10, 19);
    const last = new Date(2026, 10, 21);
    render(<Calendar value={first} min={first} max={last} onChange={() => {}} />);
    const firstDay = screen.getByRole("button", { name: /19 de noviembre/i });
    firstDay.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(firstDay).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    expect(screen.getByRole("button", { name: /21 de noviembre/i })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Mes siguiente" })).toBeDisabled();
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

describe("Checkbox · RadioGroup · Switch (UI SDK)", () => {
  it("Checkbox alterna con clic en la etiqueta y expone mixed", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Checkbox checked={false} onChange={onChange} label="Avisos" />);
    await userEvent.click(screen.getByText("Avisos"));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Checkbox checked={false} indeterminate onChange={onChange} label="Avisos" />);
    expect(screen.getByRole("checkbox", { name: "Avisos" })).toHaveAttribute("aria-checked", "mixed");
  });

  it("RadioGroup: las flechas mueven y marcan, saltando las deshabilitadas", async () => {
    function T() {
      const [v, setV] = useState<"a" | "b" | "c">("a");
      return <RadioGroup aria-label="Plan" value={v} onChange={setV} options={[{ value: "a", label: "A" }, { value: "b", label: "B", disabled: true }, { value: "c", label: "C" }]} />;
    }
    render(<T />);
    screen.getByRole("radio", { name: "A" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "C" })).toHaveAttribute("aria-checked", "true");
  });

  it("Switch tiene rol switch y responde a Espacio", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Modo agente" />);
    screen.getByRole("switch", { name: "Modo agente" }).focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("PasswordInput · OtpInput", () => {
  it("PasswordInput muestra y oculta sin perder el valor", async () => {
    function T() {
      const [v, setV] = useState("");
      return <PasswordInput aria-label="Clave" value={v} onChange={setV} />;
    }
    render(<T />);
    const input = screen.getByLabelText("Clave");
    await userEvent.type(input, "s3creto");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("s3creto");
  });

  it("OtpInput filtra por patrón y avisa al completar", async () => {
    const done = vi.fn();
    function T() {
      const [v, setV] = useState("");
      return <OtpInput value={v} onChange={setV} onComplete={done} length={4} />;
    }
    render(<T />);
    const input = screen.getByLabelText("Código de verificación");
    await userEvent.type(input, "1a2b34");
    expect(input).toHaveValue("1234");
    expect(done).toHaveBeenCalledWith("1234");
  });
});

describe("Meter · Timeline", () => {
  it("Meter expone rol meter con el valor formateado", () => {
    render(<Meter label="Almacenamiento" value={7.5} max={10} format={(v) => `${v} de 10 GB`} />);
    const m = screen.getByRole("meter", { name: "Almacenamiento" });
    expect(m).toHaveAttribute("aria-valuenow", "7.5");
    expect(m).toHaveAttribute("aria-valuetext", "7.5 de 10 GB");
  });

  it("Timeline marca el evento en curso", () => {
    render(<Timeline items={[{ title: "Hecho", status: "complete" }, { title: "Ahora", status: "current" }, { title: "Luego", status: "upcoming" }]} />);
    expect(screen.getByText("Ahora").closest("[aria-current]")).toHaveAttribute("aria-current", "step");
  });
});

describe("UIProvider", () => {
  it("traduce los textos del kit", () => {
    render(
      <UIProvider locale="en-US">
        <Select value={null} onChange={() => {}} options={[]} />
      </UIProvider>,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Select");
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
