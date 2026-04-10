import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Xrevia-LMS/" : "/",
  plugins: [vue()],
  build: {
    assetsDir: "assets",
    rollupOptions: {
      input: "pages.html",
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: ({ name }) => {
          if (name && name.endsWith(".css")) {
            return "assets/app.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
}));
