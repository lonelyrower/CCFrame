# Multi-stage build for Next.js app with sharp support
FROM node:20-bookworm AS base

# Build arguments for memory/registry configuration
ARG MANUAL_MEMORY_MB
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG SHARP_DIST_BASE_URL
ENV MANUAL_MEMORY_MB=$MANUAL_MEMORY_MB
ENV NPM_CONFIG_REGISTRY=$NPM_REGISTRY
ENV SHARP_DIST_BASE_URL=$SHARP_DIST_BASE_URL

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

# Set npm configuration for better performance and regional mirrors
RUN npm config set registry "$NPM_CONFIG_REGISTRY" && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 300000

# Build stage
FROM base AS build

# Copy package files for dependency installation
COPY package.json package-lock.json .npmrc ./

# Proceed to dependency installation
# Install dependencies with optimized settings
RUN --mount=type=cache,id=ccframe-npm-cache,target=/root/.npm \
    NODE_OPTIONS="--max-old-space-size=1024" \
    npm ci --prefer-offline --no-audit --progress=false
COPY prisma ./prisma
RUN --mount=type=cache,id=ccframe-cache,target=/root/.cache \
    npx prisma generate

# Copy source code (use .dockerignore to exclude unnecessary files)
COPY . .

# Build Next.js with dynamic memory optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN echo "🏗️  Building Next.js application..." && \
    NODE_OPTIONS="--max-old-space-size=1024" \
    npm run build

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
    adduser --system --uid 1001 --home /home/nextjs nextjs

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV HOME=/home/nextjs

# Ensure home directory writable for npm logs/cache
RUN mkdir -p /home/nextjs/.npm && chown -R nextjs:nodejs /home/nextjs

# Copy production build artifacts and dependencies
COPY --from=build --chown=nextjs:nodejs /app/package.json ./
COPY --from=build --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=build --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/app ./app
COPY --from=build --chown=nextjs:nodejs /app/components ./components
COPY --from=build --chown=nextjs:nodejs /app/lib ./lib
COPY --from=build --chown=nextjs:nodejs /app/types ./types
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nextjs:nodejs /app/jobs ./jobs
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Health check - use simple endpoint that doesn't depend on external services
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health-simple || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]

