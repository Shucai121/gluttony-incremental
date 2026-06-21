/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative paths so the build works on GitHub Pages / itch.io
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
