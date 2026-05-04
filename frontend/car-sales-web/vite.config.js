import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy image requests to the backend static folder during local development.
      "/images": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyRes", (proxyRes, _req, _res) => {
            // Keep this hook available for debugging missing backend image files.
            if (proxyRes.statusCode === 404) {
              return;
            }
          });
        },
      },
    },
  },
});
