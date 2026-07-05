# =============================================================================
# EdgeTwin-BMS+ Backend Dockerfile
# =============================================================================

FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# =============================================================================
# Production stage
# =============================================================================

FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    APP_HOME=/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create app directory
WORKDIR $APP_HOME

# Create non-root user
RUN groupadd -r edgetwin && useradd -r -g edgetwin -d $APP_HOME -s /sbin/nologin edgetwin

# Copy application code
COPY backend/app ./app
COPY backend/alembic.ini .
COPY backend/alembic ./alembic

# Create necessary directories
RUN mkdir -p /app/logs /app/ai/models && \
    chown -R edgetwin:edgetwin $APP_HOME

# Switch to non-root user
USER edgetwin

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
