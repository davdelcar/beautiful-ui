import { useState, type ReactNode } from "react";
import { z } from "zod";
import { Form, FormField, FormSubmit, useZodForm } from "@/components/form";
import {
  ACCENTS,
  Avatar,
  Button,
  Card,
  Dialog,
  Dropzone,
  Input,
  Segmented,
  Select,
  Switch,
  Textarea,
  setAccent,
  useTheme,
  useToast,
  type Accent,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/* Plantilla: ajustes con subnavegación (lateral en escritorio, select en móvil)
 * y secciones en cards. Cada sección guarda por separado. */

const SECTIONS = [
  { id: "perfil", label: "Perfil" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "apariencia", label: "Apariencia" },
  { id: "peligro", label: "Zona de peligro" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const profile = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.email("Email no válido"),
  role: z.string().min(1, "Elige un rol"),
  bio: z.string().max(160, "Máximo 160 caracteres"),
});
type Profile = z.infer<typeof profile>;

const ACCENT_SWATCH: Record<Accent, string> = {
  blue: "oklch(0.56 0.2 256)",
  violet: "oklch(0.53 0.22 292)",
  green: "oklch(0.5 0.13 155)",
  orange: "oklch(0.55 0.17 42)",
  pink: "oklch(0.54 0.2 0)",
};

function Section({ id, title, description, children, footer }: { id: string; title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card>
        <div className="grid gap-4 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
          <div>
            <h2 className="text-heading text-ink">{title}</h2>
            <p className="mt-1 text-meta text-ink-3">{description}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-4">{children}</div>
        </div>
        {footer && <div className="primitive-card-footer flex items-center justify-end gap-2 border-t border-line bg-inset">{footer}</div>}
      </Card>
    </section>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const theme = useTheme();
  const [active, setActive] = useState<SectionId>("perfil");
  const [avatar, setAvatar] = useState<File[]>([]);
  const [notif, setNotif] = useState({ email: true, push: false, digest: true, mentions: true });
  const [accent, setAccentState] = useState<Accent>(() => (document.documentElement.dataset.accent as Accent) ?? "blue");
  const [density, setDensity] = useState<"comfy" | "compact">("comfy");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const form = useZodForm(profile, { defaultValues: { name: "Ana López", email: "ana@acme.com", role: "admin", bio: "" } });
  const bio = form.watch("bio") ?? "";

  const go = (id: SectionId) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-20 border-b border-line bg-page/85 backdrop-blur">
        <div className="mx-auto flex h-13 max-w-[1040px] items-center gap-3 px-4 sm:px-6">
          <h1 className="text-heading text-ink">Ajustes</h1>
          <Select aria-label="Sección" className="ml-auto w-48 md:hidden" value={active} onChange={go} options={SECTIONS.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
      </header>
      <div className="mx-auto grid max-w-[1040px] gap-6 px-4 py-6 sm:px-6 md:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Secciones de ajustes" className="sticky top-20 hidden self-start md:block">
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={active === s.id ? "true" : undefined}
                  onClick={() => go(s.id)}
                  className={cn(
                    "w-full rounded-control px-2.5 py-1.5 text-left text-body transition-colors",
                    active === s.id ? "bg-hover-2 font-medium text-ink" : "text-ink-2 hover:bg-hover hover:text-ink",
                    s.id === "peligro" && "text-red hover:text-red",
                  )}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <Form form={form} onSubmit={async (v: Profile) => (await new Promise((r) => setTimeout(r, 600)), toast(`Perfil de ${v.name} guardado`))}>
            <Section
              id="perfil"
              title="Perfil"
              description="Cómo te ven el resto de miembros."
              footer={
                <>
                  <Button type="button" size="sm" variant="quiet" onClick={() => form.reset()}>
                    Descartar
                  </Button>
                  <FormSubmit>Guardar cambios</FormSubmit>
                </>
              }
            >
              <div className="flex items-center gap-4">
                <Avatar name={form.watch("name") || "?"} color="#2f6fec" size="xl" />
                <Dropzone files={avatar} onFilesChange={setAvatar} accept="image/*" multiple={false} maxSize={2 * 1024 * 1024} hint="PNG o JPG, hasta 2 MB" className="flex-1" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField<Profile> name="name" label="Nombre" required>
                  {(f) => <Input {...f.input} autoComplete="name" />}
                </FormField>
                <FormField<Profile> name="email" label="Email" required>
                  {(f) => <Input {...f.input} type="email" autoComplete="email" />}
                </FormField>
                <FormField<Profile> name="role" label="Rol">
                  {(f) => (
                    <Select
                      id={f.id}
                      value={(f.value as string) || null}
                      onChange={f.onChange}
                      options={[
                        { value: "admin", label: "Administrador" },
                        { value: "editor", label: "Editor" },
                        { value: "viewer", label: "Lector" },
                      ]}
                    />
                  )}
                </FormField>
              </div>
              <FormField<Profile> name="bio" label="Bio" hint={`${bio.length}/160`}>
                {(f) => <Textarea {...f.input} placeholder="Cuéntanos algo de ti…" />}
              </FormField>
            </Section>
          </Form>

          <Section id="notificaciones" title="Notificaciones" description="Elige qué te avisa y por dónde.">
            {(
              [
                ["email", "Correo", "Resumen de actividad y aprobaciones pendientes."],
                ["push", "Push", "Avisos en tiempo real en el navegador."],
                ["digest", "Resumen diario", "Un email a las 8:00 con lo importante."],
                ["mentions", "Menciones", "Cuando alguien te menciona en un chat."],
              ] as const
            ).map(([k, label, desc]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-body font-medium text-ink">{label}</div>
                  <div className="text-meta text-ink-3">{desc}</div>
                </div>
                <Switch checked={notif[k]} onChange={(v) => (setNotif((n) => ({ ...n, [k]: v })), toast(`${label}: ${v ? "activado" : "desactivado"}`))} aria-label={label} />
              </div>
            ))}
          </Section>

          <Section id="apariencia" title="Apariencia" description="Se guarda en este navegador.">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-body text-ink">Tema</span>
              <Segmented
                value={theme.dark ? "dark" : "light"}
                onChange={(v) => theme.setTheme(v === "dark")}
                options={[
                  { value: "light", label: "Claro" },
                  { value: "dark", label: "Oscuro" },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-body text-ink">Color de acento</span>
              <div role="radiogroup" aria-label="Color de acento" className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={accent === a}
                    aria-label={a}
                    onClick={() => (setAccent(a), setAccentState(a))}
                    className={cn("size-6 rounded-full transition-[box-shadow,transform] duration-150 hover:scale-110", accent === a && "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--ink)]")}
                    style={{ background: ACCENT_SWATCH[a] }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-body text-ink">Densidad</span>
              <Segmented
                size="sm"
                value={density}
                onChange={setDensity}
                options={[
                  { value: "comfy", label: "Cómoda" },
                  { value: "compact", label: "Compacta" },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-body text-ink">Idioma</span>
              <Select
                aria-label="Idioma"
                className="w-40"
                value={lang}
                onChange={setLang}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>
          </Section>

          <Section id="peligro" title="Zona de peligro" description="Acciones que no se pueden deshacer.">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-control bg-red-tint px-3.5 py-3">
              <div>
                <div className="text-body font-medium text-ink">Eliminar cuenta</div>
                <div className="text-meta text-ink-2">Se borrarán tus datos y los de tus espacios.</div>
              </div>
              <Button size="sm" className="bg-red-solid text-white hover:brightness-110" onClick={() => setConfirm(true)}>
                Eliminar cuenta
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <Dialog
        open={confirm}
        onClose={() => (setConfirm(false), setConfirmText(""))}
        title="¿Eliminar tu cuenta?"
        description="Escribe ELIMINAR para confirmar. Esta acción no se puede deshacer."
        footer={
          <>
            <Button size="sm" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={confirmText !== "ELIMINAR"}
              className="bg-red-solid text-white hover:brightness-110"
              onClick={() => (setConfirm(false), setConfirmText(""), toast("Cuenta programada para eliminación"))}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <Input className="mt-2" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Confirmación" placeholder="ELIMINAR" />
      </Dialog>
    </div>
  );
}
