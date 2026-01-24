.PHONY: help install dev build start clean docker-up docker-down docker-logs migrate seed backup restore preflight smoke test test-unit test-e2e test-coverage

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

test: test-unit ## Run unit tests (alias)

test-unit: ## Run unit tests with Vitest
	npm run test:run

test-watch: ## Run unit tests in watch mode
	npm run test

test-ui: ## Run unit tests with Vitest UI
	npm run test:ui

test-coverage: ## Run unit tests with coverage report
	npm run test:coverage

test-e2e: ## Run E2E tests with Playwright
	npm run test:e2e

test-e2e-ui: ## Run E2E tests with Playwright UI
	npm run test:e2e:ui

test-e2e-headed: ## Run E2E tests in headed mode
	npm run test:e2e:headed

test-all: lint type-check test-unit test-e2e ## Run all tests (lint, type-check, unit, e2e)

preflight: ## Run deployment preflight checks
	npm run preflight

smoke: ## Run smoke tests (app must be running)
	npm run smoke

setup: install migrate seed ## Complete initial setup
	@echo "✅ Setup complete! Run 'make dev' to start development server"

ci: lint type-check test-unit ## Run CI checks (lint, type-check, unit tests)
