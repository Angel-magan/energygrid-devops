import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Permite conexiones externas (crucial para Docker)
    port: 5173,
    watch: {
      usePolling: true, // Asegura que los cambios de código se vean reflejados en tiempo real
    },
  },
});
