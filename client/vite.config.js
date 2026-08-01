import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@react-three/drei")) {
            return "three-drei";
          }

          if (id.includes("node_modules/@react-three/fiber")) {
            return "three-fiber";
          }

          if (
            id.includes("node_modules/three-stdlib") ||
            id.includes("node_modules/troika-three-text") ||
            id.includes("node_modules/meshline") ||
            id.includes("node_modules/maath")
          ) {
            return "three-extras";
          }

          if (id.includes("node_modules/three/")) {
            return "three-core";
          }

          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
