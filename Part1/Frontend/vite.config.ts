import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    devSourcemap: true,
  },
  server: {
    hmr: {
      protocol: "ws",
    },
  },
  build: {
    rollupOptions: {
      input: path.join(__dirname, "src", "main.ts"),
    },
  },
});
