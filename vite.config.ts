import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "src/index.ts"
      },
      output: {
        entryFileNames: "service_worker.js"
      }
    }
  }
});
