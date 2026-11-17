import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  /* GitHub Pages sirve el sitio en /<repo>/; en local, en la raíz. */
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      /* Central Icons es un pack de pago (requiere CENTRAL_LICENSE_KEY). Si tienes
       * licencia, instálalo y borra este alias; mientras tanto SidebarNav usa
       * equivalentes locales con la misma API. */
      {
        find: /^@central-icons-react\/round-outlined-radius-2-stroke-2\/.*$/,
        replacement: `${src}/vendor/central-icons.tsx`,
      },
      { find: "@", replacement: src },
    ],
  },
});
