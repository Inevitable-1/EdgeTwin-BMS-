#!/usr/bin/env python3
"""
EdgeTwin-BMS+ Battery Data Simulator
Generates realistic battery telemetry data for demo purposes.
"""

import json
import time
import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import paho.mqtt.client as mqtt

class BatterySimulator:
    """Simulates realistic battery behavior for demo."""
    
    def __init__(self, battery_id: str = "BT-2024-001"):
        self.battery_id = battery_id
        self.soh = random.uniform(75, 95)  # State of Health
        self.soc = random.uniform(20, 90)  # State of Charge
        self.temperature = 25.0
        self.voltage = 355.2  # Nominal pack voltage
        self.current = 0.0
        self.cycle_count = random.randint(500, 2000)
        self.time_elapsed = 0
        
        # Cell-level data (40 cells: 5S8P)
        self.cell_voltages = [random.uniform(3.6, 3.8) for _ in range(40)]
        self.cell_temperatures = [random.uniform(24, 28) for _ in range(40)]
        
        # Simulation state
        self.charging = False
        self.driving = False
        self.anomaly_active = False
        
    def simulate_charging(self, duration_seconds: int = 300):
        """Simulate a charging session."""
        self.charging = True
        self.current = random.uniform(20, 50)  # Amps
        
        for _ in range(duration_seconds):
            self.time_elapsed += 1
            
            # SOC increases
            self.soc = min(100, self.soc + 0.05)
            
            # Temperature rises during charging
            heat_generation = self.current * 0.1
            self.temperature += heat_generation * 0.01
            
            # Cell voltages increase
            for i in range(40):
                self.cell_voltages[i] = min(4.2, self.cell_voltages[i] + 0.001)
                self.cell_temperatures[i] += heat_generation * 0.005
            
            yield self.get_telemetry()
            
    def simulate_driving(self, duration_seconds: int = 600, style: str = "normal"):
        """Simulate driving with different styles."""
        self.driving = True
        self.charging = False
        
        # Current draw based on driving style
        current_draw = {"eco": 15, "normal": 30, "sport": 50}
        self.current = -current_draw.get(style, 30)  # Negative for discharge
        
        for _ in range(duration_seconds):
            self.time_elapsed += 1
            
            # SOC decreases
            self.soc = max(0, self.soc - 0.02)
            
            # Temperature varies
            self.temperature += random.uniform(-0.1, 0.2)
            self.temperature = max(20, min(50, self.temperature))
            
            # Cell voltages decrease with variation
            for i in range(40):
                discharge_rate = 0.0005 + random.uniform(-0.0001, 0.0001)
                self.cell_voltages[i] = max(3.0, self.cell_voltages[i] - discharge_rate)
                self.cell_temperatures[i] = self.temperature + random.uniform(-2, 2)
            
            yield self.get_telemetry()
    
    def simulate_thermal_event(self, duration_seconds: int = 120):
        """Simulate a thermal event for demo."""
        self.anomaly_active = True
        source_cell = random.randint(0, 39)
        
        for i in range(duration_seconds):
            self.time_elapsed += 1
            
            # Source cell temperature rises rapidly
            heat_rate = 0.5 + (i / duration_seconds) * 2
            self.cell_temperatures[source_cell] += heat_rate
            
            # Heat propagates to neighbors
            for j in range(40):
                if j != source_cell:
                    distance = abs(j - source_cell)
                    propagation = heat_rate / (distance + 1)
                    self.cell_temperatures[j] += propagation * 0.1
            
            # Overall temperature rises
            self.temperature = max(self.cell_temperatures)
            
            # Voltage drops
            self.voltage = self.voltage * 0.999
            
            yield self.get_telemetry()
            
        self.anomaly_active = False
        
    def get_telemetry(self) -> Dict:
        """Get current telemetry data."""
        # Calculate thermal risk
        max_temp = max(self.cell_temperatures)
        thermal_risk = min(100, max(0, (max_temp - 30) * 2.5))
        
        # Calculate anomaly score
        voltage_std = self._calculate_voltage_std()
        anomaly_score = min(1.0, voltage_std * 10 + (thermal_risk / 100) * 0.3)
        
        # Calculate RUL
        rul = max(0, (self.soh / 100) * 5000 - self.cycle_count)
        
        return {
            "device_id": self.battery_id,
            "timestamp": datetime.now().isoformat(),
            "voltage": round(self.voltage, 2),
            "current": round(self.current, 2),
            "temperature": round(self.temperature, 2),
            "soc": round(self.soc, 2),
            "soh": round(self.soh, 2),
            "power": round(abs(self.voltage * self.current), 2),
            "cycle_count": self.cycle_count,
            "rul": round(rul, 0),
            "thermal_risk": round(thermal_risk, 2),
            "anomaly_score": round(anomaly_score, 4),
            "cell_voltages": [round(v, 3) for v in self.cell_voltages],
            "cell_temperatures": [round(t, 2) for t in self.cell_temperatures],
            "charging": self.charging,
            "driving": self.driving,
            "anomaly_active": self.anomaly_active
        }
    
    def _calculate_voltage_std(self) -> float:
        """Calculate voltage standard deviation across cells."""
        mean_v = sum(self.cell_voltages) / len(self.cell_voltages)
        variance = sum((v - mean_v) ** 2 for v in self.cell_voltages) / len(self.cell_voltages)
        return math.sqrt(variance)
    
    def get_passport(self) -> Dict:
        """Get battery passport data."""
        return {
            "battery_id": self.battery_id,
            "manufacturer": "Tata Autocomp",
            "chemistry": "NMC 811",
            "capacity_kwh": 75.0,
            "nominal_voltage": 355.2,
            "manufacturing_date": "2024-01-15",
            "warranty_status": "ACTIVE",
            "warranty_expiry": "2032-01-15",
            "cycle_count": self.cycle_count,
            "soh": round(self.soh, 2),
            "predicted_rul_cycles": int(self.get_telemetry()["rul"]),
            "fast_charge_count": random.randint(100, 500),
            "total_energy_throughput": round(self.cycle_count * 75 * 0.8, 2),
            "carbon_footprint_kg": round(self.cycle_count * 75 * 0.5 * 0.001, 2),
            "second_life_eligible": self.soh > 40,
            "recycling_recommended": self.soh < 20,
            "end_of_life_status": "ACTIVE" if self.soh > 20 else "RECYCLING",
            "maintenance_history": [
                {"date": "2024-06-15", "type": "inspection", "cost": 2000},
                {"date": "2024-12-01", "type": "balancing", "cost": 500},
                {"date": "2025-03-10", "type": "thermal_service", "cost": 5000}
            ]
        }


