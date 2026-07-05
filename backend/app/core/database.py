"""
EdgeTwin-BMS+ Database Configuration
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from typing import AsyncGenerator

from app.core.config import settings


# =============================================================================
# Async Engine (for FastAPI)
# =============================================================================

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# =============================================================================
# Sync Engine (for Alembic, scripts)
# =============================================================================

sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
)

SyncSession = sessionmaker(bind=sync_engine)


# =============================================================================
# Base Model
# =============================================================================

class Base(DeclarativeBase):
    pass


# =============================================================================
# Database Dependency
# =============================================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database sessions.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# =============================================================================
# Database Initialization
# =============================================================================

async def init_db():
    """
    Initialize database tables.
    """
    async with engine.begin() as conn:
        # Import all models to ensure they are registered
        from app.models import user, fleet, battery, telemetry, prediction, alert, battery_passport, maintenance, audit_log, digital_twin
        
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections.
    """
    await engine.dispose()
