#!/bin/bash

# CCFrame Server Initialization Script
# For fresh Ubuntu/Debian server setup
# Usage: curl -fsSL <url> | bash

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CCFrame Server Initialization${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}✗${NC} Please run as root (use sudo)"
    exit 1
fi

# Update system
echo -e "${YELLOW}Step 1/6:${NC} Updating system packages..."
apt-get update && apt-get upgrade -y
echo -e "${GREEN}✓${NC} System updated"
echo ""

# Install essential packages
echo -e "${YELLOW}Step 2/6:${NC} Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    ca-certificates \
    gnupg \
    lsb-release
echo -e "${GREEN}✓${NC} Essential packages installed"
echo ""

# Install Docker
echo -e "${YELLOW}Step 3/6:${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Enable Docker service
    systemctl enable docker
    systemctl start docker

    echo -e "${GREEN}✓${NC} Docker installed"
else
    echo -e "${GREEN}✓${NC} Docker already installed"
fi
echo ""

# Install Nginx
echo -e "${YELLOW}Step 4/6:${NC} Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓${NC} Nginx installed"
else
    echo -e "${GREEN}✓${NC} Nginx already installed"
fi
echo ""

# Install Certbot for SSL
echo -e "${YELLOW}Step 5/6:${NC} Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓${NC} Certbot installed"
else
    echo -e "${GREEN}✓${NC} Certbot already installed"
fi
echo ""

# Configure firewall
echo -e "${YELLOW}Step 6/6:${NC} Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}✓${NC} Firewall configured"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Server Initialization Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Clone the repository:"
echo -e "     ${BLUE}git clone <repo-url> /opt/ccframe${NC}"
echo -e ""
echo -e "  2. Navigate to the project:"
echo -e "     ${BLUE}cd /opt/ccframe${NC}"
echo -e ""
echo -e "  3. Run the deployment script:"
echo -e "     ${BLUE}bash deploy.sh${NC}"
echo -e ""
echo -e "  4. Configure Nginx reverse proxy:"
echo -e "     ${BLUE}bash scripts/setup-nginx.sh your-domain.com${NC}"
echo -e ""
