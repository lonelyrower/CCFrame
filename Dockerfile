# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Ensure compatibility libraries and openssl are present during install
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client with a dummy DATABASE_URL (not used during build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build Next.js application
# Use dummy DATABASE_URL to avoid hardcoding localhost during build
ENV NEXT_TELEMETRY_DISABLED=1
# Disable Cloudflare Image Resizing (requires Pro plan)
ENV NEXT_PUBLIC_DISABLE_CF=true
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# Create public directory if it doesn't exist in builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy Prisma client (generated)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy seed script dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy package.json for npm commands
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install runtime dependencies needed by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

# Install Prisma CLI with all dependencies (needed for migrations at runtime)
RUN npm install prisma@6.17.0 --save-dev --ignore-scripts && \
    chown -R nextjs:nodejs ./node_modules

# Create uploads directory structure for public/private separation
RUN mkdir -p ./uploads/original ./public/uploads ./private/uploads && \
    chown -R nextjs:nodejs ./uploads ./public/uploads ./private/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
