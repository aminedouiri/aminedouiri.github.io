import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { open: true },
  build: {
    rollupOptions: {
      output: {
        // Split big third-party libraries into their own cached chunks.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/")) return "three";
          if (id.includes("/animejs/")) return "anime";
          if (id.includes("/react") || id.includes("/scheduler/")) return "react";
          return "vendor";
        },
      },
    },
    // three.js (~600 kB minified) is imported as a whole namespace and can't be
    // split further, so allow its single vendor chunk without a warning.
    chunkSizeWarningLimit: 700,
  },
});
