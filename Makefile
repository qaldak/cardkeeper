# Convenience wrappers around docker compose. Everything runs in containers, nothing is installed on the host.
DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: help up down logs dev test lint typecheck migration shell

help: ## Show this help
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

up: ## Build and start the production stack
	docker compose up -d --build

down: ## Stop the production stack (data volumes are kept)
	docker compose down

logs: ## Follow the app logs
	docker compose logs -f app

dev: ## Start the dev server with hot reload on http://localhost:3000
	$(DEV) up --build

test: ## Run lint, typecheck and all tests (unit + integration)
	$(DEV) run --rm --build test

lint: ## Run ESLint only
	$(DEV) run --rm --no-deps test npm run lint

typecheck: ## Run the TypeScript type check only
	$(DEV) run --rm --no-deps test npm run typecheck

migration: ## Create a new Prisma migration: make migration name=add_something
	@test -n "$(name)" || (echo "usage: make migration name=<migration_name>" && exit 1)
	$(DEV) run --rm app npx prisma migrate dev --name $(name)

shell: ## Open a shell in the dev container
	$(DEV) run --rm app sh
