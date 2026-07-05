"""
EdgeTwin-BMS+ Schemas
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    ChangePassword,
    Token,
    TokenPayload,
    LoginRequest,
)
from app.schemas.fleet import (
    FleetBase,
    FleetCreate,
    FleetUpdate,
    FleetResponse,
    FleetListResponse,
    FleetStatistics,
)
from app.schemas.battery import (
    BatteryBase,
    BatteryCreate,
    BatteryUpdate,
    BatteryResponse,
    BatteryListResponse,
    BatteryHealth,
    BatteryWithTelemetry,
)
from app.schemas.telemetry import (
    TelemetryBase,
    TelemetryCreate,
    TelemetryResponse,
    TelemetryListResponse,
    TelemetryStats,
    TelemetryBulkCreate,
)
from app.schemas.prediction import (
    PredictionBase,
    PredictionCreate,
    PredictionResponse,
    PredictionListResponse,
    PredictionExplanation,
)
from app.schemas.alert import (
    AlertBase,
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertListResponse,
    AlertStatistics,
)
from app.schemas.battery_passport import (
    BatteryPassportBase,
    BatteryPassportCreate,
    BatteryPassportUpdate,
    BatteryPassportResponse,
    BatteryPassportListResponse,
    BatteryPassportFull,
)
from app.schemas.maintenance import (
    MaintenanceBase,
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
    MaintenanceListResponse,
    MaintenanceSchedule,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListResponse",
    "ChangePassword",
    "Token",
    "TokenPayload",
    "LoginRequest",
    # Fleet
    "FleetBase",
    "FleetCreate",
    "FleetUpdate",
    "FleetResponse",
    "FleetListResponse",
    "FleetStatistics",
    # Battery
    "BatteryBase",
    "BatteryCreate",
    "BatteryUpdate",
    "BatteryResponse",
    "BatteryListResponse",
    "BatteryHealth",
    "BatteryWithTelemetry",
    # Telemetry
    "TelemetryBase",
    "TelemetryCreate",
    "TelemetryResponse",
    "TelemetryListResponse",
    "TelemetryStats",
    "TelemetryBulkCreate",
    # Prediction
    "PredictionBase",
    "PredictionCreate",
    "PredictionResponse",
    "PredictionListResponse",
    "PredictionExplanation",
    # Alert
    "AlertBase",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "AlertListResponse",
    "AlertStatistics",
    # Battery Passport
    "BatteryPassportBase",
    "BatteryPassportCreate",
    "BatteryPassportUpdate",
    "BatteryPassportResponse",
    "BatteryPassportListResponse",
    "BatteryPassportFull",
    # Maintenance
    "MaintenanceBase",
    "MaintenanceCreate",
    "MaintenanceUpdate",
    "MaintenanceResponse",
    "MaintenanceListResponse",
    "MaintenanceSchedule",
]
