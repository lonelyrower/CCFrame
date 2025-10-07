.PHONY: help install dev build start clean docker-up docker-down docker-logs migrate seed backup restore

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \\033[36m%-15s\\033[0m %s\\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules .next out dist

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-build: ## Rebuild Docker containers
	docker-compose build --no-cache

migrate: ## Run database migrations
	npx prisma migrate dev

migrate-deploy: ## Deploy database migrations (production)
	npx prisma migrate deploy

seed: ## Seed database with admin user
	npm run seed

backup: ## Run backup script
	bash scripts/backup.sh

restore: ## Restore from backup (Usage: make restore DATE=20250610)
	bash scripts/restore.sh $(DATE)

prisma-studio: ## Open Prisma Studio
	npx prisma studio

lint: ## Run linter
	npm run lint

type-check: ## Run TypeScript type check
	npm run type-check

test: lint type-check ## Run all tests

setup: install migrate seed ## Complete initial setup
	@echo "✅ Setup complete! Run 'make dev' to start development server"
