"use client";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import { Alert, Button, Card, CardBody, EmptyState, IconSparkle, SkeletonText } from "@/components/ui";

export type ChatRecipeMessage = { id: string; role: "user" | "assistant"; text: string };

type ChatRecipeProps = {
  messages: ChatRecipeMessage[];
  pending?: boolean;
  error?: string;
  onSend: (text: string) => void;
  onRetry?: () => void;
};

// La aplicación controla el historial y la petición. Usa un ID nuevo por mensaje.
export default function ChatRecipe({ messages, pending, error, onSend, onRetry }: ChatRecipeProps) {
  const latest = messages.at(-1);

  return (
    <Card>
      <CardBody className="flex min-w-0 flex-col gap-4">
        <h2 className="text-heading text-ink">Asistente</h2>

        {messages.length === 0 && !pending && !error && (
          <EmptyState icon={<IconSparkle />} title="Inicia una conversación" hint="Escribe un mensaje para empezar." />
        )}

        {messages.length > 0 && (
          <ol className="flex flex-col gap-3" aria-label="Mensajes">
            {messages.map((message) => (
              <li key={message.id} className="rounded-card bg-inset p-3">
                <div className="mb-1 text-meta font-medium text-ink-2">{message.role === "user" ? "Tú" : "Asistente"}</div>
                {message.role === "assistant" && message === latest ? (
                  <div>
                    <p className="sr-only">{message.text}</p>
                    <div aria-hidden="true">
                      <StreamingText
                        content={(message.text.match(/\S+/g) ?? []).map((text) => ({ text }))}
                        sources={[]}
                        followUps={[]}
                        loop={false}
                        showActions={false}
                        fill
                      />
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-body text-ink">{message.text}</p>
                )}
              </li>
            ))}
          </ol>
        )}

        {pending && (
          <div role="status" className="rounded-card bg-inset p-3">
            <span className="sr-only">Esperando respuesta</span>
            <SkeletonText lines={2} />
          </div>
        )}

        {error && (
          <Alert
            tone="danger"
            title="No se pudo completar la respuesta"
            action={onRetry && <Button type="button" size="xs" onClick={onRetry}>Reintentar</Button>}
          >
            {error}
          </Alert>
        )}

        <PromptBar demo={false} textOnly disabled={pending} placeholder="Escribe un mensaje" onSend={onSend} />
      </CardBody>
    </Card>
  );
}
