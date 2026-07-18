import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Honor a harness-assigned port (e.g. Claude Code preview) instead of auto-incrementing.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    globals: true,
    setupFiles: "./src/test/setup.ts",
    exclude: ["node_modules", "dist", "smoke"],
  },
});
