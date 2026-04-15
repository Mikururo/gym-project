# ═══════════════════════════════════════════════════════════
# Stage 1: Сборка React приложения
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей отдельно для кэширования слоёв
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем production-сборку
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2: Nginx для раздачи статики
# ═══════════════════════════════════════════════════════════
FROM nginx:1.25-alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx в foreground-режиме
CMD ["nginx", "-g", "daemon off;"]
