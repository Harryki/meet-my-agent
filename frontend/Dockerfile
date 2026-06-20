FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 3000

FROM base AS dev
CMD ["npm", "run", "dev"]

FROM base AS builder
ARG API_URL
ENV API_URL=$API_URL
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
