# Multi-stage build for Next.js app with sharp support
FROM node:20-bookworm AS base

WORKDIR /app

# Install OS deps for sharp/libvips (with HEIF support where available)
# Note: Debian bookworm ships libwebp7/libtiff6
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      python3 \
      make \
      g++ \
      libvips-dev \
      libheif1 \
      libjpeg62-turbo \
      libpng16-16 \
      libwebp7 \
      libtiff6 \
      curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set npm configuration for better performance
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 300000

# Build stage
FROM base AS build

# Copy package files for dependency installation
COPY package.json package-lock.json .npmrc ./

# Install dependencies with retry logic and caching
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=optional

# Reinstall sharp for the correct platform
RUN npm install --platform=linux --arch=x64 sharp

# Prisma needs schema at build for client generation
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.cache \
    npx prisma generate

# Copy source code (use .dockerignore to exclude unnecessary files)
COPY . .

# Build Next.js with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production --silent

# Runner image - use Debian-based Node for production
FROM node:20-bookworm-slim AS runner

# Install necessary runtime dependencies for sharp & Prisma
RUN apt-get update && \
        apt-get install -y --no-install-recommends \
            ca-certificates \
            curl \
            libvips \
            libssl3 \
            openssl \
        && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
        adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy production build artifacts and dependencies
COPY --from=build --chown=nextjs:nodejs /app/package.json ./
COPY --from=build --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=build --chown=nextjs:nodejs /app/.next ./
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]

