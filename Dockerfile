# Multi-stage build for Next.js app with sharp support
FROM node:18-bullseye AS base

WORKDIR /app

# Install OS deps for sharp/libvips (with HEIF support where available)
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
      libwebp6 \
      libtiff5 \
      curl && \
    rm -rf /var/lib/apt/lists/*

# Build stage
FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

# Prisma needs schema at build for client generation
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

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

EXPOSE 3000

CMD ["npm", "run", "start"]

