# Deployment Guide

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

#### Prerequisites
- VPS with Docker and Docker Compose installed
- Domain pointed to your VPS
- Cloudflare account (for image optimization)

#### Steps

1. **Clone repository on VPS**
```bash
git clone <your-repo-url> ccframe
cd ccframe
```

2. **Create environment file**
```bash
cp .env.example .env
nano .env
```

Update with your production values:
```bash
DATABASE_URL="postgresql://ccframe:secure_password@postgres:5432/ccframe"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="secure-admin-password"
BASE_URL="https://yourdomain.com"
NODE_ENV="production"

# PostgreSQL
POSTGRES_USER="ccframe"
POSTGRES_PASSWORD="secure_password"
POSTGRES_DB="ccframe"
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
# Check logs
docker-compose logs -f app

# Check database
docker-compose exec postgres psql -U ccframe -c "\dt"
```

5. **Setup Nginx reverse proxy**

Create `/etc/nginx/sites-available/ccframe`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

6. **Setup SSL with Certbot**
```bash
certbot --nginx -d yourdomain.com
```

### Option 2: GitHub Container Registry + Pull

1. **Pull latest image**
```bash
docker pull ghcr.io/<your-username>/ccframe:latest
```

2. **Run with docker run**
```bash
docker run -d \
  --name ccframe-app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/ccframe" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="admin-pass" \
  -v ./uploads:/app/uploads \
  -v ./backups:/app/backups \
  ghcr.io/<your-username>/ccframe:latest
```

### Option 3: Manual Build on VPS

1. **Install dependencies**
```bash
npm ci
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Build application**
```bash
npm run build
```

4. **Run migrations**
```bash
npx prisma migrate deploy
```

5. **Seed admin user**
```bash
npm run seed
```

6. **Start with PM2**
```bash
npm install -g pm2
pm2 start npm --name "ccframe" -- start
pm2 save
pm2 startup
```

## 🔧 Post-Deployment

### 1. Verify Application

- Visit https://yourdomain.com
- Login at https://yourdomain.com/admin/login
- Test image upload

### 2. Setup Cloudflare

1. **Add your domain to Cloudflare**
   - Update nameservers at your registrar
   - Wait for propagation (up to 24h)

2. **Enable Image Resizing**
   - Go to Speed > Optimization
   - Enable "Image Resizing"
   - Test: `https://yourdomain.com/cdn-cgi/image/width=400/uploads/original/test.jpg`

3. **Configure Cache Rules**
   - Cache Everything for `/uploads/*`
   - Bypass cache for `/api/*`
   - Bypass cache for `/admin/*`

### 3. Setup Backups

1. **Create cron job**
```bash
crontab -e
```

Add:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/ccframe && bash scripts/backup.sh >> logs/backup.log 2>&1

# Weekly cleanup at 3 AM Sunday
0 3 * * 0 cd /path/to/ccframe && find backups/db -name "*.sql.gz" -mtime +7 -delete
```

2. **Test backup**
```bash
bash scripts/backup.sh
```

3. **Test restore**
```bash
# List backups
ls -lh backups/db/

# Restore
bash scripts/restore.sh 20250610
```

### 4. Monitoring

**Using Docker logs:**
```bash
# View logs
docker-compose logs -f app

# Export logs
docker-compose logs app > app.log
```

**Using PM2 (if not using Docker):**
```bash
pm2 logs ccframe
pm2 monit
```

### 5. Security Checklist

- [ ] Change default admin password
- [ ] Use strong NEXTAUTH_SECRET (min 32 chars)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW/iptables)
- [ ] Regular database backups
- [ ] Keep Docker images updated
- [ ] Monitor disk usage for uploads
- [ ] Setup fail2ban for SSH protection

## 🔄 Updates

### Update via Docker Compose

```bash
cd ccframe
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update via GitHub Container Registry

```bash
docker pull ghcr.io/<your-username>/ccframe:latest
docker stop ccframe-app
docker rm ccframe-app
# Run with new image (see Option 2 above)
```

### Manual Update

```bash
cd ccframe
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart ccframe
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection
docker-compose exec postgres psql -U ccframe -c "SELECT 1"

# View database logs
docker-compose logs postgres
```

### Image Upload Issues

```bash
# Check uploads directory permissions
ls -la uploads/
chmod -R 755 uploads/
chown -R node:node uploads/  # in Docker container
```

### Application Errors

```bash
# View application logs
docker-compose logs app --tail=100 -f

# Check environment variables
docker-compose exec app env | grep -E "DATABASE_URL|NEXTAUTH"

# Restart application
docker-compose restart app
```

### Out of Disk Space

```bash
# Check disk usage
df -h
du -sh uploads/
du -sh backups/

# Clean old backups
find backups/db -name "*.sql.gz" -mtime +30 -delete
find backups/uploads -name "*.tar.gz" -mtime +90 -delete

# Clean Docker
docker system prune -a
```

## 📊 Performance Optimization

### Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_photos_is_public ON "Photo"("isPublic");
CREATE INDEX idx_photos_album_id ON "Photo"("albumId");
CREATE INDEX idx_photos_created_at ON "Photo"("createdAt" DESC);
CREATE INDEX idx_photo_tags_tag_id ON "PhotoTag"("tagId");
```

### Nginx Caching

Add to Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location ~* \.(jpg|jpeg|png|gif|webp|avif)$ {
    proxy_cache my_cache;
    proxy_cache_valid 200 30d;
    proxy_cache_valid 404 10m;
    add_header X-Cache-Status $upstream_cache_status;
    proxy_pass http://localhost:3000;
}
```

## 🔗 Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Cloudflare Images](https://developers.cloudflare.com/images/)
