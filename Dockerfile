# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Build tools are required to compile bcrypt's native addon if no prebuilt
# binary is available for the platform.
RUN apk add --no-cache python3 make g++
RUN corepack enable

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---- Production stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++
RUN corepack enable

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 3004
CMD ["node", "dist/main.js"]