class MQTTPublisher:
    """Publishes simulated data via MQTT."""
    
    def __init__(self, broker: str = "localhost", port: int = 1883):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.connect(broker, port, 60)
        self.client.loop_start()
        
    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        
    def publish(self, topic: str, data: Dict):
        """Publish data to MQTT topic."""
        payload = json.dumps(data)
        self.client.publish(topic, payload, qos=1)
        
    def stop(self):
        """Stop the MQTT client."""
        self.client.loop_stop()
        self.client.disconnect()


def main():
    """Main simulation loop."""
    print("=" * 60)
    print("EdgeTwin-BMS+ Battery Simulator")
    print("=" * 60)
    
    # Initialize simulator and MQTT publisher
    simulator = BatterySimulator("BT-2024-001")
    publisher = MQTTPublisher()
    
    print("\nSimulation Modes:")
    print("1. Normal Operation (Charging + Driving)")
    print("2. Thermal Event Simulation")
    print("3. Continuous Monitoring")
    
    mode = input("\nSelect mode (1-3): ").strip()
    
    try:
        if mode == "1":
            # Charging then driving
            print("\n--- Charging Phase ---")
            for telemetry in simulator.simulate_charging(duration_seconds=60):
                publisher.publish("edgetwin/telemetry", telemetry)
                print(f"\rSOC: {telemetry['soc']:.1f}% | Temp: {telemetry['temperature']:.1f}°C", end="")
                time.sleep(0.1)
            
            print("\n\n--- Driving Phase (Normal) ---")
            for telemetry in simulator.simulate_driving(duration_seconds=120, style="normal"):
                publisher.publish("edgetwin/telemetry", telemetry)
                print(f"\rSOC: {telemetry['soc']:.1f}% | Temp: {telemetry['temperature']:.1f}°C", end="")
                time.sleep(0.1)
                
        elif mode == "2":
            # Thermal event
            print("\n--- Thermal Event Simulation ---")
            print("⚠️  WARNING: Simulating thermal runaway scenario")
            for telemetry in simulator.simulate_thermal_event(duration_seconds=100):
                publisher.publish("edgetwin/telemetry", telemetry)
                risk = telemetry['thermal_risk']
                temp = telemetry['temperature']
                print(f"\rTemp: {temp:.1f}°C | Risk: {risk:.1f}% | Anomaly: {telemetry['anomaly_score']:.3f}", end="")
                if risk > 80:
                    print("\n🚨 CRITICAL: Thermal runaway imminent!")
                time.sleep(0.1)
                
        elif mode == "3":
            # Continuous monitoring
            print("\n--- Continuous Monitoring ---")
            print("Press Ctrl+C to stop")
            while True:
                telemetry = simulator.get_telemetry()
                publisher.publish("edgetwin/telemetry", telemetry)
                print(f"\rTime: {simulator.time_elapsed}s | SOC: {telemetry['soc']:.1f}% | SOH: {telemetry['soh']:.1f}%", end="")
                time.sleep(0.1)
                
    except KeyboardInterrupt:
        print("\n\nSimulation stopped.")
    finally:
        publisher.stop()
        print("MQTT client disconnected.")


if __name__ == "__main__":
    main()
