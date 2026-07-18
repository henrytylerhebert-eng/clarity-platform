import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Honor a harness-assigned port (e.g. Claude Code preview) instead of auto-incrementing.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      // Local API vertical slice (packages/api-service): npm run api:dev
      "/api": `http://127.0.0.1:${process.env.API_PORT ?? 4315}`,
    },
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
