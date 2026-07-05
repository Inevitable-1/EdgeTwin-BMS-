"""
EdgeTwin-BMS+ Core Configuration
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import model_validator


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    
    # Application
    APP_NAME: str = "EdgeTwin-BMS+"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-to-a-random-secret-key-min-32-chars"
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Backend
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_WORKERS: int = 4
    BACKEND_LOG_LEVEL: str = "info"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Database
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "edgetwin_bms"
    POSTGRES_USER: str = "edgetwin"
    POSTGRES_PASSWORD: str = "edgetwin_secret_password"
    DATABASE_URL: str = ""
    DATABASE_URL_SYNC: str = ""
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = ""
    REDIS_URL: str = ""
    
    # MQTT
    MQTT_BROKER: str = "mosquitto"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: Optional[str] = ""
    MQTT_PASSWORD: Optional[str] = ""
    MQTT_CLIENT_ID: str = "edgetwin-backend"
    MQTT_TELEMETRY_TOPIC: str = "edgetwin/+/telemetry"
    MQTT_ALERTS_TOPIC: str = "edgetwin/+/alerts"
    MQTT_COMMANDS_TOPIC: str = "edgetwin/+/commands"
    MQTT_QOS: int = 1
    MQTT_KEEPALIVE: int = 60
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "change-this-jwt-secret-key-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI Models
    AI_MODELS_DIR: str = "/app/ai/models"
    AI_MODEL_VERSION: str = "1.0.0"
    AI_INFERENCE_DEVICE: str = "cpu"
    AI_BATCH_SIZE: int = 32
    
    # Logging
    LOG_FORMAT: str = "json"
    LOG_FILE: str = "/app/logs/edgetwin.log"
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Cache
    CACHE_TTL: int = 300
    CACHE_MAX_SIZE: int = 1000
    
    @model_validator(mode="after")
    def compute_derived_urls(self) -> "Settings":
        self.DATABASE_URL = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        self.DATABASE_URL_SYNC = (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        self.REDIS_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return self
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
