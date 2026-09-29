import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { personaApiPlugin } from "./server/vitePersonaPlugin.js";

export default defineConfig({
  plugins: [react(), personaApiPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
  },
});
