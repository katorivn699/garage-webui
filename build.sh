#!/bin/bash
set -e

# Build script for local development
# This builds both frontend and backend

echo "🏗️  Building Garage WebUI..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
pnpm install --frozen-lockfile
pnpm run build

# Build backend
echo -e "${BLUE}🔧 Building backend...${NC}"
cd backend

# Get version from git tag or use dev
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')

# Build for current platform
go build -ldflags="-s -w -X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME}" -o ../garage-webui .

cd ..

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Binary: ./garage-webui"
echo "Frontend dist: ./dist/"
echo ""
echo "To run:"
echo "  1. Copy .env.example to .env and configure"
echo "  2. ./garage-webui"
