#!/bin/bash
set -e

# Build script for local development
# This builds both frontend and backend into a single binary

echo "🏗️  Building Garage WebUI..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
pnpm install --frozen-lockfile
pnpm run build

# Move frontend to backend for embedding
echo -e "${BLUE}📁 Copying frontend to backend...${NC}"
rm -rf backend/ui/dist
cp -r dist backend/ui/dist

# Build backend with embedded frontend
echo -e "${BLUE}🔧 Building backend with embedded frontend...${NC}"
cd backend

# Get version from git tag or use dev
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')

# Build for current platform with prod tag
go build -tags prod -ldflags="-s -w -X main.Version=${VERSION} -X main.BuildTime=${BUILD_TIME}" -o ../garage-webui .

cd ..

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Binary: ./garage-webui (with embedded frontend)"
echo ""
echo "To run:"
echo "  1. Copy backend/.env.example to backend/.env and configure"
echo "  2. ./garage-webui"
