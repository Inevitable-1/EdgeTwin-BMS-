"""
EdgeTwin-BMS+ WebSocket Manager
"""

import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from loguru import logger


class ConnectionManager:
    """
    WebSocket connection manager for real-time updates.
    """
    
    def __init__(self):
        # Active connections: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Device connections: {battery_id: [websocket1, ...]}
        self.device_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        user_id: Optional[str] = None,
        battery_id: Optional[str] = None,
    ):
        """
        Accept and store a WebSocket connection.
        """
        await websocket.accept()
        
        if user_id:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            logger.info(f"User {user_id} connected via WebSocket")
        
        if battery_id:
            if battery_id not in self.device_connections:
                self.device_connections[battery_id] = []
            self.device_connections[battery_id].append(websocket)
            logger.info(f"Device {battery_id} connected via WebSocket")
    
    def disconnect(
        self,
        websocket: WebSocket,
        user_id: Optional[str] = None,
        battery_id: Optional[str] = None,
    ):
        """
        Remove a WebSocket connection.
        """
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                logger.info(f"User {user_id} disconnected from WebSocket")
        
        if battery_id and battery_id in self.device_connections:
            if websocket in self.device_connections[battery_id]:
                self.device_connections[battery_id].remove(websocket)
                if not self.device_connections[battery_id]:
                    del self.device_connections[battery_id]
                logger.info(f"Device {battery_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: str, user_id: str):
        """
        Send a message to a specific user.
        """
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")
    
    async def send_to_device(self, message: str, battery_id: str):
        """
        Send a message to a specific device.
        """
        if battery_id in self.device_connections:
            for connection in self.device_connections[battery_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to device {battery_id}: {e}")
    
    async def broadcast(self, message: str):
        """
        Broadcast a message to all connected users.
        """
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast to user {user_id}: {e}")
    
    async def broadcast_telemetry(self, battery_id: str, data: dict):
        """
        Broadcast telemetry data to all users monitoring a battery.
        """
        message = json.dumps({
            "type": "telemetry",
            "battery_id": battery_id,
            "data": data,
        })
        await self.broadcast(message)
    
    async def broadcast_alert(self, alert_data: dict):
        """
        Broadcast an alert to all connected users.
        """
        message = json.dumps({
            "type": "alert",
            "data": alert_data,
        })
        await self.broadcast(message)
    
    async def broadcast_prediction(self, battery_id: str, prediction_data: dict):
        """
        Broadcast a prediction to all users monitoring a battery.
        """
        message = json.dumps({
            "type": "prediction",
            "battery_id": battery_id,
            "data": prediction_data,
        })
        await self.broadcast(message)
    
    def get_connected_users(self) -> List[str]:
        """
        Get list of connected user IDs.
        """
        return list(self.active_connections.keys())
    
    def get_connected_devices(self) -> List[str]:
        """
        Get list of connected device IDs.
        """
        return list(self.device_connections.keys())
    
    def get_user_connection_count(self, user_id: str) -> int:
        """
        Get the number of connections for a user.
        """
        return len(self.active_connections.get(user_id, []))
