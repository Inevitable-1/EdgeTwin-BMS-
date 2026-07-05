"""
EdgeTwin-BMS+ WebSocket Endpoints
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Request
from loguru import logger

router = APIRouter()


def _get_manager(request: Request):
    return request.app.state.connection_manager


@router.websocket("/telemetry/{battery_id}")
async def websocket_telemetry(
    websocket: WebSocket,
    battery_id: UUID,
    token: Optional[str] = Query(None),
    request: Request = None,
):
    """
    WebSocket endpoint for real-time telemetry data.
    """
    manager = _get_manager(websocket.scope.get("app"))
    
    await manager.connect(
        websocket,
        battery_id=str(battery_id),
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
            
            elif data.startswith("subscribe:"):
                topic = data.split(":")[1]
                logger.info(f"Client subscribed to {topic} for battery {battery_id}")
                await websocket.send_text(f"subscribed:{topic}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, battery_id=str(battery_id))
        logger.info(f"Client disconnected from telemetry WebSocket for battery {battery_id}")


@router.websocket("/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time alerts.
    """
    manager = websocket.scope["app"].state.connection_manager
    
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from alerts WebSocket")


@router.websocket("/dashboard")
async def websocket_dashboard(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for dashboard updates.
    """
    manager = websocket.scope["app"].state.connection_manager
    
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from dashboard WebSocket")


@router.websocket("/predictions/{battery_id}")
async def websocket_predictions(
    websocket: WebSocket,
    battery_id: UUID,
    token: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time predictions.
    """
    manager = websocket.scope["app"].state.connection_manager
    
    await manager.connect(
        websocket,
        battery_id=str(battery_id),
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, battery_id=str(battery_id))
        logger.info(f"Client disconnected from predictions WebSocket for battery {battery_id}")
