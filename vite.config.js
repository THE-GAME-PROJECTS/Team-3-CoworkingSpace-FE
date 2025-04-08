import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://52.207.218.26:5001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Додаємо заголовки CORS для проксі
            proxyReq.setHeader(
              "Access-Control-Allow-Origin",
              "http://localhost:5173",
            );
            proxyReq.setHeader("Access-Control-Allow-Credentials", "true");
          });
        },
      },
    },
  },
});
