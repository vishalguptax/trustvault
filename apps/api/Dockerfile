FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./

# Generate Prisma client and build
RUN cd apps/api && npx prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter @trustvault/api run build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only what is needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/.env.example ./apps/api/.env.example
COPY --from=builder /app/package.json ./

WORKDIR /app/apps/api

EXPOSE 8000

CMD ["node", "dist/main.js"]
