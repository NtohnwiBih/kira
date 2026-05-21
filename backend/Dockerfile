FROM node:22-alpine AS base
WORKDIR /app

# Development stage
FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate    
CMD ["npm", "run", "start:dev"]

# Builder stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN addgroup -S kira && adduser -S kira -G kira
USER kira
EXPOSE 4000
HEALTHCHECK CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/main"]