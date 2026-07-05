"""
EdgeTwin-BMS+ MQTT Service
"""

import json
import asyncio
from typing import Optional, Callable
from datetime import datetime
import paho.mqtt.client as mqtt
from loguru import logger
import redis.asyncio as redis

from app.core.config import settings


class MQTTService:
    """
    MQTT service for receiving telemetry and publishing commands.
    """
    
    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.connected = False
        self.redis_client: Optional[redis.Redis] = None
        self.message_handlers: dict[str, list[Callable]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None
    
    async def initialize(self):
        """Initialize MQTT client and Redis connection."""
        self._loop = asyncio.get_event_loop()
        
        # Initialize Redis for offline buffering
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
            )
            await self.redis_client.ping()
            logger.info("Redis connected for MQTT buffering")
        except Exception as e:
            logger.warning(f"Redis not available for buffering: {e}")
        
        # Initialize MQTT client
        self.client = mqtt.Client(
            client_id=settings.MQTT_CLIENT_ID,
            protocol=mqtt.MQTTv311,
        )
        
        if settings.MQTT_USERNAME:
            self.client.username_pw_set(
                settings.MQTT_USERNAME,
                settings.MQTT_PASSWORD,
            )
        
        # Set callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        # Set last will
        self.client.will_set(
            "edgetwin/backend/status",
            payload=json.dumps({"status": "offline", "timestamp": datetime.utcnow().isoformat()}),
            qos=1,
            retain=True,
        )
        
        # Connect to broker
        try:
            self.client.connect(
                settings.MQTT_BROKER,
                settings.MQTT_PORT,
                settings.MQTT_KEEPALIVE,
            )
            self.client.loop_start()
            logger.info(f"MQTT client connecting to {settings.MQTT_BROKER}:{settings.MQTT_PORT}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
    
    def _on_connect(self, client, userdata, flags, rc):
        """Handle MQTT connection."""
        if rc == 0:
            self.connected = True
            logger.info("Connected to MQTT broker")
            
            # Subscribe to topics
            client.subscribe(settings.MQTT_TELEMETRY_TOPIC, settings.MQTT_QOS)
            client.subscribe(settings.MQTT_ALERTS_TOPIC, settings.MQTT_QOS)
            
            # Publish online status
            client.publish(
                "edgetwin/backend/status",
                payload=json.dumps({"status": "online", "timestamp": datetime.utcnow().isoformat()}),
                qos=1,
                retain=True,
            )
        else:
            logger.error(f"MQTT connection failed with code {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Handle MQTT disconnection."""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected MQTT disconnection (rc={rc})")
    
    def _on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            logger.debug(f"Received MQTT message on {topic}")
            
            # Schedule async handler
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self._process_message(topic, payload),
                    self._loop,
                )
            else:
                # Buffer message if no event loop
                self._buffer_message(topic, payload)
                
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    async def _process_message(self, topic: str, payload: dict):
        """Process incoming MQTT message."""
        try:
            # Extract device_id from topic
            parts = topic.split("/")
            if len(parts) >= 2:
                device_id = parts[1]
            else:
                device_id = "unknown"
            
            # Add metadata
            payload["received_at"] = datetime.utcnow().isoformat()
            payload["mqtt_topic"] = topic
            
            # Call registered handlers
            for handler in self.message_handlers.get(topic, []):
                try:
                    await handler(device_id, payload)
                except Exception as e:
                    logger.error(f"Handler error for {topic}: {e}")
            
            # Also call wildcard handlers
            for pattern, handlers in self.message_handlers.items():
                if pattern.endswith("+") or pattern.endswith("#"):
                    if self._topic_matches(pattern, topic):
                        for handler in handlers:
                            try:
                                await handler(device_id, payload)
                            except Exception as e:
                                logger.error(f"Wildcard handler error: {e}")
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def _topic_matches(self, pattern: str, topic: str) -> bool:
        """Check if topic matches pattern."""
        pattern_parts = pattern.split("/")
        topic_parts = topic.split("/")
        
        for i, part in enumerate(pattern_parts):
            if part == "#":
                return True
            if part == "+":
                continue
            if i >= len(topic_parts) or part != topic_parts[i]:
                return False
        
        return len(pattern_parts) == len(topic_parts)
    
    def _buffer_message(self, topic: str, payload: dict):
        """Buffer message to Redis for later processing."""
        if self.redis_client:
            try:
                self.redis_client.lpush(
                    "mqtt:buffer",
                    json.dumps({"topic": topic, "payload": payload}),
                )
                self.redis_client.ltrim("mqtt:buffer", 0, 999)
            except Exception as e:
                logger.error(f"Failed to buffer message: {e}")
    
    def register_handler(self, topic_pattern: str, handler: Callable):
        """Register a message handler for a topic pattern."""
        if topic_pattern not in self.message_handlers:
            self.message_handlers[topic_pattern] = []
        self.message_handlers[topic_pattern].append(handler)
        logger.info(f"Registered handler for {topic_pattern}")
    
    def publish(self, topic: str, payload: dict, qos: int = 1, retain: bool = False):
        """Publish a message to MQTT."""
        if not self.connected or not self.client:
            logger.warning("MQTT not connected, buffering message")
            self._buffer_message(topic, payload)
            return False
        
        try:
            message = json.dumps(payload)
            result = self.client.publish(topic, message, qos=qos, retain=retain)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.debug(f"Published to {topic}")
                return True
            else:
                logger.error(f"Failed to publish to {topic}: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing to {topic}: {e}")
            return False
    
    async def publish_command(self, device_id: str, command: str, params: dict = None):
        """Publish a command to a device."""
        topic = f"edgetwin/{device_id}/commands"
        payload = {
            "command": command,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if params:
            payload["params"] = params
        
        return self.publish(topic, payload)
    
    async def shutdown(self):
        """Shutdown MQTT client."""
        if self.client:
            # Publish offline status
            self.publish(
                "edgetwin/backend/status",
                {"status": "offline", "timestamp": datetime.utcnow().isoformat()},
                retain=True,
            )
            
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT client disconnected")
        
        if self.redis_client:
            await self.redis_client.close()


# Global instance
mqtt_service = MQTTService()
