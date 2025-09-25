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
      libvips \
      libheif1 \
      libjpeg62-turbo \
      libpng16-16 \
      libwebp7 \
      libtiff6 \
      curl && \
    rm -rf /var/lib/apt/lists/*

# Build stage
FROM base AS build

COPY package.json .npmrc ./
# Copy package-lock.json only if it exists
COPY package-lock.json* ./
RUN npm ci --silent --no-audit --no-fund --no-optional

# Prisma needs schema at build for client generation
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# Runner image
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/jobs ./jobs
# Fallback copy: duplicate jobs under scripts/jobs to avoid path issues in some builds
COPY --from=build /app/jobs ./scripts/jobs

EXPOSE 3000

CMD ["npm", "run", "start"]
