"""
EdgeTwin-BMS+ Middleware
"""

import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

from app.core.config import settings


# =============================================================================
# Request Logging Middleware
# =============================================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging HTTP requests.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path} "
            f"from {client_ip}"
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"status={response.status_code} duration={duration:.3f}s"
            )
            
            # Add timing header
            response.headers["X-Process-Time"] = str(round(duration, 3))
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"duration={duration:.3f}s error={str(e)}"
            )
            raise


# =============================================================================
# Rate Limiting Middleware
# =============================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting requests.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis client for rate limiting."""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
            )
        except Exception as e:
            logger.warning(f"Failed to connect to Redis for rate limiting: {e}")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks and documentation
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Skip if Redis is not available
        if not self.redis_client:
            return await call_next(request)
        
        # Get client identifier
        client_ip = request.client.host if request.client else "unknown"
        client_key = f"rate_limit:{client_ip}"
        
        try:
            # Get current request count
            current_count = await self.redis_client.get(client_key)
            
            if current_count is None:
                # First request, set counter with expiry
                await self.redis_client.setex(
                    client_key,
                    60,  # 1 minute window
                    1,
                )
            elif int(current_count) >= settings.RATE_LIMIT_PER_MINUTE:
                # Rate limit exceeded
                logger.warning(f"Rate limit exceeded for {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please try again later."},
                    headers={"Retry-After": "60"},
                )
            else:
                # Increment counter
                await self.redis_client.incr(client_key)
            
            return await call_next(request)
            
        except Exception as e:
            # If Redis fails, allow request through
            logger.error(f"Rate limiting error: {e}")
            return await call_next(request)


# =============================================================================
# Security Headers Middleware
# =============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware for adding security headers.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
