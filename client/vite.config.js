import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  server: {
    port: 5173
  },
  // Pre-bundle MUI icons with the dev optimizer so lazy-loaded admin chunks don’t hit 504 “Outdated Optimize Dep”.
  optimizeDeps: {
    include: ["@mui/material", "@mui/icons-material"]
  }
});
