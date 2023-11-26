import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This is required, because the eslint plugin is a bit wrong :)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    eslint({
      exclude: [/virtual:/, /node_modules/],
    }),
  ],
  server: {
    open: true,
    proxy: {
      "/api": `http://${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}`,
    },
  },
});
