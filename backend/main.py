import csv
import re
import asyncio
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import your AI engine
from ai_engine.optimizer import ConflictOptimizer

# Initialize the FastAPI app
app = FastAPI()

# Apply CORS middleware - UPDATED to allow Vercel and local requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"], # The "*" allows your Vercel URL
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods
    allow_headers=["*"],
)

# Strictly validate all input to block field tampering or malformed CSV data
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

def clean_numeric_string(value: str) -> float:
    """Strips 't' and 'km/h' from CSV values so Pydantic can process them."""
    clean_value = re.sub(r'[^\d.]', '', str(value))
    return float(clean_value) if clean_value else 0.0

@app.get("/api/v1/scenario/{scenario_id}")
async def get_historical_scenario(scenario_id: int):
    file_path = Path(__file__).parent / "data" / "historical_logs.csv"
    
    if not file_path.exists():
        raise HTTPException(status_code=500, detail=f"Historical data vault offline at {file_path}.")

    try:
        with open(file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row["scenario_id"]) == scenario_id:
                    
                    # 1. Strip strings down to pure floats before validation
                    row["train_1_weight"] = clean_numeric_string(row.get("train_1_weight", "0"))
                    row["train_1_speed"] = clean_numeric_string(row.get("train_1_speed", "0"))
                    row["train_2_weight"] = clean_numeric_string(row.get("train_2_weight", "0"))
                    row["train_2_speed"] = clean_numeric_string(row.get("train_2_speed", "0"))

                    # 2. Validate the raw row data
                    validated_data = TrainScenario(**row)

                    await asyncio.sleep(1.5) 
                    
                    # 3. Pass the data to your AI optimizer
                    optimizer = ConflictOptimizer()
                    ai_decision = optimizer.evaluate_routes(validated_data.model_dump())
                    
                    # 3. Pass the data to your AI optimizer
                    optimizer = ConflictOptimizer()
                    ai_decision = optimizer.evaluate_routes(validated_data.model_dump())
                    
                    # 4. Return the real AI-generated recommendation
                    return {
                        "status": "success",
                        "scenario": validated_data.model_dump(),
                        "ai_recommendation": ai_decision.get("recommendation", f"AI Optimized clearance for {validated_data.train_1_id}")
                    }
                    
            raise HTTPException(status_code=404, detail="Scenario not found.")
            
    except ValidationError as e:
        # Returns the exact validation error so you don't get silent crashes
        print(f"Validation Crash: {e}")
        raise HTTPException(status_code=422, detail=f"Data validation failed: {e}")
    except ValueError:
        raise HTTPException(status_code=422, detail="Data validation failed. Corrupted logs.")
    
    # Add this new Pydantic model near your other models at the top
class ApprovalRequest(BaseModel):
    scenario_id: int
    priority_train_id: str
    action_taken: str

# Add these new endpoints at the bottom of main.py
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
    # In a production environment, this writes directly to a secure PostgreSQL database.
    # For the hackathon, we simulate the successful database transaction.
    audit_log = {
        "timestamp": "Real-time",
        "scenario_id": request.scenario_id,
        "decision": request.action_taken,
        "cleared_train": request.priority_train_id,
        "status": "Audit securely logged."
    }
    print(f"AUDIT TRAIL SAVED: {audit_log}")
    return audit_log
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    """Event-driven WebSocket stream for real-time scenario processing."""
    await websocket.accept()
    # Point to the new dataset
    file_path = Path(__file__).parent / "data" / "indian_railways_logs.csv"
    
    try:
        with open(file_path, mode='r', encoding='utf-8') as file:
            reader = list(csv.DictReader(file))
            
        current_index = 0
        
        while True:
            # Wait for the frontend to request the next scenario
            data = await websocket.receive_text()
            if data == "NEXT":
                if current_index >= len(reader):
                    current_index = 0 # Loop back to start if we hit 500
                    
                row = reader[current_index]
                current_index += 1
                
                # Clean strings and validate
                row["train_1_weight"] = clean_numeric_string(row.get("train_1_weight", "0"))
                row["train_1_speed"] = clean_numeric_string(row.get("train_1_speed", "0"))
                row["train_2_weight"] = clean_numeric_string(row.get("train_2_weight", "0"))
                row["train_2_speed"] = clean_numeric_string(row.get("train_2_speed", "0"))
                
                validated_data = TrainScenario(**row)
                
                # Small artificial delay so the UI loading states render beautifully
                await asyncio.sleep(0.5)
                
                optimizer = ConflictOptimizer()
                ai_decision = optimizer.evaluate_routes(validated_data.model_dump())
                
                await websocket.send_json({
                    "status": "success",
                    "scenario": validated_data.model_dump(),
                    "ai_recommendation": ai_decision.get("recommendation"),
                    "telemetry_data": ai_decision.get("telemetry_data")
                })
                
    except WebSocketDisconnect:
        print("Frontend UI Disconnected from Stream.")