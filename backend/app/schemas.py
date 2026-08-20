from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class TrainBase(BaseModel):
    train_id: str
    locomotive_model: str
    max_capacity: int
    max_weight: float

class TrainCreate(TrainBase):
    pass

class TrainResponse(TrainBase):
    class Config:
        from_attributes = True

class ScheduleResponse(BaseModel):
    schedule_id: int
    train_id: str
    station_id: str
    scheduled_arrival: datetime
    scheduled_departure: datetime

    class Config:
        from_attributes = True

class TelemetryData(BaseModel):
    train_id: str
    latitude: float
    longitude: float
    current_speed: float
    current_weight: float
    passenger_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AlertTrigger(BaseModel):
    train_id: str
    alert_type: str = Field(..., description="e.g. SPEED_VIOLATION, ROUTE_DEV, SIGNAL_PASSED_RED")
    severity: str = Field(..., description="CRITICAL, WARNING, INFO")
    description: str
    location: str
