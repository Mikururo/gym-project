FROM node:18-alpine AS builder

WORKDIR /app/services/auth-service

COPY services/auth-service/package*.json ./
RUN npm install

WORKDIR /app
COPY shared ./shared
COPY services/auth-service ./services/auth-service

WORKDIR /app/services/auth-service
RUN npm run build && npm prune --omit=dev

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/node_modules ./services/auth-service/node_modules

WORKDIR /app/services/auth-service
ENV NODE_ENV=production

CMD ["node", "dist/services/auth-service/src/index.js"]
