#!/bin/bash

# CCFrame Quick Deploy Script
# Run this after git pull to update your deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CCFrame Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo -e "${RED}✗${NC} Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓${NC} Docker is installed"
echo ""

# Initialize secrets if needed
if [ -f "scripts/init-secrets.sh" ]; then
    echo -e "${YELLOW}Step 1/4:${NC} Initializing configuration..."
    bash scripts/init-secrets.sh
    echo ""
else
    echo -e "${YELLOW}Step 1/4:${NC} Skipping secrets initialization (script not found)"
    echo ""
fi

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo -e "${YELLOW}Step 2/4:${NC} Pulling latest code..."
    git pull origin main || echo -e "${YELLOW}⚠${NC} Git pull failed, continuing with existing code..."
    echo ""
else
    echo -e "${YELLOW}Step 2/4:${NC} Not a git repository, skipping pull"
    echo ""
fi

# Stop existing containers
echo -e "${YELLOW}Step 3/4:${NC} Stopping existing containers..."
$DOCKER_COMPOSE down
echo ""

# Rebuild and start
echo -e "${YELLOW}Step 4/4:${NC} Building and starting services..."
$DOCKER_COMPOSE build --no-cache
$DOCKER_COMPOSE up -d
echo ""

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 5

# Check if containers are running
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ Deployment Successful!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Access your application at: ${GREEN}http://localhost:3000${NC}"
    echo -e "Admin panel: ${GREEN}http://localhost:3000/admin${NC}"
    echo ""
    echo -e "To view logs: ${BLUE}$DOCKER_COMPOSE logs -f app${NC}"
    echo -e "To stop: ${BLUE}$DOCKER_COMPOSE down${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ Deployment Failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "Check logs with: ${BLUE}$DOCKER_COMPOSE logs app${NC}"
    echo ""
    exit 1
fi
