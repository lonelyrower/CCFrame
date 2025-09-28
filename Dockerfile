# Multi-stage build for Next.js app with sharp support
FROM node:20-bookworm AS base

# Build arguments for memory configuration
ARG MANUAL_MEMORY_MB
ENV MANUAL_MEMORY_MB=$MANUAL_MEMORY_MB

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

# Install dependencies with dynamic memory optimization
RUN --mount=type=cache,target=/root/.npm \
    bash -c '
    # Memory detection function
    detect_memory() {
        # Allow manual override via build args
        if [ -n "$MANUAL_MEMORY_MB" ]; then
            echo "=== Manual Memory Override ==="
            echo "Using manual memory setting: ${MANUAL_MEMORY_MB}MB"
            AVAILABLE_MEM=$MANUAL_MEMORY_MB
        else
            # Get total memory in MB
            TOTAL_MEM=$(awk "/MemTotal/ {printf \"%.0f\", \$2/1024}" /proc/meminfo)
            AVAILABLE_MEM=$(awk "/MemAvailable/ {printf \"%.0f\", \$2/1024}" /proc/meminfo)
        fi

        echo "=== Memory Detection ==="
        echo "Total Memory: ${TOTAL_MEM}MB"
        echo "Available Memory: ${AVAILABLE_MEM}MB"

        # Determine optimal settings based on available memory
        if [ "$AVAILABLE_MEM" -lt 512 ]; then
            echo "⚠️  WARNING: Very low memory detected (${AVAILABLE_MEM}MB)"
            echo "   Recommended: Add more memory or enable swap on host system"
            echo "   Attempting minimal installation..."
            export NODE_OPTIONS="--max-old-space-size=256"
            export NPM_FLAGS="--prefer-offline --no-audit --progress=false --loglevel=error"
        elif [ "$AVAILABLE_MEM" -lt 1024 ]; then
            echo "⚠️  Low memory detected (${AVAILABLE_MEM}MB)"
            echo "   Using conservative memory settings..."
            export NODE_OPTIONS="--max-old-space-size=512"
            export NPM_FLAGS="--prefer-offline --no-audit --progress=false"
        elif [ "$AVAILABLE_MEM" -lt 2048 ]; then
            echo "✓ Moderate memory available (${AVAILABLE_MEM}MB)"
            export NODE_OPTIONS="--max-old-space-size=1024"
            export NPM_FLAGS="--prefer-offline --no-audit --progress=false"
        else
            echo "✓ Good memory available (${AVAILABLE_MEM}MB)"
            export NODE_OPTIONS="--max-old-space-size=2048"
            export NPM_FLAGS="--prefer-offline --no-audit"
        fi

        echo "Node Options: $NODE_OPTIONS"
        echo "NPM Flags: $NPM_FLAGS"
        echo "========================"
    }

    # Detect memory and run npm ci
    detect_memory
    npm ci $NPM_FLAGS || {
        echo "❌ npm ci failed - trying emergency fallback"
        export NODE_OPTIONS="--max-old-space-size=256"
        npm ci --prefer-offline --no-audit --progress=false --loglevel=error || {
            echo "❌ Installation failed even with minimal settings"
            echo "💡 Suggestions:"
            echo "   1. Increase system memory/swap"
            echo "   2. Try building on a machine with more RAM"
            echo "   3. Use a pre-built image if available"
            exit 1
        }
    }
    '
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.cache \
    npx prisma generate

# Copy source code (use .dockerignore to exclude unnecessary files)
COPY . .

# Build Next.js with dynamic memory optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bash -c '
    # Memory detection function
    detect_memory() {
        # Allow manual override via build args
        if [ -n "$MANUAL_MEMORY_MB" ]; then
            echo "=== Manual Memory Override ==="
            echo "Using manual memory setting: ${MANUAL_MEMORY_MB}MB"
            AVAILABLE_MEM=$MANUAL_MEMORY_MB
        else
            # Get total memory in MB
            TOTAL_MEM=$(awk "/MemTotal/ {printf \"%.0f\", \$2/1024}" /proc/meminfo)
            AVAILABLE_MEM=$(awk "/MemAvailable/ {printf \"%.0f\", \$2/1024}" /proc/meminfo)
        fi

        echo "=== Build Stage Memory Check ==="
        echo "Total Memory: ${TOTAL_MEM}MB"
        echo "Available Memory: ${AVAILABLE_MEM}MB"

        # Determine optimal settings based on available memory
        if [ "$AVAILABLE_MEM" -lt 512 ]; then
            echo "⚠️  WARNING: Very low memory detected (${AVAILABLE_MEM}MB)"
            echo "   Recommended: Add more memory or enable swap on host system"
            echo "   Attempting minimal build..."
            export NODE_OPTIONS="--max-old-space-size=256"
        elif [ "$AVAILABLE_MEM" -lt 1024 ]; then
            echo "⚠️  Low memory detected (${AVAILABLE_MEM}MB)"
            echo "   Using conservative memory settings..."
            export NODE_OPTIONS="--max-old-space-size=512"
        elif [ "$AVAILABLE_MEM" -lt 2048 ]; then
            echo "✓ Moderate memory available (${AVAILABLE_MEM}MB)"
            export NODE_OPTIONS="--max-old-space-size=1024"
        else
            echo "✓ Good memory available (${AVAILABLE_MEM}MB)"
            export NODE_OPTIONS="--max-old-space-size=2048"
        fi

        echo "Node Options: $NODE_OPTIONS"
        echo "========================"
    }

    # Detect memory and run build
    detect_memory
    echo "Starting Next.js build with $NODE_OPTIONS"
    npm run build || {
        echo "❌ Build failed - trying emergency settings"
        export NODE_OPTIONS="--max-old-space-size=256"
        echo "Retrying with emergency memory limit: $NODE_OPTIONS"
        npm run build || {
            echo "❌ Build failed even with minimal settings"
            echo "💡 Build Suggestions:"
            echo "   1. Increase system memory (recommended: 2GB+)"
            echo "   2. Build locally and copy .next folder"
            echo "   3. Use multi-stage build with smaller chunks"
            exit 1
        }
    }
    '

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]

