import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import ChatRecipe from "@/components/blocks/ChatRecipe";
import ListDetailPage, { type Order } from "@/components/blocks/ListDetailPage";

it("el listado representa carga, error recuperable y vacío con datos de la app", async () => {
  const onRetry = vi.fn();
  const { rerender } = render(<ListDetailPage orders={[]} loading />);
  expect(screen.getByRole("status")).toHaveTextContent("Cargando pedidos");
  expect(screen.queryByRole("table")).toBeNull();

  rerender(<ListDetailPage orders={[]} error="Tiempo de espera agotado" onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Tiempo de espera agotado");
  await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(onRetry).toHaveBeenCalledOnce();

  rerender(<ListDetailPage orders={[]} />);
  expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Nuevo pedido" })).toBeNull();
});

it("ordena antes de paginar y entrega las acciones al producto", async () => {
  const orders: Order[] = Array.from({ length: 12 }, (_, i) => ({
    id: `#${i + 1}`,
    customer: `Cliente ${i + 1}`,
    email: "ventas@example.test",
    status: "todo",
    total: 12 - i,
    items: 1,
    date: new Date(2025, 0, 1),
    tags: [],
  }));
  const onCreate = vi.fn();
  const onOrderAction = vi.fn();
  render(<ListDetailPage orders={orders} onCreate={onCreate} onOrderAction={onOrderAction} />);

  await userEvent.click(screen.getByRole("button", { name: "Nuevo pedido" }));
  expect(onCreate).toHaveBeenCalledOnce();
  expect(screen.queryByRole("row", { name: /#12/ })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Total" }));
  const row = screen.getAllByRole("row")[1];
  expect(row).toHaveTextContent("#12");
  row.focus();
  await userEvent.keyboard("{Enter}");

  const detail = screen.getByRole("dialog", { name: "Pedido #12" });
  expect(detail).not.toHaveTextContent("Pago confirmado");
  await userEvent.click(within(detail).getByRole("button", { name: "Enviar factura" }));
  expect(onOrderAction).toHaveBeenCalledWith("invoice", [orders[11]]);
});

it("el chat delega el envío y el reintento y conserva el borrador mientras espera", async () => {
  const onSend = vi.fn();
  const onRetry = vi.fn();
  const { rerender } = render(<ChatRecipe messages={[]} onSend={onSend} />);
  expect(screen.getByText("Inicia una conversación")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Choose model" })).toBeNull();
  const prompt = screen.getByRole("textbox", { name: "Prompt" });
  await userEvent.type(prompt, "  Hola @equipo{enter}");
  expect(onSend).toHaveBeenCalledWith("Hola @equipo");

  const messages = [{ id: "1", role: "user" as const, text: "Hola @equipo" }];
  rerender(<ChatRecipe messages={messages} pending onSend={onSend} />);
  expect(screen.getByRole("status")).toHaveTextContent("Esperando respuesta");
  await userEvent.type(prompt, "Siguiente mensaje{enter}");
  expect(onSend).toHaveBeenCalledOnce();
  expect(prompt).toHaveValue("Siguiente mensaje");

  rerender(<ChatRecipe messages={messages} error="Servicio no disponible" onSend={onSend} onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Servicio no disponible");
  await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(onRetry).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(onSend).toHaveBeenLastCalledWith("Siguiente mensaje");

  rerender(
    <ChatRecipe
      messages={[...messages, { id: "2", role: "assistant", text: "Ya tengo la respuesta" }]}
      onSend={onSend}
    />,
  );
  expect(screen.getByRole("list", { name: "Mensajes" })).toHaveTextContent("Ya tengo la respuesta");
  expect(screen.queryByRole("button", { name: "Action" })).toBeNull();
});
