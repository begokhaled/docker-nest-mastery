# ==============================================================================
# MAKEFILE - DOCKER & NESTJS TEMPLATE COMMAND CENTER
# ==============================================================================

.PHONY: help guide dev dev-build dev-down prod prod-down logs clean test-health test-all shell-api shell-postgres shell-mongo shell-redis

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

guide: ## Open the interactive Docker & NestJS Study Guide in your browser
	@open DOCKER_STUDY_GUIDE.html 2>/dev/null || xdg-open DOCKER_STUDY_GUIDE.html 2>/dev/null || echo "Open DOCKER_STUDY_GUIDE.html in your browser"

# ------------------------------------------------------------------------------
# DEVELOPMENT (Nodemon + Volume Mount + Exposed DB Ports)
# ------------------------------------------------------------------------------
dev: ## Start development stack (Postgres, Mongo, Redis, Nest with nodemon hot-reload)
	docker compose up

dev-build: ## Rebuild and start development stack
	docker compose up --build

dev-down: ## Stop development stack
	docker compose down

# ------------------------------------------------------------------------------
# PRODUCTION SIMULATION (Nginx + Multi-stage Prod Image + Network Isolation)
# ------------------------------------------------------------------------------
prod: ## Start production simulation stack (Nginx, Hardened Nest API, Isolated DBs)
	docker compose -f docker-compose.prod.yml up --build -d

prod-down: ## Stop production simulation stack
	docker compose -f docker-compose.prod.yml down

# ------------------------------------------------------------------------------
# LOGS & MONITORING
# ------------------------------------------------------------------------------
logs: ## Stream logs for all running containers
	docker compose logs -f

logs-api: ## Stream logs specifically for NestJS container
	docker compose logs -f api

# ------------------------------------------------------------------------------
# TESTING & VERIFICATION ENDPOINTS
# ------------------------------------------------------------------------------
test-health: ## Verify health check endpoint (Postgres, Mongo, Redis)
	@echo "Checking health endpoint..."
	@curl -s http://localhost:3000/api/v1/health | jq . || curl -s http://localhost:3000/api/v1/health

test-all: ## Run sample test requests against Postgres, Mongo, and Redis
	@echo "\n=== 1. Health Check ==="
	@curl -s http://localhost:3000/api/v1/health
	@echo "\n\n=== 2. Create User in PostgreSQL ==="
	@curl -s -X POST http://localhost:3000/api/v1/users \
		-H "Content-Type: application/json" \
		-d '{"email":"dev@example.com","name":"Alex Developer","role":"engineer"}'
	@echo "\n\n=== 3. List Users from PostgreSQL ==="
	@curl -s http://localhost:3000/api/v1/users
	@echo "\n\n=== 4. Insert Audit Log in MongoDB ==="
	@curl -s -X POST http://localhost:3000/api/v1/logs \
		-H "Content-Type: application/json" \
		-d '{"action":"USER_LOGIN","level":"INFO","details":"User signed in via API","metadata":{"ip":"127.0.0.1"}}'
	@echo "\n\n=== 5. List Logs from MongoDB ==="
	@curl -s http://localhost:3000/api/v1/logs
	@echo "\n\n=== 6. Set Key-Value in Redis ==="
	@curl -s -X POST http://localhost:3000/api/v1/cache \
		-H "Content-Type: application/json" \
		-d '{"key":"session:user_123","value":{"userId":"123","active":true},"ttlSeconds":120}'
	@echo "\n\n=== 7. Get Key from Redis ==="
	@curl -s http://localhost:3000/api/v1/cache/session:user_123
	@echo "\n"

# ------------------------------------------------------------------------------
# INTERACTIVE CONTAINER SHELLS (Debugging & Inspection)
# ------------------------------------------------------------------------------
shell-api: ## Open a shell inside the NestJS container
	docker compose exec api sh

shell-postgres: ## Open a psql terminal inside PostgreSQL container
	docker compose exec postgres psql -U postgres_user -d nest_docker_db

shell-mongo: ## Open a mongosh terminal inside MongoDB container
	docker compose exec mongodb mongosh -u mongo_user -p mongo_secure_password --authenticationDatabase admin nest_mongo_db

shell-redis: ## Open a redis-cli terminal inside Redis container
	docker compose exec redis redis-cli -a redis_secure_password

# ------------------------------------------------------------------------------
# CLEANUP
# ------------------------------------------------------------------------------
clean: ## Stop and remove all containers, networks, and persistent volume data
	docker compose down -v --remove-orphans
	docker compose -f docker-compose.prod.yml down -v --remove-orphans
