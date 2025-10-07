# Project Setup Checklist

Use this checklist to ensure proper setup and deployment of CCFrame.

## ✅ Initial Setup

### Local Development

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 16+ installed and running
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] Database credentials configured in `.env`
- [ ] Prisma migrations run (`npm run prisma:migrate`)
- [ ] Admin user seeded (`npm run seed`)
- [ ] Development server starts (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login to admin panel

### Environment Configuration

- [ ] `DATABASE_URL` is set correctly
- [ ] `NEXTAUTH_SECRET` is generated (min 32 chars)
- [ ] `ADMIN_EMAIL` is set
- [ ] `ADMIN_PASSWORD` is strong and unique
- [ ] `BASE_URL` matches your domain (production)
- [ ] `.env` file is in `.gitignore`
- [ ] No sensitive data in git history

## 🚀 Pre-Deployment

### Code Quality

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] All routes accessible
- [ ] Admin login works
- [ ] File upload works

### Docker Setup

- [ ] Dockerfile builds successfully
- [ ] Docker Compose starts all services
- [ ] Database container is healthy
- [ ] Application container is running
- [ ] Can access app through Docker
- [ ] Database migrations run on startup
- [ ] Admin user created on startup
- [ ] Volumes configured for uploads and backups

### GitHub Repository

- [ ] Repository created on GitHub
- [ ] Remote added to local repository
- [ ] `.gitignore` excludes sensitive files
- [ ] `ccframe开发需求.md` is NOT in repository
- [ ] `.env` is NOT in repository
- [ ] All code pushed to main branch
- [ ] README updated with repository URL
- [ ] License file added

### GitHub Actions

- [ ] CI workflow file exists (`.github/workflows/ci.yml`)
- [ ] Docker publish workflow exists (`.github/workflows/docker-publish.yml`)
- [ ] Security workflow exists (`.github/workflows/security.yml`)
- [ ] Workflows run successfully on push
- [ ] Docker image builds in CI
- [ ] Type checking passes in CI
- [ ] Linting passes in CI

### GitHub Container Registry

- [ ] Repository has packages write permission
- [ ] Docker image published to GHCR
- [ ] Image is accessible at `ghcr.io/<username>/ccframe:latest`
- [ ] Image tags are correct (latest, version, sha)
- [ ] Can pull image successfully
- [ ] Can run pulled image

## 🌐 Production Deployment

### VPS Setup

- [ ] VPS provisioned (4C/6G/100G minimum)
- [ ] SSH access configured
- [ ] Firewall configured (allow 22, 80, 443)
- [ ] Domain DNS points to VPS IP
- [ ] Docker installed on VPS
- [ ] Docker Compose installed on VPS
- [ ] Nginx installed on VPS

### Application Deployment

- [ ] Repository cloned on VPS
- [ ] Production `.env` created
- [ ] All environment variables set correctly
- [ ] Docker Compose services started
- [ ] Database initialized
- [ ] Admin user created
- [ ] Application accessible on localhost:3000

### Nginx Configuration

- [ ] Nginx config file created
- [ ] Reverse proxy to localhost:3000 configured
- [ ] Client max body size set to 50M
- [ ] Security headers added
- [ ] Config file symlinked to sites-enabled
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded

### SSL/TLS

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS enabled
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate auto-renewal configured
- [ ] SSL Labs test passes (A+ rating)

### Cloudflare Setup

- [ ] Domain added to Cloudflare
- [ ] DNS records configured
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] SSL mode set to "Full (strict)"
- [ ] Image Resizing enabled
- [ ] Cache rules configured
  - [ ] Cache `/uploads/*` (public images)
  - [ ] Bypass `/api/*`
  - [ ] Bypass `/admin/*`
- [ ] Test `/cdn-cgi/image/...` URLs work

### Security

- [ ] Admin password changed from default
- [ ] Database password is strong
- [ ] `NEXTAUTH_SECRET` is random and secure
- [ ] Firewall allows only necessary ports
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] fail2ban installed and configured
- [ ] Regular security updates enabled
- [ ] No sensitive data in logs

## 🔧 Post-Deployment

### Functional Testing

- [ ] Homepage loads correctly
- [ ] Public photos gallery works
- [ ] Tag browsing works
- [ ] Album viewing works
- [ ] Series browsing works
- [ ] Admin login works
- [ ] Photo upload works (single)
- [ ] Photo upload works (batch)
- [ ] Upload progress displays correctly
- [ ] Photo edit works
- [ ] Photo delete works
- [ ] Album creation works
- [ ] Series creation works
- [ ] Tag management works
- [ ] Settings page works
- [ ] Theme color extraction works
- [ ] Dark/light mode toggle works
- [ ] Analytics page displays data

### Performance Testing

- [ ] Homepage loads in < 2s
- [ ] Images load progressively
- [ ] Lazy loading works
- [ ] Infinite scroll works
- [ ] No console errors
- [ ] No memory leaks
- [ ] Lighthouse score > 90
- [ ] Images served via Cloudflare CDN
- [ ] AVIF/WebP format negotiation works

### Backup Setup

- [ ] Backup script tested manually
- [ ] Restore script tested manually
- [ ] Cron job created for daily backups
- [ ] Backup directory has sufficient space
- [ ] Old backups are cleaned up automatically
- [ ] Backups stored securely
- [ ] Offsite backup configured (optional)

### Monitoring

- [ ] Application logs accessible
- [ ] Database logs accessible
- [ ] Nginx logs accessible
- [ ] Disk space monitoring set up
- [ ] Uptime monitoring configured (optional)
- [ ] Error alerting configured (optional)

## 📱 Ongoing Maintenance

### Weekly

- [ ] Review application logs
- [ ] Check disk usage
- [ ] Verify backups are running
- [ ] Test restore process (monthly)
- [ ] Review security alerts
- [ ] Update dependencies (if needed)

### Monthly

- [ ] Review analytics
- [ ] Check for security updates
- [ ] Optimize database (if needed)
- [ ] Clean up old backups
- [ ] Review Cloudflare usage
- [ ] Check SSL certificate expiry

### Quarterly

- [ ] Full security audit
- [ ] Performance review
- [ ] Dependency major version updates
- [ ] Database optimization
- [ ] Review and update documentation

## 🎯 Optional Enhancements

### Features

- [ ] Implement search functionality
- [ ] Add photo metadata display (EXIF)
- [ ] Enable photo comments
- [ ] Add watermark option
- [ ] Implement photo sharing
- [ ] Add RSS feed
- [ ] Create sitemap.xml
- [ ] Add robots.txt

### Infrastructure

- [ ] Set up staging environment
- [ ] Configure CDN for static assets
- [ ] Implement Redis caching
- [ ] Set up monitoring dashboard
- [ ] Configure log aggregation
- [ ] Implement automated testing
- [ ] Set up CI/CD for staging

### Security

- [ ] Implement 2FA for admin
- [ ] Add API rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Implement CSP headers
- [ ] Add security monitoring
- [ ] Regular penetration testing

## 📝 Notes

Use this space to track custom configurations or decisions:

```
Date: ___________
-
-
-

Date: ___________
-
-
-
```

---

**Last Updated**: 2025-10-06
**Version**: 1.0.0
