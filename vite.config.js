import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/xrevia_lms_vue/static/xrevia/",
  plugins: [vue()],
});
