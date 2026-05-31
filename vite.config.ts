import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@firebase") || id.includes("node_modules/firebase")) {
            return "firebase";
          }

          if (id.includes("node_modules/react") || id.includes("node_modules/lucide-react")) {
            return "vendor";
          }
        }
      }
    }
  }
});
