#!/bin/bash

# Fix nginx proxy configuration
echo "🔧 Fixing nginx configuration..."

# Restart nginx container to reload config
echo "Restarting nginx container..."
docker restart ccframe-nginx

# Wait for nginx to restart
sleep 5

# Test the configuration
echo "Testing nginx configuration..."
docker exec ccframe-nginx nginx -t

echo "✅ Nginx fix completed!"
echo "🌐 Visit http://142.91.99.128 to check if the issue is resolved"