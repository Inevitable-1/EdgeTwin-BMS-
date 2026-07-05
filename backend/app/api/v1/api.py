"""
EdgeTwin-BMS+ API Router
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, fleets, batteries, telemetry, predictions, alerts, passports, maintenance, digital_twins, websocket

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(fleets.router, prefix="/fleets", tags=["Fleets"])
api_router.include_router(batteries.router, prefix="/batteries", tags=["Batteries"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(passports.router, prefix="/passports", tags=["Battery Passports"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"])
api_router.include_router(digital_twins.router, prefix="/digital-twins", tags=["Digital Twins"])
api_router.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
