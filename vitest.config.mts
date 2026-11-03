import path from "node:path";
import { defineConfig } from "vitest/config";

// Component tests only (*.test.tsx in jsdom). Pure *.test.ts files keep running under node --test.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
