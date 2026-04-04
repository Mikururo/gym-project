FROM node:18-alpine AS builder

WORKDIR /app/services/gym-service

COPY services/gym-service/package*.json ./
RUN npm install

WORKDIR /app
COPY shared ./shared
COPY services/gym-service ./services/gym-service

WORKDIR /app/services/gym-service
RUN npm run build && npm prune --omit=dev

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/gym-service/dist ./services/gym-service/dist
COPY --from=builder /app/services/gym-service/node_modules ./services/gym-service/node_modules

WORKDIR /app/services/gym-service
ENV NODE_ENV=production

CMD ["node", "dist/services/gym-service/src/index.js"]
