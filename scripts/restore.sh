#!/bin/bash

# CCFrame Restore Script
# Restore database and uploads from backup

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
DB_BACKUP_DIR="$BACKUP_DIR/db"
UPLOADS_BACKUP_DIR="$BACKUP_DIR/uploads"

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-ccframe}"
DB_USER="${POSTGRES_USER:-ccframe}"

# Check arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_date> [--with-uploads]"
  echo ""
  echo "Example: $0 20250610 --with-uploads"
  echo ""
  echo "Available database backups:"
  ls -1 "$DB_BACKUP_DIR"/*.sql.gz 2>/dev/null | xargs -n1 basename || echo "  No backups found"
  echo ""
  echo "Available uploads backups:"
  ls -1 "$UPLOADS_BACKUP_DIR"/*.tar.gz 2>/dev/null | xargs -n1 basename || echo "  No backups found"
  exit 1
fi

BACKUP_DATE=$1
WITH_UPLOADS=false

if [ "$2" == "--with-uploads" ]; then
  WITH_UPLOADS=true
fi

DB_BACKUP_FILE="$DB_BACKUP_DIR/ccframe_${BACKUP_DATE}.sql.gz"

# Check if backup exists
if [ ! -f "$DB_BACKUP_FILE" ]; then
  echo "❌ Database backup not found: $DB_BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "📁 Database backup: $DB_BACKUP_FILE"

if [ "$WITH_UPLOADS" = true ]; then
  # Find uploads backup for the week
  WEEK=$(date -d "$BACKUP_DATE" +%Y%W 2>/dev/null || date -j -f "%Y%m%d" "$BACKUP_DATE" +%Y%W)
  UPLOADS_BACKUP_FILE="$UPLOADS_BACKUP_DIR/uploads_${WEEK}.tar.gz"

  if [ -f "$UPLOADS_BACKUP_FILE" ]; then
    echo "📁 Uploads backup: $UPLOADS_BACKUP_FILE"
  else
    echo "⚠️  Uploads backup not found for week $WEEK"
    WITH_UPLOADS=false
  fi
fi

read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

# Restore database
echo ""
echo "🔄 Restoring database..."

# Drop and recreate database
PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS $DB_NAME;"

PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
gunzip -c "$DB_BACKUP_FILE" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME"

echo "✓ Database restored successfully"

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "✓ Migrations completed"

# Restore uploads if requested
if [ "$WITH_UPLOADS" = true ]; then
  echo ""
  echo "🔄 Restoring uploads..."

  # Backup current uploads
  if [ -d "uploads" ]; then
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mv uploads "uploads_backup_$BACKUP_TIMESTAMP"
    echo "  Current uploads backed up to: uploads_backup_$BACKUP_TIMESTAMP"
  fi

  # Extract backup
  tar -xzf "$UPLOADS_BACKUP_FILE"
  echo "✓ Uploads restored successfully"
fi

echo ""
echo "✅ Restore completed successfully at $(date)"
echo ""
echo "Next steps:"
echo "  1. Verify the data: npm run prisma:studio"
echo "  2. Restart the application: npm run dev"
