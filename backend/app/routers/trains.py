from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from datetime import datetime, timedelta
from app.schemas import ScheduleResponse, TelemetryData

router = APIRouter(prefix="/api/v1", tags=["trains"])

# Mock static database records for route & telemetry
MOCK_TRAIN_ROUTES: Dict[str, dict] = {
    "TR-801": {
        "train_id": "TR-801",
        "locomotive_model": "Vande Bharat Express (Class 18)",
        "max_speed_limit": 160.0,
        "max_capacity": 1128,
        "max_weight": 3000.0,
        "current_weight": 2450.0,
        "passenger_count": 420,
        "current_speed": 112.5,
        "delay_delta_minutes": +3.5,
        "route_waypoints": [
            {"station_id": "NDLS", "station_name": "New Delhi Central", "eta": "10:00 AM", "status": "COMPLETED"},
            {"station_id": "CNB", "station_name": "Kanpur Central", "eta": "02:15 PM", "status": "IN_TRANSIT"},
            {"station_id": "PRYJ", "station_name": "Prayagraj Junction", "eta": "05:00 PM", "status": "SCHEDULED"},
            {"station_id": "BSB", "station_name": "Varanasi Junction", "eta": "07:30 PM", "status": "SCHEDULED"},
        ]
    },
    "TR-404": {
        "train_id": "TR-404",
        "locomotive_model": "WAP-7 Heavy Freight Locomotive",
        "max_speed_limit": 110.0,
        "max_capacity": 0,
        "max_weight": 4500.0,
        "current_weight": 3800.0,
        "passenger_count": 0,
        "current_speed": 98.0,
        "delay_delta_minutes": +14.2,
        "route_waypoints": [
            {"station_id": "CSTM", "station_name": "Mumbai CSMT", "eta": "06:00 AM", "status": "COMPLETED"},
            {"station_id": "KYN", "station_name": "Kalyan Junction", "eta": "07:45 AM", "status": "COMPLETED"},
            {"station_id": "PUNE", "station_name": "Pune Junction", "eta": "11:30 AM", "status": "IN_TRANSIT"},
            {"station_id": "SUR", "station_name": "Solapur", "eta": "04:20 PM", "status": "SCHEDULED"},
        ]
    },
    "TR-909": {
        "train_id": "TR-909",
        "locomotive_model": "Rajdhani Superfast Express",
        "max_speed_limit": 140.0,
        "max_capacity": 950,
        "max_weight": 2200.0,
        "current_weight": 1850.0,
        "passenger_count": 650,
        "current_speed": 135.0,
        "delay_delta_minutes": -1.0,
        "route_waypoints": [
            {"station_id": "MAS", "station_name": "Chennai Central", "eta": "08:00 AM", "status": "COMPLETED"},
            {"station_id": "BZA", "station_name": "Vijayawada", "eta": "01:30 PM", "status": "IN_TRANSIT"},
            {"station_id": "BPQ", "station_name": "Balharshah", "eta": "07:00 PM", "status": "SCHEDULED"},
            {"station_id": "NGP", "station_name": "Nagpur Junction", "eta": "10:15 PM", "status": "SCHEDULED"},
        ]
    },
    "TR-102": {
        "train_id": "TR-102",
        "locomotive_model": "WAG-9 High Train Weight or Total Load Goods",
        "max_speed_limit": 100.0,
        "max_capacity": 0,
        "max_weight": 5000.0,
        "current_weight": 4100.0,
        "passenger_count": 0,
        "current_speed": 85.2,
        "delay_delta_minutes": 0.0,
        "route_waypoints": [
            {"station_id": "HWH", "station_name": "Howrah Junction", "eta": "05:00 AM", "status": "COMPLETED"},
            {"station_id": "DGR", "station_name": "Durgapur", "eta": "08:30 AM", "status": "IN_TRANSIT"},
            {"station_id": "DHN", "station_name": "Dhanbad Junction", "eta": "11:00 AM", "status": "SCHEDULED"},
        ]
    }
}

@router.get("/trains/{train_id}/route")
async def get_train_route(train_id: str):
    """GET /api/v1/trains/{id}/route: Fetch static route schedule and historical data."""
    if train_id in MOCK_TRAIN_ROUTES:
        return MOCK_TRAIN_ROUTES[train_id]
    
    # Generic fallback dynamic mock response for unlisted train IDs
    return {
        "train_id": train_id,
        "locomotive_model": "Standard Express (Class 12)",
        "max_speed_limit": 120.0,
        "max_capacity": 800,
        "max_weight": 3000.0,
        "current_weight": 2100.0,
        "passenger_count": 350,
        "current_speed": 95.0,
        "delay_delta_minutes": 0.0,
        "route_waypoints": [
            {"station_id": "STN-A", "station_name": "Terminal Alpha", "eta": "09:00 AM", "status": "COMPLETED"},
            {"station_id": "STN-B", "station_name": "Central Sector B", "eta": "12:00 PM", "status": "IN_TRANSIT"},
            {"station_id": "STN-C", "station_name": "Terminal Charlie", "eta": "03:00 PM", "status": "SCHEDULED"},
        ]
    }
