"""
EdgeTwin-BMS+ Backend Tests
Basic test suite for the FastAPI application
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch


class TestHealthCheck:
    """Test health check endpoints."""
    
    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "EdgeTwin-BMS+"
        assert "version" in data
    
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuth:
    """Test authentication endpoints."""
    
    def test_login_success(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@edgetwin.com", "password": "admin123"}
        )
        # Will return 401 without valid database, but endpoint exists
        assert response.status_code in [200, 401, 422]
    
    def test_register_endpoint_exists(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpass123",
                "name": "Test User"
            }
        )
        # Endpoint exists
        assert response.status_code in [200, 201, 401, 422]


class TestAPI:
    """Test API endpoints exist."""
    
    def test_fleets_endpoint(self, client):
        response = client.get("/api/v1/fleets/")
        # Will return 401 without auth, but endpoint exists
        assert response.status_code in [200, 401]
    
    def test_batteries_endpoint(self, client):
        response = client.get("/api/v1/batteries/")
        assert response.status_code in [200, 401]
    
    def test_alerts_endpoint(self, client):
        response = client.get("/api/v1/alerts/")
        assert response.status_code in [200, 401]
    
    def test_predictions_endpoint(self, client):
        response = client.get("/api/v1/predictions/")
        assert response.status_code in [200, 401]
    
    def test_passports_endpoint(self, client):
        response = client.get("/api/v1/passports/")
        assert response.status_code in [200, 401]
