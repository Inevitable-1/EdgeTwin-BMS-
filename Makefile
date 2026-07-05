# EdgeTwin-BMS+ Makefile
# Common development commands

.PHONY: help dev-up dev-down dev-build dev-logs \
        backend-install backend-dev backend-test backend-lint \
        frontend-install frontend-dev frontend-build frontend-lint \
        ai-train-all ai-train-soh ai-train-soc ai-train-rul ai-train-thermal ai-train-anomaly \
        esp32-build esp32-upload esp32-monitor \
        db-migrate db-upgrade db-downgrade \
        docker-build docker-up docker-down docker-logs

# Default target
help:
	@echo "EdgeTwin-BMS+ Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Docker Commands:"
	@echo "  make dev-up          Start all services with Docker Compose"
	@echo "  make dev-down        Stop all services"
	@echo "  make dev-build       Build all Docker images"
	@echo "  make dev-logs        View logs from all services"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make backend-install Install Python dependencies"
	@echo "  make backend-dev     Start backend in development mode"
	@echo "  make backend-test    Run backend tests"
	@echo "  make backend-lint    Run linting and type checks"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make frontend-install Install npm dependencies"
	@echo "  make frontend-dev     Start frontend dev server"
	@echo "  make frontend-build   Build for production"
	@echo "  make frontend-lint    Run linting"
	@echo ""
	@echo "AI Training Commands:"
	@echo "  make ai-train-all     Train all AI models"
	@echo "  make ai-train-soh     Train SOH model"
	@echo "  make ai-train-soc     Train SOC model"
	@echo "  make ai-train-rul     Train RUL model"
	@echo "  make ai-train-thermal Train Thermal model"
	@echo "  make ai-train-anomaly Train Anomaly model"
	@echo ""
	@echo "ESP32 Commands:"
	@echo "  make esp32-build      Build ESP32 firmware"
	@echo "  make esp32-upload     Upload to ESP32"
	@echo "  make esp32-monitor    Monitor serial output"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate       Generate new migration"
	@echo "  make db-upgrade       Apply migrations"
	@echo "  make db-downgrade     Rollback last migration"

# ==================== Docker Commands ====================

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

dev-build:
	docker-compose build

dev-logs:
	docker-compose logs -f

# ==================== Backend Commands ====================

backend-install:
	cd backend && pip install -r requirements.txt

backend-dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-test:
	cd backend && pytest tests/ -v --cov=app --cov-report=html

backend-lint:
	cd backend && flake8 app/ --max-line-length=120
	cd backend && mypy app/ --ignore-missing-imports
	cd backend && black --check app/
	cd backend && isort --check-only app/

backend-format:
	cd backend && black app/
	cd backend && isort app/

# ==================== Frontend Commands ====================

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-typecheck:
	cd frontend && npm run type-check

# ==================== AI Training Commands ====================

ai-train-all:
	cd ai && python training/train_soh.py
	cd ai && python training/train_soc.py
	cd ai && python training/train_rul.py
	cd ai && python training/train_thermal.py
	cd ai && python training/train_anomaly.py

ai-train-soh:
	cd ai && python training/train_soh.py

ai-train-soc:
	cd ai && python training/train_soc.py

ai-train-rul:
	cd ai && python training/train_rul.py

ai-train-thermal:
	cd ai && python training/train_thermal.py

ai-train-anomaly:
	cd ai && python training/train_anomaly.py

ai-evaluate:
	cd ai && python evaluation/evaluate_models.py

# ==================== ESP32 Commands ====================

esp32-build:
	cd firmware/esp32_bms && pio run

esp32-upload:
	cd firmware/esp32_bms && pio run --target upload

esp32-monitor:
	cd firmware/esp32_bms && pio device monitor

esp32-build-release:
	cd firmware/esp32_bms && pio run -e release

# ==================== Database Commands ====================

db-migrate:
	cd backend && alembic revision --autogenerate -m "$(message)"

db-upgrade:
	cd backend && alembic upgrade head

db-downgrade:
	cd backend && alembic downgrade -1

# ==================== Utility Commands ====================

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true

env-setup:
	cp .env.example .env
	@echo "Created .env file. Please update with your configuration."

git-init:
	git init
	git add .
	git commit -m "Initial commit: EdgeTwin-BMS+ project setup"
	@echo "Git repository initialized with initial commit."
