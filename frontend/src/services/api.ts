import axios, { AxiosInstance } from 'axios';
import { mockApi, shouldUseMockApi } from './mockApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class RealApiService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  async getFleets(params?: Record<string, unknown>) {
    const r = await this.client.get('/fleets', { params });
    return r.data;
  }
  async getFleet(id: string) {
    const r = await this.client.get(`/fleets/${id}`);
    return r.data;
  }
  async getFleetStatistics(id: string) {
    const r = await this.client.get(`/fleets/${id}/statistics`);
    return r.data;
  }
  async createFleet(data: { name: string; description?: string }) {
    const r = await this.client.post('/fleets', data);
    return r.data;
  }
  async updateFleet(id: string, data: { name?: string; description?: string }) {
    const r = await this.client.put(`/fleets/${id}`, data);
    return r.data;
  }
  async deleteFleet(id: string) {
    const r = await this.client.delete(`/fleets/${id}`);
    return r.data;
  }
  async getBatteries(params?: Record<string, unknown>) {
    const r = await this.client.get('/batteries', { params });
    return r.data;
  }
  async getBatteryHealth() {
    const r = await this.client.get('/batteries/health');
    return r.data;
  }
  async getBattery(id: string) {
    const r = await this.client.get(`/batteries/${id}`);
    return r.data;
  }
  async getBatteryWithTelemetry(id: string) {
    const r = await this.client.get(`/batteries/${id}/with-telemetry`);
    return r.data;
  }
  async createBattery(data: Record<string, unknown>) {
    const r = await this.client.post('/batteries', data);
    return r.data;
  }
  async updateBattery(id: string, data: Record<string, unknown>) {
    const r = await this.client.put(`/batteries/${id}`, data);
    return r.data;
  }
  async deleteBattery(id: string) {
    const r = await this.client.delete(`/batteries/${id}`);
    return r.data;
  }
  async getTelemetry(batteryId: string, params?: Record<string, unknown>) {
    const r = await this.client.get(`/telemetry/${batteryId}`, { params });
    return r.data;
  }
  async getTelemetryStats(batteryId: string, hours?: number) {
    const r = await this.client.get(`/telemetry/${batteryId}/stats`, { params: { hours } });
    return r.data;
  }
  async getLatestTelemetry(batteryId: string) {
    const r = await this.client.get(`/telemetry/${batteryId}/latest`);
    return r.data;
  }
  async getLatestPredictions(batteryId: string) {
    const r = await this.client.get(`/predictions/${batteryId}/latest`);
    return r.data;
  }
  async getPredictions(batteryId: string, params?: Record<string, unknown>) {
    const r = await this.client.get(`/predictions/${batteryId}`, { params });
    return r.data;
  }
  async getPredictionExplanation(batteryId: string, predictionId: string) {
    const r = await this.client.get(`/predictions/${batteryId}/${predictionId}/explanation`);
    return r.data;
  }
  async getAlerts(params?: Record<string, unknown>) {
    const r = await this.client.get('/alerts', { params });
    return r.data;
  }
  async getAlertStatistics() {
    const r = await this.client.get('/alerts/statistics');
    return r.data;
  }
  async acknowledgeAlert(id: string) {
    const r = await this.client.put(`/alerts/${id}`, { status: 'acknowledged' });
    return r.data;
  }
  async resolveAlert(id: string) {
    const r = await this.client.put(`/alerts/${id}`, { status: 'resolved' });
    return r.data;
  }
  async getPassports() {
    const r = await this.client.get('/passports');
    return r.data;
  }
  async getPassport(id: string) {
    const r = await this.client.get(`/passports/${id}`);
    return r.data;
  }
  async getFullPassport(id: string) {
    const r = await this.client.get(`/passports/${id}/full`);
    return r.data;
  }
  async getPassportByBattery(batteryId: string) {
    const r = await this.client.get(`/passports/by-battery/${batteryId}`);
    return r.data;
  }
  async getDigitalTwin(batteryId: string) {
    const r = await this.client.get(`/digital-twins/${batteryId}`);
    return r.data;
  }
  async createDigitalTwin(data: Record<string, unknown>) {
    const r = await this.client.post('/digital-twins', data);
    return r.data;
  }
  async updateDigitalTwin(batteryId: string, data: Record<string, unknown>) {
    const r = await this.client.put(`/digital-twins/${batteryId}`, data);
    return r.data;
  }
}

let backendAvailable: boolean | null = null;

async function getApi() {
  if (backendAvailable === null) {
    backendAvailable = !(await shouldUseMockApi());
  }
  return backendAvailable ? new RealApiService() : mockApi;
}

// Proxy that delegates to real or mock
export const api = new Proxy({} as RealApiService, {
  get(_target, prop: string) {
    return async (...args: unknown[]) => {
      const apiInstance = await getApi();
      const method = (apiInstance as unknown as Record<string, (...a: unknown[]) => unknown>)[prop];
      if (typeof method === 'function') {
        return method.apply(apiInstance, args);
      }
      throw new Error(`Method ${String(prop)} not found`);
    };
  },
});
