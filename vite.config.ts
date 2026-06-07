import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import packageMetadata from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageMetadata.version),
  },
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
