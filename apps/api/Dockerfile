FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npx turbo build --filter=api

# Production
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
