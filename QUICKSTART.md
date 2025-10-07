# Quick Start Guide

Get CCFrame up and running in 5 minutes.

## 🚀 Local Development (Fastest)

### Option 1: Using Make (Recommended)

```bash
# 1. Clone repository
git clone <your-repo-url> ccframe
cd ccframe

# 2. Setup environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 3. Complete setup (installs deps, runs migrations, seeds admin)
make setup

# 4. Start development server
make dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Option 2: Using npm

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Run migrations and seed
npm run prisma:migrate
npm run seed

# 4. Start dev server
npm run dev
```

## 🐳 Using Docker (Production-like)

```bash
# 1. Setup environment
cp .env.example .env
# Update .env with Docker settings (see below)

# 2. Start services
docker-compose up -d

# 3. View logs
docker-compose logs -f app
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Environment Variables

Update `.env` with:
```bash
DATABASE_URL="postgresql://ccframe:ccframe_password@postgres:5432/ccframe"
NEXTAUTH_SECRET="your-super-secret-key-change-this"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
POSTGRES_USER="ccframe"
POSTGRES_PASSWORD="ccframe_password"
POSTGRES_DB="ccframe"
```

## 📝 First Steps

### 1. Login to Admin

- Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Use credentials from `.env`:
  - Email: `admin@example.com`
  - Password: `change-this-password`

### 2. Upload Photos

- Navigate to Upload page
- Drag and drop images
- Add titles and tags
- Set public/private visibility

### 3. Create Album

- Go to Albums page
- Click "Create Album"
- Select photos to include
- Set album cover

## 🛠️ Useful Commands

### Development

```bash
# Start dev server
make dev

# Run type checking
make type-check

# Run linter
make lint

# Open Prisma Studio
make prisma-studio
```

### Database

```bash
# Create migration
npx prisma migrate dev --name your_migration

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npm run prisma:generate
```

### Docker

```bash
# Start containers
make docker-up

# Stop containers
make docker-down

# View logs
make docker-logs

# Rebuild containers
make docker-build
```

## 🔧 Configuration

### Required Environment Variables

```bash
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # Secret for JWT (min 32 chars)
ADMIN_EMAIL          # Initial admin email
ADMIN_PASSWORD       # Initial admin password
```

### Optional Environment Variables

```bash
NEXTAUTH_URL         # Base URL (default: http://localhost:3000)
BASE_URL            # Same as NEXTAUTH_URL
NODE_ENV            # Environment (development/production)
```

## 📸 Testing Image Optimization

### Cloudflare URL Format

Once deployed with Cloudflare:
```
https://yourdomain.com/cdn-cgi/image/format=auto,width=800/uploads/original/2025/10/photo.jpg
```

### Local Testing

Without Cloudflare, images are served directly:
```
http://localhost:3000/uploads/original/2025/10/photo.jpg
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
# For local installation:
sudo systemctl status postgresql

# For Docker:
docker-compose ps
```

### Port Already in Use

```bash
# Change port in package.json or use:
PORT=3001 npm run dev
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### Permission Errors on Uploads

```bash
mkdir -p uploads/original
chmod -R 755 uploads
```

## 🔗 Next Steps

1. **Read the full [README](README.md)** for detailed documentation
2. **Check [DEPLOYMENT.md](DEPLOYMENT.md)** for production deployment
3. **Review [CONTRIBUTING.md](CONTRIBUTING.md)** if you want to contribute
4. **Explore the codebase** to understand the structure

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cloudflare Images](https://developers.cloudflare.com/images/)

## ❓ Need Help?

- Check [GitHub Issues](../../issues)
- Review [Troubleshooting Guide](DEPLOYMENT.md#troubleshooting)
- Read the source code comments

---

Happy coding! 🎉
