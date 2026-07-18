import { defineConfig } from "vite";

export default defineConfig((config) => {
  const isDev = config.mode === "development";
  return {
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          main: "src/index.ts",
          options: "options.html"
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === "main" ? "service_worker.js" : "options.js"
        }
      },
      minify: !isDev
    }
  };
});
