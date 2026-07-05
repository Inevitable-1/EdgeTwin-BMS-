"""
EdgeTwin-BMS+ Backend Main Application
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from sqlalchemy import text
import sys

from app.core.config import settings
from app.core.database import engine, async_session
from app.core.middleware import RequestLoggingMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from app.api.v1.api import api_router
from app.core.websocket import ConnectionManager
from app.services.mqtt_service import mqtt_service
from app.services.ai_service import ai_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting EdgeTwin-BMS+ Backend...")
    
    # Initialize WebSocket connection manager
    app.state.connection_manager = ConnectionManager()
    
    # Verify database connection
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    
    # Initialize AI service
    try:
        await ai_service.initialize()
        logger.info("AI service initialized")
    except Exception as e:
        logger.warning(f"AI service initialization failed: {e}")
    
    # Initialize MQTT service
    try:
        await mqtt_service.initialize()
        logger.info("MQTT service initialized")
    except Exception as e:
        logger.warning(f"MQTT service initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EdgeTwin-BMS+ Backend...")
    
    # Shutdown MQTT
    try:
        await mqtt_service.shutdown()
    except Exception as e:
        logger.error(f"MQTT shutdown error: {e}")
    
    # Close database engine
    await engine.dispose()
    
    logger.info("Backend shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-Powered Edge Digital Twin & Battery Passport Platform",
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom Middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    
    # Include API Router
    app.include_router(api_router, prefix="/api/v1")
    
    # Health Check Endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "mqtt_connected": mqtt_service.connected if mqtt_service else False,
        }
    
    # Root Endpoint
    @app.get("/")
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs" if settings.DEBUG else None,
        }
    
    # Exception Handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        return JSONResponse(
            status_code=404,
            content={"detail": "Resource not found"},
        )
    
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.LOG_LEVEL,
    )
    
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        workers=settings.BACKEND_WORKERS,
        reload=settings.DEBUG,
    )
