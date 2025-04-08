# 1️⃣ Використовуємо офіційний Node.js для білду
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY ...
RUN npm run build

# 2️⃣ Використовуємо Nginx для продакшену
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

