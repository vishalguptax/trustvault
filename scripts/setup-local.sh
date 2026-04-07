#!/bin/bash
# ============================================
# TrustiLock Local Development Setup
# ============================================
# This script sets up everything needed to run
# the project locally without any cloud services.
#
# Prerequisites:
#   - Node.js 20+
#   - pnpm (npm install -g pnpm)
#   - Docker Desktop (for local MongoDB)
#     OR MongoDB Community Server installed locally
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  TrustiLock Local Development Setup"
echo "=========================================="
echo ""

# -------------------------------------------
# Step 1: Check prerequisites
# -------------------------------------------
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Install Node.js 20 LTS first.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}Node.js 20+ required. Found: $(node -v)${NC}"
  exit 1
fi
echo -e "  ${GREEN}Node.js $(node -v)${NC}"

if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}  pnpm not found. Installing...${NC}"
  npm install -g pnpm
fi
echo -e "  ${GREEN}pnpm $(pnpm -v)${NC}"

# -------------------------------------------
# Step 2: Check MongoDB
# -------------------------------------------
echo ""
echo -e "${YELLOW}[2/7] Checking MongoDB...${NC}"

MONGO_RUNNING=false

# Check if Docker is available and MongoDB container is running
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q trustilock-mongo; then
    MONGO_RUNNING=true
    echo -e "  ${GREEN}MongoDB container (trustilock-mongo) is running${NC}"
  fi
fi

# Check if local MongoDB is running on port 27017
if [ "$MONGO_RUNNING" = false ]; then
  if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand({ping:1})" --quiet mongodb://localhost:27017 &> /dev/null; then
      MONGO_RUNNING=true
      echo -e "  ${GREEN}Local MongoDB is running on port 27017${NC}"
    fi
  fi
fi

if [ "$MONGO_RUNNING" = false ]; then
  echo -e "  ${YELLOW}MongoDB is not running.${NC}"
  if command -v docker &> /dev/null; then
    echo -e "  ${YELLOW}Starting MongoDB via Docker...${NC}"
    docker run -d \
      --name trustilock-mongo \
      -p 27017:27017 \
      -v trustilock-mongo-data:/data/db \
      --restart unless-stopped \
      mongo:7
    echo -e "  ${GREEN}MongoDB started via Docker on port 27017${NC}"
    MONGO_RUNNING=true
  else
    echo -e "${RED}  No Docker or local MongoDB found.${NC}"
    echo ""
    echo "  Options:"
    echo "    1. Install Docker Desktop and re-run this script"
    echo "    2. Install MongoDB Community Server locally"
    echo "    3. Use MongoDB Atlas (set DATABASE_URL in apps/api/.env)"
    echo ""
    echo "  To start MongoDB via Docker manually:"
    echo "    docker run -d --name trustilock-mongo -p 27017:27017 -v trustilock-mongo-data:/data/db mongo:7"
    echo ""
    exit 1
  fi
fi

# -------------------------------------------
# Step 3: Install dependencies
# -------------------------------------------
echo ""
echo -e "${YELLOW}[3/7] Installing dependencies...${NC}"
pnpm install

# -------------------------------------------
# Step 4: Generate Prisma client
# -------------------------------------------
echo ""
echo -e "${YELLOW}[4/7] Generating Prisma client...${NC}"
cd apps/api
pnpm prisma generate
cd ../..

# -------------------------------------------
# Step 5: Create .env if missing
# -------------------------------------------
echo ""
echo -e "${YELLOW}[5/7] Setting up environment...${NC}"

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.local apps/api/.env
  echo -e "  ${GREEN}Created apps/api/.env from .env.local (local MongoDB)${NC}"
else
  echo -e "  ${YELLOW}apps/api/.env already exists — skipping${NC}"
fi

# -------------------------------------------
# Step 6: Push schema to MongoDB
# -------------------------------------------
echo ""
echo -e "${YELLOW}[6/7] Pushing Prisma schema to MongoDB...${NC}"
cd apps/api
pnpm prisma db push
cd ../..

# -------------------------------------------
# Step 7: Seed database
# -------------------------------------------
echo ""
echo -e "${YELLOW}[7/7] Seeding database...${NC}"
cd infrastructure/seed
npx tsx seed-data.ts
cd ../..

# -------------------------------------------
# Done
# -------------------------------------------
echo ""
echo "=========================================="
echo -e "  ${GREEN}Setup complete!${NC}"
echo "=========================================="
echo ""
echo "  Start all apps:     pnpm dev"
echo "  Start API only:     pnpm dev:api"
echo "  Start web only:     pnpm dev:web"
echo "  Start mobile only:  pnpm dev:mobile"
echo ""
echo "  API:     http://localhost:8000"
echo "  Web:     http://localhost:3000"
echo "  Mobile:  Expo on port 5000"
echo "  MongoDB: mongodb://localhost:27017/trustilock"
echo ""
echo "  Swagger: http://localhost:8000/api/docs"
echo ""
