from fastapi import APIRouter, HTTPException
from typing import Dict

router = APIRouter(prefix="/api/v1", tags=["stations"])

MOCK_STATIONS_DATA: Dict[str, dict] = {
    "NDLS": {
        "station_id": "NDLS",
        "station_name": "New Delhi Central Railway Hub",
        "platforms_count": 16,
        "active_trains_count": 8,
        "manifest": [
            {"train_id": "TR-801", "platform": 4, "type": "PASSENGER", "eta": "10:15 AM", "status": "INBOUND", "delay_min": 3},
            {"train_id": "TR-202", "platform": 1, "type": "EXPRESS", "eta": "10:30 AM", "status": "OUTBOUND", "delay_min": 0},
            {"train_id": "TR-909", "platform": 7, "type": "SUPERFAST", "eta": "11:00 AM", "status": "INBOUND", "delay_min": -1},
            {"train_id": "TR-102", "platform": 12, "type": "FREIGHT", "eta": "11:45 AM", "status": "OUTBOUND", "delay_min": 15},
        ]
    },
    "CSTM": {
        "station_id": "CSTM",
        "station_name": "Mumbai CSMT Junction",
        "platforms_count": 18,
        "active_trains_count": 12,
        "manifest": [
            {"train_id": "TR-404", "platform": 2, "type": "FREIGHT", "eta": "09:45 AM", "status": "OUTBOUND", "delay_min": 14},
            {"train_id": "TR-505", "platform": 5, "type": "PASSENGER", "eta": "10:00 AM", "status": "INBOUND", "delay_min": 2},
        ]
    }
}

@router.get("/stations/{station_id}")
async def get_station_manifest(station_id: str):
    """GET /api/v1/stations/{id}: Fetch inbound/outbound train ETAs and manifest."""
    upper_id = station_id.upper()
    if upper_id in MOCK_STATIONS_DATA:
        return MOCK_STATIONS_DATA[upper_id]
    
    # Generic dynamic station manifest fallback
    return {
        "station_id": upper_id,
        "station_name": f"Station {upper_id} Junction",
        "platforms_count": 10,
        "active_trains_count": 4,
        "manifest": [
            {"train_id": "TR-801", "platform": 1, "type": "PASSENGER", "eta": "10:15 AM", "status": "INBOUND", "delay_min": 2},
            {"train_id": "TR-404", "platform": 3, "type": "FREIGHT", "eta": "10:45 AM", "status": "OUTBOUND", "delay_min": 10},
            {"train_id": "TR-909", "platform": 5, "type": "SUPERFAST", "eta": "11:30 AM", "status": "INBOUND", "delay_min": 0},
        ]
    }
