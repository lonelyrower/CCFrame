#!/bin/bash

# CCFrame Nginx Setup Script
# Usage: bash setup-nginx.sh your-domain.com

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}✗${NC} Please provide a domain name"
    echo "Usage: bash setup-nginx.sh your-domain.com"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CCFrame Nginx Configuration${NC}"
echo -e "${BLUE}  Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create Nginx configuration
echo -e "${YELLOW}Step 1/3:${NC} Creating Nginx configuration..."

cat > /etc/nginx/sites-available/ccframe << EOF
# CCFrame - Main Site
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Upload size limit
    client_max_body_size 100M;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Image uploads caching
    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
EOF

echo -e "${GREEN}✓${NC} Nginx configuration created"
echo ""

# Enable site
echo -e "${YELLOW}Step 2/3:${NC} Enabling site..."
ln -sf /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
echo -e "${GREEN}✓${NC} Site enabled"
echo ""

# Test and get SSL certificate
echo -e "${YELLOW}Step 3/3:${NC} Obtaining SSL certificate..."

# First create a temporary config without SSL for certbot
cat > /etc/nginx/sites-available/ccframe-temp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ccframe-temp /etc/nginx/sites-enabled/ccframe
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email --redirect

# Restore full config
ln -sf /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/ccframe
rm -f /etc/nginx/sites-available/ccframe-temp

# Test and reload
nginx -t && systemctl reload nginx

echo -e "${GREEN}✓${NC} SSL certificate obtained"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Nginx Configuration Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Your site is now available at: ${GREEN}https://${DOMAIN}${NC}"
echo -e "Admin panel: ${GREEN}https://${DOMAIN}/admin${NC}"
echo ""
