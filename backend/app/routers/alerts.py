from fastapi import APIRouter, status
from datetime import datetime
from app.schemas import AlertTrigger

router = APIRouter(prefix="/api/v1", tags=["alerts"])

# In-memory log of submitted alerts for development display
SYSTEM_ALERTS_LOG = [
    {
        "id": "ALT-1001",
        "train_id": "TR-404",
        "alert_type": "SPEED_VIOLATION",
        "severity": "CRITICAL",
        "description": "Locomotive exceeded track curved threshold by +12 km/h at Switch Sector B-4.",
        "location": "Kalyan Outer Line #3",
        "timestamp": "2026-08-17T15:20:00"
    },
    {
        "id": "ALT-1002",
        "train_id": "TR-801",
        "alert_type": "SIGNAL_DELAY",
        "severity": "WARNING",
        "description": "Holding on automatic block signal #142 due to clearance delay ahead.",
        "location": "Kanpur Central Approach",
        "timestamp": "2026-08-17T15:25:30"
    }
]

@router.get("/alerts")
async def get_all_alerts():
    """Fetch active system alerts log."""
    return SYSTEM_ALERTS_LOG

@router.post("/alerts/trigger", status_code=status.HTTP_201_CREATED)
async def trigger_anomaly_alert(payload: AlertTrigger):
    """POST /api/v1/alerts/trigger: Log tracking anomalies or manual overrides."""
    new_alert = {
        "id": f"ALT-{len(SYSTEM_ALERTS_LOG) + 1001}",
        "train_id": payload.train_id,
        "alert_type": payload.alert_type,
        "severity": payload.severity,
        "description": payload.description,
        "location": payload.location,
        "timestamp": datetime.utcnow().isoformat()
    }
    SYSTEM_ALERTS_LOG.insert(0, new_alert)
    return {
        "message": "Anomaly alert successfully logged to central dispatch console",
        "alert": new_alert
    }
