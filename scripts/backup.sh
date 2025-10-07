#!/bin/bash

# CCFrame Backup Script
# Daily database backup and weekly uploads backup

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
DB_BACKUP_DIR="$BACKUP_DIR/db"
UPLOADS_BACKUP_DIR="$BACKUP_DIR/uploads"
DATE=$(date +%Y%m%d)
WEEK=$(date +%Y%W)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-ccframe}"
DB_USER="${POSTGRES_USER:-ccframe}"

# Retention
DAILY_RETENTION=7    # Keep 7 days of daily backups
WEEKLY_RETENTION=8   # Keep 8 weeks of weekly backups

# Create backup directories
mkdir -p "$DB_BACKUP_DIR"
mkdir -p "$UPLOADS_BACKUP_DIR"

echo "🔄 Starting backup process..."

# Database backup
echo "📦 Backing up database..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  | gzip > "$DB_BACKUP_DIR/ccframe_${DATE}.sql.gz"

echo "✓ Database backup created: ccframe_${DATE}.sql.gz"

# Uploads backup (weekly)
DAY_OF_WEEK=$(date +%u)
if [ "$DAY_OF_WEEK" -eq 1 ]; then  # Monday
  echo "📦 Creating weekly uploads backup..."
  tar -czf "$UPLOADS_BACKUP_DIR/uploads_${WEEK}.tar.gz" uploads/
  echo "✓ Uploads backup created: uploads_${WEEK}.tar.gz"
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."

# Remove daily DB backups older than retention period
find "$DB_BACKUP_DIR" -name "ccframe_*.sql.gz" -type f -mtime +$DAILY_RETENTION -delete
echo "✓ Removed database backups older than $DAILY_RETENTION days"

# Remove weekly uploads backups older than retention period
find "$UPLOADS_BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$((WEEKLY_RETENTION * 7)) -delete
echo "✓ Removed uploads backups older than $WEEKLY_RETENTION weeks"

# Show backup summary
echo ""
echo "📊 Backup Summary:"
echo "  Database backups: $(ls -1 $DB_BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)"
echo "  Uploads backups:  $(ls -1 $UPLOADS_BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)"
echo ""
echo "✅ Backup completed successfully at $(date)"
