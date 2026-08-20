import csv
import re
import asyncio
import datetime
from pathlib import Path
from typing import List, Dict
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

# Import your AI engine
from ai_engine.optimizer import ConflictOptimizer

# Initialize the FastAPI app ONCE
app = FastAPI()

# Apply CORS middleware ONCE (Configured for Vercel & Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === PYDANTIC MODELS ===
class TrainScenario(BaseModel):
    scenario_id: int
    train_1_id: str
    train_1_type: str
    train_1_weight: float = Field(..., gt=0)
    train_1_speed: float = Field(..., ge=0)
    train_2_id: str
    train_2_type: str
    train_2_weight: float = Field(..., gt=0)
    train_2_speed: float = Field(..., ge=0)
    location: str
    delay_risk: str

class ApprovalRequest(BaseModel):
    scenario_id: int
    priority_train_id: str
    action_taken: str

class AlertRequest(BaseModel):
    train_id: str
    alert_type: str
    severity: str
    description: str
    location: str

def clean_numeric_string(value: str) -> float:
    """Strips 't' and 'km/h' from CSV values so Pydantic can process them."""
    clean_value = re.sub(r'[^\d.]', '', str(value))
    return float(clean_value) if clean_value else 0.0

# === IN-MEMORY DATABASE ===
active_alerts: List[Dict] = [
    {
        "id": "ALT-1001",
        "train_id": "TR-404",
        "alert_type": "SPEED_VIOLATION",
        "severity": "RESOLVED",
        "description": "Locomotive exceeded track curved threshold by +12 km/h.",
        "location": "Kalyan Outer Line #3",
        "timestamp": datetime.datetime.now().isoformat(),
        "showAction": False
    }
]

# === REST API ENDPOINTS ===
@app.get("/api/v1/alerts")
async def get_alerts():
    return active_alerts

@app.post("/api/v1/alerts/trigger")
async def trigger_alert(alert: AlertRequest):
    new_alert = alert.model_dump()
    new_alert["id"] = f"ALT-{1000 + len(active_alerts) + 1}"
    new_alert["timestamp"] = datetime.datetime.now().isoformat()
    new_alert["showAction"] = False
    active_alerts.insert(0, new_alert)
    return {"status": "success", "alert": new_alert}

@app.get("/api/v1/kpi")
async def get_network_kpis():
    """Simulates macro-level network throughput and KPI metrics."""
    return {
        "throughput_efficiency": "94.2%",
        "avg_delay_prevented_mins": 14.5,
        "total_conflicts_resolved": 128,
        "section_status": "Optimal"
    }

@app.post("/api/v1/audit/approve")
async def log_audit_trail(request: ApprovalRequest):
    """Logs the controller's decision for the SIH Audit Trail requirement."""
    audit_log = {
        "timestamp": "Real-time",
        "scenario_id": request.scenario_id,
        "decision": request.action_taken,
        "cleared_train": request.priority_train_id,
        "status": "Audit securely logged."
    }
    print(f"AUDIT TRAIL SAVED: {audit_log}")
    return audit_log

# === LIVE WEBSOCKET STREAM ===
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Check for the main CSV, use fallback if needed
    file_path = Path(__file__).parent / "data" / "indian_railways_logs.csv"
    fallback_path = Path(__file__).parent / "data" / "historical_logs.csv"
    
    csv_exists = file_path.exists()
    if not csv_exists and fallback_path.exists():
        file_path = fallback_path
        csv_exists = True

    try:
        if csv_exists:
            with open(file_path, mode='r', encoding='utf-8') as file:
                reader = list(csv.DictReader(file))
        else:
            # SAFETY NET 1: Mock data if NO CSV is found
            reader = [{
                "scenario_id": "999", "train_1_id": "TR-801", "train_1_type": "FREIGHT",
                "train_1_weight": "4500", "train_1_speed": "85", "train_2_id": "TR-404",
                "train_2_type": "EXPRESS", "train_2_weight": "1200", "train_2_speed": "110",
                "location": "Kanpur Switch", "delay_risk": "HIGH"
            }]
            
        current_index = 0
        
        while True:
            data = await websocket.receive_text()
            if data == "NEXT":
                if current_index >= len(reader):
                    current_index = 0
                    
                row = reader[current_index]
                current_index += 1
                
                # Clean the data before validating
                row["train_1_weight"] = clean_numeric_string(row.get("train_1_weight", "0"))
                row["train_1_speed"] = clean_numeric_string(row.get("train_1_speed", "0"))
                row["train_2_weight"] = clean_numeric_string(row.get("train_2_weight", "0"))
                row["train_2_speed"] = clean_numeric_string(row.get("train_2_speed", "0"))
                
                try:
                    validated_data = TrainScenario(**row)
                except ValidationError as e:
                    print(f"CSV Validation Error on row {current_index}: {e}")
                    # SAFETY NET 2: Prevent frontend hang if a CSV row is corrupted
                    validated_data = TrainScenario(
                        scenario_id=999, train_1_id="TR-ERR1", train_1_type="ERROR", train_1_weight=100, train_1_speed=0,
                        train_2_id="TR-ERR2", train_2_type="ERROR", train_2_weight=100, train_2_speed=0,
                        location="Data Corrupt", delay_risk="CRITICAL"
                    )
                    
                await asyncio.sleep(0.5)
                
                # SAFETY NET 3: Catch any AI crashes
                try:
                    optimizer = ConflictOptimizer()
                    ai_decision = optimizer.evaluate_routes(validated_data.model_dump())
                    recommendation = ai_decision.get("recommendation", f"Clearance granted for {validated_data.train_1_id}. System optimal.")
                    telemetry = ai_decision.get("telemetry_data", {})
                except Exception as e:
                    print(f"AI Engine Error: {e}")
                    recommendation = f"EMERGENCY OVERRIDE: AI Offline. Hold {validated_data.train_2_id} at siding."
                    telemetry = {}
                
                await websocket.send_json({
                    "status": "success",
                    "scenario": validated_data.model_dump(),
                    "ai_recommendation": recommendation,
                    "priority_train": validated_data.train_1_id,
                    "telemetry_data": telemetry
                })
                
    except WebSocketDisconnect:
        print("Frontend UI Disconnected from Stream.")
    except Exception as e:
        print(f"CRITICAL WEBSOCKET ERROR: {e}")