#!/bin/bash

# CCFrame Secrets Initialization Script
# Automatically generates secure default credentials if .env doesn't exist

set -e

ENV_FILE="${ENV_FILE:-.env}"
ENV_EXAMPLE=".env.example"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to generate random secret
generate_secret() {
    openssl rand -hex 32
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CCFrame Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}ℹ${NC} .env file already exists. Checking configuration..."

    # Check if required variables are set
    source "$ENV_FILE" 2>/dev/null || true

    NEEDS_UPDATE=false

    if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-nextauth-secret-change-this-to-a-random-string" ]; then
        echo -e "${YELLOW}⚠${NC} NEXTAUTH_SECRET not set or using default. Generating new secret..."
        NEW_NEXTAUTH_SECRET=$(generate_secret)
        NEEDS_UPDATE=true
    fi

    if [ -z "$ADMIN_EMAIL" ] || [ "$ADMIN_EMAIL" = "admin@example.com" ]; then
        echo -e "${YELLOW}⚠${NC} ADMIN_EMAIL not set or using default. Using: admin@ccframe.local"
        NEW_ADMIN_EMAIL="admin@ccframe.local"
        NEEDS_UPDATE=true
    fi

    if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "change-this-password" ]; then
        echo -e "${YELLOW}⚠${NC} ADMIN_PASSWORD not set or using default. Generating random password..."
        NEW_ADMIN_PASSWORD=$(generate_password)
        NEEDS_UPDATE=true
    fi

    if [ "$NEEDS_UPDATE" = true ]; then
        # Update .env file with new values
        [ ! -z "$NEW_NEXTAUTH_SECRET" ] && sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_NEXTAUTH_SECRET\"|" "$ENV_FILE"
        [ ! -z "$NEW_ADMIN_EMAIL" ] && sed -i.bak "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=\"$NEW_ADMIN_EMAIL\"|" "$ENV_FILE"
        [ ! -z "$NEW_ADMIN_PASSWORD" ] && sed -i.bak "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"$NEW_ADMIN_PASSWORD\"|" "$ENV_FILE"
        rm -f "${ENV_FILE}.bak"

        echo -e "${GREEN}✓${NC} Updated .env with secure defaults"

        if [ ! -z "$NEW_ADMIN_PASSWORD" ]; then
            echo ""
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "${GREEN}  Admin Credentials (SAVE THIS!)${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo -e "Email:    ${GREEN}${NEW_ADMIN_EMAIL:-$ADMIN_EMAIL}${NC}"
            echo -e "Password: ${GREEN}${NEW_ADMIN_PASSWORD}${NC}"
            echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            echo ""
        fi
    else
        echo -e "${GREEN}✓${NC} Configuration looks good!"
    fi

    exit 0
fi

# Create new .env file from example
echo -e "${YELLOW}ℹ${NC} .env file not found. Creating with secure defaults..."

if [ ! -f "$ENV_EXAMPLE" ]; then
    echo -e "${RED}✗${NC} .env.example not found. Cannot initialize configuration."
    exit 1
fi

# Generate secure credentials
NEXTAUTH_SECRET=$(generate_secret)
ADMIN_PASSWORD=$(generate_password)
ADMIN_EMAIL="admin@ccframe.local"
POSTGRES_PASSWORD=$(generate_password)

# Copy example and replace placeholders
cp "$ENV_EXAMPLE" "$ENV_FILE"

# Update with generated values (cross-platform sed)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"$POSTGRES_PASSWORD\"|" "$ENV_FILE"
    sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" "$ENV_FILE"
    sed -i '' "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=\"$ADMIN_EMAIL\"|" "$ENV_FILE"
    sed -i '' "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"$ADMIN_PASSWORD\"|" "$ENV_FILE"
else
    # Linux
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"$POSTGRES_PASSWORD\"|" "$ENV_FILE"
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" "$ENV_FILE"
    sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=\"$ADMIN_EMAIL\"|" "$ENV_FILE"
    sed -i "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=\"$ADMIN_PASSWORD\"|" "$ENV_FILE"
fi

echo -e "${GREEN}✓${NC} Created .env with secure random credentials"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Admin Credentials (SAVE THIS!)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Email:    ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}ℹ${NC} These credentials have been saved to .env"
echo -e "${YELLOW}ℹ${NC} You can change them by editing the .env file"
echo ""
