import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Потрібен для React проєктів

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // Має бути масив плагінів
  server: {
    proxy: {
      "/api": {
        target: "https://api.space-coworking.pp.ua",
        changeOrigin: true,
        secure: true, // Використовувати secure для HTTPS
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  // Тут можуть бути інші налаштування...
});
