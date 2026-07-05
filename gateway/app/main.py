"""
EdgeTwin-BMS+ Gateway
MQTT to REST bridge for ESP32 devices
"""

import json
import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt
import httpx
from loguru import logger
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "EdgeTwin-BMS+ Gateway"
    APP_VERSION: str = "1.0.0"
    MQTT_BROKER: str = "mosquitto"
    MQTT_PORT: int = 1883
    BACKEND_URL: str = "http://backend:8000"
    GATEWAY_PORT: int = 8001
    
    class Config:
        env_file = ".env"


settings = Settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MQTT Client
mqtt_client = mqtt.Client()

# WebSocket connections
active_connections: list[WebSocket] = []


@app.on_event("startup")
async def startup():
    """Initialize MQTT connection."""
    def on_connect(client, userdata, flags, rc):
        logger.info(f"Connected to MQTT broker with result code {rc}")
        # Subscribe to all device topics
        client.subscribe("edgetwin/+/telemetry")
        client.subscribe("edgetwin/+/alerts")
        client.subscribe("edgetwin/+/responses")
    
    def on_message(client, userdata, msg):
        """Handle incoming MQTT messages."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.info(f"Received message on {topic}: {payload['device_id']}")
            
            # Forward to backend
            asyncio.create_task(forward_to_backend(topic, payload))
            
            # Broadcast to WebSocket clients
            asyncio.create_task(broadcast_to_websockets(topic, payload))
            
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    try:
        mqtt_client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info("MQTT client started")
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup MQTT connection."""
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    logger.info("MQTT client stopped")


async def forward_to_backend(topic: str, payload: dict):
    """Forward MQTT message to backend API."""
    try:
        async with httpx.AsyncClient() as client:
            # Determine endpoint based on topic
            if "telemetry" in topic:
                response = await client.post(
                    f"{settings.BACKEND_URL}/api/v1/telemetry/{payload['device_id']}/ingest",
                    json=payload,
                    timeout=5.0,
                )
            elif "alerts" in topic:
                response = await client.post(
                    f"{settings.BACKEND_URL}/api/v1/alerts/ingest",
                    json=payload,
                    timeout=5.0,
                )
            else:
                logger.warning(f"Unknown topic: {topic}")
                return
            
            if response.status_code == 200:
                logger.debug(f"Forwarded message to backend: {response.status_code}")
            else:
                logger.warning(f"Backend returned status {response.status_code}: {response.text}")
                
    except httpx.RequestError as e:
        logger.error(f"Failed to forward message to backend: {e}")
    except Exception as e:
        logger.error(f"Error forwarding to backend: {e}")


async def broadcast_to_websockets(topic: str, payload: dict):
    """Broadcast message to connected WebSocket clients."""
    message = json.dumps({
        "topic": topic,
        "payload": payload,
    })
    
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except Exception:
            disconnected.append(connection)
    
    # Remove disconnected clients
    for conn in disconnected:
        active_connections.remove(conn)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mqtt_connected": mqtt_client.is_connected(),
    }


@app.post("/publish")
async def publish_message(topic: str, payload: dict):
    """Publish a message via MQTT."""
    try:
        mqtt_client.publish(topic, json.dumps(payload), qos=1)
        return {"status": "published", "topic": topic}
    except Exception as e:
        logger.error(f"Failed to publish message: {e}")
        return {"status": "error", "detail": str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")


if __name__ == "__main__":
    import uvicorn
    
    logger.remove()
    logger.add(
        stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
    )
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.GATEWAY_PORT,
        reload=True,
    )
