import { defineConfig } from "vite"
// import react from "@vitejs/plugin-react";
import preact from "@preact/preset-vite"
import tsconfigPaths from "vite-tsconfig-paths"
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), preact()],
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    // minify: false,
  },
})
