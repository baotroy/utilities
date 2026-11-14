# syntax=docker/dockerfile:1

# Base: Node 26 LTS on Alpine (musl) - used only for install & build
FROM node:26-alpine3.24 AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Stage 1: Install dependencies (build tools for native addons stay in this stage only)
FROM base AS deps
RUN apk add --no-cache g++ make python3
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Stage 2: Build the application (output: "standalone" in next.config.js)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Minimal runtime - bare Alpine + node binary only (no npm/npx/yarn/corepack)
# libatomic: the node binary copied from the node image links against libatomic.so.1
FROM alpine:3.24 AS runner
RUN apk add --no-cache libstdc++ libatomic && \
    addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs
COPY --from=base /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
