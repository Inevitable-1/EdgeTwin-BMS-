"""
EdgeTwin-BMS+ Test Fixtures
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient


@pytest.fixture
def client():
    """Create a test client."""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def sample_battery_data():
    """Sample battery data for testing."""
    return {
        "battery_id": "BT-TEST-001",
        "manufacturer": "Test Manufacturer",
        "model": "Test Model",
        "chemistry": "NMC",
        "capacity_kwh": 60.0,
        "nominal_voltage": 355.2,
        "max_current": 200,
    }


@pytest.fixture
def sample_telemetry_data():
    """Sample telemetry data for testing."""
    return {
        "voltage": 350.0,
        "current": 50.0,
        "temperature": 32.5,
        "soc": 75.0,
        "soh": 95.0,
        "power": 17.5,
    }
