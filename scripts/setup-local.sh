#!/bin/bash
# ============================================
# TrustiLock Local Development Setup
# ============================================
# Prerequisites:
#   - Node.js 20+
#   - pnpm (npm install -g pnpm)
#   - MongoDB Community Server running locally
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
echo -e "${YELLOW}[1/4] Checking prerequisites...${NC}"

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
echo -e "${YELLOW}[2/4] Checking MongoDB...${NC}"

MONGO_RUNNING=false

if command -v mongosh &> /dev/null; then
  if mongosh --eval "db.runCommand({ping:1})" --quiet mongodb://localhost:27017 &> /dev/null; then
    MONGO_RUNNING=true
    echo -e "  ${GREEN}Local MongoDB is running on port 27017${NC}"
  fi
fi

if [ "$MONGO_RUNNING" = false ]; then
  echo -e "${RED}  MongoDB is not running on port 27017.${NC}"
  echo -e "  Start MongoDB Community Server first, then re-run this script."
  exit 1
fi

# -------------------------------------------
# Step 3: Install dependencies
# -------------------------------------------
echo ""
echo -e "${YELLOW}[3/4] Installing dependencies...${NC}"
pnpm install

# -------------------------------------------
# Step 4: Create .env if missing
# -------------------------------------------
echo ""
echo -e "${YELLOW}[4/4] Setting up environment...${NC}"

if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.local apps/api/.env
  echo -e "  ${GREEN}Created apps/api/.env from .env.local (local MongoDB)${NC}"
else
  echo -e "  ${YELLOW}apps/api/.env already exists — skipping${NC}"
fi

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
echo "  Seed database:      pnpm db:seed"
echo ""
echo "  API:     http://localhost:8000"
echo "  Web:     http://localhost:3000"
echo "  Mobile:  Expo on port 5000"
echo "  MongoDB: mongodb://localhost:27017/trustilock"
echo ""
echo "  Swagger: http://localhost:8000/api/docs"
echo ""
