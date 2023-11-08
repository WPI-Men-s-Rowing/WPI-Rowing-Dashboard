import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  // This is required, because the eslint plugin is a bit wrong :)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  plugins: [react(), eslint()],
  server: {
    open: true,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
