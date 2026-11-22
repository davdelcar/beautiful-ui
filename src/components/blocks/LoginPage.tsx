"use client";

import { useState } from "react";
import { z } from "zod";
import { Form, FormError, FormField, FormSubmit, useZodForm } from "@/components/form";
import { Button, Checkbox, Input, Separator, ThemeToggle } from "@/components/ui";

/* Plantilla: inicio de sesión y registro en una card centrada.
 * Sustituye `onSubmit` por tu llamada de auth; lanza un Error para mostrarlo arriba. */

const login = z.object({
  email: z.email("Introduce un email válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  remember: z.boolean(),
});
const register = login.extend({
  name: z.string().min(2, "¿Cómo te llamas?"),
});
/* login acepta `name` vacío para compartir valores con registro */
const loginWithName = login.extend({ name: z.string().optional() });
type Values = z.infer<typeof register>;

type Props = {
  brand?: string;
  defaultMode?: "login" | "register";
  onSubmit?: (values: Partial<Values>, mode: "login" | "register") => Promise<void>;
  onSocial?: (provider: "google" | "github") => void;
};

export default function LoginPage(props: Props) {
  const [mode, setMode] = useState(props.defaultMode ?? "login");
  // el resolver de zod se fija al montar: remontamos al cambiar de modo
  return <AuthCard key={mode} {...props} mode={mode} setMode={setMode} />;
}

function AuthCard({
  brand = "Acme",
  mode,
  setMode,
  onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 900));
  },
  onSocial,
}: Props & { mode: "login" | "register"; setMode: (m: "login" | "register") => void }) {
  const [done, setDone] = useState(false);
  const form = useZodForm((mode === "login" ? loginWithName : register) as typeof register, {
    defaultValues: { email: "", password: "", remember: true, name: "" },
  });
  const isLogin = mode === "login";

  const submit = async (v: Partial<Values>) => {
    try {
      await onSubmit(v, mode);
      setDone(true);
    } catch (e) {
      form.setError("root", { message: e instanceof Error ? e.message : "No se pudo continuar" });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      {/* en el flujo: en pantallas bajas el botón no puede caer encima de la card */}
      <div className="flex justify-end p-3">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-14">
      <div className="flex w-full max-w-[380px] flex-col gap-6" style={{ animation: "fade-up 500ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-[11px] bg-ink text-heading text-canvas shadow-raised">{brand[0]}</span>
          <div>
            <h1 className="text-title text-ink">{isLogin ? `Entra en ${brand}` : "Crea tu cuenta"}</h1>
            <p className="mt-1 text-body text-ink-3">{isLogin ? "Bienvenido de nuevo." : "Empieza gratis, sin tarjeta."}</p>
          </div>
        </div>

        <div className="rounded-window bg-surface p-5 shadow-card">
          {done ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center" style={{ animation: "fade-in 200ms ease-out both" }}>
              <span className="text-heading text-ink">{isLogin ? "¡Hola de nuevo!" : "Cuenta creada"}</span>
              <span className="text-body text-ink-3">Redirigiendo…</span>
              <Button size="sm" variant="quiet" onClick={() => setDone(false)}>
                Volver
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" type="button" onClick={() => onSocial?.("google")}>
                  <GoogleMark /> Google
                </Button>
                <Button size="sm" type="button" onClick={() => onSocial?.("github")}>
                  <GithubMark /> GitHub
                </Button>
              </div>
              <Separator label="o con tu email" className="my-4" />
              <Form form={form} onSubmit={submit}>
                <FormError />
                {!isLogin && (
                  <FormField<Values> name="name" label="Nombre">
                    {(f) => <Input {...f.input} autoComplete="name" placeholder="Ana López" />}
                  </FormField>
                )}
                <FormField<Values> name="email" label="Email">
                  {(f) => <Input {...f.input} type="email" autoComplete="email" placeholder="ana@empresa.com" />}
                </FormField>
                <FormField<Values> name="password" label="Contraseña" hint={isLogin ? undefined : "Mínimo 8 caracteres."}>
                  {(f) => <Input {...f.input} type="password" autoComplete={isLogin ? "current-password" : "new-password"} />}
                </FormField>
                {isLogin && (
                  <div className="flex items-center justify-between">
                    <FormField<Values> name="remember">
                      {(f) => <Checkbox checked={!!f.value} onChange={f.onChange} label="Recordarme" />}
                    </FormField>
                    <a href="#" className="text-meta text-accent-ink hover:underline">
                      ¿Olvidaste la contraseña?
                    </a>
                  </div>
                )}
                <FormSubmit size="md" className="w-full">
                  {isLogin ? "Entrar" : "Crear cuenta"}
                </FormSubmit>
              </Form>
            </>
          )}
        </div>

        <p className="text-center text-body text-ink-3">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            className="font-medium text-accent-ink hover:underline"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
            }}
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2.1H12v4h6c-.1 1-.8 2.5-2.3 3.5l3.6 2.8c2.1-2 3.3-4.9 3.3-8.2z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5l-3.7 2.9C3.9 20.6 7.6 23 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.1 7C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.9z" />
      <path fill="#EA4335" d="M12 5.4c1.7 0 2.9.7 3.5 1.3l2.7-2.6C16.5 2.6 14.4 1.7 12 1.7 7.6 1.7 3.9 4.2 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
function GithubMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.5a10.5 10.5 0 0 0-3.3 20.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.2 3.1.9.1-.7.4-1.2.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.3 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5z" />
    </svg>
  );
}
