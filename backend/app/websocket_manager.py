import asyncio
import json
import math
import random
from datetime import datetime
from typing import List, Dict
from fastapi import WebSocket

class TelemetryConnectionManager:
    """Manages active WebSockets and streams live telemetry simulation to connected clients."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # Initial simulation coordinates for active trains
        self.mock_trains: Dict[str, dict] = {
            "TR-801": {"lat": 28.6139, "lng": 77.2090, "speed": 112.5, "weight": 2450.0, "passengers": 420, "angle": 0.0, "status": "ON_TIME"},
            "TR-404": {"lat": 19.0760, "lng": 72.8777, "speed": 98.0, "weight": 3800.0, "passengers": 120, "angle": 1.2, "status": "DELAYED"},
            "TR-909": {"lat": 13.0827, "lng": 80.2707, "speed": 135.0, "weight": 1850.0, "passengers": 650, "angle": 2.5, "status": "CRITICAL"},
            "TR-102": {"lat": 22.5726, "lng": 88.3639, "speed": 85.2, "weight": 4100.0, "passengers": 0, "angle": 0.8, "status": "ON_TIME"},
        }

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

    async def start_simulation_loop(self):
        """Generates continuous mock spatial telemetry for all active trains."""
        while True:
            await asyncio.sleep(1.0)
            if not self.active_connections:
                continue

            telemetry_payload = []
            now_iso = datetime.utcnow().isoformat()

            for train_id, state in self.mock_trains.items():
                # Simulate movement along trajectory
                state["angle"] += 0.02
                delta_lat = 0.0015 * math.cos(state["angle"])
                delta_lng = 0.0015 * math.sin(state["angle"])
                
                state["lat"] += delta_lat
                state["lng"] += delta_lng
                state["speed"] = max(40.0, min(160.0, state["speed"] + random.uniform(-2.5, 2.5)))
                state["passengers"] = max(0, state["passengers"] + random.randint(-2, 2))

                telemetry_payload.append({
                    "train_id": train_id,
                    "latitude": round(state["lat"], 6),
                    "longitude": round(state["lng"], 6),
                    "current_speed": round(state["speed"], 1),
                    "current_weight": state["weight"],
                    "passenger_count": state["passengers"],
                    "status": state["status"],
                    "timestamp": now_iso
                })

            await self.broadcast({"type": "TELEMETRY_UPDATE", "data": telemetry_payload})

manager = TelemetryConnectionManager()
