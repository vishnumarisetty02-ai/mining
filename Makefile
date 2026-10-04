.PHONY: check lint types test test-unit test-property test-integration test-contract fmt clean

# ── Composite targets ─────────────────────────────────────────────────
check: lint types test-unit  ## Run lint + types + unit tests (pre-push gate)

ci: lint types test  ## Full CI pipeline

# ── Lint & format ─────────────────────────────────────────────────────
lint:  ## Run ruff linter
	uv run ruff check packages/ services/ tests/

fmt:  ## Auto-format with ruff
	uv run ruff format packages/ services/ tests/
	uv run ruff check --fix packages/ services/ tests/

# ── Type checking ─────────────────────────────────────────────────────
types:  ## Run mypy strict
	uv run mypy packages/ services/

# ── Tests ─────────────────────────────────────────────────────────────
test:  ## Run all tests
	uv run pytest tests/ -v --cov

test-unit:  ## Run unit tests only
	uv run pytest tests/ -v -m unit --cov

test-property:  ## Run property-based tests (Hypothesis)
	uv run pytest tests/ -v -m property

test-integration:  ## Run integration tests (needs Docker services)
	uv run pytest tests/ -v -m integration

test-contract:  ## Run API contract tests (Schemathesis)
	uv run pytest tests/ -v -m contract

# ── Database ──────────────────────────────────────────────────────────
migrate:  ## Apply Alembic migrations
	uv run alembic upgrade head

migrate-new:  ## Create a new Alembic migration (usage: make migrate-new MSG="add facts table")
	uv run alembic revision --autogenerate -m "$(MSG)"

migrate-down:  ## Rollback one migration
	uv run alembic downgrade -1

# ── Docker ────────────────────────────────────────────────────────────
up:  ## Start all services with Docker Compose
	docker compose -f deploy/docker-compose.yml up -d --build

down:  ## Stop Docker Compose services
	docker compose -f deploy/docker-compose.yml down

# ── Housekeeping ──────────────────────────────────────────────────────
clean:  ## Remove caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
