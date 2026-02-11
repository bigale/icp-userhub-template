import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  envPrefix: ["CANISTER_", "DFX_", "DEV_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
});
