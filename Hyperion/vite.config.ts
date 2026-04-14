import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      onwarn(warning, warn) {
        // suppress warnings about unresolved imports that vite handles
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      },
    },
  },
});
