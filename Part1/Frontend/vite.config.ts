import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  css: {
    devSourcemap: true,
  },
  server: {
    hmr: {
      protocol: "ws",
    },
  },
  base: env.mode === "production" ? "/dist/" : "/",
  build: {
    outDir: path.resolve("..", "wwwroot", "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, "src", "main.ts"),
    },
  },
}));
