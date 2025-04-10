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
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Додаємо CORS заголовки до відповіді від сервера
            proxyRes.headers["Access-Control-Allow-Origin"] =
              "http://localhost:5173";
            proxyRes.headers["Access-Control-Allow-Methods"] =
              "GET, POST, PUT, DELETE, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] =
              "X-Requested-With, Content-Type, Authorization";
            proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
          });
        },
      },
    },
  },
});
